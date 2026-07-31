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
