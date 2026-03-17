import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const trackerCsvPath = path.join(rootDir, 'docs', 'marketing', 'week1', 'WEEK1_DAILY_TRACKER.csv');
const reelsTrackerPath = path.resolve(rootDir, '..', '..', '03_Marketing', 'Videos', 'reels_metrics_tracker.md');
const reelsManifestPath = path.resolve(
  rootDir,
  '..',
  '..',
  '03_Marketing',
  'Videos',
  'output',
  'content_reels',
  'reels_manifest.json',
);
const reportDir = path.join(rootDir, 'output', 'growth');
const reportPath = path.join(reportDir, 'growth-review.md');

const numericFields = [
  'spend_usd',
  'impressions',
  'clicks',
  'ctr',
  'landing_view',
  'landing_play_click',
  'checkout_start',
  'payment_credited',
  'lp_click_rate',
  'checkout_rate',
  'payment_per_landing',
  'payment_per_checkout',
  'cpc_usd',
  'cpa_checkout_usd',
  'cac_payment_usd',
];

function parseCsv(text) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(current);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...dataRows] = rows;
  return dataRows.map((values) => {
    const entry = {};
    for (let index = 0; index < header.length; index += 1) {
      entry[header[index]] = values[index] ?? '';
    }
    return entry;
  });
}

function parseNumber(value) {
  if (value === undefined || value === null) {
    return 0;
  }

  const normalized = String(value).trim().replace(',', '.');
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRatio(numerator, denominator) {
  if (!denominator) {
    return '0%';
  }

  return `${(numerator / denominator * 100).toFixed(1)}%`;
}

function basename(filePath) {
  return path.basename(filePath || '');
}

async function readOptionalText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function readOptionalJson(filePath) {
  const content = await readOptionalText(filePath);
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getUsedClipNames(reelsTrackerContent) {
  if (!reelsTrackerContent) {
    return new Set();
  }

  const usedClips = new Set();
  const lines = reelsTrackerContent.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith('|')) {
      continue;
    }

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length < 1) {
      continue;
    }

    const clipName = cells[0];
    if (!clipName || clipName === 'Clip' || clipName.startsWith('---')) {
      continue;
    }

    if (clipName.endsWith('.mp4')) {
      usedClips.add(clipName);
    }
  }

  return usedClips;
}

function buildSourceSummary(rows) {
  const buckets = new Map();

  for (const row of rows) {
    const source = row.source || 'unknown';
    const current = buckets.get(source) ?? {
      source,
      spend_usd: 0,
      impressions: 0,
      clicks: 0,
      landing_view: 0,
      landing_play_click: 0,
      checkout_start: 0,
      payment_credited: 0,
    };

    for (const field of Object.keys(current)) {
      if (field === 'source') {
        continue;
      }
      current[field] += parseNumber(row[field]);
    }

    buckets.set(source, current);
  }

  return [...buckets.values()].sort((left, right) => {
    if (right.payment_credited !== left.payment_credited) {
      return right.payment_credited - left.payment_credited;
    }
    return right.checkout_start - left.checkout_start;
  });
}

function getTopRows(rows, metric) {
  return [...rows]
    .filter((row) => parseNumber(row[metric]) > 0)
    .sort((left, right) => parseNumber(right[metric]) - parseNumber(left[metric]))
    .slice(0, 5);
}

function pickNextClips(manifest, usedClipNames) {
  if (!Array.isArray(manifest)) {
    return [];
  }

  return manifest
    .filter((item) => !usedClipNames.has(basename(item.file)))
    .slice(0, 3)
    .map((item) => ({
      clip: basename(item.file),
      hook: item.hook || 'n/a',
      cta_url: item.cta_url || 'https://nebulaclash.com',
      description: item.description || '',
    }));
}

function renderTopRows(title, rows, metric) {
  const lines = [`## ${title}`, ''];

  if (!rows.length) {
    lines.push(`No rows with \`${metric}\` yet.`, '');
    return lines.join('\n');
  }

  lines.push('| Source | Creative | landing_view | checkout_start | payment_credited | Decision | Next action |');
  lines.push('| --- | --- | ---: | ---: | ---: | --- | --- |');

  for (const row of rows) {
    lines.push(
      `| ${row.source || 'unknown'} | ${row.creative_id || 'n/a'} | ${formatNumber(parseNumber(row.landing_view))} | ${formatNumber(parseNumber(row.checkout_start))} | ${formatNumber(parseNumber(row.payment_credited))} | ${row.decision || ''} | ${row.next_action || ''} |`,
    );
  }

  lines.push('');
  return lines.join('\n');
}

async function main() {
  const csvContent = await fs.readFile(trackerCsvPath, 'utf8');
  const parsedRows = parseCsv(csvContent);
  const normalizedRows = parsedRows.map((row) => {
    const normalized = { ...row };
    for (const field of numericFields) {
      normalized[field] = parseNumber(row[field]);
    }
    return normalized;
  });

  const rowsWithSignals = normalizedRows.filter((row) =>
    row.landing_view > 0 ||
    row.checkout_start > 0 ||
    row.payment_credited > 0 ||
    row.clicks > 0 ||
    row.impressions > 0,
  );

  const totals = rowsWithSignals.reduce(
    (accumulator, row) => {
      accumulator.spend_usd += row.spend_usd;
      accumulator.impressions += row.impressions;
      accumulator.clicks += row.clicks;
      accumulator.landing_view += row.landing_view;
      accumulator.landing_play_click += row.landing_play_click;
      accumulator.checkout_start += row.checkout_start;
      accumulator.payment_credited += row.payment_credited;
      return accumulator;
    },
    {
      spend_usd: 0,
      impressions: 0,
      clicks: 0,
      landing_view: 0,
      landing_play_click: 0,
      checkout_start: 0,
      payment_credited: 0,
    },
  );

  const reelsTrackerContent = await readOptionalText(reelsTrackerPath);
  const reelsManifest = await readOptionalJson(reelsManifestPath);
  const usedClipNames = getUsedClipNames(reelsTrackerContent);
  const nextClips = pickNextClips(reelsManifest, usedClipNames);
  const sourceSummary = buildSourceSummary(rowsWithSignals);

  const reportLines = [
    '# Nebula Clash Growth Review',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Inputs',
    '',
    `- Tracker CSV: \`${path.relative(rootDir, trackerCsvPath)}\``,
    `- Reels tracker: \`${path.relative(rootDir, reelsTrackerPath)}\``,
    `- Reels manifest: \`${path.relative(rootDir, reelsManifestPath)}\``,
    '',
    '## Weekly Totals',
    '',
    `- Spend USD: ${formatNumber(totals.spend_usd)}`,
    `- Impressions: ${formatNumber(totals.impressions)}`,
    `- Clicks: ${formatNumber(totals.clicks)}`,
    `- Landing views: ${formatNumber(totals.landing_view)}`,
    `- Landing play clicks: ${formatNumber(totals.landing_play_click)}`,
    `- Checkout starts: ${formatNumber(totals.checkout_start)}`,
    `- Payments credited: ${formatNumber(totals.payment_credited)}`,
    '',
    '## Funnel Ratios',
    '',
    `- landing_play_click / landing_view: ${formatRatio(totals.landing_play_click, totals.landing_view)}`,
    `- checkout_start / landing_view: ${formatRatio(totals.checkout_start, totals.landing_view)}`,
    `- payment_credited / landing_view: ${formatRatio(totals.payment_credited, totals.landing_view)}`,
    `- payment_credited / checkout_start: ${formatRatio(totals.payment_credited, totals.checkout_start)}`,
    '',
    '## Source Rollup',
    '',
  ];

  if (!sourceSummary.length) {
    reportLines.push('No paid or tracked source data yet.', '');
  } else {
    reportLines.push('| Source | Spend USD | landing_view | checkout_start | payment_credited | payment / landing | payment / checkout |');
    reportLines.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
    for (const source of sourceSummary) {
      reportLines.push(
        `| ${source.source} | ${formatNumber(source.spend_usd)} | ${formatNumber(source.landing_view)} | ${formatNumber(source.checkout_start)} | ${formatNumber(source.payment_credited)} | ${formatRatio(source.payment_credited, source.landing_view)} | ${formatRatio(source.payment_credited, source.checkout_start)} |`,
      );
    }
    reportLines.push('');
  }

  reportLines.push(renderTopRows('Top Creatives By Payments', getTopRows(rowsWithSignals, 'payment_credited'), 'payment_credited'));
  reportLines.push(renderTopRows('Top Creatives By Checkout Starts', getTopRows(rowsWithSignals, 'checkout_start'), 'checkout_start'));
  reportLines.push(renderTopRows('Top Creatives By Landing Views', getTopRows(rowsWithSignals, 'landing_view'), 'landing_view'));
  reportLines.push('## Next Reel Candidates', '');

  if (!nextClips.length) {
    reportLines.push('No unused reels found in the current manifest.', '');
  } else {
    reportLines.push('| Clip | Hook | CTA URL | Description |');
    reportLines.push('| --- | --- | --- | --- |');
    for (const clip of nextClips) {
      reportLines.push(`| ${clip.clip} | ${clip.hook} | ${clip.cta_url} | ${clip.description} |`);
    }
    reportLines.push('');
  }

  reportLines.push('## Decision Prompts', '');
  reportLines.push('- Which source+creative pair produced the strongest `payment_credited / landing_view`?');
  reportLines.push('- Which creatives produced reach without lower-funnel movement?');
  reportLines.push('- Which of the next reel candidates should become this week\'s 3 main posts?');
  reportLines.push('- Which single hypothesis in `NebulaClash_Hypothesis_Backlog.md` should move next based on this report?');
  reportLines.push('');

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(reportPath, reportLines.join('\n'), 'utf8');

  console.log(`Growth review written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
