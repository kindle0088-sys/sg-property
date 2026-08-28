import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSortableDate, computeAvg1y } from '../lib/txstats.js';

test('toSortableDate: mmyy → yyyy-mm（恒定 20xx 前缀，URA 数据均为 2000 年后）', () => {
  assert.equal(toSortableDate('1225'), '2025-12');
  assert.equal(toSortableDate('0105'), '2005-01');
});

test('toSortableDate: 非法/短输入返回空串', () => {
  assert.equal(toSortableDate(''), '');
  assert.equal(toSortableDate(null), '');
  assert.equal(toSortableDate('abc'), '');
  assert.equal(toSortableDate('123'), '');
});

test('computeAvg1y: cutoff 为空返回 0', () => {
  assert.equal(computeAvg1y([{ month: '1225', pricePsf: 100 }], 'month', ''), 0);
  assert.equal(computeAvg1y([{ month: '1225', pricePsf: 100 }], 'month', null), 0);
});

test('computeAvg1y: mmyy cutoff 按月过滤', () => {
  const txns = [
    { month: '1125', pricePsf: 1000 }, // 早于 cutoff，排除
    { month: '0126', pricePsf: 2000 },
    { month: '0226', pricePsf: 2100 },
    { month: '', pricePsf: 9999 } // 无日期，排除
  ];
  assert.equal(computeAvg1y(txns, 'month', '0126'), 2050);
});

test('computeAvg1y: yyyy-mm cutoff（HDB 格式）', () => {
  const txns = [
    { sortDate: '2025-06', pricePsf: 1000 },
    { sortDate: '2026-02', pricePsf: 2000 },
    { sortDate: '2026-03', pricePsf: 2002 }
  ];
  // 3 条样本 < 5：不过滤，简单平均
  assert.equal(computeAvg1y(txns, 'sortDate', '2026-01'), 2001);
});

test('computeAvg1y: 小样本(<5)不过滤直接平均', () => {
  const txns = [
    { month: '0126', pricePsf: 1000 },
    { month: '0226', pricePsf: 999999 } // 极端值
  ];
  assert.equal(computeAvg1y(txns, 'month', '0126'), 500500);
});

test('computeAvg1y: MAD 过滤剔除极端离群值', () => {
  const txns = [];
  // 10 条围绕 2000 的正常值
  for (let i = 0; i < 10; i++) txns.push({ month: '0226', pricePsf: 1950 + i * 10 });
  txns.push({ month: '0226', pricePsf: 99999 }); // 一条异常面积导致的坏 PSF
  const avg = computeAvg1y(txns, 'month', '0126');
  assert.ok(avg >= 1950 && avg <= 2050, `期望 ~1995，实际 ${avg}`);
});

test('computeAvg1y: pricePsf 缺失/为 0 的记录被忽略', () => {
  const txns = [
    { month: '0126', pricePsf: 0 },
    { month: '0126', pricePsf: null },
    { month: '0126', pricePsf: 1500 }
  ];
  assert.equal(computeAvg1y(txns, 'month', '0126'), 1500);
});
