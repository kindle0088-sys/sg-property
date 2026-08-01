/* === Chart rendering (Chart.js global from CDN) === */

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      labels: { color: '#94a3b8', font: { size: 11 } }
    }
  },
  scales: {
    x: {
      ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 20 },
      grid: { color: 'rgba(42,58,84,0.5)' }
    },
    y: {
      beginAtZero: false,
      position: 'left',
      ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => '$' + v },
      grid: { color: 'rgba(42,58,84,0.3)' }
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      ticks: { color: '#60a5fa', font: { size: 10 } },
      grid: { display: false }
    }
  }
};

export function renderPriceChart(transactions) {
  const canvas = document.getElementById('priceChart');
  if (!canvas) return;

  // Group by month — use sortDate (yyyy-mm) for proper ordering
  const byMonth = {};
  transactions.forEach(t => {
    const m = (t.sortDate || '').substring(0, 7);
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = { prices: [], psfs: [], count: 0 };
    byMonth[m].prices.push(t.price);
    byMonth[m].psfs.push(t.pricePsf);
    byMonth[m].count++;
  });

  const labels = Object.keys(byMonth).sort();
  const avgPsf = labels.map(m => {
    const d = byMonth[m];
    return Math.round(d.psfs.reduce((a, b) => a + b, 0) / d.psfs.length);
  });
  const volumes = labels.map(m => byMonth[m].count);

  if (window._priceChart) window._priceChart.destroy();
  window._priceChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg PSF',
          data: avgPsf,
          type: 'line',
          borderColor: '#fbbf24',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#fbbf24',
          tension: 0.3,
          yAxisID: 'y'
        },
        {
          label: 'Transactions',
          data: volumes,
          backgroundColor: 'rgba(96,165,250,0.3)',
          borderColor: 'rgba(96,165,250,0.5)',
          borderWidth: 1,
          borderRadius: 2,
          yAxisID: 'y1'
        }
      ]
    },
    options: chartOptions
  });
}

export function renderHdbChart(transactions) {
  // Group by month — use sortDate (yyyy-mm) for proper ordering
  const byMonth = {};
  transactions.forEach(t => {
    const m = t.sortDate || '';
    if (!m) return;
    if (!byMonth[m]) byMonth[m] = { prices: [], psfs: [], count: 0 };
    byMonth[m].prices.push(t.resalePrice);
    byMonth[m].psfs.push(t.pricePsf);
    byMonth[m].count++;
  });

  const labels = Object.keys(byMonth).sort();
  const avgPsfData = labels.map(m => {
    const arr = byMonth[m].psfs.filter(Boolean);
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  });
  const countData = labels.map(m => byMonth[m].count);

  try {
    const ctx = document.getElementById('priceChart')?.getContext('2d');
    if (!ctx) return;
    if (window._priceChart) window._priceChart.destroy();
    window._priceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'HDB Resale Price (bar)', data: countData, backgroundColor: 'rgba(34,197,94,0.3)', order: 2, yAxisID: 'y1' },
          { label: 'Avg PSF', data: avgPsfData, borderColor: '#fbbf24', backgroundColor: '#fbbf24', type: 'line', order: 1, yAxisID: 'y', tension: 0.3, pointRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#64748b', maxRotation: 45, maxTicksLimit: 20 } },
          y: { position: 'left', ticks: { color: '#64748b', callback: v => '$' + v } },
          y1: { position: 'right', grid: { display: false }, ticks: { color: '#64748b' } }
        }
      }
    });
  } catch(e) { /* chart fail silently */ }
}

// ── 全岛剩余租约折价曲线（Bala's Curve 近似） ──
export function renderLeaseCurveChart(curve) {
  const canvas = document.getElementById('leaseCurveChart');
  if (!canvas || !curve?.buckets) return;
  const buckets = curve.buckets.filter(b => b.medianPsf != null);
  if (!buckets.length) return;
  if (window._leaseChart) window._leaseChart.destroy();
  window._leaseChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: buckets.map(b => b.label),
      datasets: [{
        label: 'Median PSF',
        data: buckets.map(b => b.medianPsf),
        borderColor: '#fbbf24',
        backgroundColor: 'rgba(251,191,36,0.18)',
        pointBackgroundColor: '#fbbf24',
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        borderWidth: 3,
        pointRadius: 7,
        pointHoverRadius: 9,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: item => `Median PSF: $${item.parsed.y}`,
            afterBody: items => {
              const b = buckets[items[0].dataIndex];
              return `${b.count.toLocaleString()} 笔交易\n相对 90+ 年: ${b.relative != null ? b.relative + '%' : '-'}`;
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: 'rgba(42,58,84,0.5)' } },
        y: { ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => '$' + v }, grid: { color: 'rgba(42,58,84,0.3)' } }
      }
    }
  });
}

// ── 楼栋剩余租约 vs PSF 散点 ──
export function renderLeaseScatter(transactions) {
  const canvas = document.getElementById('leaseScatter');
  if (!canvas) return;
  const pts = (transactions || [])
    .filter(t => t.remainingLease != null && t.pricePsf)
    .map(t => ({ x: Number(t.remainingLease), y: Number(t.pricePsf) }));
  if (pts.length < 2) {
    canvas.parentElement.innerHTML = '<div class="text-muted" style="padding:10px;font-size:13px">租约数据不足，无法绘制散点（该楼栋近期交易缺少剩余租约字段）</div>';
    return;
  }
  if (window._leaseScatter) window._leaseScatter.destroy();
  window._leaseScatter = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Remaining lease vs PSF',
        data: pts,
        backgroundColor: 'rgba(245,158,11,0.65)',
        borderColor: 'rgba(245,158,11,1)',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: '剩余租约 (年)', color: '#94a3b8', font: { size: 11 } }, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(42,58,84,0.5)' } },
        y: { title: { display: true, text: 'PSF ($)', color: '#94a3b8', font: { size: 11 } }, ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => '$' + v }, grid: { color: 'rgba(42,58,84,0.3)' } }
      }
    }
  });
}

// ── A/B 对比：两条年均 PSF 走势叠加 ──
export function renderCompareChart(sA, sB, nameA, nameB) {
  const canvas = document.getElementById('compareChart');
  if (!canvas) return;
  if (window._compareChart) window._compareChart.destroy();
  const labels = [...new Set([...sA.map(s => s.year), ...sB.map(s => s.year)])].sort();
  const trunc = n => (n || '').length > 22 ? n.slice(0, 22) + '…' : n;
  const mk = (s, color, name) => ({
    label: trunc(name),
    data: labels.map(y => s.find(x => x.year === y)?.psf ?? null),
    borderColor: color, backgroundColor: 'transparent', borderWidth: 2.5,
    pointRadius: 3.5, pointBackgroundColor: color, tension: 0.3, spanGaps: true
  });
  try {
    window._compareChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { ...mk(sA, '#fbbf24', nameA), yAxisID: 'y', order: 1 },
          { ...mk(sB, '#60a5fa', nameB), yAxisID: 'y1', order: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8', font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y}`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(42,58,84,0.5)' } },
          y: { beginAtZero: false, position: 'left', ticks: { color: '#fbbf24', font: { size: 10 }, callback: v => '$' + v }, grid: { color: 'rgba(42,58,84,0.3)' }, title: { display: true, text: 'A (左轴)', color: '#fbbf24', font: { size: 10 } } },
          y1: { beginAtZero: false, position: 'right', ticks: { color: '#60a5fa', font: { size: 10 }, callback: v => '$' + v }, grid: { display: false }, title: { display: true, text: 'B (右轴)', color: '#60a5fa', font: { size: 10 } } }
        }
      }
    });
  } catch(e) { /* chart fail silently */ }
}
