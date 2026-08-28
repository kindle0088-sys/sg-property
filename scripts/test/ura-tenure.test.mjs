import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTenure } from '../ura-fetcher.js';

test('parseTenure: Freehold', () => {
  assert.deepEqual(parseTenure('Freehold'), { type: 'Freehold', years: null, from: null });
  assert.deepEqual(parseTenure('freehold'), { type: 'Freehold', years: null, from: null });
});

test('parseTenure: 带起始年份的租约', () => {
  assert.deepEqual(
    parseTenure('99 years lease commencing from 1995'),
    { type: 'Leasehold', years: 99, from: 1995 }
  );
});

test('parseTenure: 无起始年份的租约（取第一个数字）', () => {
  assert.deepEqual(parseTenure('999 years leasehold'), { type: 'Leasehold', years: 999, from: null });
  assert.deepEqual(parseTenure('Leasehold 60 years'), { type: 'Leasehold', years: 60, from: null });
});

test('parseTenure: 空值与未知格式', () => {
  assert.deepEqual(parseTenure(''), { type: 'unknown', years: null, from: null });
  assert.deepEqual(parseTenure(null), { type: 'unknown', years: null, from: null });
  const unknown = parseTenure('Some Odd Tenure Text');
  assert.equal(unknown.type, 'Some Odd Tenure Text');
});
