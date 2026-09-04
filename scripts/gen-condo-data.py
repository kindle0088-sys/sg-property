# 从 data/projects/<slug>.json 生成 reports/_data/<slug>.json（build-condo-reports.mjs 的数据输入）
# 用法: python scripts/gen-condo-data.py slug1 slug2 ...
import json, sys, os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SALE_LABEL = {'1': '新售', '2': '楼花转售', '3': '现楼转售'}

def bucket(area):
    if area < 700: return '1房 (~<700sqft)'
    if area < 1000: return '2房 (700-1000sqft)'
    if area < 1350: return '3房 (1000-1350sqft)'
    return '4房+ (>1350sqft)'

def gen(slug):
    src = os.path.join(ROOT, 'data', 'projects', slug + '.json')
    d = json.load(open(src, encoding='utf-8'))
    txns = d.get('transactions', [])
    # price history by year
    by_year = defaultdict(list)
    for t in txns:
        y = t.get('sortDate', '')[:4]
        if y:
            by_year[y].append(t)
    ph = []
    prev = None
    for y in sorted(by_year):
        ts = by_year[y]
        avg_psf = round(sum(t['pricePsf'] for t in ts) / len(ts))
        avg_price = round(sum(int(t['price']) for t in ts) / len(ts))
        yoy = None if prev is None else (avg_psf / prev - 1) * 100
        ph.append({'year': y, 'n': len(ts), 'avgPsf': avg_psf, 'avgPrice': avg_price, 'yoy': yoy})
        prev = avg_psf
    # unit profile
    up = defaultdict(int)
    for t in txns:
        up[bucket(t.get('areaSqf', 0))] += 1
    # sale mix
    sm = defaultdict(int)
    for t in txns:
        sm[SALE_LABEL.get(t.get('typeOfSale'), '其他')] += 1
    n = len(txns)
    sale_mix = {k: {'n': v, 'pct': round(v / n * 100, 1)} for k, v in sm.items()}
    # top transactions
    by_price = sorted(txns, key=lambda t: int(t['price']), reverse=True)[:10]
    by_psf = sorted(txns, key=lambda t: t['pricePsf'], reverse=True)[:5]
    def slim(t):
        return {'price': int(t['price']), 'psf': t['pricePsf'], 'area': t['areaSqf'],
                'floor': t.get('floorRange', '-'), 'date': t.get('fmtDate', '')}
    out = {
        'slug': slug,
        'name': d['name'],
        'street': d.get('street', ''),
        'segment': d.get('marketSegment', ''),
        'coord': d.get('coord'),
        'proximity': d.get('proximity'),
        'stats': d.get('stats'),
        'fmtFirstDate': d.get('fmtFirstDate'),
        'fmtLastDate': d.get('fmtLastDate'),
        'priceHistory': ph,
        'unitProfile': dict(up),
        'saleMix': sale_mix,
        'top': {'top10ByPrice': [slim(t) for t in by_price], 'top5ByPsf': [slim(t) for t in by_psf]},
        'nTrans': n,
    }
    dst = os.path.join(ROOT, 'reports', '_data', slug + '.json')
    json.dump(out, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'OK {slug}: nTrans={n}, years={ph[0]["year"]}..{ph[-1]["year"]}, last={d.get("fmtLastDate")}')

if __name__ == '__main__':
    for slug in sys.argv[1:]:
        gen(slug)
