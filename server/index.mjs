import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(rootDir, 'data');
const legacyStatePath = join(dataDir, 'wallet-state.json');
const dbPath = join(dataDir, 'wallet-state.sqlite');
const port = Number(process.env.PORT || 8787);
const authSecret = String(process.env.API_AUTH_SECRET || '');
const adminLogin = String(process.env.ADMIN_LOGIN || '').trim();
const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
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

function parseLegacyState() {
  if (!existsSync(legacyStatePath)) return null;
  try {
    const raw = readFileSync(legacyStatePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      wallets: parsed.wallets ?? {},
      orders: parsed.orders ?? {},
    };
  } catch {
    return null;
  }
}

function initDatabase() {
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS wallets (
      player_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      inv_id TEXT UNIQUE NOT NULL,
      player_id TEXT NOT NULL,
      pack_id TEXT NOT NULL,
      coins INTEGER NOT NULL,
      amount_rub REAL NOT NULL,
      out_sum TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      credited_at TEXT,
      provider TEXT NOT NULL,
      last_webhook_payload TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_player_id ON orders (player_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
    CREATE TABLE IF NOT EXISTS reward_claims (
      player_id TEXT NOT NULL,
      reward_key TEXT NOT NULL,
      amount INTEGER NOT NULL,
      claimed_at TEXT NOT NULL,
      PRIMARY KEY (player_id, reward_key)
    );
    CREATE TABLE IF NOT EXISTS daily_rewards (
      player_id TEXT PRIMARY KEY,
      last_claim_date TEXT NOT NULL,
      streak INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leaderboard_profiles (
      player_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      best_level INTEGER NOT NULL DEFAULT 1,
      best_score INTEGER NOT NULL DEFAULT 0,
      total_stars INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_profiles (best_level DESC, best_score DESC, total_stars DESC);
  `);

  const hasOrders = db.prepare('SELECT 1 AS ok FROM orders LIMIT 1').get();
  if (!hasOrders) {
    const legacy = parseLegacyState();
    if (legacy) {
      const insertWallet = db.prepare(`
        INSERT INTO wallets (player_id, balance, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(player_id) DO UPDATE SET
          balance = excluded.balance,
          updated_at = excluded.updated_at
      `);
      const insertOrder = db.prepare(`
        INSERT OR REPLACE INTO orders (
          order_id, inv_id, player_id, pack_id, coins, amount_rub, out_sum, status, created_at, credited_at, provider, last_webhook_payload
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const nowIso = new Date().toISOString();
      const migrate = () => {
        db.exec('BEGIN IMMEDIATE');
        try {
        Object.entries(legacy.wallets).forEach(([playerId, balance]) => {
          const normalizedId = String(playerId || '').trim();
          if (!normalizedId) return;
          const normalizedBalance = Math.max(0, Math.floor(Number(balance || 0)));
          insertWallet.run(normalizedId, normalizedBalance, nowIso);
        });

        Object.entries(legacy.orders).forEach(([orderId, orderRaw]) => {
          const order = orderRaw || {};
          const normalizedOrderId = String(order.orderId || orderId || '').trim();
          const invId = String(order.invId || '').trim();
          const playerId = String(order.playerId || '').trim();
          const packId = String(order.packId || '').trim();
          if (!normalizedOrderId || !invId || !playerId || !packId) return;

          const coins = Math.max(0, Math.floor(Number(order.coins || 0)));
          const amountRub = Number(order.amountRub || 0);
          const outSum = String(order.outSum || Number(amountRub || 0).toFixed(2));
          const status = String(order.status || 'created');
          const createdAt = String(order.createdAt || nowIso);
          const creditedAt = order.creditedAt ? String(order.creditedAt) : null;
          const provider = String(order.provider || 'robokassa');
          const webhookPayload = order.lastWebhookPayload ? JSON.stringify(order.lastWebhookPayload) : null;

          insertOrder.run(
            normalizedOrderId,
            invId,
            playerId,
            packId,
            coins,
            amountRub,
            outSum,
            status,
            createdAt,
            creditedAt,
            provider,
            webhookPayload,
          );
        });
          db.exec('COMMIT');
        } catch (error) {
          try {
            db.exec('ROLLBACK');
          } catch {
            // Ignore rollback failures and rethrow original error.
          }
          throw error;
        }
      };
      migrate();
    }
  }

  return db;
}

const db = initDatabase();

function withTransaction(work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback failures and rethrow the original error.
    }
    throw error;
  }
}

function normalizeOrigin(origin) {
  const value = String(origin || '').trim();
  if (!value) return '';

  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function getRequestOrigin(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').trim().toLowerCase();
  const proto = forwardedProto === 'https' ? 'https' : 'http';
  const host = String(req.headers.host || '').trim();
  if (!host) return '';

  return normalizeOrigin(`${proto}://${host}`);
}

function isOriginAllowed(origin, req) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(normalizedOrigin)) return true;

  const requestOrigin = req ? getRequestOrigin(req) : '';
  if (requestOrigin && normalizedOrigin === requestOrigin) {
    return true;
  }

  const publicBaseOrigin = normalizeOrigin(process.env.PUBLIC_BASE_URL || '');
  if (publicBaseOrigin && normalizedOrigin === publicBaseOrigin) {
    return true;
  }

  try {
    const originUrl = new URL(normalizedOrigin);
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
  if (origin && isOriginAllowed(origin, req)) {
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

function issueAdminSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  return signSessionToken({ role: 'admin', exp });
}

function verifyAdminToken(token) {
  if (!authSecret || !token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, encodedSignature] = parts;
  const expectedSignature = toBase64Url(
    createHmac('sha256', authSecret).update(encodedPayload).digest(),
  );

  if (!safeEqual(encodedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    const role = String(payload?.role || '').trim();
    const exp = Number(payload?.exp || 0);
    return role === 'admin' && Number.isFinite(exp) && Date.now() < exp * 1000;
  } catch {
    return false;
  }
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

function initAdminSession(res, payload) {
  if (!authSecret) {
    json(res, 500, { error: 'API_AUTH_SECRET is required' });
    return;
  }

  if (!adminLogin || !adminPassword) {
    json(res, 500, { error: 'ADMIN_LOGIN and ADMIN_PASSWORD are required' });
    return;
  }

  const username = String(payload?.username || '').trim();
  const password = String(payload?.password || '').trim();
  if (!safeEqual(username, adminLogin) || !safeEqual(password, adminPassword)) {
    json(res, 401, { error: 'Invalid credentials' });
    return;
  }

  const token = issueAdminSessionToken();
  if (!token) {
    json(res, 500, { error: 'Failed to issue admin token' });
    return;
  }

  json(res, 200, { ok: true, token });
}

function nowIso() {
  return new Date().toISOString();
}

function ensureWalletRow(playerId) {
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedPlayerId) return 0;

  db.prepare(`
    INSERT INTO wallets (player_id, balance, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(player_id) DO NOTHING
  `).run(normalizedPlayerId, initialCoins, nowIso());

  const row = db.prepare('SELECT balance FROM wallets WHERE player_id = ?').get(normalizedPlayerId);
  return Math.max(0, Math.floor(Number(row?.balance || 0)));
}

function grantCoins(playerId, amount) {
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedAmount = Math.max(0, Math.floor(Number(amount || 0)));
  if (!normalizedPlayerId || normalizedAmount <= 0) {
    return ensureWalletRow(normalizedPlayerId);
  }

  return withTransaction(() => {
    const current = ensureWalletRow(normalizedPlayerId);
    const next = current + normalizedAmount;
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, nowIso(), normalizedPlayerId);
    return next;
  });
}

function getUtcDateKey(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getDefaultDisplayName(playerId) {
  const normalized = String(playerId || '').trim();
  if (!normalized) return 'Pilot';
  return `Pilot-${normalized.slice(-4)}`;
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

  const balance = ensureWalletRow(playerId);

  json(res, 200, {
    ok: true,
    playerId,
    token,
    balance,
  });
}

function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL;
  const requestOrigin = getRequestOrigin(req);
  if (!requestOrigin) {
    return `http://localhost:${port}`;
  }

  if (!isOriginAllowed(requestOrigin, req)) {
    return `http://localhost:${port}`;
  }

  return requestOrigin;
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

function createRobokassaInvoice(req, playerId, pack, returnUrl = '') {
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

  ensureWalletRow(playerId);
  const orderId = `${playerId}_${pack.id}_${Date.now()}`;
  const invId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
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

  return {
    ok: true,
    orderId,
    invId,
    playerId,
    packId: pack.id,
    coins: pack.coins,
    amountRub: pack.amountRub,
    outSum,
    status: 'created',
    createdAt: nowIso(),
    provider: 'robokassa',
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

  const returnUrl = String(payload.returnUrl || '').trim();
  const invoice = createRobokassaInvoice(req, playerId, pack, returnUrl);
  if (!invoice.ok) {
    json(res, invoice.status || 500, { error: invoice.error || 'Invoice create failed' });
    return;
  }

  const createOrderTx = (order) => withTransaction(() => {
    ensureWalletRow(order.playerId);
    db.prepare(`
      INSERT INTO orders (
        order_id, inv_id, player_id, pack_id, coins, amount_rub, out_sum, status, created_at, provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order.orderId,
      order.invId,
      order.playerId,
      order.packId,
      order.coins,
      order.amountRub,
      order.outSum,
      order.status,
      order.createdAt,
      order.provider,
    );
  });

  try {
    createOrderTx(invoice);
  } catch {
    json(res, 500, { error: 'Invoice create failed' });
    return;
  }

  json(res, 200, {
    ok: true,
    provider: 'robokassa',
    orderId: invoice.orderId,
    invId: invoice.invId,
    paymentUrl: invoice.paymentUrl,
  });
}

function getWallet(res, playerId) {
  const balance = ensureWalletRow(playerId);
  json(res, 200, { playerId, balance });
}

function getOrderStatus(res, orderId, playerId) {
  const normalizedOrderId = String(orderId || '').trim();
  if (!normalizedOrderId) {
    json(res, 400, { error: 'orderId is required' });
    return;
  }

  const order = db.prepare(`
    SELECT order_id, status, pack_id, coins, amount_rub, created_at, credited_at, player_id
    FROM orders
    WHERE order_id = ?
  `).get(normalizedOrderId);
  if (!order) {
    json(res, 404, { error: 'Order not found' });
    return;
  }

  if (String(order.player_id || '').trim() !== playerId) {
    json(res, 403, { error: 'Order does not belong to this player' });
    return;
  }

  const balance = ensureWalletRow(playerId);
  json(res, 200, {
    ok: true,
    orderId: normalizedOrderId,
    status: String(order.status || 'created'),
    packId: String(order.pack_id || ''),
    coins: Number(order.coins || 0),
    amountRub: Number(order.amount_rub || 0),
    balance,
    createdAt: String(order.created_at || ''),
    creditedAt: order.credited_at ? String(order.credited_at) : null,
  });
}

function grantCoinsWithAdminToken(res, payload) {
  const playerId = String(payload.playerId || '').trim();
  if (!playerId) {
    json(res, 400, { error: 'playerId is required' });
    return;
  }

  const amount = Math.floor(Number(payload.amount || 0));
  if (amount === 0) {
    json(res, 400, { error: 'non-zero amount is required' });
    return;
  }

  const grantTx = (targetPlayerId, delta) => withTransaction(() => {
    const current = ensureWalletRow(targetPlayerId);
    const next = Math.max(0, current + delta);
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, nowIso(), targetPlayerId);
    return next;
  });

  const next = grantTx(playerId, amount);

  json(res, 200, { ok: true, playerId, balance: next });
}

function spendWallet(res, payload, playerId) {
  const amount = Math.floor(Number(payload.amount || 0));
  if (amount <= 0) {
    json(res, 400, { error: 'positive amount is required' });
    return;
  }

  const spendTx = (targetPlayerId, cost) => withTransaction(() => {
    const current = ensureWalletRow(targetPlayerId);
    if (current < cost) {
      return { ok: false, balance: current };
    }

    const next = current - cost;
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, nowIso(), targetPlayerId);
    return { ok: true, balance: next };
  });

  const result = spendTx(playerId, amount);
  if (!result.ok) {
    json(res, 409, { error: 'Not enough balance', balance: result.balance });
    return;
  }

  json(res, 200, { ok: true, playerId, balance: result.balance });
}

function claimLevelCompletionReward(res, payload, playerId) {
  const level = Math.max(1, Math.floor(Number(payload.level || 1)));
  const score = Math.max(0, Math.floor(Number(payload.score || 0)));
  const stars = Math.max(0, Math.floor(Number(payload.stars || 0)));
  const reward = Math.max(15, Math.min(140, 20 + level * 2 + Math.min(4, stars) * 3 + Math.min(10000, score) / 2000));
  const rewardKey = `level_complete_${level}`;

  const result = withTransaction(() => {
    const existing = db.prepare(`
      SELECT amount
      FROM reward_claims
      WHERE player_id = ? AND reward_key = ?
    `).get(playerId, rewardKey);

    const current = ensureWalletRow(playerId);
    if (existing) {
      return { granted: false, balance: current };
    }

    const next = current + reward;
    const claimedAt = nowIso();

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, reward, claimedAt);

    return { granted: true, balance: next };
  });

  json(res, 200, {
    ok: true,
    granted: result.granted,
    reward,
    level,
    balance: result.balance,
  });
}

function getDailyRewardStatus(res, playerId) {
  const row = db.prepare(`
    SELECT last_claim_date, streak
    FROM daily_rewards
    WHERE player_id = ?
  `).get(playerId);

  const today = getUtcDateKey(0);
  const canClaim = !row || String(row.last_claim_date || '') !== today;
  const streak = Math.max(1, Math.floor(Number(row?.streak || 1)));
  const rewards = [40, 55, 70, 90, 110, 140, 180];
  const nextStreak = canClaim
    ? (() => {
      const yesterday = getUtcDateKey(-1);
      if (row && String(row.last_claim_date || '') === yesterday) {
        return Math.min(rewards.length, streak + 1);
      }
      return 1;
    })()
    : streak;
  const nextReward = rewards[Math.max(0, Math.min(rewards.length - 1, nextStreak - 1))];
  const nextClaimAt = canClaim ? null : `${getUtcDateKey(1)}T00:00:00.000Z`;

  json(res, 200, {
    ok: true,
    canClaim,
    streak,
    lastClaimDate: row ? String(row.last_claim_date || '') : null,
    nextReward,
    nextClaimAt,
  });
}

function claimDailyReward(res, playerId) {
  const rewards = [40, 55, 70, 90, 110, 140, 180];
  const today = getUtcDateKey(0);
  const yesterday = getUtcDateKey(-1);

  const result = withTransaction(() => {
    const row = db.prepare(`
      SELECT last_claim_date, streak
      FROM daily_rewards
      WHERE player_id = ?
    `).get(playerId);

    const current = ensureWalletRow(playerId);
    if (row && String(row.last_claim_date || '') === today) {
      const streak = Math.max(1, Math.floor(Number(row.streak || 1)));
      const reward = rewards[Math.max(0, Math.min(rewards.length - 1, streak - 1))];
      return { granted: false, reward, streak, balance: current };
    }

    const previousStreak = Math.max(1, Math.floor(Number(row?.streak || 1)));
    const streak = row && String(row.last_claim_date || '') === yesterday
      ? Math.min(rewards.length, previousStreak + 1)
      : 1;
    const reward = rewards[Math.max(0, Math.min(rewards.length - 1, streak - 1))];
    const next = current + reward;
    const updatedAt = nowIso();

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, updatedAt, playerId);
    db.prepare(`
      INSERT INTO daily_rewards (player_id, last_claim_date, streak, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        last_claim_date = excluded.last_claim_date,
        streak = excluded.streak,
        updated_at = excluded.updated_at
    `).run(playerId, today, streak, updatedAt);

    return { granted: true, reward, streak, balance: next };
  });

  json(res, 200, {
    ok: true,
    granted: result.granted,
    reward: result.reward,
    streak: result.streak,
    balance: result.balance,
    nextClaimAt: `${getUtcDateKey(1)}T00:00:00.000Z`,
  });
}

function submitLeaderboard(res, payload, playerId) {
  const bestLevel = Math.max(1, Math.floor(Number(payload.bestLevel || 1)));
  const bestScore = Math.max(0, Math.floor(Number(payload.bestScore || 0)));
  const totalStars = Math.max(0, Math.floor(Number(payload.totalStars || 0)));
  const incomingName = String(payload.displayName || '').trim();
  const displayName = (incomingName || getDefaultDisplayName(playerId)).slice(0, 24);

  withTransaction(() => {
    const existing = db.prepare(`
      SELECT display_name, best_level, best_score, total_stars
      FROM leaderboard_profiles
      WHERE player_id = ?
    `).get(playerId);

    const mergedLevel = Math.max(bestLevel, Math.floor(Number(existing?.best_level || 1)));
    const mergedScore = Math.max(bestScore, Math.floor(Number(existing?.best_score || 0)));
    const mergedStars = Math.max(totalStars, Math.floor(Number(existing?.total_stars || 0)));
    const mergedName = displayName || String(existing?.display_name || getDefaultDisplayName(playerId)).slice(0, 24);

    db.prepare(`
      INSERT INTO leaderboard_profiles (player_id, display_name, best_level, best_score, total_stars, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        display_name = excluded.display_name,
        best_level = excluded.best_level,
        best_score = excluded.best_score,
        total_stars = excluded.total_stars,
        updated_at = excluded.updated_at
    `).run(playerId, mergedName, mergedLevel, mergedScore, mergedStars, nowIso());
  });

  json(res, 200, { ok: true });
}

function getLeaderboardTop(res, requestedLimit) {
  const limit = Math.max(1, Math.min(50, Math.floor(Number(requestedLimit || 20))));
  const rows = db.prepare(`
    SELECT display_name, best_level, best_score, total_stars
    FROM leaderboard_profiles
    ORDER BY best_level DESC, best_score DESC, total_stars DESC, updated_at ASC
    LIMIT ?
  `).all(limit);

  const items = rows.map((row, index) => ({
    rank: index + 1,
    displayName: String(row.display_name || 'Pilot'),
    bestLevel: Math.max(1, Math.floor(Number(row.best_level || 1))),
    bestScore: Math.max(0, Math.floor(Number(row.best_score || 0))),
    totalStars: Math.max(0, Math.floor(Number(row.total_stars || 0))),
  }));

  json(res, 200, { ok: true, items });
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

  const creditTx = (candidateOrderId, providerInvId, providerOutSum, webhookPayload) => withTransaction(() => {
    let order = null;
    if (candidateOrderId) {
      order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(candidateOrderId);
    }
    if (!order) {
      order = db.prepare('SELECT * FROM orders WHERE inv_id = ?').get(providerInvId);
    }
    if (!order) return { status: 'missing' };
    if (String(order.status || '') === 'credited') {
      return { status: 'already', invId: String(order.inv_id || providerInvId) };
    }
    if (Number(order.out_sum || 0).toFixed(2) !== Number(providerOutSum || 0).toFixed(2)) {
      return { status: 'mismatch' };
    }

    const playerId = String(order.player_id || '').trim();
    const current = ensureWalletRow(playerId);
    const next = current + Number(order.coins || 0);
    const creditedAt = nowIso();

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, creditedAt, playerId);
    db.prepare(`
      UPDATE orders
      SET status = 'credited',
          credited_at = ?,
          provider = 'robokassa',
          last_webhook_payload = ?
      WHERE order_id = ?
    `).run(creditedAt, webhookPayload, order.order_id);

    return { status: 'credited', invId: String(order.inv_id || providerInvId) };
  });

  const result = creditTx(orderIdFromShp, invId, outSum, JSON.stringify(payload));
  if (result.status === 'mismatch') {
    text(res, 409, 'OutSum mismatch');
    return;
  }

  text(res, 200, `OK${result.invId || invId}`);
}

const server = createServer(async (req, res) => {
  const urlObj = new URL(req.url || '/', `http://${req.headers.host || `localhost:${port}`}`);
  const origin = String(req.headers.origin || '').trim();
  applyCors(req, res);
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    if (origin && !isOriginAllowed(origin, req)) {
      json(res, 403, { error: 'Origin is not allowed' });
      return;
    }
    res.statusCode = 204;
    res.end();
    return;
  }

  if (origin && !isOriginAllowed(origin, req)) {
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

  if (req.method === 'POST' && urlObj.pathname === '/api/admin/session') {
    if (!enforceRateLimit(req, res, 'admin-session', 20)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    initAdminSession(res, payload);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/wallet') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    getWallet(res, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/rewards/daily-status') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-status', 40)) return;
    getDailyRewardStatus(res, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/rewards/daily-claim') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-claim', 20)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    claimDailyReward(res, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/rewards/level-complete') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'level-reward', 30)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    claimLevelCompletionReward(res, payload, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/leaderboard/top') {
    if (!enforceRateLimit(req, res, 'leaderboard-top', 60)) return;
    getLeaderboardTop(res, urlObj.searchParams.get('limit'));
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/leaderboard/submit') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'leaderboard-submit', 40)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    submitLeaderboard(res, payload, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/payments/order-status') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'order-status', 60)) return;
    getOrderStatus(res, urlObj.searchParams.get('orderId'), playerId);
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
    if (!enforceRateLimit(req, res, 'admin-grant-coins', 20)) return;
    if (!requireJsonRequest(req, res)) return;

    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }

    const token = extractBearerToken(req);
    if (verifyAdminToken(token)) {
      grantCoinsWithAdminToken(res, payload);
      return;
    }

    json(res, 401, { error: 'Unauthorized' });
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
