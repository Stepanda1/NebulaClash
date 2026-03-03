import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(rootDir, 'data');
const statePath = join(dataDir, 'wallet-state.json');
const port = Number(process.env.PORT || 8787);
const authSecret = String(process.env.API_AUTH_SECRET || '');
const adminPlayerIds = new Set(
  String(process.env.ADMIN_PLAYER_ID || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
const sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS || 60 * 60 * 24 * 30);
const initialCoins = Math.max(0, Math.floor(Number(process.env.INITIAL_COINS || 50)));
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const MAX_BODY_SIZE = 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_STORE = new Map();
const JSON_CONTENT_TYPES = ['application/json', 'application/json; charset=utf-8'];

const DEFAULT_PACKS = [
  { id: 'pack-120', coins: 60, amountRub: 99 },
  { id: 'pack-300', coins: 150, amountRub: 199 },
  { id: 'pack-800', coins: 420, amountRub: 499 },
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

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const originUrl = new URL(origin);
    const host = originUrl.hostname.toLowerCase();

    if (host === 'nebulaclash.com' || host === 'www.nebulaclash.com') {
      return true;
    }

    if (host.endsWith('.nebulaclash.com')) {
      return true;
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function applyCors(req, res) {
  const origin = String(req.headers.origin || '').trim();
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Signature, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').trim();
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return String(req.socket?.remoteAddress || '').trim() || 'unknown';
}

function cleanupRateLimitBucket(now) {
  for (const [key, bucket] of RATE_LIMIT_STORE.entries()) {
    if (bucket.resetAt <= now) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}

function enforceRateLimit(req, res, bucketName, limit, windowMs = RATE_LIMIT_WINDOW_MS) {
  const now = Date.now();
  cleanupRateLimitBucket(now);

  const key = `${bucketName}:${getClientIp(req)}`;
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || existing.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    json(res, 429, { error: 'Too many requests', retryAfter: retryAfterSeconds });
    return false;
  }

  existing.count += 1;
  return true;
}

function isJsonRequest(req) {
  const contentType = String(req.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  return JSON_CONTENT_TYPES.some((item) => item.split(';')[0] === contentType);
}

function requireJsonRequest(req, res) {
  if (isJsonRequest(req)) return true;
  json(res, 415, { error: 'Content-Type must be application/json' });
  return false;
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

function safeEqual(a, b) {
  if (!a || !b) return false;
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function safeEqualHex(a, b) {
  if (!a || !b) return false;
  return safeEqual(a.trim().toLowerCase(), b.trim().toLowerCase());
}

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function signSessionToken(payload) {
  if (!authSecret) return null;
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = toBase64Url(
    createHmac('sha256', authSecret).update(encodedPayload).digest(),
  );
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  if (!authSecret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, encodedSignature] = parts;
  const expectedSignature = toBase64Url(
    createHmac('sha256', authSecret).update(encodedPayload).digest(),
  );

  if (!safeEqual(encodedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    const playerId = String(payload?.playerId || '').trim();
    const exp = Number(payload?.exp || 0);
    if (!playerId || !Number.isFinite(exp) || Date.now() >= exp * 1000) {
      return null;
    }
    return { playerId, exp };
  } catch {
    return null;
  }
}

function issueSession(playerId) {
  const exp = Math.floor(Date.now() / 1000) + Math.max(300, sessionTtlSeconds);
  return signSessionToken({ playerId, exp });
}

function extractBearerToken(req) {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) return '';
  return authHeader.slice(7).trim();
}

function requireAuth(req, res) {
  if (!authSecret) {
    json(res, 500, { error: 'API_AUTH_SECRET is required for protected routes' });
    return null;
  }

  const token = extractBearerToken(req);
  const session = verifySessionToken(token);
  if (!session) {
    json(res, 401, { error: 'Unauthorized' });
    return null;
  }

  return session.playerId;
}

function isAdminPlayer(playerId) {
  const normalized = String(playerId || '').trim();
  return normalized ? adminPlayerIds.has(normalized) : false;
}

function ensureWallet(state, playerId) {
  if (typeof state.wallets[playerId] !== 'number') {
    state.wallets[playerId] = initialCoins;
    return true;
  }
  return false;
}

function initSession(res, payload) {
  if (!authSecret) {
    json(res, 500, { error: 'API_AUTH_SECRET is required' });
    return;
  }

  const tokenFromClient = String(payload?.token || '').trim();
  const validSession = verifySessionToken(tokenFromClient);
  const playerId = validSession?.playerId || `p_${randomUUID()}`;
  const token = issueSession(playerId);

  if (!token) {
    json(res, 500, { error: 'Failed to issue session token' });
    return;
  }

  const state = loadState();
  const changed = ensureWallet(state, playerId);
  if (changed) saveState(state);

  json(res, 200, {
    ok: true,
    playerId,
    token,
    balance: Number(state.wallets[playerId] || 0),
    isAdmin: isAdminPlayer(playerId),
  });
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim().toLowerCase();
  const proto = forwardedProto === 'https' ? 'https' : 'http';
  const host = String(req.headers.host || '').trim();

  if (!host) {
    return `http://localhost:${port}`;
  }

  try {
    const hostUrl = new URL(`${proto}://${host}`);
    if (!isOriginAllowed(hostUrl.origin)) {
      return `http://localhost:${port}`;
    }
  } catch {
    return `http://localhost:${port}`;
  }

  return `${proto}://${host}`;
}

function text(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(payload);
}

function getRobokassaPaymentUrl() {
  return process.env.ROBOKASSA_PAYMENT_URL || 'https://auth.robokassa.ru/Merchant/Index.aspx';
}

function formatAmount(amountRub) {
  return Number(amountRub).toFixed(2);
}

function collectShpParams(sourceObj) {
  const result = {};
  for (const [key, value] of Object.entries(sourceObj)) {
    if (!key.toLowerCase().startsWith('shp_')) continue;
    result[key] = String(value ?? '');
  }
  return result;
}

function buildRobokassaSignature(parts, password, shpParams = {}) {
  const normalizedShpParts = Object.entries(shpParams)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`);

  const signatureBase = [...parts, password, ...normalizedShpParts].join(':');
  return createHash('md5').update(signatureBase).digest('hex');
}

function buildPaymentReturnUrl(rawUrl, status, orderId) {
  const normalized = String(rawUrl || '').trim();
  if (!normalized) return '';

  try {
    const url = new URL(normalized);
    if (!isOriginAllowed(url.origin)) return '';
    url.searchParams.set('payment', status);
    url.searchParams.set('orderId', orderId);
    return url.toString();
  } catch {
    return '';
  }
}

function createRobokassaInvoice(state, req, playerId, pack, returnUrl = '') {
  const baseUrl = getBaseUrl(req);
  const merchantLogin = String(process.env.ROBOKASSA_MERCHANT_LOGIN || '').trim();
  const password1 = String(process.env.ROBOKASSA_PASSWORD1 || '').trim();
  const paymentUrlBase = getRobokassaPaymentUrl();
  const culture = String(process.env.ROBOKASSA_CULTURE || 'ru').trim();
  const isTest = String(process.env.ROBOKASSA_IS_TEST || '').trim();

  if (!merchantLogin || !password1) {
    return {
      error: 'ROBOKASSA_MERCHANT_LOGIN and ROBOKASSA_PASSWORD1 are required',
      status: 500,
    };
  }

  ensureWallet(state, playerId);
  const orderId = `${playerId}_${pack.id}_${Date.now()}`;
  const invId = String(Date.now());
  const outSum = formatAmount(pack.amountRub);
  const originHeader = (req.headers.origin || '').trim();
  const fallbackSuccess = buildPaymentReturnUrl(originHeader, 'success', orderId);
  const fallbackFail = buildPaymentReturnUrl(originHeader, 'fail', orderId);
  const successUrl =
    buildPaymentReturnUrl(returnUrl, 'success', orderId) ||
    buildPaymentReturnUrl(process.env.ROBOKASSA_SUCCESS_URL, 'success', orderId) ||
    fallbackSuccess ||
    buildPaymentReturnUrl(baseUrl, 'success', orderId);
  const failUrl =
    buildPaymentReturnUrl(returnUrl, 'fail', orderId) ||
    buildPaymentReturnUrl(process.env.ROBOKASSA_FAIL_URL, 'fail', orderId) ||
    fallbackFail ||
    buildPaymentReturnUrl(baseUrl, 'fail', orderId);
  const shp = { Shp_orderId: orderId };
  const signature = buildRobokassaSignature([merchantLogin, outSum, invId], password1, shp);

  const paymentUrl = new URL(paymentUrlBase);
  paymentUrl.searchParams.set('MerchantLogin', merchantLogin);
  paymentUrl.searchParams.set('OutSum', outSum);
  paymentUrl.searchParams.set('InvId', invId);
  paymentUrl.searchParams.set('Description', `Space coins ${pack.coins}`);
  paymentUrl.searchParams.set('SignatureValue', signature);
  paymentUrl.searchParams.set('ResultURL', `${baseUrl}/api/payments/robokassa/result`);
  paymentUrl.searchParams.set('SuccessURL', successUrl);
  paymentUrl.searchParams.set('FailURL', failUrl);
  paymentUrl.searchParams.set('Culture', culture);
  paymentUrl.searchParams.set('Encoding', 'utf-8');
  if (isTest) {
    paymentUrl.searchParams.set('IsTest', isTest);
  }
  Object.entries(shp).forEach(([key, value]) => paymentUrl.searchParams.set(key, value));

  state.orders[orderId] = {
    orderId,
    invId,
    playerId,
    packId: pack.id,
    coins: pack.coins,
    amountRub: pack.amountRub,
    outSum,
    status: 'created',
    createdAt: new Date().toISOString(),
    provider: 'robokassa',
  };

  return {
    ok: true,
    orderId,
    invId,
    paymentUrl: paymentUrl.toString(),
  };
}

async function createInvoice(req, res, payload, playerId) {
  const packId = String(payload.packId || '').trim();
  if (!packId) {
    json(res, 400, { error: 'packId is required' });
    return;
  }

  const pack = readPacks().find((item) => item.id === packId);
  if (!pack) {
    json(res, 404, { error: 'Unknown packId' });
    return;
  }

  const state = loadState();
  const returnUrl = String(payload.returnUrl || '').trim();
  const invoice = createRobokassaInvoice(state, req, playerId, pack, returnUrl);
  if (!invoice.ok) {
    json(res, invoice.status || 500, { error: invoice.error || 'Invoice create failed' });
    return;
  }

  saveState(state);

  json(res, 200, {
    ok: true,
    provider: 'robokassa',
    orderId: invoice.orderId,
    invId: invoice.invId,
    paymentUrl: invoice.paymentUrl,
  });
}

function getWallet(res, playerId) {
  const state = loadState();
  const changed = ensureWallet(state, playerId);
  if (changed) saveState(state);
  const balance = Number(state.wallets[playerId] || 0);
  json(res, 200, { playerId, balance, isAdmin: isAdminPlayer(playerId) });
}

function grantAdminCoins(res, payload, playerId) {
  if (!isAdminPlayer(playerId)) {
    json(res, 403, { error: 'Forbidden' });
    return;
  }

  const amount = Math.floor(Number(payload.amount || 0));
  if (amount === 0) {
    json(res, 400, { error: 'non-zero amount is required' });
    return;
  }

  const state = loadState();
  ensureWallet(state, playerId);
  const current = Number(state.wallets[playerId] || 0);
  const next = Math.max(0, current + amount);
  state.wallets[playerId] = next;
  saveState(state);

  json(res, 200, { ok: true, playerId, balance: next, isAdmin: true });
}

function spendWallet(res, payload, playerId) {
  const amount = Math.floor(Number(payload.amount || 0));
  if (amount <= 0) {
    json(res, 400, { error: 'positive amount is required' });
    return;
  }

  const state = loadState();
  ensureWallet(state, playerId);
  const current = Number(state.wallets[playerId] || 0);
  if (current < amount) {
    json(res, 409, { error: 'Not enough balance', balance: current });
    return;
  }

  const next = current - amount;
  state.wallets[playerId] = next;
  saveState(state);
  json(res, 200, { ok: true, playerId, balance: next });
}

function parseRobokassaPayload(rawBody, urlObj) {
  const params = new URLSearchParams(rawBody);
  const source = params.size > 0 ? params : urlObj.searchParams;
  const payload = {};
  for (const [key, value] of source.entries()) {
    payload[key] = value;
  }
  return payload;
}

function creditFromRobokassaResult(res, payload) {
  const password2 = String(process.env.ROBOKASSA_PASSWORD2 || '').trim();
  if (!password2) {
    text(res, 500, 'ROBOKASSA_PASSWORD2 is required');
    return;
  }

  const outSum = String(payload.OutSum || '').trim();
  const invId = String(payload.InvId || '').trim();
  const signature = String(payload.SignatureValue || payload.Signature || '').trim();
  const shp = collectShpParams(payload);

  if (!outSum || !invId || !signature) {
    text(res, 400, 'Missing OutSum/InvId/SignatureValue');
    return;
  }

  const expectedSignature = buildRobokassaSignature([outSum, invId], password2, shp);
  if (!safeEqualHex(signature, expectedSignature)) {
    text(res, 401, 'Invalid signature');
    return;
  }

  const orderIdFromShp = String(payload.Shp_orderId || '').trim();
  const state = loadState();
  const order =
    (orderIdFromShp && state.orders[orderIdFromShp]) ||
    Object.values(state.orders).find((item) => String(item.invId || '') === invId);

  if (!order) {
    text(res, 200, `OK${invId}`);
    return;
  }

  if (order.status === 'credited') {
    text(res, 200, `OK${invId}`);
    return;
  }

  if (Number(order.outSum || 0).toFixed(2) !== Number(outSum || 0).toFixed(2)) {
    text(res, 409, 'OutSum mismatch');
    return;
  }

  const playerId = String(order.playerId || '').trim();
  const current = Number(state.wallets[playerId] || 0);
  const next = current + Number(order.coins || 0);
  state.wallets[playerId] = next;
  order.status = 'credited';
  order.creditedAt = new Date().toISOString();
  order.provider = 'robokassa';
  order.lastWebhookPayload = payload;
  state.orders[order.orderId] = order;
  saveState(state);

  text(res, 200, `OK${invId}`);
}

const server = createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || `localhost:${port}`}`);
  const origin = String(req.headers.origin || '').trim();
  applyCors(req, res);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    if (origin && !isOriginAllowed(origin)) {
      json(res, 403, { error: 'Origin is not allowed' });
      return;
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  if (origin && !isOriginAllowed(origin)) {
    json(res, 403, { error: 'Origin is not allowed' });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/health') {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/session/init') {
    if (!enforceRateLimit(req, res, 'session-init', 30)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    initSession(res, payload);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/wallet') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    getWallet(res, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/wallet/spend') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'wallet-spend', 40)) return;
    if (!requireJsonRequest(req, res)) return;

    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    spendWallet(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/payments/robokassa/create-invoice') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'create-invoice', 20)) return;
    if (!requireJsonRequest(req, res)) return;

    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    await createInvoice(req, res, payload, playerId).catch((error) => {
      json(res, 500, { error: 'create-invoice failed', details: String(error) });
    });
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/admin/grant-coins') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'admin-grant-coins', 20)) return;
    if (!requireJsonRequest(req, res)) return;

    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    grantAdminCoins(res, payload, playerId);
    return;
  }

  if ((req.method === 'POST' || req.method === 'GET') && urlObj.pathname === '/api/payments/robokassa/result') {
    if (!enforceRateLimit(req, res, 'robokassa-result', 120)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseRobokassaPayload(rawBody, urlObj);
    creditFromRobokassaResult(res, payload);
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Wallet API listening on http://localhost:${port}`);
});
