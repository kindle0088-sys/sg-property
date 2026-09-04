# 分户型毛回报率：district 分卧室中位月租 x12 / 项目近12个月分面积桶中位价，按成交结构加权
import json, os
from statistics import median
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(p): return json.load(open(os.path.join(ROOT, p), encoding='utf-8'))

slugs = ['parc-esta', 'riverfront-residences', 'jadescape', 'sims-urban-oasis', 'whistler-grand']
idx = {p['id']: p for p in load('data/projects-index.json')}
rentals = load('data/rentals.json')

# district -> bedroom -> median rent
dist_bed_rent = defaultdict(lambda: defaultdict(list))
for r in rentals:
    if r['propertyType'] == 'Non-landed Properties' and r['bedrooms'] in ('1', '2', '3', '4'):
        dist_bed_rent[r['district']][r['bedrooms']].append(r['rent'])

def bucket_br(area):
    if area < 700: return '1'
    if area < 1000: return '2'
    if area < 1350: return '3'
    return '4'

for s in slugs:
    p = idx[s]
    dist = p['district']
    txns = [t for t in load(f'data/projects/{s}.json')['transactions']
            if '2025-09' <= t.get('sortDate', '') <= '2026-08' and t.get('typeOfSale') == '3']
    by_br = defaultdict(list)
    for t in txns:
        by_br[bucket_br(t['areaSqf'])].append(int(t['price']))
    total_w, acc = 0, 0
    detail = []
    for br in ('1', '2', '3', '4'):
        if br not in by_br: continue
        med_price = median(by_br[br])
        rents = dist_bed_rent[dist].get(br, [])
        if not rents: continue
        med_rent = median(rents)
        y = med_rent * 12 / med_price * 100
        w = len(by_br[br])
        acc += y * w; total_w += w
        detail.append(f"{br}BR: n={w} medPrice=${med_price/1e6:.2f}M medRent=${med_rent:.0f} y={y:.2f}%")
    gy = acc / total_w if total_w else 0
    print(f"{s} D{dist} 加权毛回报 {gy:.2f}%")
    for x in detail: print('   ', x)
