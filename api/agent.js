// Vercel Serverless Function — Agent API for FINPG
// Permissões: GET (leitura), POST (inserção), GET /export (backup JSON)
// PATCH e DELETE são bloqueados intencionalmente — o agente não pode alterar ou apagar dados.

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore }                  from 'firebase-admin/firestore';

function getEnv() {
  return {
    APP_ID:    process.env.VITE_APP_ID || 'planejamento-2026',
    AGENT_KEY: process.env.AGENT_API_KEY,
    USER_ID:   process.env.AGENT_USER_ID,
  };
}

function getDb() {
  if (!getApps().length) {
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (saJson) {
      initializeApp({ credential: cert(JSON.parse(saJson)) });
    } else {
      initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
    }
  }
  return getFirestore();
}

// ── Firestore path ─────────────────────────────────────────────────────────

function colRef(db, env, year, col) {
  return db.collection('artifacts').doc(env.APP_ID)
    .collection('users').doc(env.USER_ID)
    .collection('years').doc(String(year))
    .collection(col);
}

// ── Operações permitidas ───────────────────────────────────────────────────

const COLLECTIONS = [
  'expenses', 'credit_expenses', 'incomes',
  'vacation_incomes', 'vacation_expenses', 'obligations',
];

async function listItems(db, env, year, col) {
  const snap = await colRef(db, env, year, col).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getItem(db, env, year, col, id) {
  const snap = await colRef(db, env, year, col).doc(id).get();
  if (!snap.exists) throw new Error(`Item ${id} não encontrado`);
  return { id: snap.id, ...snap.data() };
}

async function createItem(db, env, year, col, item) {
  const { id, ...fields } = item;
  const ref = await colRef(db, env, year, col).add(fields);
  return { id: ref.id, ...fields };
}

// Exporta todas as coleções de um ano como JSON estruturado para backup/restauração
async function exportYear(db, env, year) {
  const result = { exportedAt: new Date().toISOString(), year: String(year), collections: {} };
  for (const col of COLLECTIONS) {
    const snap = await colRef(db, env, year, col).get();
    result.collections[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return result;
}

// ── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-agent-key');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Rejeita explicitamente PATCH e DELETE antes de qualquer outra checagem
  if (req.method === 'PATCH' || req.method === 'DELETE' || req.method === 'PUT') {
    res.status(403).json({ error: 'Forbidden: este endpoint não permite alterar ou apagar dados existentes.' });
    return;
  }

  const env = getEnv();

  if (!env.AGENT_KEY || req.headers['x-agent-key'] !== env.AGENT_KEY) {
    res.status(401).json({ error: 'Unauthorized' }); return;
  }
  if (!env.USER_ID) {
    res.status(500).json({ error: 'AGENT_USER_ID not configured' }); return;
  }

  // Parse URL — suporta dois formatos:
  //   Vercel prod: /api/agent?p=2026/expenses  (rewrite injeta ?p=)
  //   Local:       /api/agent/2026/expenses    (path direto)
  const rawUrl  = req.url || '';
  const qs      = new URL(rawUrl, 'http://localhost').searchParams;
  const pParam  = qs.get('p');
  const pathSrc = pParam
    ? pParam
    : rawUrl.replace(/^\/api\/agent\/?/, '').split('?')[0];
  const parts = pathSrc.split('/').filter(Boolean);
  const [year, col, id] = parts;

  if (!year || !col) {
    res.status(400).json({ error: 'URL: /api/agent/{year}/{collection}[/{id}] ou /api/agent/{year}/export' });
    return;
  }

  try {
    const db = getDb();
    let result;

    if (col === 'export' && req.method === 'GET') {
      result = await exportYear(db, env, year);
    } else if (req.method === 'GET' && !id) {
      result = await listItems(db, env, year, col);
    } else if (req.method === 'GET' && id) {
      result = await getItem(db, env, year, col, id);
    } else if (req.method === 'POST' && !id) {
      result = await createItem(db, env, year, col, req.body || {});
    } else {
      res.status(405).json({ error: 'Method not allowed' }); return;
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[agent-api]', err.message);
    res.status(500).json({ error: err.message });
  }
}
