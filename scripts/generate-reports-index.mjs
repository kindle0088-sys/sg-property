#!/usr/bin/env node
/**
 * generate-reports-index.mjs
 * 生成 reports/index.html（网格卡片 + 搜索/筛选/排序）。
 *
 * 数据来源：REPORTS 数组（下方）。新增研报时在此加一行即可，然后重跑：
 *   node scripts/generate-reports-index.mjs
 * 字段：name(短名) title(原标题) href(相对路径) icon(2字母) date(YYYY-MM-DD)
 *       type(condo|ec|hdb) district(Dxx) score(0-10) color(图标底色)
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'reports', 'index.html');

// 种子数据：从旧 index.html 解析（仅首次迁移用）
const LEGACY = join(__dirname, '..', 'reports', 'index.html');

function parseLegacy(html) {
  const cardRe = /<a class="card" href="([^"]+)">\s*<div class="card-left"><div class="card-icon"[^>]*>([^<]+)<\/div><div class="card-info"><h3>(.*?)<\/h3><span class="date">([^<]+)<\/span><\/div><\/div><span class="card-arrow">→<\/span>\s*<\/a>/gs;
  const out = [];
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    const [_, href, icon, titleHtml, date] = m;
    const badgeM = titleHtml.match(/<span class="badge badge-(\w+)">([^<]+)<\/span>/);
    const type = badgeM ? badgeM[1] : 'unknown';
    const title = titleHtml.replace(/<span[^>]*>.*?<\/span>/gs, '').replace(/\s+/g, ' ').trim();
    const nameM = title.match(/^(.*?)\s*[—–-]\s/);
    const name = nameM ? nameM[1].trim() : title;
    const distM = title.match(/D(\d{1,2})/);
    const district = distM ? 'D' + parseInt(distM[1], 10) : null;
    const scoreM = title.match(/七维评分\s*([\d.]+)/);
    const score = scoreM ? parseFloat(scoreM[1]) : null;
    const innerM = m[0].match(/<div class="card-icon" style="background:([^;]+);"/);
    out.push({ name, title, href, icon, date: date.trim(), type, district, score, color: innerM ? innerM[1] : '#3b82f6' });
  }
  return out;
}

// 首次迁移：若目标文件仍是旧格式，则解析旧文件取数据；否则读取内嵌 REPORTS
let REPORTS;
const existing = readFileSync(OUT, 'utf8');
const dataM = existing.match(/const REPORTS = (\[[\s\S]*?\]);\n/);
if (dataM) {
  REPORTS = JSON.parse(dataM[1].replace(/,\s*([}\]])/g, '$1'));
  console.log('read', REPORTS.length, 'from embedded data');
} else {
  REPORTS = parseLegacy(existing);
  console.log('parsed', REPORTS.length, 'from legacy layout');
}

// 手动补区域（原标题缺失）
const districtFix = { 'Clementi Crest 金文泰景': 'D5', 'Bidadari Estate': 'D22' };
for (const r of REPORTS) if (districtFix[r.name]) r.district = districtFix[r.name];

// 从研报 HTML 同步综合分（覆盖硬编码旧值，保证主页与最新研报一致）
const { existsSync } = await import('fs');
function extractScore(txt) {
  // 优先"综合评分：X.XX / 10"（score-card / dim 模板）
  let m = txt.match(/综合评分[：:]\s*([\d.]+)\s*\/\s*10/);
  if (m) return +m[1];
  // val 标签（KPI 区）
  m = txt.match(/<div class="val">([\d.]+)<\/div><div class="lbl">七维综合评分/);
  if (m) return +m[1];
  // hero score
  m = txt.match(/<span class="score">([\d.]+)<\/span>/);
  if (m) return +m[1];
  // value num-gold（One Canberra 表格式模板）
  m = txt.match(/<div class="value num-gold">([\d.]+)</);
  if (m) return +m[1];
  // score-ring
  m = txt.match(/score-ring[^>]*>\s*([\d.]+)/);
  if (m) return +m[1];
  // 兜底：裸综合评分
  m = txt.match(/综合评分[：:]\s*([\d.]+)/);
  if (m) return +m[1];
  return null;
}
const reportDir = join(__dirname, '..', 'reports');
let synced = 0, missingScore = [];
for (const r of REPORTS) {
  const p = join(reportDir, r.href);
  if (!existsSync(p)) { missingScore.push(`${r.name}(no-file)`); continue; }
  const s = extractScore(readFileSync(p, 'utf8'));
  if (s == null) { missingScore.push(r.name); continue; }
  if (Math.abs(s - (r.score ?? -1)) > 0.001) {
    r.score = s;
    r.title = r.title.replace(/[（(]七维评分\s*[\d.]+\s*[)）]/, `（七维评分 ${s.toFixed(2)}）`);
    synced++;
  }
}
if (synced) console.log(`synced ${synced} scores from report HTML`);
if (missingScore.length) console.log('no-score (kept legacy):', missingScore.join(', '));

// 排序稳定化：按 type 分组顺序 + 原序（先记录原索引——sort 比较器里
// 调 indexOf 会随数组重排而漂移，导致同类型报告相对顺序被打乱）
const typeOrder = { condo: 0, ec: 1, hdb: 2 };
REPORTS.forEach((r, i) => { r._origIdx = i; });
REPORTS.sort((a, b) => typeOrder[a.type] - typeOrder[b.type] || a._origIdx - b._origIdx);
for (const r of REPORTS) delete r._origIdx;

const avg = (REPORTS.reduce((s, r) => s + (r.score ?? 0), 0) / REPORTS.length).toFixed(2);
const count = { condo: 0, ec: 0, hdb: 0 };
for (const r of REPORTS) count[r.type]++;

const TYPE_LABEL = { condo: '私人公寓', ec: 'EC', hdb: 'HDB' };
const TYPE_CLASS = { condo: 'badge-condo', ec: 'badge-ec', hdb: 'badge-hdb' };

const districts = [...new Set(REPORTS.map(r => r.district).filter(Boolean))]
  .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

const dataJson = JSON.stringify(REPORTS).replace(/</g, '\\u003c');

const css = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;background:#0b1120;color:#e2e8f0;line-height:1.6}
.container{max-width:1180px;margin:0 auto;padding:40px 24px 80px}
a{text-decoration:none;color:#60a5fa}
header{display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid #1e293b;margin-bottom:28px}
.logo{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.5px}
.logo span{color:#fbbf24}
nav a{font-size:13px;color:#94a3b8;margin-left:20px;padding:4px 0;border-bottom:2px solid transparent;transition:all .15s}
nav a:hover{color:#fbbf24;border-bottom-color:#fbbf24}
h1{font-size:27px;font-weight:700;color:#fff;margin-bottom:6px}
.sub{color:#94a3b8;font-size:14px;margin-bottom:8px}
.stats{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0 22px}
.stat{background:#1e293b;border:1px solid #26334a;border-radius:8px;padding:8px 14px;font-size:13px;color:#cbd5e1}
.stat b{color:#fbbf24;font-size:15px;margin-right:4px}
.toolbar{position:sticky;top:0;z-index:20;background:rgba(11,17,32,.94);backdrop-filter:blur(8px);padding:12px 0;margin-bottom:22px;border-bottom:1px solid #1e293b}
.toolbar-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.search{flex:1;min-width:200px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:9px 14px;color:#f1f5f9;font-size:14px;outline:none}
.search::placeholder{color:#64748b}
.search:focus{border-color:#fbbf24}
select{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:9px 12px;color:#e2e8f0;font-size:13px;outline:none;cursor:pointer}
select:focus{border-color:#fbbf24}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.chip{background:#1e293b;border:1px solid #334155;border-radius:999px;padding:5px 14px;font-size:12.5px;color:#cbd5e1;cursor:pointer;transition:all .15s;user-select:none}
.chip:hover{border-color:#fbbf24;color:#fbbf24}
.chip.active{background:rgba(251,191,36,.14);border-color:#fbbf24;color:#fbbf24;font-weight:600}
.chip .n{opacity:.6;font-size:11px;margin-left:3px}
.result-count{font-size:12.5px;color:#64748b;margin-bottom:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.card{display:flex;flex-direction:column;background:#1e293b;border:1px solid #26334a;border-radius:12px;padding:16px 16px 13px;transition:all .16s;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;inset:0 0 auto 0;height:3px}
.card.type-condo::before{background:linear-gradient(90deg,#3b82f6,#60a5fa)}
.card.type-ec::before{background:linear-gradient(90deg,#f59e0b,#fbbf24)}
.card.type-hdb::before{background:linear-gradient(90deg,#22c55e,#4ade80)}
.card.type-condo{background:linear-gradient(145deg,rgba(59,130,246,.10),rgba(30,41,59,.6) 55%)}
.card.type-ec{background:linear-gradient(145deg,rgba(245,158,11,.10),rgba(30,41,59,.6) 55%)}
.card.type-hdb{background:linear-gradient(145deg,rgba(34,197,94,.10),rgba(30,41,59,.6) 55%)}
.card.type-condo:hover{background:linear-gradient(145deg,rgba(59,130,246,.20),rgba(38,51,70,.9) 55%);border-color:#3b82f6}
.card.type-ec:hover{background:linear-gradient(145deg,rgba(245,158,11,.20),rgba(38,51,70,.9) 55%);border-color:#f59e0b}
.card.type-hdb:hover{background:linear-gradient(145deg,rgba(34,197,94,.20),rgba(38,51,70,.9) 55%);border-color:#22c55e}
.card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.35)}
.card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
.card-top h3{font-size:16.5px;font-weight:800;color:#fff;line-height:1.35;flex:1}
.score{font-size:16px;font-weight:800;padding:3px 10px;border-radius:8px;line-height:1.4;flex-shrink:0}
.score.s-gold{background:rgba(251,191,36,.15);color:#fbbf24;border:1px solid rgba(251,191,36,.4)}
.score.s-blue{background:rgba(96,165,250,.14);color:#60a5fa;border:1px solid rgba(96,165,250,.38)}
.score.s-slate{background:rgba(148,163,184,.13);color:#94a3b8;border:1px solid rgba(148,163,184,.35)}
.badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.badge{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:5px;letter-spacing:.3px}
.badge-ec{background:rgba(245,158,11,.14);color:#fbbf24;border:1px solid rgba(245,158,11,.38)}
.badge-condo{background:rgba(59,130,246,.14);color:#60a5fa;border:1px solid rgba(59,130,246,.38)}
.badge-hdb{background:rgba(34,197,94,.14);color:#22c55e;border:1px solid rgba(34,197,94,.38)}
.badge-dist{background:rgba(148,163,184,.1);color:#94a3b8;border:1px solid rgba(148,163,184,.3)}
.card .desc{font-size:12px;color:#94a3b8;flex:1;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px}
.card .date{font-size:11px;color:#64748b;border-top:1px dashed #334155;padding-top:9px}
.empty{text-align:center;color:#64748b;padding:48px 0;font-size:14px}
footer{text-align:center;color:#475569;font-size:12px;padding:32px 0 0;border-top:1px solid #1e293b;margin-top:44px}
@media (max-width:640px){.grid{grid-template-columns:1fr}.toolbar{position:static}}
`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Property Reports — SG Property Dashboard</title>
<style>${css}</style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">SG <span>Property</span> Reports</div>
    <nav>
      <a href="https://kindle0088-sys.github.io/sg-property/">Dashboard</a>
      <a href="https://kindle0088-sys.github.io/sg-property/#/map">Map</a>
    </nav>
  </header>

  <h1>Singapore Property Analysis Reports</h1>
  <div class="sub">基于七维投资框架的深度研究报告</div>

  <div class="stats">
    <div class="stat"><b>${REPORTS.length}</b>份研报</div>
    <div class="stat"><b>${count.condo}</b>私人公寓</div>
    <div class="stat"><b>${count.ec}</b>EC</div>
    <div class="stat"><b>${count.hdb}</b>HDB</div>
    <div class="stat"><b>${districts.length}</b>个区域</div>
    <div class="stat">平均评分 <b>${avg}</b></div>
  </div>

  <div class="toolbar">
    <div class="toolbar-row">
      <input class="search" id="search" type="text" placeholder="🔍 搜索项目名 / 区域 (D19) / 关键词…" autocomplete="off">
      <select id="district">
        <option value="all">全部区域</option>
        ${districts.map(d => `<option value="${d}">${d}</option>`).join('')}
      </select>
      <select id="sort">
        <option value="default">默认排序</option>
        <option value="score">评分从高到低</option>
        <option value="score-asc">评分从低到高</option>
        <option value="date">日期从新到旧</option>
      </select>
    </div>
    <div class="chips" id="chips">
      <div class="chip active" data-type="all">全部 <span class="n">${REPORTS.length}</span></div>
      <div class="chip" data-type="condo">🏠 私人公寓 <span class="n">${count.condo}</span></div>
      <div class="chip" data-type="ec">🏘️ EC <span class="n">${count.ec}</span></div>
      <div class="chip" data-type="hdb">🏗️ HDB <span class="n">${count.hdb}</span></div>
    </div>
  </div>

  <div class="result-count" id="resultCount"></div>
  <div class="grid" id="grid"></div>

  <footer>
    <a href="https://kindle0088-sys.github.io/sg-property/">← Back to Dashboard</a> · Property Reports · Updated ${new Date().toISOString().slice(0, 10)}
  </footer>
</div>

<script>
const REPORTS = ${dataJson};

const TYPE_LABEL = ${JSON.stringify(TYPE_LABEL)};
const TYPE_CLASS = ${JSON.stringify(TYPE_CLASS)};
const state = { q: '', type: 'all', district: 'all', sort: 'default' };

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function scoreClass(s) {
  if (s == null) return '';
  if (s >= 7.5) return 's-gold';
  if (s >= 6.8) return 's-blue';
  return 's-slate';
}

function render() {
  const q = state.q.trim().toLowerCase();
  let list = REPORTS.filter(r => {
    if (state.type !== 'all' && r.type !== state.type) return false;
    if (state.district !== 'all' && r.district !== state.district) return false;
    if (q) {
      const hay = (r.name + ' ' + r.title + ' ' + (r.district || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (state.sort === 'score') list = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  else if (state.sort === 'score-asc') list = [...list].sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  else if (state.sort === 'date') list = [...list].sort((a, b) => b.date.localeCompare(a.date));

  $('resultCount').textContent = \`\${list.length} / \${REPORTS.length} 份\`;

  if (!list.length) {
    $('grid').innerHTML = '<div class="empty">没有匹配的研报，换个关键词试试 🔍</div>';
    return;
  }
  $('grid').innerHTML = list.map(r => {
    const desc = r.title.replace(/^.*?\\s*[—–-]\\s/, '').replace(/（七维评分\\s*[\\d.]+）$/, '').trim();
    return \`<a class="card type-\${r.type}" href="\${esc(r.href)}">
      <div class="card-top">
        <h3>\${esc(r.name)}</h3>
        \${r.score != null ? \`<span class="score \${scoreClass(r.score)}">\${r.score.toFixed(2)}</span>\` : ''}
      </div>
      <div class="badges">
        <span class="badge \${TYPE_CLASS[r.type]}">\${TYPE_LABEL[r.type]}</span>
        \${r.district ? \`<span class="badge badge-dist">\${esc(r.district)}</span>\` : ''}
      </div>
      <div class="desc">\${esc(desc)}</div>
      <div class="date">📅 \${esc(r.date)}</div>
    </a>\`;
  }).join('');
}

$('search').addEventListener('input', e => { state.q = e.target.value; render(); });
$('district').addEventListener('change', e => { state.district = e.target.value; render(); });
$('sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
document.querySelectorAll('#chips .chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('#chips .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    state.type = c.dataset.type;
    render();
  });
});
render();
</script>
</body>
</html>
`;

writeFileSync(OUT, html, 'utf8');
console.log('written', OUT, '-', REPORTS.length, 'reports');
