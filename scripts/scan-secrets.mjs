#!/usr/bin/env node
/**
 * Fails if likely secret values appear in tracked / source paths.
 * Does not print matched secret values.
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skipDirs = new Set([
  'node_modules',
  '.git',
  'dist',
  'outputs',
  '.next',
  '.vinext',
  '.wrangler',
  '.sites-runtime',
  '.vercel',
]);

const patterns = [
  { name: 'jwt_like', re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/ },
  { name: 'hmac_env_assignment', re: /COMPANY_INQUIRY_HMAC_SECRET\s*=\s*[^\s"'`]{32,}/ },
  { name: 'service_role_assignment', re: /SERVICE_ROLE[A-Z_]*\s*=\s*[^\s"'`]{20,}/i },
];

const allowPath = (rel) => {
  if (rel === '.env.example') return false; // still scanned; placeholders must not look like real JWT/HMAC
  if (rel.endsWith('.png') || rel.endsWith('.jpg') || rel.endsWith('.ico')) return false;
  if (rel.includes('generated-assets.mjs')) return false; // base64 assets can false-positive
  return true;
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (skipDirs.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  const rel = path.relative(root, file);
  if (!allowPath(rel)) continue;
  if (!/\.(js|mjs|cjs|ts|tsx|json|md|html|css|txt|example|yml|yaml|toml)$/i.test(rel) && !rel.startsWith('.')) {
    continue;
  }
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { name, re } of patterns) {
    if (re.test(text)) hits.push({ file: rel, pattern: name });
  }
}

let trackedHits = [];
try {
  const tracked = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  trackedHits = hits.filter((h) => tracked.includes(h.file));
} catch {
  trackedHits = hits;
}

const report = {
  ok: hits.length === 0,
  hitCount: hits.length,
  hits: hits.map((h) => ({ file: h.file, pattern: h.pattern })),
  trackedHits: trackedHits.map((h) => ({ file: h.file, pattern: h.pattern })),
};
console.log(JSON.stringify(report, null, 2));
process.exit(hits.length ? 1 : 0);
