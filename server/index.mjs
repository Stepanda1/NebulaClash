import { createHmac, createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(rootDir, 'data');
const legacyStatePath = join(dataDir, 'wallet-state.json');
const dbPath = join(dataDir, 'wallet-state.sqlite');
const liveConfigPath = join(dataDir, 'live-config.json');
const port = Number(process.env.PORT || 8787);
const authSecret = String(process.env.API_AUTH_SECRET || '');
const adminLogin = String(process.env.ADMIN_LOGIN || '').trim();
const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim();
const calendarTimeZone = String(process.env.GAME_TIMEZONE || 'Asia/Yekaterinburg').trim() || 'Asia/Yekaterinburg';
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

const STARTER_BUNDLE_DEFAULT = {
  id: 'starter-bundle',
  coins: 120,
  amountRub: 149,
  modifierTokens: 1,
  continueReserve: 2,
  expiresInHours: 12,
};

const DAILY_REWARD_CALENDAR = [
  18, 20, 22, 24, 26, 30, 36, 22, 24, 26,
  28, 32, 36, 40, 26, 28, 30, 32, 36, 40,
  30, 32, 34, 36, 40, 44, 48, 38, 44, 72,
];

const DAILY_COLLECTION_MILESTONES = {
  7: 25,
  14: 35,
  21: 45,
  30: 60,
};

const LEVEL_COMPLETION_MILESTONES = {
  3: 20,
  5: 25,
  10: 45,
  15: 60,
  20: 80,
  30: 120,
};

const DAILY_MISSION_DEFINITIONS = [
  { id: 'bomb_activations', target: 4, reward: 18 },
  { id: 'score_1800', target: 2200, reward: 20 },
  { id: 'clean_clears', target: 3, reward: 28 },
  { id: 'lightning_activations', target: 1, reward: 24 },
  { id: 'level_completions', target: 4, reward: 16 },
  { id: 'score_2600', target: 3400, reward: 32 },
];

const DAILY_MISSION_REROLL_COST = 30;
const DAILY_MISSION_COMPLETION_CHEST_REWARD = 35;
const WEEKLY_MISSION_TARGET = 18;
const WEEKLY_MISSION_CHEST_REWARD = 60;

const LEADERBOARD_CHEST_TIERS = [
  { id: 'top10', maxRank: 10, reward: 80 },
  { id: 'top5', maxRank: 5, reward: 140 },
  { id: 'top3', maxRank: 3, reward: 220 },
];

const FALLBACK_LEADERBOARD_PROFILES = [
  { displayName: 'NovaFox', bestLevel: 9, bestScore: 2480, totalStars: 22 },
  { displayName: 'CometHex', bestLevel: 8, bestScore: 2210, totalStars: 19 },
  { displayName: 'OrionPulse', bestLevel: 7, bestScore: 1980, totalStars: 16 },
  { displayName: 'VoidPilot', bestLevel: 6, bestScore: 1730, totalStars: 14 },
  { displayName: 'SolarMint', bestLevel: 5, bestScore: 1490, totalStars: 11 },
];

const DEFAULT_LIVE_CONFIG = {
  economy: {
    boosterCost: 18,
    moveBoostAmount: 5,
    timeBoostSeconds: 30,
    runModifierCosts: {
      startBomb: 18,
      startLightning: 18,
      bossShield: 24,
      trashCleaner: 22,
    },
    missionRerollCost: DAILY_MISSION_REROLL_COST,
  },
  monetization: {
    coinPacks: DEFAULT_PACKS,
    starterOffer: {
      ...STARTER_BUNDLE_DEFAULT,
    },
  },
  experiments: {
    shopTimingVariantWeights: {
      a: 0.34,
      b: 0.33,
      c: 0.33,
    },
    forcedVariant: null,
  },
  event: {
    active: true,
    id: 'cryo_storm_weekly',
    title: 'Cryo Storm Sector',
    description: 'Launch special runs with cryo shields, close event missions, and convert the storm into extra rewards.',
    endsAt: null,
    accentColor: '#67e8f9',
    eventRunIceTiles: 10,
    scoreMultiplier: 1.15,
    rewardMultiplier: 1.25,
    missions: [
      {
        id: 'cryo_clear_24',
        title: 'Break Cryo Shields',
        description: 'Clear 24 cryo cells during event runs.',
        target: 24,
        reward: 110,
        metric: 'ice_cleared',
      },
      {
        id: 'storm_runs_3',
        title: 'Close 3 Storm Runs',
        description: 'Finish 3 levels while the event flag is active.',
        target: 3,
        reward: 140,
        metric: 'levels_completed',
      },
      {
        id: 'boss_pressure_80',
        title: 'Pressure the Sector Boss',
        description: 'Deal 80 total boss damage across event runs.',
        target: 80,
        reward: 160,
        metric: 'boss_damage',
      },
    ],
    shopOffers: [
      {
        id: 'event_pack_mid',
        title: 'Storm Reserve',
        description: 'Mid pack tuned for event progression.',
        packId: 'pack-300',
        badge: 'Event pack',
      },
      {
        id: 'event_modifier_boss',
        title: 'Cryo Shield Crack',
        description: 'Open the next event run with a boss-safe start.',
        modifierId: 'bossShield',
        priceCoins: 14,
        badge: 'Event boost',
      },
    ],
  },
};

function mergePlainObjects(base, override) {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return base;
  }

  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = mergePlainObjects(result[key], value);
      continue;
    }

    result[key] = value;
  }
  return result;
}

function readLiveConfig() {
  if (!existsSync(liveConfigPath)) {
    return DEFAULT_LIVE_CONFIG;
  }

  try {
    const parsed = JSON.parse(readFileSync(liveConfigPath, 'utf8'));
    return mergePlainObjects(DEFAULT_LIVE_CONFIG, parsed);
  } catch {
    return DEFAULT_LIVE_CONFIG;
  }
}

function persistLiveConfig(config) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(liveConfigPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

let liveConfigCache = readLiveConfig();

function getLiveConfig() {
  liveConfigCache = readLiveConfig();
  return liveConfigCache;
}

function getStarterBundleConfig() {
  return getLiveConfig().monetization?.starterOffer || STARTER_BUNDLE_DEFAULT;
}

function getEventConfig() {
  return getLiveConfig().event || DEFAULT_LIVE_CONFIG.event;
}

function getEventEndsAt() {
  const configured = String(getEventConfig().endsAt || '').trim();
  if (configured) return configured;
  const now = new Date();
  const day = now.getUTCDay() || 7;
  const daysUntilNextMonday = 8 - day;
  now.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

function readPacks() {
  const liveConfigPacks = getLiveConfig().monetization?.coinPacks;
  if (Array.isArray(liveConfigPacks) && liveConfigPacks.length > 0) {
    const normalizedLive = liveConfigPacks
      .map((item) => ({
        id: String(item.id || ''),
        coins: Number(item.coins || 0),
        amountRub: Number(item.amountRub || item.amount || 0),
      }))
      .filter((item) => item.id && item.coins > 0 && item.amountRub > 0);
    if (normalizedLive.length > 0) {
      return normalizedLive;
    }
  }

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

  const ensureColumn = (tableName, columnName, definition) => {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    if (columns.some((column) => String(column.name || '') === columnName)) {
      return;
    }
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  };

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
    CREATE TABLE IF NOT EXISTS daily_mission_progress (
      player_id TEXT NOT NULL,
      mission_date TEXT NOT NULL,
      bomb_activations INTEGER NOT NULL DEFAULT 0,
      highest_score INTEGER NOT NULL DEFAULT 0,
      clean_level_clears INTEGER NOT NULL DEFAULT 0,
      lightning_activations INTEGER NOT NULL DEFAULT 0,
      level_completions INTEGER NOT NULL DEFAULT 0,
      mission_ids_json TEXT NOT NULL DEFAULT '[]',
      free_rerolls_used INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (player_id, mission_date)
    );
    CREATE TABLE IF NOT EXISTS player_profiles (
      player_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      unlocked_level INTEGER NOT NULL DEFAULT 1,
      level_stars_json TEXT NOT NULL DEFAULT '{}',
      best_score INTEGER NOT NULL DEFAULT 0,
      weekly_loop_json TEXT NOT NULL DEFAULT '{}',
      event_progress_json TEXT NOT NULL DEFAULT '{}',
      tutorial_completed INTEGER NOT NULL DEFAULT 0,
      modifier_tokens INTEGER NOT NULL DEFAULT 0,
      continue_reserve INTEGER NOT NULL DEFAULT 0,
      starter_offer_expires_at TEXT,
      starter_bundle_claimed INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn('daily_rewards', 'total_claims', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('daily_mission_progress', 'lightning_activations', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('daily_mission_progress', 'level_completions', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('daily_mission_progress', 'mission_ids_json', "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn('daily_mission_progress', 'free_rerolls_used', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('player_profiles', 'event_progress_json', "TEXT NOT NULL DEFAULT '{}'");

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

function parseJsonObject(rawValue, fallbackValue) {
  try {
    const parsed = JSON.parse(String(rawValue || ''));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore malformed stored JSON
  }
  return fallbackValue;
}

function ensurePlayerProfileRow(playerId) {
  const normalizedPlayerId = String(playerId || '').trim();
  if (!normalizedPlayerId) return null;

  const existing = db.prepare(`
    SELECT *
    FROM player_profiles
    WHERE player_id = ?
  `).get(normalizedPlayerId);
  if (existing) {
    return existing;
  }

  const updatedAt = nowIso();
  const starterBundle = getStarterBundleConfig();
  const expiresAt = new Date(Date.now() + starterBundle.expiresInHours * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO player_profiles (
      player_id,
      display_name,
      unlocked_level,
      level_stars_json,
      best_score,
      weekly_loop_json,
      event_progress_json,
      tutorial_completed,
      modifier_tokens,
      continue_reserve,
      starter_offer_expires_at,
      starter_bundle_claimed,
      updated_at
    ) VALUES (?, ?, 1, '{}', 0, '{}', '{}', 0, 0, 0, ?, 0, ?)
  `).run(normalizedPlayerId, '', expiresAt, updatedAt);

  return db.prepare(`
    SELECT *
    FROM player_profiles
    WHERE player_id = ?
  `).get(normalizedPlayerId);
}

function getPlayerProfile(playerId) {
  const row = ensurePlayerProfileRow(playerId);
  const starterBundle = getStarterBundleConfig();
  const displayName = String(row?.display_name || '').trim();
  const normalizedEventProgress = normalizeEventProgress(parseJsonObject(row?.event_progress_json, {}));
  const starterOfferExpiresAt = row?.starter_offer_expires_at ? String(row.starter_offer_expires_at) : null;
  const starterOfferClaimed = Boolean(Number(row?.starter_bundle_claimed || 0));
  const starterOfferActive = !starterOfferClaimed
    && Boolean(starterOfferExpiresAt)
    && Date.parse(starterOfferExpiresAt || '') > Date.now();

  return {
    playerId,
    displayName,
    unlockedLevel: Math.max(1, Math.floor(Number(row?.unlocked_level || 1))),
    levelStars: parseJsonObject(row?.level_stars_json, {}),
    bestScore: Math.max(0, Math.floor(Number(row?.best_score || 0))),
    weeklyLoop: parseJsonObject(row?.weekly_loop_json, {}),
    eventProgress: normalizedEventProgress,
    tutorialCompleted: Boolean(Number(row?.tutorial_completed || 0)),
    modifierTokens: Math.max(0, Math.floor(Number(row?.modifier_tokens || 0))),
    continueReserve: Math.max(0, Math.floor(Number(row?.continue_reserve || 0))),
    starterOffer: {
      active: starterOfferActive,
      claimed: starterOfferClaimed,
      expiresAt: starterOfferExpiresAt,
      packId: starterBundle.id,
      coins: starterBundle.coins,
      amountRub: starterBundle.amountRub,
      modifierTokens: starterBundle.modifierTokens,
      continueReserve: starterBundle.continueReserve,
    },
  };
}

function updatePlayerProfileState(playerId, payload = {}) {
  return withTransaction(() => {
    const current = getPlayerProfile(playerId);
    const nextDisplayName = typeof payload.displayName === 'string'
      ? String(payload.displayName || '').trim().slice(0, 24)
      : current.displayName;
    const nextUnlockedLevel = payload.unlockedLevel == null
      ? current.unlockedLevel
      : Math.max(current.unlockedLevel, Math.max(1, Math.floor(Number(payload.unlockedLevel || 1))));
    const nextLevelStars = payload.levelStars && typeof payload.levelStars === 'object'
      ? payload.levelStars
      : current.levelStars;
    const nextBestScore = payload.bestScore == null
      ? current.bestScore
      : Math.max(current.bestScore, Math.max(0, Math.floor(Number(payload.bestScore || 0))));
    const nextWeeklyLoop = payload.weeklyLoop && typeof payload.weeklyLoop === 'object'
      ? payload.weeklyLoop
      : current.weeklyLoop;
    const nextEventProgress = payload.eventProgress && typeof payload.eventProgress === 'object'
      ? normalizeEventProgress(payload.eventProgress)
      : normalizeEventProgress(current.eventProgress);
    const nextTutorialCompleted = payload.tutorialCompleted == null
      ? current.tutorialCompleted
      : Boolean(payload.tutorialCompleted);

    db.prepare(`
      UPDATE player_profiles
      SET display_name = ?,
          unlocked_level = ?,
          level_stars_json = ?,
          best_score = ?,
          weekly_loop_json = ?,
          event_progress_json = ?,
          tutorial_completed = ?,
          updated_at = ?
      WHERE player_id = ?
    `).run(
      nextDisplayName,
      nextUnlockedLevel,
      JSON.stringify(nextLevelStars),
      nextBestScore,
      JSON.stringify(nextWeeklyLoop),
      JSON.stringify(nextEventProgress),
      nextTutorialCompleted ? 1 : 0,
      nowIso(),
      playerId,
    );

    return getPlayerProfile(playerId);
  });
}

function getUtcDateKey(offsetDays = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return formatCalendarDateKey(d);
}

function getUtcWeekKey(now = new Date()) {
  const zoned = getCalendarParts(now);
  const pseudoUtc = new Date(Date.UTC(zoned.year, zoned.month - 1, zoned.day, 12, 0, 0));
  const day = pseudoUtc.getUTCDay() || 7;
  pseudoUtc.setUTCDate(pseudoUtc.getUTCDate() - (day - 1));
  return pseudoUtc.toISOString().slice(0, 10);
}

function getCalendarParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: calendarTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || '00';
  return {
    year: Number(pick('year')),
    month: Number(pick('month')),
    day: Number(pick('day')),
  };
}

function formatCalendarDateKey(date = new Date()) {
  const { year, month, day } = getCalendarParts(date);
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseTimeZoneOffsetMinutes(rawOffset) {
  const normalized = String(rawOffset || '').trim().replace(/^GMT/, '').replace(/^UTC/, '');
  if (!normalized) return 0;
  const match = normalized.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] || 0);
  const minutes = Number(match[3] || 0);
  return sign * (hours * 60 + minutes);
}

function getTimeZoneOffsetMinutes(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: calendarTimeZone,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'longOffset',
  });
  const parts = formatter.formatToParts(date);
  const offsetLabel = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT+00:00';
  return parseTimeZoneOffsetMinutes(offsetLabel);
}

function getWeekStartIso(weekKey = getUtcWeekKey()) {
  const [year, month, day] = String(weekKey || '').split('-').map((part) => Number(part || 0));
  if (!year || !month || !day) {
    return `${weekKey}T00:00:00.000Z`;
  }
  const localMidnightUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return new Date(localMidnightUtc - offsetMinutes * 60 * 1000).toISOString();
}

function hashStringToUnitInterval(value) {
  const hash = createHash('sha256').update(String(value || '')).digest();
  const segment = hash.readUInt32BE(0);
  return segment / 0xffffffff;
}

function getAssignedShopTimingVariant(playerId) {
  const config = getLiveConfig().experiments || DEFAULT_LIVE_CONFIG.experiments;
  if (config.forcedVariant === 'a' || config.forcedVariant === 'b' || config.forcedVariant === 'c') {
    return config.forcedVariant;
  }

  const weights = {
    a: Math.max(0, Number(config.shopTimingVariantWeights?.a ?? 0.34)),
    b: Math.max(0, Number(config.shopTimingVariantWeights?.b ?? 0.33)),
    c: Math.max(0, Number(config.shopTimingVariantWeights?.c ?? 0.33)),
  };
  const total = weights.a + weights.b + weights.c || 1;
  const roll = hashStringToUnitInterval(playerId || 'anonymous');
  const aThreshold = weights.a / total;
  const bThreshold = aThreshold + (weights.b / total);
  if (roll < aThreshold) return 'a';
  if (roll < bThreshold) return 'b';
  return 'c';
}

function buildPublicLiveConfig(playerId = '') {
  const config = getLiveConfig();
  const event = getEventConfig();
  return {
    economy: config.economy,
    monetization: {
      coinPacks: readPacks().map((pack) => ({
        id: pack.id,
        coins: pack.coins,
        amountRub: pack.amountRub,
        priceLabel: `${pack.amountRub} ₽`,
      })),
      starterOffer: getStarterBundleConfig(),
    },
    experiments: {
      shopTimingVariantWeights: config.experiments?.shopTimingVariantWeights || DEFAULT_LIVE_CONFIG.experiments.shopTimingVariantWeights,
      forcedVariant: config.experiments?.forcedVariant ?? null,
      assignedVariant: playerId ? getAssignedShopTimingVariant(playerId) : null,
    },
    event: {
      ...event,
      endsAt: getEventEndsAt(),
    },
  };
}

function getDefaultEventProgress() {
  return {
    eventId: getEventConfig().id,
    iceCleared: 0,
    levelsCompleted: 0,
    bossDamage: 0,
    coinsSpent: 0,
    claimedMissionIds: [],
    updatedAt: nowIso(),
  };
}

function normalizeEventProgress(rawProgress) {
  const event = getEventConfig();
  const eventId = String(rawProgress?.eventId || '');
  if (!rawProgress || eventId !== event.id) {
    return getDefaultEventProgress();
  }

  const claimedMissionIds = Array.isArray(rawProgress.claimedMissionIds)
    ? rawProgress.claimedMissionIds.map((value) => String(value || '').trim()).filter(Boolean)
    : [];

  return {
    eventId: event.id,
    iceCleared: Math.max(0, Math.floor(Number(rawProgress.iceCleared || 0))),
    levelsCompleted: Math.max(0, Math.floor(Number(rawProgress.levelsCompleted || 0))),
    bossDamage: Math.max(0, Math.floor(Number(rawProgress.bossDamage || 0))),
    coinsSpent: Math.max(0, Math.floor(Number(rawProgress.coinsSpent || 0))),
    claimedMissionIds,
    updatedAt: typeof rawProgress.updatedAt === 'string' ? rawProgress.updatedAt : nowIso(),
  };
}

function getEventMetricValue(progress, metric) {
  if (metric === 'ice_cleared') return progress.iceCleared;
  if (metric === 'levels_completed') return progress.levelsCompleted;
  if (metric === 'boss_damage') return progress.bossDamage;
  return progress.coinsSpent;
}

function getDailyMissionProgressRow(playerId, missionDate = getUtcDateKey(0)) {
  return db.prepare(`
    SELECT bomb_activations, highest_score, clean_level_clears, lightning_activations, level_completions, mission_ids_json, free_rerolls_used
    FROM daily_mission_progress
    WHERE player_id = ? AND mission_date = ?
  `).get(playerId, missionDate);
}

function getClaimedRewardKeys(playerId, prefix) {
  return new Set(db.prepare(`
    SELECT reward_key
    FROM reward_claims
    WHERE player_id = ? AND reward_key LIKE ?
  `).all(playerId, `${prefix}%`).map((row) => String(row.reward_key || '')));
}

function buildDefaultMissionIds() {
  return DAILY_MISSION_DEFINITIONS.slice(0, 3).map((mission) => mission.id);
}

function sanitizeMissionIds(rawValue) {
  try {
    const parsed = JSON.parse(String(rawValue || '[]'));
    if (!Array.isArray(parsed)) return buildDefaultMissionIds();
    const valid = parsed
      .map((item) => String(item || '').trim())
      .filter((id) => DAILY_MISSION_DEFINITIONS.some((mission) => mission.id === id));
    if (valid.length === 3) {
      return valid;
    }
  } catch {
    // ignore malformed JSON
  }
  return buildDefaultMissionIds();
}

function ensureDailyMissionRow(playerId, missionDate = getUtcDateKey(0)) {
  const existing = getDailyMissionProgressRow(playerId, missionDate);
  if (existing) {
    return existing;
  }
  db.prepare(`
    INSERT INTO daily_mission_progress (
      player_id, mission_date, bomb_activations, highest_score, clean_level_clears, lightning_activations, level_completions, mission_ids_json, free_rerolls_used, updated_at
    ) VALUES (?, ?, 0, 0, 0, 0, 0, ?, 0, ?)
  `).run(playerId, missionDate, JSON.stringify(buildDefaultMissionIds()), nowIso());
  return getDailyMissionProgressRow(playerId, missionDate);
}

function getMissionCurrentProgress(progress, missionId) {
  if (missionId === 'bomb_activations') return progress.bombActivations;
  if (missionId === 'score_1800' || missionId === 'score_2600') return progress.highestScore;
  if (missionId === 'clean_clears') return progress.cleanLevelClears;
  if (missionId === 'lightning_activations') return progress.lightningActivations;
  if (missionId === 'level_completions') return progress.levelCompletions;
  return 0;
}

function buildWeeklyMissionTrack(playerId) {
  const weekKey = getUtcWeekKey();
  const weekStartIso = getWeekStartIso(weekKey);
  const claimedMissionCount = Math.max(0, Math.floor(Number(db.prepare(`
    SELECT COUNT(*) AS total
    FROM reward_claims
    WHERE player_id = ? AND reward_key LIKE 'daily_mission_%' AND reward_key NOT LIKE 'daily_mission_completion_%' AND claimed_at >= ?
  `).get(playerId, weekStartIso)?.total || 0)));
  const rewardKey = `weekly_mission_track_${weekKey}_${WEEKLY_MISSION_TARGET}`;
  const claimed = db.prepare(`
    SELECT 1 AS ok
    FROM reward_claims
    WHERE player_id = ? AND reward_key = ?
  `).get(playerId, rewardKey);

  return {
    weekKey,
    progress: claimedMissionCount,
    target: WEEKLY_MISSION_TARGET,
    reward: WEEKLY_MISSION_CHEST_REWARD,
    claimable: claimedMissionCount >= WEEKLY_MISSION_TARGET && !claimed,
    claimed: Boolean(claimed),
  };
}

function buildDailyMissionStatus(playerId, missionDate = getUtcDateKey(0)) {
  const progressRow = ensureDailyMissionRow(playerId, missionDate);
  const progress = {
    bombActivations: Math.max(0, Math.floor(Number(progressRow?.bomb_activations || 0))),
    highestScore: Math.max(0, Math.floor(Number(progressRow?.highest_score || 0))),
    cleanLevelClears: Math.max(0, Math.floor(Number(progressRow?.clean_level_clears || 0))),
    lightningActivations: Math.max(0, Math.floor(Number(progressRow?.lightning_activations || 0))),
    levelCompletions: Math.max(0, Math.floor(Number(progressRow?.level_completions || 0))),
  };
  const missionIds = sanitizeMissionIds(progressRow?.mission_ids_json);
  const claimedKeys = getClaimedRewardKeys(playerId, `daily_mission_${missionDate}_`);
  const missions = missionIds.map((missionId, slotIndex) => {
    const mission = DAILY_MISSION_DEFINITIONS.find((item) => item.id === missionId) || DAILY_MISSION_DEFINITIONS[slotIndex];
    const rewardKey = `daily_mission_${missionDate}_${mission.id}`;
    const current = getMissionCurrentProgress(progress, mission.id);
    return {
      slotIndex,
      id: mission.id,
      target: mission.target,
      reward: mission.reward,
      progress: current,
      completed: current >= mission.target,
      claimed: claimedKeys.has(rewardKey),
    };
  });

  const completionRewardKey = `daily_mission_completion_${missionDate}`;
  const completionClaimed = db.prepare(`
    SELECT 1 AS ok
    FROM reward_claims
    WHERE player_id = ? AND reward_key = ?
  `).get(playerId, completionRewardKey);
  const completedClaims = missions.filter((mission) => mission.claimed).length;

  return {
    missionDate,
    missions,
    freeRerollsRemaining: Math.max(0, 1 - Math.max(0, Math.floor(Number(progressRow?.free_rerolls_used || 0)))),
    paidRerollCost: DAILY_MISSION_REROLL_COST,
    completionChest: {
      reward: DAILY_MISSION_COMPLETION_CHEST_REWARD,
      claimable: completedClaims === missions.length && missions.length > 0 && !completionClaimed,
      claimed: Boolean(completionClaimed),
      progress: completedClaims,
      target: missions.length,
    },
    weeklyTrack: buildWeeklyMissionTrack(playerId),
  };
}

function rerollDailyMission(res, payload, playerId) {
  const missionDate = getUtcDateKey(0);
  const slotIndex = Math.max(0, Math.min(2, Math.floor(Number(payload.slotIndex || 0))));

  const result = withTransaction(() => {
    const row = ensureDailyMissionRow(playerId, missionDate);
    const currentMissionIds = sanitizeMissionIds(row?.mission_ids_json);
    const currentMissionId = currentMissionIds[slotIndex];
    const freeRerollsUsed = Math.max(0, Math.floor(Number(row?.free_rerolls_used || 0)));
    const hasFreeReroll = freeRerollsUsed < 1;

    if (!hasFreeReroll) {
      const wallet = ensureWalletRow(playerId);
      if (wallet < DAILY_MISSION_REROLL_COST) {
        return { ok: false, error: 'Not enough balance', balance: wallet };
      }
      db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
        .run(wallet - DAILY_MISSION_REROLL_COST, nowIso(), playerId);
    }

    const claimedKey = `daily_mission_${missionDate}_${currentMissionId}`;
    const missionClaimed = db.prepare(`
      SELECT 1 AS ok
      FROM reward_claims
      WHERE player_id = ? AND reward_key = ?
    `).get(playerId, claimedKey);
    if (missionClaimed) {
      return { ok: false, error: 'Claimed mission cannot be rerolled', balance: ensureWalletRow(playerId) };
    }

    const alternatives = DAILY_MISSION_DEFINITIONS
      .map((mission) => mission.id)
      .filter((missionId) => missionId !== currentMissionId && !currentMissionIds.includes(missionId));
    const replacementId = alternatives[Math.floor(Math.random() * alternatives.length)] || currentMissionId;
    currentMissionIds[slotIndex] = replacementId;

    db.prepare(`
      UPDATE daily_mission_progress
      SET mission_ids_json = ?, free_rerolls_used = ?, updated_at = ?
      WHERE player_id = ? AND mission_date = ?
    `).run(
      JSON.stringify(currentMissionIds),
      hasFreeReroll ? freeRerollsUsed + 1 : freeRerollsUsed,
      nowIso(),
      playerId,
      missionDate,
    );

    return { ok: true, balance: ensureWalletRow(playerId), freeRerollUsed: hasFreeReroll };
  });

  if (!result.ok) {
    json(res, 409, { error: result.error, balance: result.balance });
    return;
  }

  const status = buildDailyMissionStatus(playerId, missionDate);
  json(res, 200, {
    ok: true,
    balance: result.balance,
    missionDate: status.missionDate,
    missions: status.missions,
    freeRerollsRemaining: status.freeRerollsRemaining,
    paidRerollCost: status.paidRerollCost,
    completionChest: status.completionChest,
    weeklyTrack: status.weeklyTrack,
  });
}

function claimDailyMissionCompletionChest(res, playerId) {
  const missionDate = getUtcDateKey(0);
  const status = buildDailyMissionStatus(playerId, missionDate);
  if (!status.completionChest.claimable) {
    json(res, 409, { error: 'Completion chest is not claimable yet' });
    return;
  }

  const rewardKey = `daily_mission_completion_${missionDate}`;
  const balance = withTransaction(() => {
    const current = ensureWalletRow(playerId);
    const next = current + DAILY_MISSION_COMPLETION_CHEST_REWARD;
    const claimedAt = nowIso();
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, DAILY_MISSION_COMPLETION_CHEST_REWARD, claimedAt);
    return next;
  });

  const nextStatus = buildDailyMissionStatus(playerId, missionDate);
  json(res, 200, {
    ok: true,
    reward: DAILY_MISSION_COMPLETION_CHEST_REWARD,
    balance,
    missionDate: nextStatus.missionDate,
    missions: nextStatus.missions,
    freeRerollsRemaining: nextStatus.freeRerollsRemaining,
    paidRerollCost: nextStatus.paidRerollCost,
    completionChest: nextStatus.completionChest,
    weeklyTrack: nextStatus.weeklyTrack,
  });
}

function claimWeeklyMissionTrackChest(res, playerId) {
  const weeklyTrack = buildWeeklyMissionTrack(playerId);
  if (!weeklyTrack.claimable) {
    json(res, 409, { error: 'Weekly mission chest is not claimable yet' });
    return;
  }

  const rewardKey = `weekly_mission_track_${weeklyTrack.weekKey}_${weeklyTrack.target}`;
  const balance = withTransaction(() => {
    const current = ensureWalletRow(playerId);
    const next = current + WEEKLY_MISSION_CHEST_REWARD;
    const claimedAt = nowIso();
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, WEEKLY_MISSION_CHEST_REWARD, claimedAt);
    return next;
  });

  json(res, 200, {
    ok: true,
    reward: WEEKLY_MISSION_CHEST_REWARD,
    balance,
    weeklyTrack: buildWeeklyMissionTrack(playerId),
  });
}

function resolveLeaderboardTier(rank) {
  if (!Number.isFinite(rank) || rank <= 0) return null;
  return LEADERBOARD_CHEST_TIERS.find((tier) => rank <= tier.maxRank) || null;
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
  const profile = getPlayerProfile(playerId);

  json(res, 200, {
    ok: true,
    playerId,
    token,
    balance,
    profile,
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

  const profile = getPlayerProfile(playerId);
  const starterBundle = getStarterBundleConfig();
  const pack = packId === starterBundle.id
    ? (profile.starterOffer.active && !profile.starterOffer.claimed
        ? { id: starterBundle.id, coins: starterBundle.coins, amountRub: starterBundle.amountRub }
        : null)
    : readPacks().find((item) => item.id === packId);
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
  const baseReward = Math.max(15, Math.min(140, 20 + level * 2 + Math.min(4, stars) * 3 + Math.min(10000, score) / 2000));
  const rewardKey = `level_complete_${level}`;

  const result = withTransaction(() => {
    const existing = db.prepare(`
      SELECT amount
      FROM reward_claims
      WHERE player_id = ? AND reward_key = ?
    `).get(playerId, rewardKey);

    const current = ensureWalletRow(playerId);
    if (existing) {
      const completedLevelsCount = Math.max(0, Math.floor(Number(db.prepare(`
        SELECT COUNT(*) AS total
        FROM reward_claims
        WHERE player_id = ? AND reward_key LIKE 'level_complete_%'
      `).get(playerId)?.total || 0)));
      return { granted: false, balance: current, reward: baseReward, milestoneBonus: 0, completedLevelsCount };
    }

    const completedLevelsCount = Math.max(0, Math.floor(Number(db.prepare(`
      SELECT COUNT(*) AS total
      FROM reward_claims
      WHERE player_id = ? AND reward_key LIKE 'level_complete_%'
    `).get(playerId)?.total || 0))) + 1;
    const milestoneBonus = LEVEL_COMPLETION_MILESTONES[completedLevelsCount] || 0;
    const reward = baseReward + milestoneBonus;
    const next = current + reward;
    const claimedAt = nowIso();

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, reward, claimedAt);

    return { granted: true, balance: next, reward, milestoneBonus, completedLevelsCount };
  });

  json(res, 200, {
    ok: true,
    granted: result.granted,
    reward: result.reward,
    baseReward,
    milestoneBonus: result.milestoneBonus,
    completedLevelsCount: result.completedLevelsCount,
    level,
    balance: result.balance,
  });
}

function getDailyRewardStatus(res, playerId) {
  const row = db.prepare(`
    SELECT last_claim_date, streak, total_claims
    FROM daily_rewards
    WHERE player_id = ?
  `).get(playerId);

  const today = getUtcDateKey(0);
  const canClaim = !row || String(row.last_claim_date || '') !== today;
  const streak = Math.max(1, Math.floor(Number(row?.streak || 1)));
  const totalClaims = Math.max(0, Math.floor(Number(row?.total_claims || 0)));
  const claimDay = (totalClaims % DAILY_REWARD_CALENDAR.length) + 1;
  const nextStreak = canClaim
    ? (() => {
      const yesterday = getUtcDateKey(-1);
      if (row && String(row.last_claim_date || '') === yesterday) {
        return Math.min(DAILY_REWARD_CALENDAR.length, streak + 1);
      }
      return 1;
    })()
    : streak;
  const nextReward = DAILY_REWARD_CALENDAR[Math.max(0, Math.min(DAILY_REWARD_CALENDAR.length - 1, claimDay - 1))];
  const milestoneBonus = DAILY_COLLECTION_MILESTONES[claimDay] || 0;
  const nextClaimAt = canClaim ? null : `${getUtcDateKey(1)}T00:00:00.000Z`;

  json(res, 200, {
    ok: true,
    canClaim,
    streak,
    totalClaims,
    claimDay,
    lastClaimDate: row ? String(row.last_claim_date || '') : null,
    nextReward,
    milestoneBonus,
    calendarRewards: DAILY_REWARD_CALENDAR,
    nextClaimAt,
  });
}

function claimDailyReward(res, playerId) {
  const today = getUtcDateKey(0);
  const yesterday = getUtcDateKey(-1);

  const result = withTransaction(() => {
    const row = db.prepare(`
      SELECT last_claim_date, streak, total_claims
      FROM daily_rewards
      WHERE player_id = ?
    `).get(playerId);

    const current = ensureWalletRow(playerId);
    const totalClaims = Math.max(0, Math.floor(Number(row?.total_claims || 0)));
    const claimDay = (totalClaims % DAILY_REWARD_CALENDAR.length) + 1;
    const reward = DAILY_REWARD_CALENDAR[Math.max(0, Math.min(DAILY_REWARD_CALENDAR.length - 1, claimDay - 1))];
    const milestoneBonus = DAILY_COLLECTION_MILESTONES[claimDay] || 0;
    if (row && String(row.last_claim_date || '') === today) {
      const streak = Math.max(1, Math.floor(Number(row.streak || 1)));
      return { granted: false, reward, streak, balance: current, claimDay, totalClaims, milestoneBonus };
    }

    const previousStreak = Math.max(1, Math.floor(Number(row?.streak || 1)));
    const streak = row && String(row.last_claim_date || '') === yesterday
      ? Math.min(DAILY_REWARD_CALENDAR.length, previousStreak + 1)
      : 1;
    const next = current + reward + milestoneBonus;
    const updatedAt = nowIso();

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, updatedAt, playerId);
    db.prepare(`
      INSERT INTO daily_rewards (player_id, last_claim_date, streak, total_claims, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(player_id) DO UPDATE SET
        last_claim_date = excluded.last_claim_date,
        streak = excluded.streak,
        total_claims = excluded.total_claims,
        updated_at = excluded.updated_at
    `).run(playerId, today, streak, totalClaims + 1, updatedAt);

    return { granted: true, reward, streak, balance: next, claimDay, totalClaims: totalClaims + 1, milestoneBonus };
  });

  json(res, 200, {
    ok: true,
    granted: result.granted,
    reward: result.reward,
    streak: result.streak,
    claimDay: result.claimDay,
    totalClaims: result.totalClaims,
    milestoneBonus: result.milestoneBonus,
    balance: result.balance,
    calendarRewards: DAILY_REWARD_CALENDAR,
    nextClaimAt: `${getUtcDateKey(1)}T00:00:00.000Z`,
  });
}

function getDailyMissionsStatus(res, playerId) {
  const status = buildDailyMissionStatus(playerId);
  json(res, 200, {
    ok: true,
    missionDate: status.missionDate,
    missions: status.missions,
    freeRerollsRemaining: status.freeRerollsRemaining,
    paidRerollCost: status.paidRerollCost,
    completionChest: status.completionChest,
    weeklyTrack: status.weeklyTrack,
  });
}

function updateDailyMissionProgress(res, payload, playerId) {
  const missionDate = getUtcDateKey(0);
  const bombActivationsDelta = Math.max(0, Math.floor(Number(payload.bombActivationsDelta || 0)));
  const highestScore = Math.max(0, Math.floor(Number(payload.highestScore || 0)));
  const cleanLevelClearDelta = Math.max(0, Math.floor(Number(payload.cleanLevelClearDelta || 0)));
  const lightningActivationsDelta = Math.max(0, Math.floor(Number(payload.lightningActivationsDelta || 0)));
  const levelCompleteDelta = Math.max(0, Math.floor(Number(payload.levelCompleteDelta || 0)));

  withTransaction(() => {
    const current = ensureDailyMissionRow(playerId, missionDate);
    const nextBombActivations = Math.max(0, Math.floor(Number(current?.bomb_activations || 0))) + bombActivationsDelta;
    const nextHighestScore = Math.max(
      Math.max(0, Math.floor(Number(current?.highest_score || 0))),
      highestScore,
    );
    const nextCleanClears = Math.max(0, Math.floor(Number(current?.clean_level_clears || 0))) + cleanLevelClearDelta;
    const nextLightningActivations = Math.max(0, Math.floor(Number(current?.lightning_activations || 0))) + lightningActivationsDelta;
    const nextLevelCompletions = Math.max(0, Math.floor(Number(current?.level_completions || 0))) + levelCompleteDelta;
    const missionIdsJson = current?.mission_ids_json ? String(current.mission_ids_json) : JSON.stringify(buildDefaultMissionIds());
    const freeRerollsUsed = Math.max(0, Math.floor(Number(current?.free_rerolls_used || 0)));

    db.prepare(`
      INSERT INTO daily_mission_progress (
        player_id, mission_date, bomb_activations, highest_score, clean_level_clears, lightning_activations, level_completions, mission_ids_json, free_rerolls_used, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(player_id, mission_date) DO UPDATE SET
        bomb_activations = excluded.bomb_activations,
        highest_score = excluded.highest_score,
        clean_level_clears = excluded.clean_level_clears,
        lightning_activations = excluded.lightning_activations,
        level_completions = excluded.level_completions,
        mission_ids_json = excluded.mission_ids_json,
        free_rerolls_used = excluded.free_rerolls_used,
        updated_at = excluded.updated_at
    `).run(playerId, missionDate, nextBombActivations, nextHighestScore, nextCleanClears, nextLightningActivations, nextLevelCompletions, missionIdsJson, freeRerollsUsed, nowIso());
  });

  getDailyMissionsStatus(res, playerId);
}

function claimDailyMission(res, payload, playerId) {
  const missionId = String(payload.missionId || '').trim();
  const mission = DAILY_MISSION_DEFINITIONS.find((item) => item.id === missionId);
  if (!mission) {
    json(res, 400, { error: 'Unknown missionId' });
    return;
  }

  const missionDate = getUtcDateKey(0);
  const rewardKey = `daily_mission_${missionDate}_${mission.id}`;
  const status = buildDailyMissionStatus(playerId, missionDate);
  const targetMission = status.missions.find((item) => item.id === mission.id);
  if (!targetMission?.completed) {
    json(res, 409, { error: 'Mission is not completed yet' });
    return;
  }
  if (targetMission.claimed) {
    json(res, 409, { error: 'Mission reward already claimed' });
    return;
  }

  const balance = withTransaction(() => {
    const current = ensureWalletRow(playerId);
    const next = current + mission.reward;
    const claimedAt = nowIso();
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, mission.reward, claimedAt);
    return next;
  });

  const nextStatus = buildDailyMissionStatus(playerId, missionDate);
  json(res, 200, {
    ok: true,
    missionId,
    reward: mission.reward,
    balance,
    missionDate,
    missions: nextStatus.missions,
    freeRerollsRemaining: nextStatus.freeRerollsRemaining,
    paidRerollCost: nextStatus.paidRerollCost,
    completionChest: nextStatus.completionChest,
    weeklyTrack: nextStatus.weeklyTrack,
  });
}

function getProfileState(res, playerId) {
  json(res, 200, { ok: true, profile: getPlayerProfile(playerId) });
}

function updateProfileState(res, payload, playerId) {
  const profile = updatePlayerProfileState(playerId, payload);
  json(res, 200, { ok: true, profile });
}

function consumeProfileBonus(res, payload, playerId) {
  const bonusType = String(payload.type || '').trim();
  if (bonusType !== 'modifier_token' && bonusType !== 'continue_reserve') {
    json(res, 400, { error: 'Unknown bonus type' });
    return;
  }

  const profile = withTransaction(() => {
    const current = getPlayerProfile(playerId);
    if (bonusType === 'modifier_token' && current.modifierTokens <= 0) return null;
    if (bonusType === 'continue_reserve' && current.continueReserve <= 0) return null;

    db.prepare(`
      UPDATE player_profiles
      SET modifier_tokens = ?, continue_reserve = ?, updated_at = ?
      WHERE player_id = ?
    `).run(
      bonusType === 'modifier_token' ? current.modifierTokens - 1 : current.modifierTokens,
      bonusType === 'continue_reserve' ? current.continueReserve - 1 : current.continueReserve,
      nowIso(),
      playerId,
    );

    return getPlayerProfile(playerId);
  });

  if (!profile) {
    json(res, 409, { error: 'Bonus is not available' });
    return;
  }

  json(res, 200, { ok: true, profile });
}

function getLiveConfigState(res, playerId = '') {
  json(res, 200, {
    ok: true,
    config: buildPublicLiveConfig(playerId),
  });
}

function updateLiveConfigState(res, payload) {
  const nextConfig = mergePlainObjects(getLiveConfig(), payload && typeof payload === 'object' ? payload : {});
  persistLiveConfig(nextConfig);
  liveConfigCache = nextConfig;
  json(res, 200, {
    ok: true,
    config: buildPublicLiveConfig(''),
  });
}

function updateEventProgress(res, payload, playerId) {
  const event = getEventConfig();
  if (!event.active) {
    json(res, 409, { error: 'Event is not active' });
    return;
  }

  const profile = withTransaction(() => {
    const current = getPlayerProfile(playerId);
    const nextProgress = normalizeEventProgress(current.eventProgress);

    nextProgress.iceCleared += Math.max(0, Math.floor(Number(payload.iceClearedDelta || 0)));
    nextProgress.levelsCompleted += Math.max(0, Math.floor(Number(payload.levelsCompletedDelta || 0)));
    nextProgress.bossDamage += Math.max(0, Math.floor(Number(payload.bossDamageDelta || 0)));
    nextProgress.coinsSpent += Math.max(0, Math.floor(Number(payload.coinsSpentDelta || 0)));
    nextProgress.updatedAt = nowIso();

    db.prepare(`
      UPDATE player_profiles
      SET event_progress_json = ?, updated_at = ?
      WHERE player_id = ?
    `).run(JSON.stringify(nextProgress), nextProgress.updatedAt, playerId);

    return getPlayerProfile(playerId);
  });

  json(res, 200, {
    ok: true,
    profile,
    config: buildPublicLiveConfig(playerId),
  });
}

function claimEventMission(res, payload, playerId) {
  const missionId = String(payload?.missionId || '').trim();
  const event = getEventConfig();
  if (!event.active) {
    json(res, 409, { error: 'Event is not active' });
    return;
  }

  const mission = Array.isArray(event.missions) ? event.missions.find((item) => String(item.id || '') === missionId) : null;
  if (!mission) {
    json(res, 404, { error: 'Mission not found' });
    return;
  }

  const rewardKey = `weekly_event_${event.id}_${mission.id}`;
  const result = withTransaction(() => {
    const claimed = db.prepare(`
      SELECT 1 AS ok
      FROM reward_claims
      WHERE player_id = ? AND reward_key = ?
    `).get(playerId, rewardKey);
    if (claimed) {
      return { status: 'claimed' };
    }

    const profile = getPlayerProfile(playerId);
    const progress = normalizeEventProgress(profile.eventProgress);
    if (getEventMetricValue(progress, mission.metric) < Math.max(1, Math.floor(Number(mission.target || 0)))) {
      return { status: 'locked' };
    }

    const nextBalance = ensureWalletRow(playerId) + Math.max(0, Math.floor(Number(mission.reward || 0)));
    const claimedAt = nowIso();
    const nextProgress = {
      ...progress,
      claimedMissionIds: Array.from(new Set([...progress.claimedMissionIds, mission.id])),
      updatedAt: claimedAt,
    };

    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(nextBalance, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, mission.reward, claimedAt);
    db.prepare(`
      UPDATE player_profiles
      SET event_progress_json = ?, updated_at = ?
      WHERE player_id = ?
    `).run(JSON.stringify(nextProgress), claimedAt, playerId);

    return {
      status: 'claimed',
      balance: nextBalance,
      reward: mission.reward,
      profile: getPlayerProfile(playerId),
    };
  });

  if (result.status === 'claimed') {
    json(res, 200, {
      ok: true,
      reward: result.reward,
      balance: result.balance,
      profile: result.profile,
      config: buildPublicLiveConfig(playerId),
    });
    return;
  }

  json(res, result.status === 'locked' ? 409 : 409, {
    error: result.status === 'locked' ? 'Mission target not reached' : 'Mission already claimed',
  });
}

function submitLeaderboard(res, payload, playerId) {
  const bestLevel = Math.max(1, Math.floor(Number(payload.bestLevel || 1)));
  const bestScore = Math.max(0, Math.floor(Number(payload.bestScore || 0)));
  const totalStars = Math.max(0, Math.floor(Number(payload.totalStars || 0)));
  const incomingName = String(payload.displayName || '').trim();
  const displayName = (incomingName || getDefaultDisplayName(playerId)).slice(0, 24);

  withTransaction(() => {
    ensurePlayerProfileRow(playerId);
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

    db.prepare(`
      UPDATE player_profiles
      SET display_name = ?, updated_at = ?
      WHERE player_id = ?
    `).run(mergedName, nowIso(), playerId);
  });

  json(res, 200, { ok: true });
}

function getLeaderboardOverview(playerId, items) {
  if (!playerId) {
    return {
      playerRank: null,
      nextRival: null,
      weeklyTier: null,
      chest: null,
    };
  }

  const playerRow = db.prepare(`
    SELECT display_name, best_level, best_score, total_stars
    FROM leaderboard_profiles
    WHERE player_id = ?
  `).get(playerId);

  const rankedPool = [
    ...db.prepare(`
      SELECT player_id, display_name, best_level, best_score, total_stars
      FROM leaderboard_profiles
    `).all().map((row) => ({
      playerId: String(row.player_id || ''),
      displayName: String(row.display_name || 'Pilot'),
      bestLevel: Math.max(1, Math.floor(Number(row.best_level || 1))),
      bestScore: Math.max(0, Math.floor(Number(row.best_score || 0))),
      totalStars: Math.max(0, Math.floor(Number(row.total_stars || 0))),
    })),
  ];

  for (const rival of FALLBACK_LEADERBOARD_PROFILES) {
    if (rankedPool.some((entry) => entry.displayName === rival.displayName)) continue;
    rankedPool.push({ playerId: '', ...rival });
  }

  rankedPool.sort((left, right) => (
    right.bestLevel - left.bestLevel
    || right.bestScore - left.bestScore
    || right.totalStars - left.totalStars
    || left.displayName.localeCompare(right.displayName)
  ));

  const playerRank = rankedPool.findIndex((entry) => entry.playerId === playerId) + 1;
  const nextRival = playerRank > 1 ? rankedPool[playerRank - 2] : null;
  const weeklyTier = resolveLeaderboardTier(playerRank);
  const weekKey = getUtcWeekKey();
  const claimedKeys = getClaimedRewardKeys(playerId, `leaderboard_weekly_${weekKey}_`);
  const chestKey = weeklyTier ? `leaderboard_weekly_${weekKey}_${weeklyTier.id}` : null;

  return {
    playerRank: playerRank || null,
    nextRival: nextRival
      ? {
          displayName: nextRival.displayName,
          bestLevel: nextRival.bestLevel,
          bestScore: nextRival.bestScore,
          totalStars: nextRival.totalStars,
          gapScore: Math.max(0, nextRival.bestScore - Math.max(0, Math.floor(Number(playerRow?.best_score || 0)))),
        }
      : null,
    weeklyTier: weeklyTier
      ? {
          id: weeklyTier.id,
          maxRank: weeklyTier.maxRank,
          reward: weeklyTier.reward,
        }
      : null,
    chest: weeklyTier
      ? {
          tierId: weeklyTier.id,
          reward: weeklyTier.reward,
          claimable: !claimedKeys.has(chestKey),
          claimed: claimedKeys.has(chestKey),
          weekKey,
        }
      : null,
  };
}

function getLeaderboardTop(res, requestedLimit, playerId = null) {
  const limit = Math.max(1, Math.min(50, Math.floor(Number(requestedLimit || 20))));
  const rows = db.prepare(`
    SELECT display_name, best_level, best_score, total_stars
    FROM leaderboard_profiles
    ORDER BY best_level DESC, best_score DESC, total_stars DESC, updated_at ASC
    LIMIT ?
  `).all(limit);

  const liveItems = rows.map((row) => ({
    displayName: String(row.display_name || 'Pilot'),
    bestLevel: Math.max(1, Math.floor(Number(row.best_level || 1))),
    bestScore: Math.max(0, Math.floor(Number(row.best_score || 0))),
    totalStars: Math.max(0, Math.floor(Number(row.total_stars || 0))),
  }));
  const itemsPool = [...liveItems];

  for (const rival of FALLBACK_LEADERBOARD_PROFILES) {
    if (itemsPool.length >= limit) break;
    const duplicate = itemsPool.some((item) => item.displayName === rival.displayName);
    if (!duplicate) {
      itemsPool.push({ ...rival });
    }
  }

  const items = itemsPool
    .sort((left, right) => (
      right.bestLevel - left.bestLevel
      || right.bestScore - left.bestScore
      || right.totalStars - left.totalStars
      || left.displayName.localeCompare(right.displayName)
    ))
    .slice(0, limit)
  .map((row, index) => ({
    rank: index + 1,
    displayName: row.displayName,
    bestLevel: row.bestLevel,
    bestScore: row.bestScore,
    totalStars: row.totalStars,
  }));

  const overview = getLeaderboardOverview(playerId, items);

  json(res, 200, {
    ok: true,
    items,
    playerRank: overview.playerRank,
    nextRival: overview.nextRival,
    weeklyTier: overview.weeklyTier,
    chest: overview.chest,
  });
}

function claimLeaderboardChest(res, playerId) {
  const overview = getLeaderboardOverview(playerId, []);
  if (!overview.weeklyTier || !overview.chest) {
    json(res, 409, { error: 'No chest tier unlocked yet' });
    return;
  }
  if (!overview.chest.claimable || overview.chest.claimed) {
    json(res, 409, { error: 'Chest already claimed' });
    return;
  }

  const rewardKey = `leaderboard_weekly_${overview.chest.weekKey}_${overview.weeklyTier.id}`;
  const balance = withTransaction(() => {
    const current = ensureWalletRow(playerId);
    const next = current + overview.weeklyTier.reward;
    const claimedAt = nowIso();
    db.prepare('UPDATE wallets SET balance = ?, updated_at = ? WHERE player_id = ?')
      .run(next, claimedAt, playerId);
    db.prepare(`
      INSERT INTO reward_claims (player_id, reward_key, amount, claimed_at)
      VALUES (?, ?, ?, ?)
    `).run(playerId, rewardKey, overview.weeklyTier.reward, claimedAt);
    return next;
  });

  const nextOverview = getLeaderboardOverview(playerId, []);
  json(res, 200, {
    ok: true,
    reward: overview.weeklyTier.reward,
    balance,
    playerRank: nextOverview.playerRank,
    weeklyTier: nextOverview.weeklyTier,
    chest: nextOverview.chest,
  });
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

    const starterBundle = getStarterBundleConfig();
    if (String(order.pack_id || '').trim() === starterBundle.id) {
      const profile = getPlayerProfile(playerId);
      db.prepare(`
        UPDATE player_profiles
        SET modifier_tokens = ?,
            continue_reserve = ?,
            starter_bundle_claimed = 1,
            updated_at = ?
        WHERE player_id = ?
      `).run(
        profile.modifierTokens + starterBundle.modifierTokens,
        profile.continueReserve + starterBundle.continueReserve,
        creditedAt,
        playerId,
      );
    }

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

  if (req.method === 'GET' && urlObj.pathname === '/api/live-config') {
    const session = verifySessionToken(extractBearerToken(req));
    getLiveConfigState(res, session?.playerId || '');
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

  if (req.method === 'GET' && urlObj.pathname === '/api/profile') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'profile-get', 60)) return;
    getProfileState(res, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/profile') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'profile-update', 60)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    updateProfileState(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/profile/consume-bonus') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'profile-consume-bonus', 40)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    consumeProfileBonus(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/event/progress') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'event-progress', 60)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    updateEventProgress(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/event/claim-mission') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'event-claim-mission', 30)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    claimEventMission(res, payload, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/rewards/daily-status') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-status', 40)) return;
    getDailyRewardStatus(res, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/missions/daily-status') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-missions-status', 40)) return;
    getDailyMissionsStatus(res, playerId);
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

  if (req.method === 'POST' && urlObj.pathname === '/api/missions/daily-progress') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-missions-progress', 50)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    updateDailyMissionProgress(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/missions/daily-claim') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-missions-claim', 30)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    claimDailyMission(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/missions/daily-reroll') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-missions-reroll', 30)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }
    rerollDailyMission(res, payload, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/missions/daily-completion-claim') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'daily-missions-completion-claim', 20)) return;
    claimDailyMissionCompletionChest(res, playerId);
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/missions/weekly-track-claim') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'weekly-missions-track-claim', 20)) return;
    claimWeeklyMissionTrackChest(res, playerId);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/leaderboard/top') {
    if (!enforceRateLimit(req, res, 'leaderboard-top', 60)) return;
    const session = verifySessionToken(extractBearerToken(req));
    getLeaderboardTop(res, urlObj.searchParams.get('limit'), session?.playerId || null);
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

  if (req.method === 'POST' && urlObj.pathname === '/api/leaderboard/claim-tier-chest') {
    const playerId = requireAuth(req, res);
    if (!playerId) return;
    if (!enforceRateLimit(req, res, 'leaderboard-claim-tier-chest', 20)) return;
    claimLeaderboardChest(res, playerId);
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

  if (req.method === 'POST' && urlObj.pathname === '/api/admin/live-config') {
    if (!enforceRateLimit(req, res, 'admin-live-config', 20)) return;
    if (!requireJsonRequest(req, res)) return;
    const rawBody = await readRawBody(req).catch(() => '');
    const payload = parseJsonBody(rawBody);
    if (payload == null) {
      json(res, 400, { error: 'Invalid JSON payload' });
      return;
    }

    const token = extractBearerToken(req);
    if (!verifyAdminToken(token)) {
      json(res, 401, { error: 'Unauthorized' });
      return;
    }

    updateLiveConfigState(res, payload);
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
