import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const dataDir = join(rootDir, 'data');
const statePath = join(dataDir, 'wallet-state.json');

mkdirSync(dataDir, { recursive: true });
writeFileSync(statePath, JSON.stringify({ wallets: {}, orders: {} }, null, 2), 'utf8');

console.log(`Reset wallet state: ${statePath}`);
