/* PlasticPlan Dashboard — Chart.js v4 configs.
   All colors/sizes are read from tokens.css; nothing visual is hardcoded here.
   Data is lifted from the Figma design (specs/figma-content-spec.md §A). */

const css = getComputedStyle(document.documentElement);
const t = (name) => css.getPropertyValue(name).trim();
const px = (name) => parseFloat(t(name));
const MUTED = Math.round(parseFloat(t('--grade-muted')) * 255)
  .toString(16).padStart(2, '0');            /* hex alpha for de-emphasised rows */
const BAND = 0.467;                           /* band width as a share of the category slot (measured: 60/128.6) */
const BAR_OF_BAND = 1 / 3;                    /* filled bar = one third of the band (measured: 21/60) */

Chart.defaults.font.family = t('--font-sans');
Chart.defaults.font.size = px('--chart-font-size');
Chart.defaults.color = t('--text-axis');
Chart.defaults.animation = false;   /* static dashboard: draw once, no entry animation */

/* ---------------------------------------------------------------- data --- */
const DATA = {
  plastic: {
    years: ['2019', '2020', '2021', '2022'],
    totals: ['74%', '77%', '81%', '83%'],
    /* bottom → top of the stack */
    series: [
      { label: 'Compostable', values: [34.9, 36.4, 36.4, 34.1], color: '--series-green-3', forecast: '--series-green-3-lt' },
      { label: 'Recyclable',  values: [22.6, 23.4, 26.8, 27.6], color: '--series-green-2', forecast: '--series-green-2-lt' },
      { label: 'Reusable',    values: [16.1, 16.9, 17.6, 21.1], color: '--series-green-1', forecast: '--series-green-1-lt' }
    ],
    forecastIndex: 3   /* 2022 is a forecast — lighter tints */
  },
  packaging: {
    years: ['2019', '2020', '2021', '2022'],
    totals: ['69%', '71%', '72%', '77%'],
    series: [
      { label: 'Metal',     values: [9.6, 10.0, 10.1, 10.9], color: '--series-blue-5' },
      { label: 'Aluminium', values: [19.3, 19.9, 20.3, 21.8], color: '--series-blue-4' },
      { label: 'Glass',     values: [12.9, 13.3, 13.5, 14.5], color: '--series-blue-3' },
      { label: 'Paper',     values: [11.8, 12.2, 12.4, 16.1], color: '--series-blue-2' },
      { label: 'Plastic',   values: [15.0, 15.5, 15.8, 14.2], color: '--series-blue-1' }
    ],
    forecastIndex: -1
  },
  recyclability: {
    rows: ['UK', 'ES', 'IT', 'DE'],
    grades: [
      { label: 'A', color: '--grade-a', values: [5.3, 3.0, 5.0, 6.3] },
      { label: 'B', color: '--grade-b', values: [11.0, 8.3, 10.0, 13.0] },
      { label: 'C', color: '--grade-c', values: [12.9, 11.0, 14.0, 13.0] },
      { label: 'D', color: '--grade-d', values: [39.9, 38.1, 42.1, 44.0] },
      { label: 'E', color: '--grade-e', values: [19.8, 25.1, 19.2, 12.7] },
      { label: 'F', color: '--grade-f', values: [11.0, 14.5, 9.7, 11.0] }
    ]
  },
  lca: {
    rows: ['Raw materials', 'Production', 'Logistics', 'Usage', 'End of life'],
    values: [29, 2.7, 6, 75.5, 3.5],
    labels: ['29%', '2.7%', '6%', '75.5%', '3.5%'],
    colors: ['--grade-d', '--grade-c', '--grade-c', '--grade-f', '--grade-c']
  }
};

/* ------------------------------------------------------------- helpers --- */
function renderLegend(id, items) {
  document.getElementById(id).innerHTML = items
    .map((i) => `<li><span class="dot" style="background:${t(i.color)}"></span>${i.label}</li>`)
    .join('');
}

/* Vertical band behind each column group + the total label on top of it. */
const bandPlugin = {
  id: 'band',
  beforeDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea: area, scales } = chart;
    const slot = area.width / chart.data.labels.length;
    ctx.save();
    ctx.fillStyle = t('--chart-band');
    chart.data.labels.forEach((_, i) => {
      const x = scales.x.getPixelForValue(i);
      ctx.fillRect(x - (slot * BAND) / 2, area.top, slot * BAND, area.bottom - area.top);
    });
    ctx.restore();
    void opts;
  },
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea: area, scales } = chart;
    ctx.save();
    /* dashed "Target 2025" rule across the top of the plot (100%) */
    ctx.strokeStyle = t('--target-line');
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(area.left, area.top);
    ctx.lineTo(area.right, area.top);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = t('--text-body');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `${Chart.defaults.font.size}px ${Chart.defaults.font.family}`;
    ctx.fillText('Target', area.right + px('--space-8'), area.top);
    ctx.fillText('2025', area.right + px('--space-8'), area.top + px('--space-16'));
    /* total label centred at the top of each band */
    ctx.textAlign = 'center';
    ctx.fillStyle = t('--text-body');
    opts.totals.forEach((label, i) => {
      ctx.fillText(label, scales.x.getPixelForValue(i), area.top + px('--space-12'));
    });
    ctx.restore();
  }
};

/* Value label at the end of each horizontal bar; inside + white when the bar
   nearly fills the axis (the "Usage" row in the design). */
const barValuePlugin = {
  id: 'barValue',
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx, scales } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.textBaseline = 'middle';
    ctx.font = `${Chart.defaults.font.size}px ${Chart.defaults.font.family}`;
    meta.data.forEach((bar, i) => {
      const inside = chart.data.datasets[0].data[i] >= scales.x.max * 0.9;
      ctx.fillStyle = inside ? t('--text-on-bar') : t('--text-body');
      ctx.textAlign = inside ? 'right' : 'left';
      const dx = inside ? -px('--space-8') : px('--space-8');
      ctx.fillText(opts.labels[i], bar.x + dx, bar.y);
    });
    ctx.restore();
  }
};

/* Pins an external legend to the plot's left edge, so it lines up with the
   axis origin rather than the card padding. */
const legendAlignPlugin = {
  id: 'legendAlign',
  afterLayout(chart, _args, opts) {
    const el = document.getElementById(opts.id);
    if (el) el.style.paddingInlineStart = `${chart.chartArea.left}px`;
  }
};

/* Chart.js resolves barThickness per dataset, never per index, so the emphasised
   first row cannot be expressed in the config. Set the drawn thickness on the bar
   elements instead; `y` is the bar's centre, so they stay centred on their tick. */
const rowThicknessPlugin = {
  id: 'rowThickness',
  afterDatasetsUpdate(chart, _args, opts) {
    chart.data.datasets.forEach((_, di) => {
      chart.getDatasetMeta(di).data.forEach((bar, i) => {
        bar.height = i === 0 ? opts.lead : opts.rest;
      });
    });
  }
};

/* --------------------------------------------------- stacked column charts */
function columnChart(canvasId, legendId, cfg) {
  const datasets = cfg.series.map((s) => ({
    label: s.label,
    data: s.values,
    categoryPercentage: BAND,
    barPercentage: BAR_OF_BAND,
    backgroundColor: (c) =>
      c.dataIndex === cfg.forecastIndex && s.forecast ? t(s.forecast) : t(s.color)
  }));
  datasets.push({
    label: 'Others',
    categoryPercentage: BAND,
    barPercentage: BAR_OF_BAND,
    data: cfg.years.map((_, i) => 100 - cfg.series.reduce((sum, s) => sum + s.values[i], 0)),
    backgroundColor: t('--chart-track')
  });

  new Chart(document.getElementById(canvasId), {
    type: 'bar',
    data: { labels: cfg.years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { right: px('--space-48') } },
      plugins: {
        legend: { display: false },
        band: { totals: cfg.totals },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw.toFixed(1)}%` } }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, border: { display: false } },
        y: {
          stacked: true, min: 0, max: 100,
          grid: { color: t('--border-grid'), drawTicks: false },
          border: { display: false },
          ticks: { stepSize: 25, padding: px('--space-8'), callback: (v) => `${v}%` }
        }
      }
    },
    plugins: [bandPlugin]
  });

  renderLegend(legendId, [
    ...cfg.series.map((s) => ({ label: s.label, color: s.color })).reverse(),
    { label: 'Others', color: '--chart-track' }
  ]);
}

columnChart('chart-plastic', 'legend-plastic', DATA.plastic);
columnChart('chart-packaging', 'legend-packaging', DATA.packaging);

/* ------------------------------------------- Recyclability (A–F, stacked) */
new Chart(document.getElementById('chart-recyclability'), {
  type: 'bar',
  data: {
    labels: DATA.recyclability.rows,
    datasets: DATA.recyclability.grades.map((g) => ({
      label: g.label,
      data: g.values,
      categoryPercentage: 0.8,
      barPercentage: 0.8,
      backgroundColor: (c) => (c.dataIndex === 0 ? t(g.color) : t(g.color) + MUTED)
    }))
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}` } }
    },
    scales: {
      x: {
        stacked: true, min: 0, max: 100,
        grid: { color: t('--border-grid') },
        border: { display: false },
        ticks: { stepSize: 20, padding: px('--space-8') }
      },
      y: {
        stacked: true,
        grid: { display: false },
        border: { display: false },
        ticks: {
          padding: px('--space-8'),
          color: (c) => (c.index === 0 ? t('--text-primary') : t('--text-axis')),
          font: (c) => ({ weight: c.index === 0 ? 700 : 400 })
        }
      }
    },
    plugins: {
      legend: { display: false },
      legendAlign: { id: 'legend-recyclability' },
      rowThickness: { lead: px('--row-bar-h-lead'), rest: px('--row-bar-h') },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.raw}` } }
    }
  },
  plugins: [legendAlignPlugin, rowThicknessPlugin]
});

renderLegend('legend-recyclability', DATA.recyclability.grades.map((g) => ({ label: g.label, color: g.color })));

/* ------------------------------------------------- Lifecycle assessment --- */
new Chart(document.getElementById('chart-lca'), {
  type: 'bar',
  data: {
    labels: DATA.lca.rows,
    datasets: [{
      label: 'Share',
      data: DATA.lca.values,
      categoryPercentage: 0.78,
      barPercentage: 0.74,
      backgroundColor: DATA.lca.colors.map(t)
    }]
  },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: px('--space-40') } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      barValue: { labels: DATA.lca.labels }
    },
    scales: {
      x: {
        min: 0, max: 80,
        grid: { color: t('--border-grid') },
        border: { display: false },
        ticks: { stepSize: 10, padding: px('--space-8'), callback: (v) => `${v}%` }
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: { padding: px('--space-8') }
      }
    }
  },
  plugins: [barValuePlugin]
});

/* ------------------------------------------------------ sidebar collapse --- */
document.getElementById('collapse').addEventListener('click', (e) => {
  const collapsed = document.body.classList.toggle('is-collapsed');
  e.currentTarget.setAttribute('aria-expanded', String(!collapsed));
  /* Collapse-Outline while the rail is open, hamburger once it is shut. */
  e.currentTarget.querySelector('use').setAttribute('href', collapsed ? '#i-menu' : '#i-collapse');
  document.getElementById('collapse-label').textContent =
    collapsed ? 'Expand navigation' : 'Collapse navigation';
});
