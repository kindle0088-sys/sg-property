# 提取 5 个目标项目的研报分析指标
import json, re, os
from statistics import median

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(p): return json.load(open(os.path.join(ROOT, p), encoding='utf-8'))

slugs = ['parc-esta', 'riverfront-residences', 'jadescape', 'sims-urban-oasis', 'whistler-grand']
idx = {p['id']: p for p in load('data/projects-index.json')}
rentals = load('data/rentals.json')

def band_mid(s):
    nums = [int(x) for x in re.findall(r'\d+', s)]
    if len(nums) >= 2: return (nums[0] + nums[1]) / 2
    if len(nums) == 1: return nums[0] * 1.2
    return None

def dist_rent_psf(dist):
    vals = []
    for r in rentals:
        if r['district'] == dist and r['propertyType'] == 'Non-landed Properties':
            mid = band_mid(r['areaSqf'])
            if mid: vals.append(r['rent'] / mid)
    return round(median(vals), 2) if vals else None

for s in slugs:
    p = idx[s]
    d = load(f'reports/_data/{s}.json')
    src = load(f'data/projects/{s}.json')
    ph = d['priceHistory']
    dist = p['district']
    rpsf = dist_rent_psf(dist)
    y1 = p['avgPsf1y']
    gy = rpsf * 12 / y1 * 100 if rpsf and y1 else None
    first, last = ph[0], ph[-1]
    span = int(last['year']) - int(first['year'])
    cagr = ((last['avgPsf'] / first['avgPsf']) ** (1 / span) - 1) * 100
    resale12 = sum(1 for t in src['transactions'] if '2025-09' <= t.get('sortDate', '') <= '2026-08' and t.get('typeOfSale') == '3')
    print(f"{s} | D{dist} {p['marketSegment']} | MRT {p['proximity']['nearestMrt']} {p['proximity']['nearestMrtDistM']}m | schools1km {p['proximity']['schoolCount1km']}")
    print(f"   avgPsf1y {y1} | rentPsf {rpsf} | grossYield {gy:.2f}% | CAGR{first['year']}-{last['year']} {cagr:.1f}% | resale12m {resale12} | total {p['totalTxns']}")
    print('   ph:', [(r['year'], r['n'], r['avgPsf'], None if r['yoy'] is None else round(r['yoy'],1)) for r in ph])
    print('   saleMix:', d['saleMix'])
    print('   units:', d['unitProfile'])
    print('   schools:', p['proximity']['schools1km'])
    print('   top1:', d['top']['top10ByPrice'][0])
