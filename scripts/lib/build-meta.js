/**
 * build-meta 的派生逻辑（纯函数，便于单测）
 *
 * 背景：`hdbRawRecords` 表示「本次构建抓到了多少条 HDB 原始记录」。
 * 但 URA 专属构建走 `--skip-hdb`，此时 hdbRaw 是空数组，
 * 旧代码直接把 `hdbRaw.length`（即 0）写进 build-meta，
 * 于是出现「hdbTransactions: 990976 而 hdbRawRecords: 0」的自相矛盾
 * （2026-11-16 的月度构建就是这样）。
 *
 * 口径：
 *   · 真抓了（rawLen > 0）      → 写本次条数，source = 'fetched'
 *   · 没抓但有可信历史值        → 沿用上一次的值，source = 'carried'
 *   · 没抓且无历史（或历史是 0） → 写 null（表示「未知」而不是「零」），source = 'unknown'
 *
 * 关键点：0 与「未知」是两件事。0 会被读成「一条都没抓到」，
 * 对一个正常运行的仓库来说这是不可能的状态，所以不要用 0 表示没加载。
 */

/**
 * @param {object} p
 * @param {number} p.rawLen 本次抓到的 HDB 原始记录数（未抓取时为 0）
 * @param {object|null} p.prev 上一份 build-meta.json（读不到就传 null）
 * @returns {{ records: number|null, source: 'fetched'|'carried'|'unknown' }}
 */
export function resolveHdbRaw({ rawLen, prev }) {
  if (Number.isFinite(rawLen) && rawLen > 0) {
    return { records: rawLen, source: 'fetched' };
  }
  const old = prev && prev.hdbRawRecords;
  /* 历史值必须是正整数才可信：0 是旧版本的错误写法，null/非数字同理不可用 */
  if (Number.isFinite(old) && old > 0) {
    return { records: old, source: 'carried' };
  }
  return { records: null, source: 'unknown' };
}
