import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const css=readFileSync(path.join(root,'app/globals.css'),'utf8');
const ui=readFileSync(path.join(root,'worker/ui/client.js'),'utf8');
const core=readFileSync(path.join(root,'worker/core.js'),'utf8');
mkdirSync(path.join(root,'dist/server'),{recursive:true});
writeFileSync(path.join(root,'dist/server/index.js'),`const SITE_CSS=${JSON.stringify(css)};\nconst SITE_JS=${JSON.stringify(ui)};\n${core}`);
console.log('Built Dkasu Worker');
