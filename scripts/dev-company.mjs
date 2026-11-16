#!/usr/bin/env node
/**
 * Local Node server for the company Vercel runtime (no Cloudflare / wrangler).
 * Usage: npm run dev:company
 */
import { createServer } from 'node:http';
import { handleCompanyRequest } from '../server/company-app.mjs';

const port = Number(process.env.PORT || 3456);

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `127.0.0.1:${port}`;
    const url = `http://${host}${req.url}`;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((item) => headers.append(k, item));
      else headers.set(k, String(v));
    }
    const init = { method: req.method, headers };
    if (body.length && req.method !== 'GET' && req.method !== 'HEAD') init.body = body;
    const request = new Request(url, init);
    const response = await handleCompanyRequest(request, process.env);
    res.statusCode = response.status;
    const setCookies =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const [k, v] of response.headers.entries()) {
      if (k.toLowerCase() === 'set-cookie') continue;
      res.setHeader(k, v);
    }
    if (setCookies.length) res.setHeader('set-cookie', setCookies);
    else {
      const single = response.headers.get('set-cookie');
      if (single) res.setHeader('set-cookie', single);
    }
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
    console.error(error);
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`DKASU company local runtime http://127.0.0.1:${port}`);
});
