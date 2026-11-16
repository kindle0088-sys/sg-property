import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHdbRaw } from '../lib/build-meta.js';

/* 这一组测试保护的是一个具体事故：2026-11-16 的月度 URA 构建把
   hdbRawRecords 写成了 0，而 hdbTransactions 仍是 990,976 —— 元数据自相矛盾。 */

test('真抓了 HDB：写本次条数，source=fetched', () => {
  const r = resolveHdbRaw({ rawLen: 990976, prev: { hdbRawRecords: 500 } });
  assert.equal(r.records, 990976);
  assert.equal(r.source, 'fetched');
});

test('--skip-hdb 且上一份有可信值：沿用旧值，source=carried', () => {
  const r = resolveHdbRaw({ rawLen: 0, prev: { hdbRawRecords: 990976 } });
  assert.equal(r.records, 990976, '不能因为本次没抓就写成 0');
  assert.equal(r.source, 'carried');
});

test('--skip-hdb 且没有上一份：写 null（未知），不是 0', () => {
  const r = resolveHdbRaw({ rawLen: 0, prev: null });
  assert.equal(r.records, null);
  assert.equal(r.source, 'unknown');
});

test('上一份的值本身是 0（旧版错误写法）：视为不可信，写 null', () => {
  const r = resolveHdbRaw({ rawLen: 0, prev: { hdbRawRecords: 0 } });
  assert.equal(r.records, null, '0 不是「可信历史值」，沿用等于把错误固化');
  assert.equal(r.source, 'unknown');
});

test('上一份字段缺失或类型不对：视为不可信', () => {
  for (const prev of [{}, { hdbRawRecords: null }, { hdbRawRecords: '990976' }, { hdbRawRecords: -1 }, undefined]) {
    const r = resolveHdbRaw({ rawLen: 0, prev });
    assert.equal(r.records, null, `prev=${JSON.stringify(prev)} 不该被采纳`);
    assert.equal(r.source, 'unknown');
  }
});

test('rawLen 非数字（NaN/undefined）：不当作「抓到了」', () => {
  const r = resolveHdbRaw({ rawLen: NaN, prev: { hdbRawRecords: 12 } });
  assert.equal(r.records, 12);
  assert.equal(r.source, 'carried');
});

test('demo 模式（rawLen=0）同样不会写出 0', () => {
  const r = resolveHdbRaw({ rawLen: 0, prev: { hdbRawRecords: 990976 } });
  assert.notEqual(r.records, 0);
});
