#!/usr/bin/env node
// ============================================================
// run-all.mjs — SG Property Dashboard Monthly URA Build (node)
// 取代 run-daily-build.cmd。计划任务直接执行：
//   C:\...\node.exe C:\...\run-all.mjs
//
// 背景（2026-08-15 排查）：
//   原 cmd 版在计划任务环境有三坑——PATH 无 git、stdout 管道阻塞、
//   cmd 语法笨拙。node 版用绝对路径 + spawnSync 捕获输出，全部绕开。
//
// 职责：git 对齐 → build.js → commit/push → gc/fsck → 状态上报
// 失败处理：fetch 重试 / 开 GitHub issue 兜底
// ============================================================

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------- 路径常量 ----------
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const SCRIPTS = path.join(ROOT, 'scripts');
const LOGS = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOGS, 'daily-build.log');
const GIT_OUT = path.join(LOGS, 'git-output.log');
const BUILD_OUT = path.join(LOGS, 'build-output.log');
const ERROR_LOG = path.join(LOGS, 'build-error.log');

// 计划任务环境 PATH 不可靠，全部用绝对路径
const NODE = 'C:/Users/jiali/.workbuddy/binaries/node/versions/22.22.2/node.exe';
const GIT = 'C:/Users/jiali/.workbuddy/binaries/PortableGit/versions/1.2.0/mingw64/bin/git.exe';
const GH = 'C:/Program Files/GitHub CLI/gh.exe';
const GIT_BIN_DIR = path.dirname(GIT);

const REPO = 'kindle0088-sys/sg-property';
const COMMIT_USER = 'kindle0088-sys';
const COMMIT_EMAIL = 'kindle0088-sys@users.noreply.github.com';
const LOOSE_THRESHOLD = 6700;

// ---------- 小工具 ----------
const now = () => new Date().toLocaleString('sv-SE', { hour12: false });
const log = (msg) => fs.appendFileSync(LOG_FILE, `[${now()}] ${msg}\n`);
const appendError = (msg) => fs.appendFileSync(ERROR_LOG, `[${now()}] ${msg}\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeEnv() {
  // git 子命令（credential helper / ssh 等）需要 PortableGit bin 在 PATH
  return { ...process.env, PATH: GIT_BIN_DIR + path.delimiter + (process.env.PATH || '') };
}

// 执行命令，捕获输出追加到 logTo 文件，返回 exit code
function run(cmd, args, { cwd = ROOT, logTo = null } = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', timeout: 600000, env: makeEnv() });
  if (logTo) {
    const header = `$ ${path.basename(cmd)} ${args.join(' ')} (exit ${r.status})\n`;
    fs.appendFileSync(logTo, header);
    if (r.stdout) fs.appendFileSync(logTo, r.stdout);
    if (r.stderr) fs.appendFileSync(logTo, r.stderr);
  }
  return r.status;
}

// git 便捷封装（输出进 git-output.log）
function git(args) {
  return run(GIT, args, { logTo: GIT_OUT });
}

// git 命令捕获 stdout（不写日志文件）
function gitOut(args) {
  const r = spawnSync(GIT, args, { cwd: ROOT, encoding: 'utf8', timeout: 600000, env: makeEnv() });
  return (r.stdout || '').trim();
}

// ---------- 失败兜底：开 GitHub issue（同一失败 streak 只开一次）----------
function openIssue(title, body) {
  const count = spawnSync(
    GH,
    ['issue', 'list', '-R', REPO, '--state', 'open', '--search', title, '--json', 'number', '--jq', 'length'],
    { encoding: 'utf8', timeout: 60000, env: makeEnv() }
  );
  const open = parseInt((count.stdout || '0').trim(), 10) || 0;
  if (open === 0) {
    spawnSync(GH, ['issue', 'create', '-R', REPO, '--title', title, '--body', body],
      { encoding: 'utf8', timeout: 60000, env: makeEnv() });
  }
}

// ---------- 状态写入 ----------
function writeStatus(status, commit, pushed) {
  const args = [path.join(SCRIPTS, 'write-status.js'), status];
  if (commit) args.push(commit);
  if (pushed) args.push(pushed);
  run(NODE, args, { cwd: SCRIPTS });
}

// ---------- fetch 带重试 ----------
async function fetchWithRetry() {
  if (git(['fetch', 'origin']) === 0) return true;
  log('WARN: git fetch failed, waiting 60s before retry');
  await sleep(60000);
  if (git(['fetch', 'origin']) === 0) return true;
  log('ERROR: git fetch failed twice, aborting');
  appendError('FETCH FAILED: git fetch origin failed twice (likely network)');
  return false;
}

// ---------- 主流程 ----------
async function main() {
  fs.mkdirSync(LOGS, { recursive: true });
  log('===== monthly URA build start =====');

  // --- pre-fetch checks（2026-08-02 事故：auto-gc 并发导致对象丢失）---
  git(['config', 'gc.auto', '0']);
  // --- 2026-08-06 事故预防：残留 rebase 状态会让构建在 detached HEAD 上 commit ---
  for (const d of ['rebase-merge', 'rebase-apply']) {
    if (fs.existsSync(path.join(ROOT, '.git', d))) {
      log(`WARN: stale ${d} state found, aborting`);
      git(['rebase', '--abort']);
    }
  }
  log('Step: pre-fetch checks done');

  // --- 对齐远程（fetch → ff-only merge；分叉则丢弃本地 commit）---
  // 2026-08-13: 用 FETCH_HEAD 而非 origin/main（本机 remote-tracking ref 写入被静默拦截）
  if (!(await fetchWithRetry())) process.exit(1);
  if (git(['merge', '--ff-only', 'FETCH_HEAD']) !== 0) {
    log('WARN: local branch diverged from remote, discarding local commits (rebuild regenerates data)');
    if (git(['reset', '--mixed', 'FETCH_HEAD']) !== 0) {
      log('ERROR: reset failed, aborting');
      process.exit(1);
    }
  }
  log('Step: aligned with remote');

  // HEAD_SHA 初始化（skip commit 时状态文件也能记录当前 HEAD）
  let headSha = gitOut(['rev-parse', 'HEAD']);

  // --- 构建（HDB 由 CI 日更，本地只跑 URA）---
  log('Step: build start');
  const buildStatus = run(NODE, [path.join(SCRIPTS, 'build.js'), '--skip-hdb'],
    { cwd: SCRIPTS, logTo: BUILD_OUT });
  if (buildStatus !== 0) {
    log('BUILD FAILED');
    appendError('BUILD FAILED');
    writeStatus('build_failed');
    openIssue('Monthly URA build failed',
      `Local scheduled build failed at ${now()}. See logs\\build-error.log.`);
    process.exit(1);
  }
  log('Step: build done');

  // --- 判断是否有实质数据变更（仅时间戳/聚合变化则跳过 commit）---
  git(['add', 'data/', '.github/']);
  const staged = gitOut(['diff', '--cached', '--name-only']);
  const hasDataChange = staged.split('\n').some((l) => {
    const t = l.trim();
    return t.startsWith('data/projects') || t.startsWith('data/districts') ||
           t.startsWith('data/rentals') || t.startsWith('data/property-index');
  });

  let skipPush = false;
  if (!hasDataChange) {
    log('Only timestamp/aggregate changes; skipping commit');
    skipPush = true;
    git(['reset', '-q']);
  } else {
    const commitStatus = git(['-c', `user.name=${COMMIT_USER}`, '-c', `user.email=${COMMIT_EMAIL}`,
      'commit', '-m', 'chore: monthly URA data build']);
    if (commitStatus !== 0) {
      log('Commit failed');
    } else {
      headSha = gitOut(['rev-parse', 'HEAD']);
      log('Committed');
    }
  }

  // --- push（skip commit 时无新提交，跳过）---
  if (!skipPush) {
    if (git(['push', 'origin', 'main']) !== 0) {
      log('PUSH FAILED');
      appendError('PUSH FAILED');
      writeStatus('push_failed', headSha);
      openIssue('Monthly URA push failed',
        `Local scheduled build succeeded but push failed at ${now()}. See logs\\build-error.log.`);
      process.exit(1);
    }
    log('Step: push done');
  }

  // --- gc（2026-08-11 事故：.git\info 缺失时 gc 清空对象库，先确保存在）---
  fs.mkdirSync(path.join(ROOT, '.git', 'info'), { recursive: true });
  if (git(['gc', '--quiet']) !== 0) {
    log('WARN: git gc reported an error');
  } else {
    log('Step: gc done');
  }

  // --- fsck（gc 后对象库完整性校验；--quick 在 git 2.55 是无效选项，用 --connectivity-only）---
  if (git(['fsck', '--connectivity-only', '--no-dangling']) !== 0) {
    const msg = 'CRITICAL: git fsck failed after gc, object store corrupt!';
    log(msg);
    appendError(msg);
  }

  // --- loose objects 监控 ---
  const cnt = gitOut(['count-objects', '-v']);
  const m = /count:\s*(\d+)/.exec(cnt);
  const loose = m ? m[1] : '?';
  log(`Loose objects: ${loose}`);
  if (loose !== '?' && Number(loose) > LOOSE_THRESHOLD) {
    log(`WARN: loose objects ${loose} exceed threshold ${LOOSE_THRESHOLD}, run manual gc`);
  }

  // --- 状态上报 ---
  writeStatus('ok', headSha, 'true');
  log('Done.');
}

main().catch((e) => {
  log(`FATAL: ${e.message}`);
  process.exit(1);
});
