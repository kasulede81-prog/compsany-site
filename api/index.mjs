/**
 * Vercel Node serverless entry.
 * All dynamic routes rewrite here (see vercel.json). Static files under public/ (if any) take precedence.
 */
import { handleCompanyRequest } from '../server/company-app.mjs';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value.join(', ');
  return value || '';
}

async function readRawBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

function buildWebRequest(req, rawBody) {
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || 'localhost';
  const proto = getHeader(req, 'x-forwarded-proto') || 'https';
  const url = `${proto}://${host}${req.url}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, String(value));
  }
  const init = { method: req.method, headers };
  if (rawBody && rawBody.length) init.body = rawBody;
  return new Request(url, init);
}

async function writeNodeResponse(webResponse, res) {
  res.statusCode = webResponse.status;
  const setCookies =
    typeof webResponse.headers.getSetCookie === 'function' ? webResponse.headers.getSetCookie() : [];
  for (const [key, value] of webResponse.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') continue;
    res.setHeader(key, value);
  }
  if (setCookies.length) res.setHeader('set-cookie', setCookies);
  else {
    const single = webResponse.headers.get('set-cookie');
    if (single) res.setHeader('set-cookie', single);
  }
  const buf = Buffer.from(await webResponse.arrayBuffer());
  res.end(buf);
}

export default async function handler(req, res) {
  try {
    const rawBody = await readRawBody(req);
    const request = buildWebRequest(req, rawBody);
    const response = await handleCompanyRequest(request, process.env);
    await writeNodeResponse(response, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify({ error: 'Internal server error' }));
    console.error('company handler error', error?.message || error);
  }
}
