const columns={technicalLink:'technical_link',customerFollowUp:'customer_follow_up',nextAction:'next_action',dueDate:'due_date'};
const recordFields=['service','kind','title','status','owner','market','notes','pricing','technicalLink','customerFollowUp','readiness','nextAction','dueDate'];
const profileFields=['service','status','owner','notes','pricing','technicalLink','customerFollowUp','readiness'];
const col=k=>columns[k]||k;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const clean=(data,keys)=>Object.fromEntries(keys.map(k=>[k,String(data?.[k]??'').slice(0,5000)]));
const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dkasu Workspace</title><meta name="description" content="Private company workspace for Dkasu services in Italy and Uganda."><style>${SITE_CSS}</style></head><body><div id="app"></div><script>${SITE_JS}</script></body></html>`;
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/' || url.pathname==='/index.html')return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
 if(url.pathname!=='/api/workspace')return new Response('Not found',{status:404});
 if(!env.DB)return json({error:'Database unavailable'},500);
 try{
  if(request.method==='GET'){
   const [records,profiles]=await Promise.all([
    env.DB.prepare('SELECT id,service,kind,title,status,owner,market,notes,pricing,technical_link AS technicalLink,customer_follow_up AS customerFollowUp,readiness,next_action AS nextAction,due_date AS dueDate,updated_at AS updatedAt FROM records ORDER BY updated_at DESC').all(),
    env.DB.prepare('SELECT service,status,owner,notes,pricing,technical_link AS technicalLink,customer_follow_up AS customerFollowUp,readiness,updated_at AS updatedAt FROM service_profiles').all()
   ]);return json({records:records.results,profiles:profiles.results});
  }
  if(request.method==='POST'){
   const body=await request.json();const isProfile=body.type==='profile';const fields=isProfile?profileFields:recordFields;const v=clean(body,fields);
   if(!v.service||(!isProfile&&(!v.title||!v.kind)))return json({error:'Required fields missing'},400);
   if(isProfile&&v.service==='DkasuLogistic')v.status='Future / planning';
   const cols=fields.map(col),values=fields.map(k=>v[k]);
   if(isProfile){await env.DB.prepare(`INSERT INTO service_profiles (${cols.join(',')},updated_at) VALUES (${cols.map(()=>'?').join(',')},?) ON CONFLICT(service) DO UPDATE SET ${cols.slice(1).map(k=>`${k}=excluded.${k}`).join(',')},updated_at=excluded.updated_at`).bind(...values,Date.now()).run();return json({ok:true});}
   const id=String(body.id||crypto.randomUUID());
   await env.DB.prepare(`INSERT INTO records (id,${cols.join(',')},updated_at) VALUES (?,${cols.map(()=>'?').join(',')},?) ON CONFLICT(id) DO UPDATE SET ${cols.map(k=>`${k}=excluded.${k}`).join(',')},updated_at=excluded.updated_at`).bind(id,...values,Date.now()).run();return json({ok:true,id});
  }
  if(request.method==='DELETE'){const id=url.searchParams.get('id');if(!id)return json({error:'ID required'},400);await env.DB.prepare('DELETE FROM records WHERE id=?').bind(id).run();return json({ok:true});}
  return json({error:'Method not allowed'},405);
 }catch(error){return json({error:String(error)},500);}
}};
