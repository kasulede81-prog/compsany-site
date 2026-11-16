declare namespace Cloudflare {
  interface Env {
    /** Legacy D1 binding — retained for platform compatibility; not used for company business data in Phase 3. */
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_EMAIL?: string;
    POS_SUPABASE_URL?: string;
    POS_SUPABASE_ANON_KEY?: string;
    COMPANY_INQUIRY_HMAC_SECRET?: string;
  }
}
