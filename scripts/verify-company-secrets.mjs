#!/usr/bin/env node
/**
 * Verifies required company secret NAMES are present without printing values.
 * Usage (local / CI with injected env, or after exporting Vercel env locally):
 *   npm run verify:secrets
 */
const required = [
  'POS_SUPABASE_URL',
  'POS_SUPABASE_ANON_KEY',
  'COMPANY_INQUIRY_HMAC_SECRET',
];
const optional = ['ADMIN_EMAIL'];

const report = [];
let ok = true;
for (const key of required) {
  const raw = process.env[key];
  const present = typeof raw === 'string' && raw.trim().length > 0;
  let detail = present ? 'present' : 'MISSING';
  if (key === 'POS_SUPABASE_URL' && present && !raw.startsWith('https://')) {
    detail = 'INVALID (must be https://)';
    ok = false;
  } else if (key === 'COMPANY_INQUIRY_HMAC_SECRET' && present && raw.trim().length < 32) {
    detail = 'TOO_SHORT (need >= 32 chars)';
    ok = false;
  } else if (!present) {
    ok = false;
  }
  report.push({ key, status: detail });
}
for (const key of optional) {
  const present = typeof process.env[key] === 'string' && process.env[key].trim().length > 0;
  report.push({ key, status: present ? 'present' : 'absent (optional break-glass)' });
}

console.log(JSON.stringify({ ok, backend: 'supabase', secrets: report }, null, 2));
process.exit(ok ? 0 : 1);
