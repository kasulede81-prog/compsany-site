import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const fields = ["service","kind","title","status","owner","market","notes","pricing","technicalLink","customerFollowUp","readiness","nextAction","dueDate"] as const;
const columns: Record<string,string> = {technicalLink:"technical_link",customerFollowUp:"customer_follow_up",nextAction:"next_action",dueDate:"due_date"};
const pfields = ["service","status","owner","notes","pricing","technicalLink","customerFollowUp","readiness"] as const;
function db() { if (!env.DB) throw new Error("Database unavailable"); return env.DB; }
function clean(input: unknown, keys: readonly string[]) { const source = (input && typeof input === "object" ? input : {}) as Record<string,unknown>; return Object.fromEntries(keys.map(k => [k, String(source[k] ?? "").slice(0,5000)])); }
export async function GET() {
  try {
    const [records, profiles] = await Promise.all([
      db().prepare("SELECT id, service, kind, title, status, owner, market, notes, pricing, technical_link AS technicalLink, customer_follow_up AS customerFollowUp, readiness, next_action AS nextAction, due_date AS dueDate, updated_at AS updatedAt FROM records ORDER BY updated_at DESC").all(),
      db().prepare("SELECT service, status, owner, notes, pricing, technical_link AS technicalLink, customer_follow_up AS customerFollowUp, readiness, updated_at AS updatedAt FROM service_profiles").all()
    ]);
    return NextResponse.json({records:records.results,profiles:profiles.results});
  } catch(e) { return NextResponse.json({error:String(e)}, {status:500}); }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.type === "profile") {
      const v = clean(body, pfields);
      if (!v.service) return NextResponse.json({error:"Service required"},{status:400});
      const keys = pfields.map(k=>columns[k]||k); const values=pfields.map(k=>v[k]);
      await db().prepare(`INSERT INTO service_profiles (${keys.join(",")},updated_at) VALUES (${keys.map(()=>"?").join(",")},?) ON CONFLICT(service) DO UPDATE SET ${keys.slice(1).map(k=>`${k}=excluded.${k}`).join(",")}, updated_at=excluded.updated_at`).bind(...values,Date.now()).run();
      return NextResponse.json({ok:true});
    }
    const v=clean(body,fields);
    if (!v.service || !v.title || !v.kind) return NextResponse.json({error:"Service, type and title required"},{status:400});
    const id = String(body.id || crypto.randomUUID());
    const keys=fields.map(k=>columns[k]||k); const values=fields.map(k=>v[k]);
    await db().prepare(`INSERT INTO records (id,${keys.join(",")},updated_at) VALUES (?,${keys.map(()=>"?").join(",")},?) ON CONFLICT(id) DO UPDATE SET ${keys.map(k=>`${k}=excluded.${k}`).join(",")},updated_at=excluded.updated_at`).bind(id,...values,Date.now()).run();
    return NextResponse.json({ok:true,id});
  } catch(e) { return NextResponse.json({error:String(e)}, {status:500}); }
}
export async function DELETE(req: NextRequest) {
  try { const id=new URL(req.url).searchParams.get("id"); if(!id)return NextResponse.json({error:"ID required"},{status:400}); await db().prepare("DELETE FROM records WHERE id = ?").bind(id).run(); return NextResponse.json({ok:true}); }
  catch(e){return NextResponse.json({error:String(e)},{status:500});}
}
