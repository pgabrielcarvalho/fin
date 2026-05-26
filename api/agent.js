// Vercel Serverless Function — Agent API for FINPG
// Permissões: GET (leitura), POST (inserção), PATCH (edição), DELETE (exclusão), GET /export (backup JSON)
// Edição e exclusão exigem confirmação explícita também na API.

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

const COMMON_FIELDS = [
  'name', 'description', 'value', 'amount', 'type', 'month', 'year',
  'category', 'categoryId', 'subcategory', 'extraordinary', 'overrides',
  'paidStatus', 'receivedStatus', 'date', 'dueDate', 'createdAt', 'updatedAt',
  'notes', 'projectId', 'installments', 'currentInstallment', 'totalInstallments',
  'startMonth', 'endMonth', 'startYear', 'endYear', 'active', 'status',
  'cardId', 'invoiceMonth', 'invoiceYear', 'paid', 'received', 'color', 'icon',
  'priority', 'recurrence', 'source', 'tags', 'order', 'parentId',
];

const COLLECTION_FIELD_ALLOWLIST = {
  expenses: COMMON_FIELDS,
  credit_expenses: COMMON_FIELDS,
  incomes: COMMON_FIELDS,
  vacation_incomes: COMMON_FIELDS,
  vacation_expenses: COMMON_FIELDS,
  obligations: COMMON_FIELDS,
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateCollection(col) {
  if (!COLLECTIONS.includes(col)) {
    throw httpError(400, `Coleção não permitida: ${col}`);
  }
}

function requireConfirmedAction(req) {
  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const confirmed = String(req.headers['x-confirmed-action'] || '').toLowerCase();
    if (confirmed !== 'true') {
      throw httpError(428, 'Confirmação obrigatória: envie x-confirmed-action: true para PATCH/DELETE.');
    }
  }
}

function validatePatchPayload(col, fields) {
  if (!isPlainObject(fields)) {
    throw httpError(400, 'PATCH exige um corpo JSON válido.');
  }

  const entries = Object.entries(fields).filter(([key]) => key !== 'id');
  if (entries.length === 0) {
    throw httpError(400, 'PATCH exige ao menos um campo para atualizar.');
  }

  const allowedFields = COLLECTION_FIELD_ALLOWLIST[col] || [];
  const invalidFields = entries
    .map(([key]) => key)
    .filter(key => !allowedFields.includes(key));

  if (invalidFields.length > 0) {
    throw httpError(400, `Campos não permitidos para ${col}: ${invalidFields.join(', ')}`);
  }

  const updates = {};
  for (const [key, value] of entries) {
    if (['name', 'description', 'type', 'category', 'categoryId', 'subcategory', 'date', 'dueDate', 'notes', 'projectId', 'status', 'cardId', 'color', 'icon', 'priority', 'recurrence', 'source', 'parentId'].includes(key)) {
      if (value !== null && typeof value !== 'string') {
        throw httpError(400, `Campo ${key} deve ser texto ou null.`);
      }
    }

    if (['value', 'amount'].includes(key)) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw httpError(400, `Campo ${key} deve ser número finito.`);
      }
    }

    if (['month', 'invoiceMonth', 'startMonth', 'endMonth'].includes(key)) {
      if (!Number.isInteger(value) || value < 0 || value > 11) {
        throw httpError(400, `Campo ${key} deve ser inteiro entre 0 e 11.`);
      }
    }

    if (['year', 'invoiceYear', 'startYear', 'endYear', 'installments', 'currentInstallment', 'totalInstallments', 'order'].includes(key)) {
      if (!Number.isInteger(value)) {
        throw httpError(400, `Campo ${key} deve ser inteiro.`);
      }
    }

    if (['extraordinary', 'active', 'paid', 'received'].includes(key)) {
      if (typeof value !== 'boolean') {
        throw httpError(400, `Campo ${key} deve ser booleano.`);
      }
    }

    if (key === 'overrides') {
      if (!isPlainObject(value)) {
        throw httpError(400, 'Campo overrides deve ser objeto.');
      }
      for (const [month, monthValue] of Object.entries(value)) {
        const monthIndex = Number(month);
        if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
          throw httpError(400, `Campo overrides contém mês inválido: ${month}`);
        }
        if (typeof monthValue !== 'number' || !Number.isFinite(monthValue)) {
          throw httpError(400, `Campo overrides.${month} deve ser número finito.`);
        }
      }
    }

    if (['paidStatus', 'receivedStatus'].includes(key)) {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'boolean')) {
        throw httpError(400, `Campo ${key} deve ser array de booleanos.`);
      }
    }

    if (key === 'tags') {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw httpError(400, 'Campo tags deve ser array de textos.');
      }
    }

    if (['createdAt', 'updatedAt'].includes(key)) {
      if (value !== null && typeof value !== 'string' && !isPlainObject(value)) {
        throw httpError(400, `Campo ${key} deve ser texto, objeto Timestamp ou null.`);
      }
    }

    updates[key] = value;
  }

  return updates;
}

async function listItems(db, env, year, col) {
  const snap = await colRef(db, env, year, col).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getItem(db, env, year, col, id) {
  const snap = await colRef(db, env, year, col).doc(id).get();
  if (!snap.exists) throw httpError(404, `Item ${id} não encontrado`);
  return { id: snap.id, ...snap.data() };
}

async function createItem(db, env, year, col, item) {
  const fields = { ...item };
  delete fields.id;
  const ref = await colRef(db, env, year, col).add(fields);
  return { id: ref.id, ...fields };
}

async function updateItem(db, env, year, col, id, fields) {
  const updates = validatePatchPayload(col, fields);
  const ref = colRef(db, env, year, col).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw httpError(404, `Item ${id} não encontrado`);
  await ref.update(updates);
  return { id, ...snap.data(), ...updates };
}

async function deleteItem(db, env, year, col, id) {
  const ref = colRef(db, env, year, col).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw httpError(404, `Item ${id} não encontrado`);
  const data = snap.data();
  await ref.delete();
  return { id, deleted: true, name: data.name };
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-agent-key,x-confirmed-action');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (req.method === 'PUT') {
    res.status(405).json({ error: 'Method not allowed: use PATCH para edições parciais.' });
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
    if (col !== 'export') validateCollection(col);
    requireConfirmedAction(req);

    const db = getDb();
    let result;

    if (col === 'export' && req.method === 'GET') {
      result = await exportYear(db, env, year);
    } else if (col === 'export') {
      res.status(405).json({ error: 'Method not allowed: export aceita apenas GET.' }); return;
    } else if (req.method === 'GET' && !id) {
      result = await listItems(db, env, year, col);
    } else if (req.method === 'GET' && id) {
      result = await getItem(db, env, year, col, id);
    } else if (req.method === 'POST' && !id) {
      result = await createItem(db, env, year, col, req.body || {});
    } else if (req.method === 'PATCH' && id) {
      result = await updateItem(db, env, year, col, id, req.body || {});
    } else if (req.method === 'DELETE' && id) {
      result = await deleteItem(db, env, year, col, id);
    } else {
      res.status(405).json({ error: 'Method not allowed' }); return;
    }

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('[agent-api]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
}
