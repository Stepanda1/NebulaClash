import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(rootDir, 'data');
const statePath = join(dataDir, 'wallet-state.json');
const port = Number(process.env.PORT || 8787);

const MAX_BODY_SIZE = 1024 * 1024;

const DEFAULT_PACKS = [
  { id: 'pack-120', coins: 120, amountRub: 99 },
  { id: 'pack-300', coins: 300, amountRub: 199 },
  { id: 'pack-800', coins: 800, amountRub: 499 },
];

function readPacks() {
  const raw = process.env.SHOP_PACKS_JSON;
  if (!raw) return DEFAULT_PACKS;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PACKS;
    const normalized = parsed
      .map((item) => ({
        id: String(item.id || ''),
        coins: Number(item.coins || 0),
        amountRub: Number(item.amountRub || item.amount || 0),
      }))
      .filter((item) => item.id && item.coins > 0 && item.amountRub > 0);

    return normalized.length > 0 ? normalized : DEFAULT_PACKS;
  } catch {
    return DEFAULT_PACKS;
  }
}

function ensureStateFile() {
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(statePath)) {
    writeFileSync(
      statePath,
      JSON.stringify({ wallets: {}, orders: {} }, null, 2),
      'utf8',
    );
  }
}

function loadState() {
  ensureStateFile();
  try {
    const raw = readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      wallets: parsed.wallets ?? {},
      orders: parsed.orders ?? {},
    };
  } catch {
    return { wallets: {}, orders: {} };
  }
}

function saveState(state) {
  ensureStateFile();
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Signature, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.end(JSON.stringify(payload));
}

function readRawBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    const chunks = [];

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        rejectBody(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolveBody(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', rejectBody);
  });
}

function parseJsonBody(rawBody) {
  if (!rawBody) return {};
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}

function safeEqualHex(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(a.trim().toLowerCase(), 'utf8');
  const right = Buffer.from(b.trim().toLowerCase(), 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getPlayerId(urlObj) {
  return (urlObj.searchParams.get('playerId') || '').trim();
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || `localhost:${port}`;
  return `${proto}://${host}`;
}

function getLavaCreateInvoiceUrl() {
  return process.env.LAVA_CREATE_INVOICE_URL || 'https://api.lava.ru/business/invoice/create';
}

function extractPaymentUrl(responseJson) {
  return (
    responseJson?.url ||
    responseJson?.paymentUrl ||
    responseJson?.invoiceUrl ||
    responseJson?.checkoutUrl ||
    responseJson?.data?.url ||
    responseJson?.data?.paymentUrl ||
    responseJson?.data?.link ||
    null
  );
}

async function createInvoice(req, res, payload) {
  const playerId = String(payload.playerId || '').trim();
  const packId = String(payload.packId || '').trim();
  if (!playerId || !packId) {
    json(res, 400, { error: 'playerId and packId are required' });
    return;
  }

  const shopId = process.env.LAVA_SHOP_ID;
  const secretKey = process.env.LAVA_SECRET_KEY;
  if (!shopId || !secretKey) {
    json(res, 500, { error: 'LAVA_SHOP_ID and LAVA_SECRET_KEY are required' });
    return;
  }

  const pack = readPacks().find((item) => item.id === packId);
  if (!pack) {
    json(res, 404, { error: 'Unknown packId' });
    return;
  }

  const state = loadState();
  const orderId = `${playerId}_${pack.id}_${Date.now()}`;
  const baseUrl = getBaseUrl(req);
  const originHeader = (req.headers.origin || '').trim();
  const fallbackSuccess = originHeader ? `${originHeader}/?payment=success&orderId=${encodeURIComponent(orderId)}` : undefined;
  const fallbackFail = originHeader ? `${originHeader}/?payment=fail` : undefined;

  const lavaPayload = {
    sum: Number(pack.amountRub),
    orderId,
    shopId,
    hookUrl: `${baseUrl}/api/payments/lava/webhook`,
    successUrl: process.env.LAVA_SUCCESS_URL || fallbackSuccess,
    failUrl: process.env.LAVA_FAIL_URL || fallbackFail,
    comment: `Space coins ${pack.coins}`,
    customFields: JSON.stringify({ playerId, packId: pack.id, coins: pack.coins }),
  };

  const signature = createHmac('sha256', secretKey).update(JSON.stringify(lavaPayload)).digest('hex');

  const response = await fetch(getLavaCreateInvoiceUrl(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Signature: signature,
    },
    body: JSON.stringify(lavaPayload),
  });

  const responseJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    json(res, response.status, {
      error: 'Lava invoice creation failed',
      details: responseJson,
    });
    return;
  }

  const paymentUrl = extractPaymentUrl(responseJson);
  if (!paymentUrl) {
    json(res, 502, { error: 'Lava response does not contain payment URL', details: responseJson });
    return;
  }

  state.orders[orderId] = {
    orderId,
    playerId,
    packId: pack.id,
    coins: pack.coins,
    amountRub: pack.amountRub,
    status: 'created',
    createdAt: new Date().toISOString(),
    lavaResponse: responseJson,
  };
  saveState(state);

  json(res, 200, { ok: true, orderId, paymentUrl });
}

function getWallet(req, res, urlObj) {
  const playerId = getPlayerId(urlObj);
  if (!playerId) {
    json(res, 400, { error: 'playerId is required' });
    return;
  }

  const state = loadState();
  const balance = Number(state.wallets[playerId] || 0);
  json(res, 200, { playerId, balance });
}

function spendWallet(res, payload) {
  const playerId = String(payload.playerId || '').trim();
  const amount = Math.floor(Number(payload.amount || 0));
  if (!playerId || amount <= 0) {
    json(res, 400, { error: 'playerId and positive amount are required' });
    return;
  }

  const state = loadState();
  const current = Number(state.wallets[playerId] || 0);
  if (current < amount) {
    json(res, 409, { error: 'Not enough balance', balance: current });
    return;
  }

  const next = current - amount;
  state.wallets[playerId] = next;
  saveState(state);
  json(res, 200, { ok: true, balance: next });
}

function verifyWebhookSignature(rawBody, payload, req) {
  const secret2 = process.env.LAVA_SECRET_KEY_2 || '';
  if (!secret2) return false;

  const signatureHeaderRaw = String(req.headers.signature || req.headers.authorization || '').trim();
  const signatureHeader = signatureHeaderRaw.toLowerCase().startsWith('signature ')
    ? signatureHeaderRaw.slice(10).trim()
    : signatureHeaderRaw;

  if (signatureHeader) {
    const expectedHmac = createHmac('sha256', secret2).update(rawBody).digest('hex');
    if (safeEqualHex(signatureHeader, expectedHmac)) return true;
  }

  const invoiceId = payload?.invoice_id;
  const amount = payload?.amount;
  const payTime = payload?.pay_time;
  const sign = payload?.sign;
  if (invoiceId && amount && payTime && sign) {
    const expectedMd5 = createHash('md5')
      .update(`${invoiceId}:${amount}:${payTime}:${secret2}`)
      .digest('hex');
    return safeEqualHex(String(sign), expectedMd5);
  }

  return false;
}

function creditFromWebhook(req, res, rawBody, payload) {
  if (payload == null || typeof payload !== 'object') {
    json(res, 400, { error: 'Invalid JSON payload' });
    return;
  }

  if (!verifyWebhookSignature(rawBody, payload, req)) {
    json(res, 401, { error: 'Invalid webhook signature' });
    return;
  }

  const orderId = String(payload.orderId || payload.order_id || '').trim();
  const status = String(payload.status || payload.state || payload.invoice_status || '').trim().toLowerCase();
  if (!orderId) {
    json(res, 400, { error: 'Webhook payload has no order ID' });
    return;
  }

  const successStatuses = new Set((process.env.LAVA_SUCCESS_STATUSES || 'success,paid,completed')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean));

  const state = loadState();
  const order = state.orders[orderId];
  if (!order) {
    json(res, 200, { ok: true, ignored: true, reason: 'unknown_order' });
    return;
  }

  if (order.status === 'credited') {
    json(res, 200, { ok: true, ignored: true, reason: 'already_credited' });
    return;
  }

  if (!successStatuses.has(status)) {
    order.status = status || 'updated';
    order.lastWebhookAt = new Date().toISOString();
    order.lastWebhookPayload = payload;
    state.orders[orderId] = order;
    saveState(state);
    json(res, 200, { ok: true, ignored: true, reason: 'non_success_status', status });
    return;
  }

  const playerId = String(order.playerId || '').trim();
  const current = Number(state.wallets[playerId] || 0);
  const next = current + Number(order.coins || 0);
  state.wallets[playerId] = next;
  order.status = 'credited';
  order.creditedAt = new Date().toISOString();
  order.lastWebhookPayload = payload;
  state.orders[orderId] = order;
  saveState(state);

  json(res, 200, { ok: true, playerId, creditedCoins: order.coins, balance: next });
}

const server = createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || `localhost:${port}`}`);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Signature, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.end();
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/health') {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/wallet') {
    getWallet(req, res, urlObj);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/wallet/spend') {
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    spendWallet(res, payload);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/lava/create-invoice') {
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    await createInvoice(req, res, payload).catch((error) => {
      json(res, 500, { error: 'create-invoice failed', details: String(error) });
    });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/lava/webhook') {
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    creditFromWebhook(req, res, rawBody, payload);
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Wallet API listening on http://localhost:${port}`);
});
