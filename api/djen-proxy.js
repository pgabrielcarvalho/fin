// Vercel Serverless Function — Proxy para API do DJEN (comunicaapi.pje.jus.br)
// Necessário porque a API do DJEN bloqueia IPs fora do Brasil via CloudFront.
// Esta função roda na região gru1 (São Paulo) e repassa as chamadas com IP brasileiro.
// Uso previsto: server-to-server. CORS não é aberto por padrão.

const DJEN_BASE = 'https://comunicaapi.pje.jus.br';
const PROXY_KEY = process.env.DJEN_PROXY_KEY;
const ALLOWED_ORIGIN = process.env.DJEN_PROXY_ALLOWED_ORIGIN;

function applyCors(req, res) {
  if (!ALLOWED_ORIGIN) return true;

  const origin = req.headers.origin;
  if (!origin) return true;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Vary', 'Origin');
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-proxy-key');

  if (req.method === 'OPTIONS') {
    if (!corsAllowed) { res.status(403).json({ error: 'Origin not allowed' }); return; }
    res.status(204).end(); return;
  }

  if (!corsAllowed) { res.status(403).json({ error: 'Origin not allowed' }); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  // Autenticação simples por chave — evita uso indevido do proxy
  if (!PROXY_KEY || req.headers['x-proxy-key'] !== PROXY_KEY) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }

  // Extrai o path após /api/djen-proxy
  const rawUrl = req.url || '';
  const qs = new URL(rawUrl, 'http://localhost').searchParams;
  const pathParam = qs.get('p') || '';
  const queryParams = new URLSearchParams();

  for (const [key, value] of qs.entries()) {
    if (key !== 'p') queryParams.append(key, value);
  }

  const queryString = queryParams.toString();
  const targetUrl = `${DJEN_BASE}/${pathParam}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'LawTech-Pro/1.0',
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('[djen-proxy]', err.message);
    res.status(500).json({ error: err.message });
  }
}
