import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRow } from '../hdb-fetcher.js';

const baseRow = {
  month: '2026-07',
  town: 'ang mo kio',
  flat_type: '4 ROOM',
  block: '309',
  street_name: 'ang mo kio ave 1',
  storey_range: '06 TO 10',
  floor_area_sqm: '92.0',
  flat_model: 'Improved',
  lease_commence_date: '1979',
  resale_price: '500000'
};

test('normalizeRow: 正常行归一化（旧数据集，无 remaining_lease 字段）', () => {
  const r = normalizeRow(baseRow, false);
  assert.equal(r.town, 'ANG MO KIO');
  assert.equal(r.flatType, '4 ROOM');
  assert.equal(r.streetName, 'ANG MO KIO AVE 1');
  assert.equal(r.floorAreaSqm, 92);
  assert.equal(r.floorAreaSqf, Math.round(92 * 10.7639));
  assert.equal(r.leaseCommenceDate, 1979);
  // 2026 - 1979 = 47 年已过 → 99 - 47 = 52 年剩余
  assert.equal(r.remainingLease, 52);
  assert.equal(r.resalePrice, 500000);
  assert.equal(r.pricePsf, Math.round(500000 / Math.round(92 * 10.7639)));
});

test('normalizeRow: 新数据集用 remaining_lease 解析', () => {
  const r = normalizeRow({ ...baseRow, remaining_lease: '55 years 06 months' }, true);
  assert.equal(r.remainingLease, 55);
});

test('normalizeRow: remaining_lease 为 NA/nil 时返回 null', () => {
  assert.equal(normalizeRow({ ...baseRow, remaining_lease: 'NA' }, true).remainingLease, null);
  assert.equal(normalizeRow({ ...baseRow, remaining_lease: '-' }, true).remainingLease, null);
});

test('normalizeRow: 无价格或面积为 0 → null（脏数据）', () => {
  assert.equal(normalizeRow({ ...baseRow, resale_price: '' }, false), null);
  assert.equal(normalizeRow({ ...baseRow, resale_price: 'abc' }, false), null);
  assert.equal(normalizeRow({ ...baseRow, floor_area_sqm: '0' }, false), null);
  assert.equal(normalizeRow({ ...baseRow, floor_area_sqm: '' }, false), null);
});

test('normalizeRow: 保留上游 _id（增量锚点）', () => {
  const r = normalizeRow({ ...baseRow, _id: 'row-123' }, false);
  assert.equal(r._id, 'row-123');
});
