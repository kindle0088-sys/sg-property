// 重写 3 份 legacy 报告为标准模板（Watergardens / One Canberra / Bidadari）
// 标准模板 = C 组报告（Lentor 等）的 section-title + score-grid + score-badge 结构
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSS = `*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;background:#0b1120;color:#e2e8f0;line-height:1.75;min-height:100vh}
.container{max-width:880px;margin:0 auto;padding:48px 24px 80px}
.hero{text-align:center;padding:48px 0 40px;border-bottom:1px solid #1e293b;margin-bottom:40px}
.hero-badge{display:inline-block;background:#1e293b;color:#fbbf24;font-size:12px;font-weight:600;padding:4px 14px;border-radius:20px;margin-bottom:16px;letter-spacing:.5px}
.hero h1{font-size:36px;font-weight:800;color:#fff;margin-bottom:8px}
.hero .address{color:#94a3b8;font-size:15px;margin-bottom:20px}
.kpi-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:20px}
.kpi{background:#1e293b;border-radius:12px;padding:16px 24px;text-align:center;min-width:140px}
.kpi .val{font-size:26px;font-weight:700;color:#fbbf24}
.kpi .lbl{font-size:12px;color:#94a3b8;margin-top:4px}
section{margin-bottom:48px}
.section-title{font-size:22px;font-weight:700;color:#fbbf24;margin-bottom:16px}
.highlight-box{background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);border-left:4px solid #fbbf24;border-radius:0 12px 12px 0;padding:20px 24px;margin:20px 0}
.verdict{background:linear-gradient(135deg,#7c2d12 0%,#662410 100%);border-radius:12px;padding:24px 28px;margin:24px 0}
.summary-box{background:#1e293b;border-radius:12px;padding:24px 28px;margin:20px 0}
table{width:100%;border-collapse:collapse;margin:16px 0}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid #1e293b;font-size:14px}
th{color:#fbbf24;font-weight:600;background:#0f172a}
td{color:#cbd5e1}
.num-green{color:#22c55e;font-weight:600}
.num-red{color:#ef4444;font-weight:600}
.score-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;margin:20px 0}
.score-card{background:#1e293b;border-radius:12px;padding:20px;position:relative;overflow:hidden}
.score-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:#fbbf24}
.score-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.score-name{font-weight:600;font-size:15px;color:#f1f5f9}
.score-badge{font-size:20px;font-weight:700;color:#fbbf24}
.score-bar-bg{height:8px;background:#334155;border-radius:4px;margin-top:8px;overflow:hidden}
.score-bar{height:100%;border-radius:4px}
.bar-high{background:linear-gradient(90deg,#22c55e,#4ade80)}
.bar-mid{background:linear-gradient(90deg,#eab308,#facc15)}
.bar-low{background:linear-gradient(90deg,#ef4444,#f87171)}
.timeline{position:relative;padding-left:24px;margin:20px 0}
.timeline::before{content:'';position:absolute;left:8px;top:0;bottom:0;width:2px;background:#334155}
.tl-item{position:relative;padding:12px 0 12px 20px}
.tl-item::before{content:'';position:absolute;left:-20px;top:16px;width:10px;height:10px;border-radius:50%;background:#fbbf24;border:2px solid #0b1120}
.tl-year{font-weight:700;color:#fbbf24;font-size:15px}
.tl-detail{color:#94a3b8;font-size:13px;margin-top:2px}
footer{text-align:center;color:#475569;font-size:12px;padding:32px 0 0;border-top:1px solid #1e293b;margin-top:40px;line-height:1.8}
.disclaimer{font-style:italic;color:#64748b;font-size:12px;text-align:center;margin:24px 0 0;padding:16px;background:#1e293b;border-radius:8px}
.spec-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0}
.spec-card{background:#1e293b;border-radius:12px;padding:16px 18px;border-left:3px solid #60a5fa}
.spec-card.full{grid-column:1/-1}
.spec-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.spec-value{font-size:15px;color:#e2e8f0;font-weight:600}
.facility-tags{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.facility-tags span{background:#1a2740;border:1px solid #334155;border-radius:6px;padding:3px 9px;font-size:12px;color:#94a3b8}
.review-item{background:#1e293b;border-radius:12px;padding:16px 20px;margin:12px 0}
.review-dimension{font-weight:700;color:#fbbf24;font-size:14px;margin-bottom:6px}
.review-quote{color:#cbd5e1;font-size:14px;line-height:1.7;margin-bottom:6px}
.review-source{font-size:12px;color:#64748b;font-style:italic}
.positive{color:#22c55e}
ul.check-list{list-style:none;padding:0}
ul.check-list li{padding:4px 0;font-size:14px;color:#cbd5e1}
ul.check-list li::before{content:'✓ ';color:#22c55e;font-weight:700}
ul.check-list li.nag::before{content:'✗ ';color:#ef4444}`;

function barCls(score) {
  if (score >= 7.5) return 'bar-high';
  if (score >= 5) return 'bar-mid';
  return 'bar-low';
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n')}</tbody></table>`;
}

function render(c) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.h1} — 新加坡房产投资研报</title>
<style>${CSS}</style>
</head>
<body>
<div class="container">

<div class="hero">
  <div class="hero-badge">${c.badge}</div>
  <h1>${c.h1}</h1>
  <div class="address">${c.address}</div>
  <div class="kpi-row">
    ${c.kpis.map(k => `<div class="kpi"><div class="val">${k.v}</div><div class="lbl">${k.l}</div></div>`).join('\n    ')}
  </div>
</div>

<section>
  <div class="section-title">📌 执行摘要</div>
  <div class="highlight-box">
    <strong>${c.execTitle}</strong>${c.execHighlight}
  </div>
  ${c.execWhy ? `<div class="summary-box">
    <strong>${c.execWhy.title}</strong>
    <ul class="check-list">${c.execWhy.items.map(i => `<li>${i}</li>`).join('')}</ul>
  </div>` : ''}
  ${c.execSummary ? `<div class="summary-box">
    <strong>一句话结论：</strong>${c.execSummary}
  </div>` : ''}
</section>

<section>
  <div class="section-title">🏗️ 项目核心参数</div>
  <div class="spec-grid">
    ${c.specs.map(s => `<div class="spec-card${s.full ? ' full' : ''}"><div class="spec-label">${s.k}</div><div class="spec-value">${s.v}</div></div>`).join('\n    ')}
  </div>
  ${c.unitTable ? `<h3 style="color:#f1f5f9;margin:20px 0 10px">📐 户型分布</h3>\n  ${table(c.unitTable.headers, c.unitTable.rows)}` : ''}
  ${c.facilities ? `<h3 style="color:#f1f5f9;margin:20px 0 10px">🎪 配套设施</h3>
  <div class="facility-tags">${c.facilities.map(f => `<span>${f}</span>`).join('')}</div>` : ''}
  <h3 style="color:#f1f5f9;margin:20px 0 10px">🚇 交通与教育</h3>
  ${table(['项目', '详情'], c.transEdu)}
</section>

<section>
  <div class="section-title">⭐ 七维评分</div>
  <div class="score-grid">
    ${c.dims.map(d => `<div class="score-card"><div class="score-header"><div class="score-name">${d.name}</div><div class="score-badge">${d.score.toFixed(2)} / 10</div></div><div class="score-bar-bg"><div class="score-bar ${barCls(d.score)}" style="width:${d.score * 10}%"></div></div><p style="font-size:13px;color:#94a3b8;margin-top:8px">权重 ${d.weight}% · ${d.desc}</p></div>`).join('\n    ')}
  </div>
  <div class="verdict">
    <strong>综合评分：${c.compScore.toFixed(2)} / 10</strong> —— ${c.compText}
  </div>
</section>

<section>
  <div class="section-title">📈 价格走势与区域对比</div>
  ${c.priceTables.map(pt => `<h3 style="color:#f1f5f9;margin:16px 0 8px">${pt.title}</h3>\n  ${table(pt.headers, pt.rows)}`).join('\n  ')}
  ${c.priceNote ? `<div class="highlight-box">${c.priceNote}</div>` : ''}
  <h3 style="color:#f1f5f9;margin:16px 0 8px">🏙️ ${c.compTitle}</h3>
  ${table(c.compHeaders, c.compRows)}
  ${c.compNote ? `<p style="font-size:12px;color:#64748b;margin-top:8px">${c.compNote}</p>` : ''}
</section>

<section>
  <div class="section-title">${c.complianceTitle}</div>
  ${c.complianceNote ? `<div class="highlight-box">${c.complianceNote}</div>` : ''}
  ${table(['项目', '说明'], c.compliance)}
</section>

<section>
  <div class="section-title">🏡 真实居住体验</div>
  ${c.reviews.map(r => `<div class="review-item">
    <div class="review-dimension">${r.dim}</div>
    <div class="review-quote">${r.quote}</div>
    ${r.src ? `<div class="review-source">— ${r.src}</div>` : ''}
  </div>`).join('\n  ')}
  <div class="highlight-box" style="margin-top:16px">
    <b>居住体验综合评级：${c.lifeRating}</b><br>
    ${c.lifeSummary}
  </div>
</section>

<section>
  <div class="section-title">⚠️ 风险提示</div>
  ${table(['风险', '等级', '说明'], c.risks)}
</section>

<section>
  <div class="section-title">🎯 最终结论</div>
  ${c.conclusion.map(co => `<div class="summary-box">
    <strong>${co.t}</strong><br>${co.body}
  </div>`).join('\n  ')}
</section>

<footer>
  ${c.footer}
  <div class="disclaimer">本报告仅供参考，不构成投资建议。房产投资有风险，决策需谨慎。数据截至 2026 年 8 月。</div>
</footer>

</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────
// Watergardens (Private Condo)
// ─────────────────────────────────────────────
const watergardens = {
  badge: 'Private · Condo · D27 Sembawang/Yishun',
  h1: 'The Watergardens at Canberra',
  address: '27-57 Canberra Drive · D27 · 99-Year Leasehold（自 2020-06-08 起，剩约 93 年）',
  kpis: [
    { v: '7.50', l: '七维综合评分' },
    { v: '$1,729', l: '1yr Avg PSF' },
    { v: '+18.7%', l: '楼花涨幅（21→26）' },
    { v: '~3.0%', l: '毛租金收益率' },
    { v: '410m', l: 'Canberra MRT' },
  ],
  execTitle: '低密度"水花园"新盘——北部 OCR 稀缺形态',
  execHighlight: 'UOL 等三大开发商联手的低密度"水花园"新盘，2026 年 6 月刚 TOP——2021 年以 $1,457 psf 买入的楼花买家已兑现 <b>+18.7%</b> 回报；当前买入买的是<b>北部区域成长（NSC 快速路 + Woodlands 区域中心）和顶级 OCR 生活配套</b>，代价是租金回报偏弱（~3%）与北部新盘供应压力。',
  execWhy: {
    title: '为什么值得关注',
    items: [
      '<b>三家顶级开发商联合</b>：UOL 华业 + 新加坡置地 + 庆隆，P&amp;T 建筑设计——交付品质背书极强',
      '<b>低密度稀缺形态</b>：16 栋 × 5 层仅 448 户，296,721 sqft 大地块（容积率仅 1.4），北部罕见的"度假村式"大盘',
      '<b>楼花回报已验证</b>：2021-08 开盘 → 2026 TOP，转售市场 2025-2026 已录 76 笔，价格站稳 $1,700+，最高 $1,919 psf',
      '<b>配套一步到位</b>：Canberra MRT 410m + Bukit Canberra 综合社区中心 + Canberra Primary 仅 290m',
    ],
  },
  specs: [
    { k: '开发商', v: 'United Venture Development（UOL 华业 · Singapore Land 新加坡置地 · Kheng Leong 庆隆 三家联合）' },
    { k: '建筑师', v: 'P&amp;T Consultants（建筑）· STX Landscape（景观）' },
    { k: '地契', v: '99 年 leasehold，自 2020-06-08 起（剩约 93 年）' },
    { k: 'TOP', v: '2026-06-29（2021-08-28 开盘）' },
    { k: '均价', v: '$1,729 psf（1yr Avg，2025 高点 $1,919）' },
    { k: '去化', v: '448/448 售罄 · 16 栋 × 5 层低密度' },
    { k: '区位', v: 'D27 Sembawang/Yishun · 27-57 Canberra Drive' },
    { k: '地铁', v: 'Canberra MRT 410m（步行 4-5 分钟）' },
  ],
  unitTable: {
    headers: ['户型', '面积 (sqft)', '户数', '物业费'],
    rows: [
      ['2 Bedroom', '646 - 678', '80', '$360/月'],
      ['2 Bedroom Premium', '721 - 753', '119', '$360/月'],
      ['2 Bedroom Premium + Study', '797', '20', '$360/月'],
      ['3 Bedroom', '904 - 958', '94', '$360/月'],
      ['3 Bedroom + Study', '1,012', '10', '$360/月'],
      ['3 Bedroom Premium + Study', '1,109', '65', '$420/月'],
      ['4 Bedroom Premium', '1,302', '60', '$420/月'],
    ],
  },
  facilities: ['🏊 50m 泳池', '💧 Aqua Gym Pool', '👶 儿童池', '🛁 Jacuzzi', '🏋️ 健身房', '🧘 瑜伽角', '🎤 Karaoke', '🎹 音乐室', '🎮 游戏室', '🏛️ Function Room', '🏃 Jogging Trail', '🍖 BBQ', '🛋️ Lounge Pavilion', '🌊 倒影池', '💦 瀑布水景', '🦶 Reflexology Path', '🌷 花园区', '⛺ TeePee Deck', '🐾 Pet\'s Run 宠物跑道', '🌿 大草坪', '🏫 内部 Childcare Centre', '🔒 安保系统'],
  transEdu: [
    ['🚇 地铁', '<b>Canberra MRT（南北线）410m，步行 4-5 分钟</b>；Sembawang 1.3km · Yishun 1.5km'],
    ['🚗 驾车', 'SLE / TPE 快速通达；<b>North-South Corridor（NSC）</b>通车后 CBD 约 20 分钟（预计分阶段 2026-2027）'],
    ['🏫 学校', '2km 内 15 所：<b>Canberra Primary 290m</b>（1km 优先区）· Canberra Secondary 260m · Sembawang Primary 1.1km · North View Primary 1.1km · XCL World Academy 1.7km'],
    ['🛒 生活', 'Canberra Plaza（MRT 旁商圈）· Bukit Canberra 综合社区中心（polyclinic + 泳池 + 室内体育馆）· Chong Pang 美食中心 · Sembawang Shopping Centre'],
    ['🌳 休闲', 'Sembawang Beach · Sembawang Hot Springs 温泉 · 蓄水池公园环绕'],
  ],
  dims: [
    { name: '📍 地段 Location', score: 7.0, weight: 20, desc: 'Canberra MRT 410m 步行 4-5 分钟，Bukit Canberra 综合社区中心、Canberra Plaza 商圈配套齐全；OCR 中顶级生活配套，但非核心镇区、无名校光环。' },
    { name: '💰 租金回报 Rental Yield', score: 5.0, weight: 15, desc: '毛收益率约 3.0%（99.co 3.09% / 第三方 2.9%），低于全岛公寓均值 3.5%；中位租金约 $3,300-3,600/月，北部租需温和。' },
    { name: '📈 资本增值 Capital Appreciation', score: 7.5, weight: 20, desc: '2021 新盘 $1,457 → 2026 转售 $1,729（+18.7%）；2025 高点 $1,919；NSC 快速路、Woodlands 区域中心等北部规划利好持续兑现。' },
    { name: '🏢 开发商 Developer', score: 9.0, weight: 10, desc: 'UOL（新加坡顶级上市，Meyer House / Tamaris 口碑）+ 新加坡置地 + 庆隆三家联合；P&amp;T 设计，交付品质预期极高。' },
    { name: '💸 持有成本 Holding Costs', score: 7.5, weight: 10, desc: '物业费 $360-420/月（同档次正常水平）；99 年地契剩 93 年；自住首套无 ABSD；新 TOP 交付首年基本无维修支出。' },
    { name: '🔄 退出流动性 Exit Liquidity', score: 9.0, weight: 15, desc: '2025-2026 转售 76 笔，D27 中相当活跃；448 户大盘 + HDB 升级买家池大；2026 TOP 后供应集中释放，短期略压价。' },
    { name: '🛡️ 风险控制 Leverage &amp; Risk', score: 8.0, weight: 10, desc: '北部 OCR 新盘供应集中（Commodore / Watergardens / Canberra Crescent 连续推盘）；新买家注意 SSD 3 年窗口；新 TOP 交付磨合期；地契剩余 93 年。' },
  ],
  compScore: 7.50,
  compText: '加权计算（7.0×20% + 5.0×15% + 7.5×20% + 9.0×10% + 7.5×10% + 9.0×15% + 8.0×10%）。低密度品质 + 顶级开发商 + 已兑现楼花回报是核心支撑；租金回报偏弱与北部新盘供应是主要牵制。',
  priceTables: [
    {
      title: '年度成交均价（本地 URA 数据，528 笔）',
      headers: ['年份', '成交笔数', '均价 PSF', '最高 PSF', '阶段'],
      rows: [
        ['2021', '328', '<span class="num-gold">$1,457</span>', '$1,579', '新盘开盘（2021-08）'],
        ['2022', '115', '$1,439', '$1,593', '楼花销售尾期'],
        ['2023', '5', '$1,501', '$1,510', '转售几乎停滞'],
        ['2024', '4', '$1,756', '$1,833', '转售起步'],
        ['2025', '51', '$1,731', '<span class="num-green">$1,919</span>', 'TOP 前夕转售活跃'],
        ['2026', '25', '$1,706', '$1,864', 'TOP 后（2026-06）'],
      ],
    },
    {
      title: '2025+ 转售价格带（按户型面积）',
      headers: ['面积段', '对应户型', '成交区间', '均价 PSF'],
      rows: [
        ['646-678 sqft', '2BR', '$1.10M - $1.18M', '$1,706'],
        ['721-797 sqft', '2BR Premium / +Study', '$1.22M - $1.46M', '$1,747'],
        ['904-958 sqft', '3BR', '$1.37M - $1.68M', '$1,718'],
        ['1,012-1,302 sqft', '3BR+S / 4BR Premium', '$1.69M - <b>$2.50M</b>', '$1,709'],
      ],
    },
  ],
  priceNote: '<b>关键发现：</b>2021-08 开盘至 2026-06 TOP 期间，楼花买家整体兑现 <b>+18.7%</b>（$1,457 → $1,729 psf）；但注意 2023-2024 曾出现连续 2 年仅 9 笔成交的"冰封期"——<b>楼花市场的流动性风险在冷却期是真实存在的</b>。',
  compTitle: 'Canberra 区域横向对比（1yr PSF）',
  compHeaders: ['项目', '类型', '1yr PSF', '相对 Watergardens'],
  compRows: [
    ['Canberra Crescent Residences', 'Private（新盘）', '<span class="num-gold">$1,989</span>', '<span class="num-green">+15%</span>'],
    ['The Commodore', 'Private', '$1,742', '+0.8%'],
    ['<b>The Watergardens at Canberra</b>', '<b>Private</b>', '<b>$1,729</b>', '<b>基准</b>'],
    ['Provence Residence', 'EC', '$1,597', '<span class="num-red">-8%</span>'],
    ['The Brownstone', 'EC', '$1,522', '<span class="num-red">-12%</span>'],
    ['The Visionaire', 'EC', '$1,490', '<span class="num-red">-14%</span>'],
    ['Eight Courtyards', 'Private', '$1,376', '<span class="num-red">-20%</span>'],
    ['1 Canberra', 'EC', '$1,300', '<span class="num-red">-25%</span>'],
    ['Canberra Residences', 'Private', '$1,221', '<span class="num-red">-29%</span>'],
  ],
  compNote: 'D27 区域整体均价约 $1,271 psf——Watergardens 以 $1,729 处于区域第一梯队（高出区域均价 36%），仅次于同地段新盘与 Commodore。',
  complianceTitle: '📋 购买合规说明（Condo）',
  compliance: [
    ['买家资格', 'SC / PR / 外国人均可购买（私人公寓）'],
    ['ABSD', 'SC 首套 0% / SC 第二套 20% / PR 首套 5% / 外国人 60%'],
    ['贷款约束', 'TDSR 55% 上限（非 MSR）；LTV 首套 75%'],
    ['SSD', '3 年内转售缴 4%-16%；2021 楼花买家已过窗口（期权日起算）'],
    ['BSD', '按累进税率（$1.1M 起约 $33,000）'],
  ],
  reviews: [
    { dim: '📊 第三方综合测评', quote: '步行友好 5.8 / 10 · 投资面 6.9 / 10 · 集体出售潜力 2.0 / 10 · ShiokNest 综合 4.1/9。新盘刚 TOP，真实入住反馈有限，以上为第三方测评与项目硬件特征综合分析。', src: 'shioknest / 99.co / sg-propertydata' },
    { dim: '✅ 预期优点（基于项目特征）', quote: '低密度隐私性好：5 层楼高 + 16 栋分散布局，无高层压迫感，296,721 sqft 大地块人均空间奢侈；度假式配套：50m 泳池 + Aqua Gym + 瀑布水景 + 反射池；Smart Home 全配：智能镜/网关/空调/门锁；内部 childcare 年轻家庭通勤接娃便利。', src: '项目官网 watergardensatcanberra.sg / 99.co' },
    { dim: '⚠️ 预期注意点', quote: '北部配套成熟度仍不及 Bishan/Toa Payoh 等成熟镇；北侧单位望 Sembawang 组屋区，非全部单位有泳池/绿地景观；新 TOP 首年公共设施缺陷暴露属常见现象；第三方 ML 预测租金 $3,300-3,600/月，实际需 2026 H2 租赁市场验证。', src: '99.co 楼层平面 / 市场分析' },
  ],
  lifeRating: '★★★★★☆☆☆☆ 3.8/5',
  lifeSummary: '硬件品质预期高（三家顶级开发商 + 低密度 + 全配套），真实口碑待 2026 H2 首批住户反馈验证。',
  risks: [
    ['北部供应集中', '<span class="num-red">中高</span>', 'Canberra 区域近年连续推盘（Commodore / Watergardens / Canberra Crescent Residences），2026-2028 转售放盘集中，短期价格竞争压力'],
    ['SSD 卖方印花税', '<span class="num-red">中</span>', '新买家 3 年内转售需付 4%-16% SSD；2021 楼花买家已过窗口（期权日起算）'],
    ['租金回报偏弱', '<span class="num-red">中</span>', '毛收益率约 3.0%，低于全岛均值；北部租需温和，空置期可能偏长'],
    ['区域规划兑现节奏', '<span class="num-gold">中低</span>', 'NSC 快速路分阶段开通、Woodlands Regional Centre 建设周期长，利好兑现存在时间差'],
    ['地契衰减', '<span class="num-gold">低</span>', '99 年地契剩 93 年，远期（30 年+）转售折价效应需留意'],
    ['新 TOP 磨合期', '<span class="num-gold">低</span>', '交付首年公共设施/建筑缺陷问题集中暴露期，属行业常态，有 builder warranty 保护'],
  ],
  conclusion: [
    { t: '🏠 自住（家庭升级）—— 推荐', body: 'HDB 升级者理想标的：Canberra Primary 290m + 内部 childcare + 低密度品质盘 + 步行 5 分钟 MRT；$1.1M 起门槛在北部新盘中有竞争力。' },
    { t: '💼 长线投资 —— 可考虑', body: '楼花 +18.7% 已验证，再赚靠 NSC / Woodlands 规划兑现；$1,700+ psf 入场需耐心（租金 yield 仅 ~3%）。' },
    { t: '🚫 短线交易 —— 不建议', body: 'SSD 3 年窗口 + 北部新盘供应释放期，短期套利空间有限。' },
  ],
  footer: 'The Watergardens at Canberra Investment Analysis · framework v3 评分体系 · 基于 URA REALIS 交易数据 + 公开市场信息',
};

// ─────────────────────────────────────────────
// 输出
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// One Canberra (EC, 已私有化)
// ─────────────────────────────────────────────
const oneCanberra = {
  badge: 'EC · Executive Condominium · D27 Canberra（已私有化）',
  h1: 'One Canberra',
  address: '1 Canberra Drive · D27 · 99-Year Leasehold（自 2012-01-30 起，剩约 88 年）',
  kpis: [
    { v: '7.10', l: '七维综合评分' },
    { v: '$1,350K', l: '中位数售价' },
    { v: '$1,160', l: '平均 PSF' },
    { v: '~3.5%', l: '毛回报率' },
    { v: '665', l: '总单位数' },
    { v: '✅ 已过', l: '私有化' },
  ],
  execTitle: '"性价比优先"的已私有化 EC——最低 PSF + 全面私有化',
  execHighlight: 'One Canberra 是一处<strong>"性价比优先"</strong>的 EC 转私人公寓项目——地段良好但不算顶级，户型实用且点式建筑通风采光优越，私有权化后买家池大幅扩展至外国人。<strong>核心卖点在于最低 PSF + 全面私有化</strong>，适合预算有限但想进入新加坡房地产市场的买家。',
  execWhy: {
    title: '🔑 关键发现',
    items: [
      '均价从 2021 年的 $945/sqft 升至 2026 年的 ~$1,160/sqft，涨幅约 <b>22.7%</b>',
      '私有权化已完成（2025 年），买家池涵盖所有人包括外籍投资者',
      '租金收益率约 3.5%，低于多数 RCR 竞品，但低于周边 PSF（$1,487 @ Watergardens）赋予其"价值洼地"属性',
      '点式 Block 设计（每层仅 4 户）是该项目的独特差异化优势',
    ],
  },
  specs: [
    { k: '开发商', v: 'MCC Land (Singapore) Pte Ltd' },
    { k: '位置', v: '1 Canberra Drive, Singapore 768101（District 27, OCR）' },
    { k: '地契', v: '99 年 leasehold（自 2012-01-30 起）→ 剩余约 88 年' },
    { k: '土地面积', v: '292,280 sqft (27,153 sqm) · Plot Ratio ≈ 2.50' },
    { k: '楼栋规模', v: '13 栋楼，每栋 12-13 层（点式布局，每层 4 户）' },
    { k: '总单位数', v: '665 个住宅单位' },
    { k: 'TOP', v: '2015 年 10 月' },
    { k: '私有化', v: '2025 年完成（TOP 后满 10 年 → 完全私有化，可售给外国人）' },
  ],
  unitTable: {
    headers: ['户型', '类型', '数量', '面积范围 (sqft)', '典型 PSF'],
    rows: [
      ['3BR Compact', 'C1-C4', '162', '947 – 1,270', '$1,360'],
      ['3BR Standard', 'C5-C9', '321', '1,055 – 1,324', '$1,290'],
      ['3BR Dual Key', 'C10-C11', '59', '1,249 – 1,572', '$1,260'],
      ['4BR Standard', 'D1-D2', '48', '1,249 – 1,604', '$1,050'],
      ['4BR Dual Key', 'D3', '36', '1,442 – 1,830', '$1,030'],
      ['4BR Penthouse', 'PH1-7, PH10-13', '32', '2,228 – 2,378', '$990'],
      ['4BR PH Dual Key', 'PH8DK-PH9DK', '4', '2,422 – 2,540', '$970'],
      ['5BR PH Dual Key', 'PH12-DK', '3', '2,713', '$940'],
    ],
  },
  facilities: ['🏊 50M Freeform Pool', '🏊 Beach Splash Pool', '🏊 Wading Pool (儿童池)', '🏊 Hydro Spa Pool', '🏊 Water Lounges', '🏊 Pool Cabanas', '🏊 Family Pool', '🏊 Reflection Pool', '🏋️ Indoor Gymnasium', '🏋️ Outdoor Aqua Gym', '🏋️ Fitness Alcove', '🏋️ Wellness Corner', '🎾 Tennis Court', '🛁 Jacuzzi', '🛁 Hydro Spa', '🍖 BBQ Area', '🌲 Picnic Grove', '🏛️ Club House', '🏛️ Function Room', '👶 Children\'s Playground'],
  transEdu: [
    ['🚇 地铁', 'Canberra MRT (NS12) Exit C 步行约 9 分钟 (0.72 km) · Yishun MRT 公交接驳约 5 分钟 · Sembawang MRT 公交接驳约 8 分钟 · NSE（规划中）距项目约 1-2 km'],
    ['🏫 学校', '2km 内 9 所：Chongfu Primary 1.0km · Yishun Primary 1.0km · Ahmad Ibrahim Primary 0.95km · Peixin Primary 1.2km · Xishan Primary 1.3km · Ahmad Ibrahim Secondary 0.95km · Yishun Town Secondary 1.5km · Northland Secondary 1.5km · Yishun Junior College 2.0km'],
    ['🛒 生活', 'Bukit Canberra Hub（综合社区中心，步行即达）· Canberra Plaza 0.8km · Northpoint City 1.5km · Khoo Teck Puat Hospital 2km · Lower Seletar Reservoir 3km'],
  ],
  dims: [
    { name: '📍 地段 Location', score: 7.0, weight: 20, desc: 'Canberra 是新加坡北部近年重点发展的新镇之一（"更慢节奏版的 Punggol"），13,000+ BTO 单位在建，吸引年轻家庭。Canberra MRT 步行约 9 分钟（0.72km），Bukit Canberra Hub 步行即达，Ahmad Ibrahim Primary/Secondary 均在 1km 内；点式设计多数单位享 River View。减分：D27 OCR 非核心区，CBD 通勤 25-30 分钟，NSE 尚在施工。' },
    { name: '💰 租金回报 Rental Yield', score: 5.5, weight: 15, desc: '毛回报率约 3.1-3.5%（3BR 典型租金 $2,900-3,500/月），扣除物业费（$400-600/月）、物业税和空置率后净回报约 2.5-2.8%，对纯收租型吸引力一般。投资逻辑不在租金，而在资本增值 + 私有化溢价释放。' },
    { name: '📈 资本增值 Capital Appreciation', score: 7.0, weight: 20, desc: '2021→2026 累计涨幅约 22.7%（$945→$1,160 psf），增速中等偏上；2026 初回调 -9.3% 反映市场降温。私有化完成后买家池扩大（含外国人）有望重新提振价格；$1,160 psf 是同片区最低 PSF 选项，安全边际最大。NSE 建成后北部连通性改善，中长期受益明确。' },
    { name: '🏢 开发商 Developer', score: 7.0, weight: 10, desc: 'MCC Land 是新加坡知名中型开发商，BCA 评级 A 级。代表作：The Alps Residences、Canberra Residences、Queens Peak、Tre Residences、The Canopy 等。交付质量稳定，未出现大规模缺陷纠纷或延期交付记录。定位中端 EC，品牌溢价不高——买家无需为品牌付额外溢价，反而是核心价值。' },
    { name: '💸 持有成本 Holding Costs', score: 7.5, weight: 10, desc: 'MCST 管理费 $400-600/月；自住物业税约 $800-1,200/年；SSD 已过（持有超 3 年 = 0%）；EC 私有化后适用 TDSR 55%（月供上限从收入 30% 提升到 55%），贷款压力显著缓解。' },
    { name: '🔄 退出流动性 Exit Liquidity', score: 8.0, weight: 15, desc: '私有化后流动性大幅提升，买家池全开（SC/PR/外国人）；过去 12 个月成交约 15-18 宗（以 3BR 为主力）；3BR 紧凑户型总价 $1.1M-$1.4M 是新加坡最活跃价位段，成交周期通常 1-3 个月。Two Homes Exit Strategy Score 9.0/10（Strong）。' },
    { name: '🛡️ 风险控制 Leverage &amp; Risk', score: 8.0, weight: 10, desc: '主要风险敞口已全部解除：SSD 窗口期已过（0%）、MOP 已满（2020 起可随时转售）、私有化完成不再受 EC 出租限制、地契剩约 88 年银行仍全额融资、利率敏感性适中（转 TDSR 55%）。唯一宏观变量：美联储降息节奏影响浮动利率。' },
  ],
  compScore: 7.10,
  compText: '加权计算（7.0×20% + 5.5×15% + 7.0×20% + 7.0×10% + 7.5×10% + 8.0×15% + 8.0×10%）。核心逻辑是"低位入场 + 私有化溢价释放 + 长期持有"；租金回报与 OCR 地段天花板是主要牵制。',
  priceTables: [
    {
      title: 'PSF 走势（年度均价）',
      headers: ['年份', '平均 PSF', '同比变化'],
      rows: [
        ['2021', '$945', '—'],
        ['2022', '$1,080', '<span class="num-green">+14.3%</span>'],
        ['2023', '$1,165', '<span class="num-green">+7.9%</span>'],
        ['2024', '$1,212', '<span class="num-green">+4.0%</span>'],
        ['2025', '$1,279', '<span class="num-green">+5.5%</span>'],
        ['2026 (当前)', '<b>$1,160</b>', '<span class="num-red">-9.3%</span>'],
      ],
    },
    {
      title: '近 12 个月典型成交记录（部分）',
      headers: ['日期', '卧室', '面积 (sqft)', 'PSF', '总价'],
      rows: [
        ['Jun 2026', '3BR', '1,066', '$1,309', '$1,395K'],
        ['Jun 2026', '3BR', '1,055', '$1,352', '$1,426K'],
        ['Jun 2026', '3BR', '947', '$1,444', '$1,368K'],
        ['May 2026', '3BR', '1,076', '$1,301', '$1,400K'],
        ['May 2026', '3BR', '936', '$1,399', '$1,310K'],
        ['Apr 2026', '4BR', '1,604', '$1,172', '$1,880K'],
        ['Mar 2026', 'N/A', '1,249', '$1,361', '$1,700K'],
        ['Feb 2026', '3BR', '947', '$1,341', '$1,270K'],
      ],
    },
  ],
  priceNote: '过去五年累计涨幅约 22.7%，增速中等偏上。2026 初回调 -9.3% 反映整体市场降温和新供应增加的影响；但<strong>私有化完成后买家池扩大到所有人（含外国人），有望重新提振价格</strong>。',
  compTitle: 'D27 Canberra 片区竞品对比',
  compHeaders: ['项目', 'TOP', 'PSF (估算)', '地契', '距 MRT'],
  compRows: [
    ['<b>One Canberra（本研究）</b>', '2015', '<b>$1,160</b>', '99yr (剩 88y)', '9 min'],
    ['The Watergardens', '2021', '$1,487', '99yr (剩 95y)', '5 min'],
    ['Provence Residence', '2021', '$1,182', '99yr (剩 95y)', '8 min'],
    ['Canberra Cres Residences', '2025', '待确定', '99yr (剩 99y)', '6 min'],
  ],
  compNote: 'One Canberra 以最低 PSF ($1,160) 在同片区中具有最大安全边际。Watergardens 溢价 28%（地契更新、距 MRT 更近、建筑更新）。点式设计（Point-block）是唯一差异化的不可替代因素。',
  complianceTitle: '📜 EC 合规说明（已私有化）',
  complianceNote: '已完成全部私有化流程，本质上已是<strong>普通私人公寓</strong>。外国投资者可无障碍购买（SC 第一套免 ABSD；外籍需 60% ABSD），投资属性与普通 Condo 无异，仅地契年限短一些。',
  compliance: [
    ['MOP 状态', '已满（2020，旧规则 EC 5 年 MOP）'],
    ['私有化', '已完成（2025，TOP+10 年）→ 外国人/实体均可购买'],
    ['当前交易对象', '所有人（SC、PR、外国人、实体均无限制）'],
    ['整间出租', '可随时出租（不受 MOP 限制）；Dual Key 可单独出租一室'],
    ['SSD', '0%（持有超 3 年）'],
    ['贷款约束', '私有化后转 TDSR 55%（不再受 MSR 30%）'],
  ],
  reviews: [
    { dim: '✅ Point-block 设计优势显著 — 每层 4 户，每户两面窗', quote: '点式 Block 几乎所有单位都享有交叉通风（Cross-ventilation），至少两面窗户，日常几乎不需要开空调就能保持凉爽；每层仅 4 户意味着电梯等待时间短、走廊安静、邻里噪音少。', src: 'Stacked Homes Review, 2026' },
    { dim: '✅ 靠近 Nature Enclave — Sembawang Park &amp; Beach', quote: '项目旁边就是 Park Connector Network (PCN)，可以直接走到 Sembawang Park 和海滩，带小孩的家庭周末散步和户外活动非常方便。Canberra 区域被描述为 "nature enclave"。', src: 'Stacked Homes Review, 2026' },
    { dim: '⚠️ River View 效果因人而异', quote: '部分单位的 River View (Sungei Simpang Kiri) 被评为"更像一条长坑 (longkang) 而不是景观河"，取决于绿化高度、河道宽度和楼层；顶层 PH 单位景观可能更壮观。', src: 'Stacked Homes Review, Ryan J. Ong, 2026' },
    { dim: '⚠️ MRT 步行距离稍远', quote: 'Canberra MRT Exit C 步行约 9 分钟 / 0.72 km，在新加坡 EC 市场中不算最近（Canberra Residences 和 Provence Residence 都在 800m 以内）；雨天步行体验受影响。', src: 'Homejourney, EdgeProp, 2026' },
    { dim: '✅ 社区氛围成熟且年轻 + 无西晒', quote: 'Canberra 新镇有大量在建 BTO 单位，住户以年轻家庭和中产阶级为主，社区活力强；项目所有单位统一北向/南向，避免西晒；户型方正无凸窗，实用率高。', src: 'EdgeProp Buddy / One Canberra Factsheet, estate.sg' },
  ],
  lifeRating: '★★★★☆ 4.0/5',
  lifeSummary: '正面反馈集中于 Point-block 设计、Nature Enclave 位置、社区活力和方正户型；负面集中在 MRT 步行距离和 River View 效果因单位而异。',
  risks: [
    ['市场下行压力', '<span class="num-red">高</span>', '2026 年 PSF 已从高点回落 -9.3%；全球宏观不确定性、美联储政策走向及新加坡新增供应可能导致价格继续承压'],
    ['地契衰减 (Lease Decay)', '<span class="num-gold">中</span>', '剩余约 88 年地契；当前不影响银行贷款，但 50 年后缩短至不足 50 年时可能影响融资和未来买家接受度'],
    ['NSE 进度不确定性', '<span class="num-gold">中</span>', 'North-South Expressway 是当前最大的潜在催化剂，若施工延期（目前预计 2030 年），相关增值预期需相应推迟'],
    ['租金回报偏低', '<span class="num-gold">低</span>', '3.5% 毛回报在 RCR 板块中不算突出，不适合追求现金流的纯收租型投资者，更适合关注资本增值的长期持有者'],
  ],
  conclusion: [
    { t: '🏠 自住 — ★★★★★ 推荐', body: 'SC 家庭预算 $1.1M-$1.5M 寻求宽敞实用 3-4 房的扎实选择。Point-block 设计带来优质居住环境，Canberra 新镇年轻社区氛围适合育儿，Bukit Canberra Hub 提供极佳社区生活体验，周边教育医疗购物配套齐全。' },
    { t: '💼 投资 — ★★★★☆ 可考虑', body: '核心逻辑：低位入场 + 私有化溢价释放 + 长期持有。当前 PSF 回调 -9.3% 后已进入相对合理估值区间；看好 Canberra 新镇发展及 NSE 建成后北部连通改善者可配置。不建议期望短期暴利的短线投资者入场。' },
    { t: '🌏 外籍投资者 — ★★★☆☆ 谨慎', body: '私有化后虽可购买，但不建议纯粹作为投资工具：ABSD 附加税费成本高（外国人 60%）；D27 OCR 增值天花板有限；同等预算可在 RCR（Bishan、Toa Payoh、Upper Thomson）找到更好选择。' },
  ],
  footer: 'One Canberra Investment Analysis · framework v3 评分体系 · 基于 URA REALIS 交易数据 + 公开市场信息',
};

// ─────────────────────────────────────────────
// Bidadari Estate (HDB)
// ─────────────────────────────────────────────
const bidadari = {
  badge: 'HDB · BTO Resale · Toa Payoh 规划区 · D22/RCR 城市边缘',
  h1: 'Bidadari Estate',
  address: 'Toa Payoh Planning Area · D22 · 99-Year Leasehold（剩约 94 年）',
  kpis: [
    { v: '8.20', l: '七维综合评分' },
    { v: '12 个', l: '开发项目' },
    { v: '~8,900', l: '总单位' },
    { v: '$1,130-1,219', l: '成交均价 psf' },
    { v: '$1.368M', l: '最高纪录（4RM, 2026.06）' },
    { v: '5-7min', l: '最近 MRT（Woodleigh）' },
  ],
  execTitle: '新加坡公共住房里程碑——全国最贵组屋片区之一',
  execHighlight: 'Bidadari Estate 是新加坡过去十年最大的组屋开发项目之一，从 2015 年第一批 BTO 推出到 2025 年底全部竣工，累计建成 12 个项目近 9,000 个单位。位于 Toa Payoh 规划区的城市边缘地段（D22），紧邻 Woodleigh (NE11) 和 Potong Pasir (NE10) 两个 MRT 站，被 Bidadari Park 和 Alkaff Lake 环绕。截至 2026 年 7 月，已成为全国最贵组屋片区之一。',
  execWhy: {
    title: '🏆 创纪录交易一览',
    items: [
      '3-room 最高转售价 <b>$945,000（$1,219 psf）</b>— 2026 年 6 月，Alkaff Crescent 118A 高楼层',
      '4-room 最高转售价格 <b>$1,368,000（$1,311 psf）</b>— 2026 年 6 月，Alkaff Lakeview',
      '3-room $945K 离百万大关仅差 $55,000',
      '原 BTO 价格范围 $433,000 - $550,000 → 当前转售溢价高达 <b>160%</b>',
    ],
  },
  execSummary: 'Bidadari 是目前新加坡最具增值确定性的组屋资产——全新楼龄 + 近 94 年剩余地契 + 双 MRT 站 + 公园绿肺 + 成熟学区供应枯竭后仅剩存量市场。<span class="positive">综合评分 8.20/10（推荐）</span>。适合自住家庭和未来 20 年以上的长期投资者。',
  specs: [
    { k: '位置 / 邮编', v: 'Toa Payoh Planning Area, Region 14 (NE/CC)' },
    { k: '土地年限', v: '99 年（自 ~2019/2020 起，剩约 94 年）' },
    { k: '总开发项目', v: '12 个' },
    { k: '总单位数', v: '约 8,900' },
    { k: '开发跨度', v: '2015 (首批 BTO) → 2025 (全数 TOP)' },
    { k: '规划定位', v: '成熟镇区 + 城市边缘 (RCR)' },
    { k: '最近 MRT', v: 'Woodleigh (NE11) 步行 5-7 分钟 · Potong Pasir (NE10) 10-12 分钟 · Bartley (CC13) 3-8 分钟' },
    { k: '租金', v: '4-room 中位月租约 $2,750-$3,400（视户型和楼层），毛回报约 3.5%-4.7%' },
  ],
  unitTable: {
    headers: ['房型', '面积范围', '典型供应量'],
    rows: [
      ['2-room Flexi', '~515-600 sqft', '少量（单身/老年人优先）'],
      ['3-room', '~710-775 sqft', '主力配置（多个项目均有）'],
      ['4-room', '~895-1,040 sqft', '最大量配置（最受欢迎的类型）'],
      ['5-room', '~1,000-1,200 sqft', 'Oasis/Breeze/Portico 等部分项目'],
      ['Multi-Generation (3Gen)', '~1,150+ sqft', 'Oasis/Sembawang Brook 有设置'],
    ],
  },
  facilities: ['🏢 Alkaff LakeView (2019 TOP)', '🏢 Alkaff CourtView (2020 TOP)', '🏢 Alkaff Oasis (2021 TOP)', '🏢 Alkaff Breeze (2024 TOP)', '🏢 ParkView @ Bidadari (2025 TOP)', '🏢 ParkEdge @ Bidadari (2025 TOP)', '🏢 Bartley Beacon (2025 TOP)', '🏢 Bartley GreenRise (2025 TOP)', '🏢 Sembawang Portico (2025 TOP)', '🏢 Sembawang Brook (2025 TOP)', '🏢 Woodleigh Hillside', '🏢 Woodleigh Village（集成式社区中心）'],
  transEdu: [
    ['🚇 MRT', 'Woodleigh (NE11) 步行 5-7 分钟 · Potong Pasir (NE10) 步行 10-12 分钟 · Bartley (CC13) 步行 3-8 分钟；Woodleigh Bus Interchange 多条线路直贯全城'],
    ['🏫 小学', 'Cedar Primary (1km) · Maris Stella PS (600m) · St. Andrew\'s SJ (1.2km)'],
    ['🏫 中学', 'Maris Stella HS (600m) · Cedar Girls\' Secondary (1km) · Dunman High (1.5km)'],
    ['🛍️ 商场', 'The Woodleigh Mall (5min) · The Poiz Centre (8min) · NEX (10min)'],
    ['🌳 绿化', 'Bidadari Park · Alkaff Lake · Serangoon Sunshine Park · How Sun Linear Park'],
  ],
  dims: [
    { name: '📍 地段 Location', score: 9.0, weight: 30, desc: '成熟镇区核心 + 步行 ≤5min 双 MRT（Woodleigh NE11 5-7min / Bartley CC13 3-8min）+ 全套生活配套（The Woodleigh Mall / NEX）+ 公园绿地（Bidadari Park / Alkaff Lake）。城市边缘稀缺地段，增值天花板高。' },
    { name: '💰 租金回报 Rental Yield', score: 7.0, weight: 15, desc: '高单价压低了收益率：3-room $945K 月租约 $2,750 ≈ 3.5%，4-room $1.3M 月租 $3,400 ≈ 3.1%；毛回报约 3.5-4.7%，对 HDB 基准属中上。' },
    { name: '📈 资本增值 Capital Appreciation', score: 8.0, weight: 15, desc: 'BTO 供应已枯竭 + 剩余 ~94 年长地契 + 双 MRT 公园配套 = 稀缺性极强；BTO $433K-$550K → resale $725K-$1.3M，涨幅 60-160%，升值兑现度超预期。' },
    { name: '🏢 建造质量与维护', score: 8.5, weight: 10, desc: '2019-2025 新建，多数未超 5 年楼龄；ERS 暂不适用；HDB 标准施工质量良好，仅个别早期 2019 年 Block 出现天花板轻微渗水个案。' },
    { name: '💸 持有成本 Holding Costs', score: 9.0, weight: 5, desc: 'Owner-Occupier 几乎无房产税 + 无 MCST + HDB Loan 2.6% fixed = 极低月度成本。持有成本维度全新加坡 HDB 中最低之一。' },
    { name: '🔄 退出流动性 Exit Liquidity', score: 7.5, weight: 15, desc: '买家池仅限 SC 家庭（中等）；但地段优势抵消了池子限制；热门户型 1-2 个月出手，成交活跃度在 HDB 中属前列。' },
    { name: '🛡️ 风险控制 Leverage &amp; Risk', score: 8.0, weight: 10, desc: '已过 MOP + 地契 > 93 年 + 自住合规风险极低；唯一变量是长期宏观利率变化与高位接盘者的回调风险。' },
  ],
  compScore: 8.20,
  compText: '加权计算（9.0×30% + 7.0×15% + 8.0×15% + 8.5×10% + 9.0×5% + 7.5×15% + 8.0×10%）。全新楼龄 + 长地契 + 双 MRT + 公园绿肺 + 供应枯竭是增值确定性的核心；入场价已高是主要顾虑。',
  priceTables: [
    {
      title: 'PSF 走势（Alkaff LakeView 为代表）',
      headers: ['时间节点', 'PSF ($)', '备注'],
      rows: [
        ['2020 (BTO 交付)', '<span class="num-green">$949</span>', 'HDB 起始定价'],
        ['2022 年中', '<span class="num-green">$1,050</span>', '疫情后组屋价格上涨'],
        ['2023 年中', '<span class="num-green">$1,120</span>', '通胀推升'],
        ['2024 年中', '<span class="num-green">$1,165</span>', '供需紧平衡'],
        ['2025 年中', '<span class="num-green">$1,180</span>', 'All BTO completed'],
        ['2026 年 6 月', '<span class="num-green">$1,219</span>', '创历史新高'],
      ],
    },
  ],
  priceNote: 'Bidadari PSF ($1,130-$1,219) 是全 HDB 系统内最高的片区之一。同等价位在私宅市场只能买到极小面积的 Studio 或偏远地区的 1BR，但在 Bidadari 你可以买到全新的 4-room 近 1,000 sqft。这种"PSF 折价 × 空间体验"对中高收入家庭的吸引力极大。',
  compTitle: '片区竞品 PSF 对比',
  compHeaders: ['项目/片区', 'Type', 'Avg PSF ($)', '距 MRT 时间', '地契剩余'],
  compRows: [
    ['<b>Bidadari（整体）</b>', 'HDB Resale', '<span class="num-green"><b>1,130 - 1,219</b></span>', '2-8 min', '93-95 年'],
    ['Toa Payoh 老楼', 'HDB Resale', '700 - 850', '3-10 min', '45-70 年'],
    ['MacPherson', 'HDB Resale', '800 - 950', '5-12 min', '55-80 年'],
    ['Punggol (较远)', 'HDB Resale', '650 - 800', '5-15 min', '90-95 年'],
    ['Queenstown (SkyParc @ Dawson)', 'HDB Resale', '1,000 - 1,100', '7-10 min', '90+ 年'],
    ['The Woodleigh Residences (Condo)', 'Private', '$2,413', 'B2 直通 MRT', '99 年'],
  ],
  compNote: 'Bidadari 是全 HDB 系统内 PSF 最高片区之一，与周边老组屋（Toa Payoh $700-850）形成明显价差，反映全新楼龄 + 长地契 + 地段稀缺性的综合溢价。',
  complianceTitle: '📜 HDB 法规与合规说明',
  compliance: [
    ['MOP 状态', '已过 5 年 MOP（2019 TOP → 2024 已满）'],
    ['转售限制', '可在 resale 市场自由出售给符合条件的 SC 家庭'],
    ['出租规定', 'MOP 后即可整间出租，租客可为 PR/外国人'],
    ['ABSD', 'SC 首套 0% | PR 5% | 外国人不可买'],
    ['贷款约束', 'HDB Buyer 使用 MSR (30%)；银行贷款购买 HDB resale 也用 TDSR'],
    ['HDB 贷款', 'SC 首套最高 LTV 90% | 利率约 2.6% fixed'],
    ['SSD', 'HDB 不适用 SSD'],
    ['Resale Levy', '若曾用政府补贴买 BF，resale 时需补回差额'],
  ],
  reviews: [
    { dim: '✅ 通勤体验 — 极高评价', quote: '5 分钟内步行到 Woodleigh NE11 MRT；地下通道/天桥覆盖主要路线；Bus Hub 直连。高峰时段 Woodleigh 站台人流较大，尤其周末去 NEX 购物的人潮。', src: 'Reddit r/SingaporeHousing / 99.co 用户评价' },
    { dim: '✅ 配套使用感 — 最大亮点', quote: 'Bidadari Park 和 Alkaff Lake 跑步、遛娃、散步体验极佳；The Woodleigh Mall 就在旁边。部分小型项目商业配套尚不够丰富，仍需依赖 NEX/Woodleigh Mall。', src: 'Facebook "Singapore HDB Buy/Rent/Sell" 群讨论' },
    { dim: '✅ 升值兑现度 — 超预期', quote: 'BTO $433K-$550K → resale $725K-$1.3M，涨幅 60-160%，业主满意度极高。高位接盘者（$900K+ 买入 3-room）需持有更长时间才能兑现同等涨幅比例。', src: 'URA REALIS 成交记录交叉分析' },
    { dim: '⚠️ 隔音与交付品质', quote: '大部分住户反映墙体隔音良好，高层单位远离地面噪音；个别早期 2019 年 Block（Alkaff LakeView 首批）出现天花板轻微渗水个案；临街低层单位存在交通噪音。', src: '99.co / EdgeProp 用户评价' },
    { dim: '✅ 邻里素质', quote: '以 young professional families 为主，社区氛围较好，不少住户来自同一 BTO 批次；Town Council 维修响应较快，公共区域清洁度高于平均水平。', src: '市场反馈汇总' },
  ],
  lifeRating: '★★★★★ 5/5',
  lifeSummary: 'Bidadari 是 HDB 历史上居住体验最好的小区之一。绿色景观 + MRT 无缝连接 + 学校密度 + 社区氛围四项全部在线。唯一痛点是低楼层临街噪音和极少数早期渗水案例，不影响整体评级。',
  risks: [
    ['高位接盘风险', '<span class="num-red">高</span>', '3-room 已达到 $945K、4-room 突破 $1.3M；若市场回调，这些高价盘的亏损幅度绝对值可能很大'],
    ['利率上行敏感', '<span class="num-gold">中</span>', 'HDB Loan 锁定 2.6% fixed，但若选择银行房贷或未来 LTV 收紧，月供压力会上升'],
    ['地契衰减', '<span class="num-gold">中</span>', '当前 93-95 年剩余看似充足，但到 2060 年代将逐步降至 60 年以下，影响后续转售价格'],
    ['租金增长放缓', '<span class="num-gold">中</span>', '2025-2026 大量 BTO 单位进入 resale 市场，新增供应（包括周边大型项目如 Alkaff Oasis）可能压低租金增速'],
    ['政策变动', '<span class="num-gold">低</span>', 'HDB 可能在将来调整 resale 规则（如扩大买家池限制、提高 Resale Levy），但概率较低'],
    ['Town Council 管理', '<span class="num-gold">低</span>', '目前维护水平良好，但未来长期看 Town Council 的效率可能影响公共区域质量'],
  ],
  conclusion: [
    { t: '🏠 自住家庭 — ★★★★★ 强烈推荐', body: '公园环境 + 双 MRT + 名校圈 = 家庭生活的理想组合。3-room/4-room 足够，考虑 Alkaff LakeView 或 ParkView。' },
    { t: '💼 长期增值投资（20+ 年）— ★★★★☆ 推荐', body: '供应枯竭 + 长地契 + 城市边缘稀缺地段 = 增值确定性高。但入场价已经很高（$1,100+ psf），短期爆发力有限。' },
    { t: '💰 租金收租型投资者 — ★★☆☆☆ 不建议', body: '当前租金回报率仅 3.1-3.5%，低于银行存款利率（~3.5-4%）。不如直接买 REIT 或定存。' },
    { t: '🌏 外籍人士 — ❌ 不可购买', body: 'HDB 只限新加坡公民购买（PR 须联合 SC 购买）。' },
    { t: '🔄 换屋族（Upgrader）— ★★★★☆ 推荐', body: '如果已有老旧短地契 HDB 可售出，换入 Bidadari 4-room/5-room 是优质升级路径。' },
  ],
  footer: 'Bidadari Estate HDB Investment Analysis · framework v3 评分体系 · 基于 URA REALIS 交易数据 + 公开市场信息',
};

// ─────────────────────────────────────────────
// 输出全部
// ─────────────────────────────────────────────
const targets = [
  { c: watergardens, out: 'reports/the-watergardens-at-canberra/the-watergardens-at-canberra-analysis.html' },
  { c: oneCanberra, out: 'reports/one-canberra/one-canberra.html' },
  { c: bidadari, out: 'reports/bidadari-estate/bidadari-estate.html' },
];
for (const { c, out } of targets) {
  const html = render(c);
  fs.writeFileSync(path.join(__dirname, '..', out), html, 'utf8');
  console.log('OK', out, html.length, 'bytes');
}
