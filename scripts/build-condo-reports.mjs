// 渲染器：condo 研报 HTML 生成（模板基于 stirling-residences）
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 研报内容配置：纯数据走 JSON（10 份 condo 研报，公开资料 + 自有 URA 数据交叉验证）
const CONTENTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'condo-report-content.json'), 'utf8'));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'reports', '_data');
const outBase = path.join(root, 'reports');

const CSS = `:root{--bg:#0b1120;--card:#1e293b;--card2:#273449;--gold:#fbbf24;--blue:#60a5fa;--green:#22c55e;--red:#ef4444;--text:#e2e8f0;--text2:#94a3b8;--text3:#64748b}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;line-height:1.7}
.wrap{max-width:980px;margin:0 auto;padding:28px 20px 60px}
.hero{background:linear-gradient(135deg,#0f172a,#1e293b 60%,#3b2f1a);border:1px solid #334155;border-radius:16px;padding:36px 32px;margin-bottom:24px;position:relative;overflow:hidden}
.hero .tag{display:inline-block;background:rgba(251,191,36,.15);color:var(--gold);border:1px solid rgba(251,191,36,.4);padding:3px 12px;border-radius:20px;font-size:12px;margin-bottom:14px}
.hero h1{font-size:30px;font-weight:700;margin-bottom:6px}
.hero .sub{color:var(--text2);font-size:14px;margin-bottom:16px}
.hero .score-row{display:flex;gap:16px;flex-wrap:wrap;align-items:center}
.hero .score{font-size:52px;font-weight:800;color:var(--gold)}
.hero .score-label{font-size:13px;color:var(--text2)}
.hero .score-verdict{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.4);color:#86efac;padding:6px 16px;border-radius:8px;font-weight:600}
.hero .meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-top:22px}
.hero .meta-grid .m{background:rgba(15,23,42,.6);border:1px solid #334155;border-radius:10px;padding:10px 14px}
.hero .meta-grid .m .k{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.5px}
.hero .meta-grid .m .v{font-size:15px;font-weight:600;color:var(--text);margin-top:2px}
.section{margin-top:34px}
.section h2{font-size:21px;font-weight:700;color:var(--gold);border-left:4px solid var(--gold);padding-left:12px;margin-bottom:16px}
.highlight-box{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.35);border-radius:12px;padding:16px 20px;margin:14px 0;font-size:14px}
.highlight-box b{color:var(--gold)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--card);border:1px solid #334155;border-radius:12px;padding:18px 20px}
.card h3{font-size:16px;font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.card p{font-size:14px;color:var(--text2)}
table{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0}
th{background:var(--card2);color:var(--gold);font-weight:600;text-align:left;padding:10px 12px;font-size:13px}
td{padding:9px 12px;border-bottom:1px solid #334155}
tr:hover td{background:rgba(51,65,85,.25)}
.num{font-variant-numeric:tabular-nums}
.num-green{color:#6ee7b7}
.num-red{color:#fca5a5}
.dim{background:var(--card);border:1px solid #334155;border-radius:12px;padding:18px 22px;margin-bottom:16px}
.dim-head{display:flex;align-items:center;gap:14px;margin-bottom:10px}
.dim-score{font-size:34px;font-weight:800;color:var(--gold);min-width:64px;text-align:center}
.dim-title{font-size:17px;font-weight:700}
.dim-weight{font-size:12px;color:var(--text3)}
.stars{color:var(--gold);letter-spacing:2px;font-size:13px}
.fac-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.fac-tags span{background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.35);color:var(--blue);padding:4px 12px;border-radius:20px;font-size:12px}
.fac-tags span.ok{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.4);color:#86efac}
.fac-tags span.miss{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.35);color:#fca5a5}
.quote{background:var(--card2);border-left:3px solid var(--blue);border-radius:8px;padding:12px 16px;margin:10px 0;font-size:14px;color:var(--text2)}
.quote b{color:var(--text)}
.quote .src{display:block;font-size:12px;color:var(--text3);margin-top:6px}
.risk-warn{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.4);border-radius:12px;padding:16px 20px;margin:14px 0}
.risk-warn b{color:#fca5a5}
.verdict-box{background:linear-gradient(135deg,#1e293b,#273449);border:1px solid rgba(251,191,36,.3);border-radius:14px;padding:24px 28px;margin-top:18px}
.verdict-box h3{color:var(--gold);margin-bottom:12px;font-size:18px}
.verdict-box .fit{display:flex;gap:14px;flex-wrap:wrap;margin-top:12px}
.verdict-box .fit div{flex:1;min-width:200px;background:rgba(15,23,42,.5);border-radius:10px;padding:14px 16px}
.verdict-box .fit .fit-yes b{color:#86efac}
.verdict-box .fit .fit-no b{color:#fca5a5}
.disclaimer{margin-top:40px;padding-top:20px;border-top:1px solid #334155;font-size:12px;color:var(--text3)}
.back-link{display:inline-block;margin-bottom:16px;font-size:13px;color:var(--blue);text-decoration:none}
.back-link:hover{text-decoration:underline}
.pct-up{color:#fca5a5}
.pct-down{color:#6ee7b7}
@media(max-width:768px){.grid2,.grid3{grid-template-columns:1fr}.hero h1{font-size:24px}.hero .score{font-size:40px}}`;

function stars(n) {
  const full = Math.floor(n);
  const half = n - full >= 0.5 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(10 - full - half);
}

function yoyCell(y) {
  if (y === null) return '<td class="num">—</td>';
  const cls = y >= 0 ? 'pct-up' : 'pct-down';
  const sign = y >= 0 ? '+' : '';
  return `<td class="num ${cls}">${sign}${y.toFixed(1)}%</td>`;
}

function priceTable(ph) {
  const last = ph[ph.length - 1];
  const label = `2026 (至${last.year === '2026' ? '7' : '12'}月)`;
  const rows = ph.map(r => {
    const yLabel = r.year === '2026' ? '2026 (至7月)' : r.year;
    return `<tr><td>${yLabel}</td><td class="num">${r.n}</td><td class="num">$${r.avgPsf.toLocaleString()}</td>${yoyCell(r.yoy)}</tr>`;
  }).join('\n');
  return `<div class="card"><table><thead><tr><th>年份</th><th>成交数</th><th>均价 PSF</th><th>同比</th></tr></thead><tbody>${rows}</tbody></table>
  <p style="font-size:12px;color:var(--text3)">数据源：URA PMI_Resi_Transaction（经自有 dashboard 交叉验证）</p></div>`;
}

function facTags(items) {
  return `<div class="fac-tags">${items.map(i => `<span class="${i.ok === false ? 'miss' : i.ok ? 'ok' : ''}">${i.t}</span>`).join('')}</div>`;
}

function metaGrid(meta) {
  return `<div class="meta-grid">${meta.map(m => `<div class="m"><div class="k">${m.k}</div><div class="v">${m.v}</div></div>`).join('')}</div>`;
}

function dimsHTML(dims) {
  return dims.map(d => `<div class="dim">
    <div class="dim-head">
      <div class="dim-score">${d.score.toFixed(2)}</div>
      <div>
        <div class="dim-title">${d.title} <span style="font-size:12px;color:var(--text3)">(权重 ${d.weight}%)</span></div>
        <div class="stars">${d.stars || stars(d.score)}</div>
      </div>
    </div>
    <p>${d.text}</p>
  </div>`).join('\n');
}

function fitHTML(c) {
  return `<div class="fit">
    <div class="fit-yes"><b>✅ 适合：</b><br>${c.yes.map(x => x + '<br>').join('')}</div>
    <div class="fit-no"><b>❌ 不适合：</b><br>${c.no.map(x => x + '<br>').join('')}</div>
  </div>`;
}

function render(c, d) {
  const s = d.stats;
  const txnPic = `<div class="card">
    <h3>🧾 交易画像</h3>
    <table>
      <tbody>
        <tr><td>总成交</td><td class="num">${d.nTrans} 笔 (${d.fmtFirstDate} - ${d.fmtLastDate})</td></tr>
        ${Object.entries(d.saleMix).map(([k, v]) => `<tr><td>${k}</td><td class="num">${v.n} 笔 (${v.pct}%)</td></tr>`).join('')}
        <tr><td>历史最高价</td><td class="num">$${(s.maxPrice / 1e6).toFixed(2)}M ($${s.maxPsf} psf)</td></tr>
        <tr><td>历史最低价</td><td class="num">$${(s.minPrice / 1e3).toFixed(0)}K ($${s.minPsf} psf)</td></tr>
        ${d.top.top10ByPrice[0] ? `<tr><td>最高成交</td><td class="num">$${(d.top.top10ByPrice[0].price / 1e6).toFixed(2)}M · ${d.top.top10ByPrice[0].area} sqft · ${d.top.top10ByPrice[0].date}</td></tr>` : ''}
      </tbody>
    </table>
  </div>`;

  const compRows = c.comps.map(x => {
    const mine = x.self ? `<b>${x.name}</b>` : x.name;
    const psf = x.self ? `<td class="num" style="color:var(--gold)"><b>${x.psf}</b></td>` : `<td class="num">${x.psf}</td>`;
    return `<tr><td>${mine}</td><td>${x.tenure}</td>${psf}</tr>`;
  }).join('\n');

  const compNote = c.compNote ? `<p style="font-size:12px;color:var(--text3);margin-top:8px">${c.compNote}</p>` : '';

  const unitMixRows = Object.entries(d.unitProfile).map(([k, v]) => {
    const pct = (v / d.nTrans * 100).toFixed(0);
    return `<tr><td>${k}</td><td class="num">${v} 笔 (${pct}%)</td></tr>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.title}</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<a class="back-link" href="../">← 返回研报索引</a>

<div class="hero">
  <span class="tag">${c.tag}</span>
  <h1>${c.h1}</h1>
  <div class="sub">${c.sub}</div>
  <div class="score-row">
    <div><span class="score">${c.score2.toFixed(2)}</span><div class="score-label">综合评分 / 10</div></div>
    <span class="score-verdict">${c.verdictLabel}</span>
  </div>
  ${metaGrid(c.meta)}
</div>

<div class="section">
  <h2>📌 执行摘要</h2>
  <div class="highlight-box"><b>一句话结论：</b>${c.exec}</div>
</div>

<div class="section">
  <h2>🏗️ 项目核心参数</h2>
  <div class="grid2">
    <div class="card">
      <h3>📐 基本信息</h3>
      <table>
        ${c.params.basic.map(r => `<tr><td>${r.k}</td><td class="num">${r.v}</td></tr>`).join('')}
      </table>
    </div>
    <div class="card">
      <h3>🏢 楼栋与户型</h3>
      <table>
        ${c.params.blocks.map(r => `<tr><td>${r.k}</td><td class="num">${r.v}</td></tr>`).join('')}
        ${unitMixRows}
      </table>
      <p style="font-size:11px;color:var(--text3);margin-top:6px">户型分布按成交面积分桶估算，仅供参考。</p>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h3>🎪 配套设施</h3>
    ${facTags(c.params.facilities)}
    <p style="margin-top:12px;font-size:13px;color:var(--text2)">${c.params.facNote}</p>
  </div>

  <div class="grid2" style="margin-top:16px">
    <div class="card">
      <h3>🚇 交通与通勤</h3>
      <table>${c.params.transport.map(r => `<tr><td>${r.k}</td><td class="num">${r.v}</td></tr>`).join('')}</table>
    </div>
    <div class="card">
      <h3>🏫 教育（1km 内 ${c.params.schools.length} 所）</h3>
      <table>${c.params.schools.map(r => `<tr><td>${r.k}</td><td class="num">${r.v}</td></tr>`).join('')}</table>
    </div>
  </div>
</div>

<div class="section">
  <h2>📊 七维评分</h2>
  ${dimsHTML(c.dims)}
</div>

<div class="section">
  <h2>📈 价格走势与区域对比</h2>
  ${priceTable(d.priceHistory)}
  <div class="grid2" style="margin-top:16px">
    <div class="card">
      <h3>🏙️ ${c.compTitle}</h3>
      <table><thead><tr><th>项目</th><th>地契</th><th>均价 PSF</th></tr></thead><tbody>${compRows}</tbody></table>
      ${compNote}
    </div>
    ${txnPic}
  </div>
</div>

<div class="section">
  <h2>🏡 真实居住体验</h2>
  ${c.lifestyle.quotes.map(q => `<div class="quote"><b>"${q.t}"</b><span class="src">${q.src}</span></div>`).join('\n')}
  <div class="highlight-box" style="margin-top:16px">
    <b>居住体验综合评级：${c.lifestyle.rating}</b><br>
    ${c.lifestyle.summary}
  </div>
</div>

<div class="section">
  <h2>⚠️ 风险提示</h2>
  <div class="risk-warn"><b>重点风险：</b>
    <ol style="margin:10px 0 0 18px;font-size:14px">${c.risks.map(r => `<li>${r}</li>`).join('')}</ol>
  </div>
  <div class="highlight-box" style="margin-top:16px">
    <b>📋 购买合规（2026 现行）：</b><br>
    ABSD —— SC 首套 0% / 第二套 20% / 第三套+ 30%；PR 首套 5% / 第二套 30%；外国人 60%（实体/信托 65%）。
    <br>贷款 —— 银行首套 LTV 75%（第三套+ 55%）；TDSR 全部债务月供 ≤ 月收入 55%。
    <br>SSD —— 私人住宅持有 ≤3 年出售按 12%/8%/4% 征收，满 3 年 0%。
  </div>
</div>

<div class="section">
  <h2>🎯 最终结论</h2>
  <div class="verdict-box">
    <h3>综合评分：${c.score2.toFixed(2)} / 10 — ${c.verdictLabel}</h3>
    <p>${c.verdict}</p>
    ${fitHTML(c.fit)}
    <p style="margin-top:16px;font-size:14px;color:var(--text2)"><b style="color:var(--gold)">买入建议：</b>${c.buyAdvice}</p>
  </div>
</div>

<div class="disclaimer">
  <b>免责声明：</b>本报告基于公开数据（URA、EdgeProp、99.co、PropertyGuru、BCA 等）与自有 dashboard 交叉验证整理，仅供投资参考，不构成买卖建议。房地产市场受政策、利率、宏观经济影响波动较大，请结合自身财务状况独立决策。数据截至 2026-07-31。
</div>

</div>
</body>
</html>`;
}

let ok = 0, fail = 0;
for (const c of CONTENTS) {
  const dataFile = path.join(dataDir, `${c.slug}.json`);
  if (!fs.existsSync(dataFile)) { console.error(`MISSING data ${c.slug}`); fail++; continue; }
  const d = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  const html = render(c, d);
  const dir = path.join(outBase, c.slug);
  fs.mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, `${c.slug}-analysis.html`);
  fs.writeFileSync(outFile, html, 'utf-8');
  console.log(`OK ${c.slug}: ${outFile} (${html.length} bytes)`);
  ok++;
}
console.log(`\n完成 ${ok}/${CONTENTS.length}, 失败 ${fail}`);
