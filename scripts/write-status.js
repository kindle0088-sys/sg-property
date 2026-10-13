// write-status.js — 将月度构建结果落盘到 logs/last-build.json
// Usage:
//   node write-status.js ok <commit-sha> true <changed true|false>
//   node write-status.js build_failed
//   node write-status.js push_failed <commit-sha>
// 除 status/commit/pushed/changed 外的字段（项目数、交易数、耗时）自动从 data/build-meta.json 读取。
// changed 供 run-all.mjs 的月度门闸判断「本月是否已真正产出新数据」。
'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const [status, commit, pushed, changed] = process.argv.slice(2);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(path.join(root, 'data', 'build-meta.json'), 'utf8'));
} catch (e) {
  // build-meta 可能不存在（构建失败早期），忽略
}

const rec = {
  date: new Date().toISOString().slice(0, 10),
  checkedAt: new Date().toISOString(),
  status: status || 'unknown',
  commit: commit || null,
  pushed: pushed === 'true',
  changed: changed === undefined ? null : changed === 'true',
  projects: meta.projects != null ? meta.projects : null,
  transactions: meta.transactions != null ? meta.transactions : null,
  rentals: meta.rentals != null ? meta.rentals : null,
  hdbTransactions: meta.hdbTransactions != null ? meta.hdbTransactions : null,
  elapsedSec: meta.elapsed != null ? Number(meta.elapsed) : null,
};

const outDir = path.join(root, 'logs');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'last-build.json');
fs.writeFileSync(outFile, JSON.stringify(rec, null, 2));
console.log('[status] ' + rec.date + ' status=' + rec.status + ' commit=' + (rec.commit || '-') + ' pushed=' + rec.pushed);
