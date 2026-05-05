import { NextResponse } from 'next/server'
import { getDataset, loadDatasets } from '@/lib/datasets'
import {
  calculateMean,
  calculateStdDev,
  calculatePercentile,
  detectOutliersIQR,
  linearRegression,
} from '@/lib/statistics'

function getCol(data, col) {
  return data.map(r => r[col]).filter(v => typeof v === 'number' && !isNaN(v))
}

function pearsonForMetricPair(data, a, b) {
  const pairs = data
    .map(r => [r[a], r[b]])
    .filter(([x, y]) => typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y))
  if (pairs.length < 2) return 0
  const xs = pairs.map(p => p[0])
  const ys = pairs.map(p => p[1])
  const mx = calculateMean(xs)
  const my = calculateMean(ys)
  let num = 0
  let dx2 = 0
  let dy2 = 0
  for (let i = 0; i < pairs.length; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    num += dx * dy
    dx2 += dx * dx
    dy2 += dy * dy
  }
  const den = Math.sqrt(dx2 * dy2)
  if (!den) return 0
  const r = num / den
  return Number.isFinite(r) ? Math.max(-1, Math.min(1, r)) : 0
}

function correlationStats(data, kind) {
  const k = String(kind ?? 'batting').toLowerCase()
  const metrics = k === 'bowling' ? ['Wickets', 'Economy_Rate', 'Bowling_Avg', 'Bowling_SR'] : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored']
  const rows = metrics
    .filter(m => getCol(data, m).length >= 2)
    .map(metric => ({
      metric,
      values: metrics
        .filter(n => getCol(data, n).length >= 2)
        .map(other => (metric === other ? 1 : pearsonForMetricPair(data, metric, other))),
    }))
  return {
    metrics: rows.map(r => r.metric),
    rows,
  }
}

function descriptiveStats(data) {
  const metrics = ['Batting_Avg', 'Strike_Rate', 'Runs_Scored', 'Wickets', 'Economy_Rate', 'Bowling_Avg', 'Bowling_SR', 'Runs_Conceded']
  const result = {}
  for (const m of metrics) {
    const col = getCol(data, m)
    if (!col.length) continue
    const sorted = [...col].sort((a, b) => a - b)
    const mean = calculateMean(col)
    const std = calculateStdDev(col)
    const n = col.length
    const skewness = std
      ? col.reduce((s, v) => s + Math.pow((v - mean) / std, 3), 0) / n
      : 0
    const kurtosis = std
      ? col.reduce((s, v) => s + Math.pow((v - mean) / std, 4), 0) / n - 3
      : 0
    result[m] = {
      mean,
      median: calculatePercentile(sorted, 50),
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      q1: calculatePercentile(sorted, 25),
      q3: calculatePercentile(sorted, 75),
      skewness: isFinite(skewness) ? skewness : 0,
      kurtosis: isFinite(kurtosis) ? kurtosis : 0,
    }
  }
  return result
}

function regressionStats(data, kind) {
  const k = String(kind ?? 'batting').toLowerCase()
  const pairs =
    k === 'bowling'
      ? data.filter(r => typeof r['Economy_Rate'] === 'number' && typeof r['Wickets'] === 'number')
      : data.filter(
          r =>
            typeof r['Strike_Rate'] === 'number' &&
            typeof r['Runs_Scored'] === 'number' &&
            !Number.isNaN(r['Strike_Rate']) &&
            !Number.isNaN(r['Runs_Scored'])
        )

  if (pairs.length < 2) {
    return {
      x_label: k === 'bowling' ? 'Economy_Rate' : 'Strike_Rate',
      y_label: k === 'bowling' ? 'Wickets' : 'Runs_Scored',
      slope: 0,
      intercept: 0,
      r2: 0,
      prediction: 0,
      sample_data: [],
      note: 'Not enough rows with both variables (e.g. Test batting CSV may omit strike rate).',
    }
  }

  const xCol = k === 'bowling' ? pairs.map(r => r['Economy_Rate']) : pairs.map(r => r['Strike_Rate'])
  const yCol = k === 'bowling' ? pairs.map(r => r['Wickets']) : pairs.map(r => r['Runs_Scored'])
  const { slope, intercept, r2 } = linearRegression(xCol, yCol)
  const defaultX = k === 'bowling' ? 7.5 : 150
  const prediction = slope * defaultX + intercept
  const sampleData = xCol.slice(0, 50).map((x, i) => ({
    x,
    y: yCol[i],
    predicted: slope * x + intercept,
  }))
  return {
    x_label: k === 'bowling' ? 'Economy_Rate' : 'Strike_Rate',
    y_label: k === 'bowling' ? 'Wickets' : 'Runs_Scored',
    slope,
    intercept,
    r2,
    prediction,
    sample_data: sampleData,
  }
}

function distributionStats(data, metric) {
  const col = getCol(data, metric)
  if (!col.length) {
    return {
      mean: null,
      std: null,
      shapiro_stat: null,
      shapiro_p: null,
      is_normal: null,
      histogram: { counts: [], bins: [] },
      pdf_curve: { x: [], y: [] },
      metric,
      empty: true,
    }
  }

  const mean = calculateMean(col)
  const std = calculateStdDev(col)
  const min = Math.min(...col)
  const max = Math.max(...col)

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return {
      mean,
      std,
      shapiro_stat: null,
      shapiro_p: null,
      is_normal: null,
      histogram: { counts: [], bins: [] },
      pdf_curve: { x: [], y: [] },
      metric,
      empty: true,
    }
  }

  if (min === max) {
    return {
      mean,
      std,
      shapiro_stat: null,
      shapiro_p: null,
      is_normal: null,
      histogram: { counts: [col.length], bins: [min, max] },
      pdf_curve: {
        x: Array.from({ length: 100 }, () => min),
        y: Array.from({ length: 100 }, () => (std > 0 ? col.length / 30 : 0)),
      },
      metric,
    }
  }

  const bins = 30
  const binWidth = (max - min) / bins
  if (!Number.isFinite(binWidth) || binWidth === 0) {
    return {
      mean,
      std,
      histogram: { counts: [col.length], bins: [min, max] },
      pdf_curve: { x: [], y: [] },
      metric,
      empty: true,
    }
  }

  const counts = Array(bins).fill(0)
  const binEdges = Array.from({ length: bins + 1 }, (_, i) => min + i * binWidth)
  col.forEach(v => {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1)
    if (idx >= 0 && idx < bins) counts[idx]++
  })
  const xPdf = Array.from({ length: 100 }, (_, i) => min + (i / 99) * (max - min))
  const yPdf = xPdf.map(x => {
    const norm =
      std > 0
        ? (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2))
        : 0
    return norm * col.length * binWidth
  })
  return {
    mean,
    std,
    shapiro_stat: null,
    shapiro_p: null,
    is_normal: null,
    histogram: { counts, bins: binEdges },
    pdf_curve: { x: xPdf, y: yPdf },
    metric,
  }
}

function confidenceIntervals(data, kind) {
  const k = String(kind ?? 'batting').toLowerCase()
  const metrics = k === 'bowling' ? ['Wickets', 'Economy_Rate', 'Bowling_Avg'] : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored']
  return metrics
    .map(m => {
      const col = getCol(data, m)
      const n = col.length
      if (!n) return null
      const mean = calculateMean(col)
      const std = calculateStdDev(col)
      const stdErr = std / Math.sqrt(n)
      const tCrit = 1.96
      const margin = tCrit * stdErr
      return { metric: m, mean, lower: mean - margin, upper: mean + margin, margin, sample_size: n }
    })
    .filter(Boolean)
}

function outliersStats(data, kind) {
  const k = String(kind ?? 'batting').toLowerCase()
  const metrics =
    k === 'bowling'
      ? ['Wickets', 'Economy_Rate', 'Bowling_Avg']
      : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored']
  return metrics
    .map(m => {
      const col = getCol(data, m)
      if (!col.length) return null
      const { lowerBound, upperBound, q1, q3 } = detectOutliersIQR(col)
      const count = col.filter(v => v < lowerBound || v > upperBound).length
      return { metric: m, count, lower_bound: lowerBound, upper_bound: upperBound, q1, q3 }
    })
    .filter(Boolean)
}

function playerComparison(data) {
  return [...data].slice(0, 5).map(r => ({
    Player: r['Player'],
    Batting_Avg: r['Batting_Avg'],
    Strike_Rate: r['Strike_Rate'],
    Runs_Scored: r['Runs_Scored'],
    Wickets: r['Wickets'],
    Economy_Rate: r['Economy_Rate'],
    Bowling_Avg: r['Bowling_Avg'],
  }))
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const kind = String(searchParams.get('kind') ?? 'batting').toLowerCase()
    const format = String(searchParams.get('format') ?? 't20').toLowerCase()
    const metric =
      String(searchParams.get('metric') ?? '').trim() ||
      (kind === 'bowling' ? 'Economy_Rate' : 'Batting_Avg')

    const ds = getDataset({ kind, format })
    if (!ds) return NextResponse.json({ error: 'No dataset found' }, { status: 404 })

    const raw = ds.data ?? []

    // Test batting CSV often has Ave/Runs but no SR column — require avg + runs only; regression uses SR only when present.
    const filtered =
      kind === 'bowling'
        ? raw.filter(
            r =>
              typeof r['Wickets'] === 'number' ||
              typeof r['Economy_Rate'] === 'number' ||
              typeof r['Bowling_Avg'] === 'number'
          )
        : raw.filter(
            r => typeof r['Batting_Avg'] === 'number' && typeof r['Runs_Scored'] === 'number' && !Number.isNaN(r['Batting_Avg'])
          )

    const distCandidates =
      kind === 'bowling'
        ? ['Economy_Rate', 'Wickets', 'Bowling_Avg', 'Bowling_SR']
        : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored']
    let distMetric = metric
    if (!getCol(filtered, distMetric).length) {
      distMetric = distCandidates.find(m => getCol(filtered, m).length) || metric
    }

    const available = loadDatasets().available
    return NextResponse.json({
      descriptive: descriptiveStats(filtered),
      correlation: correlationStats(filtered, kind),
      regression: regressionStats(filtered, kind),
      distribution: distributionStats(filtered, distMetric),
      confidence_intervals: confidenceIntervals(filtered, kind),
      outliers: outliersStats(filtered, kind),
      player_comparison:
        kind === 'bowling'
          ? [...filtered]
              .filter(r => typeof r['Wickets'] === 'number')
              .sort((a, b) => (b['Wickets'] ?? 0) - (a['Wickets'] ?? 0))
              .slice(0, 5)
              .map(r => ({ Player: r.Player, Wickets: r.Wickets, Economy_Rate: r.Economy_Rate, Bowling_Avg: r.Bowling_Avg }))
          : [...filtered]
              .filter(r => typeof r['Batting_Avg'] === 'number')
              .sort((a, b) => (b['Batting_Avg'] ?? 0) - (a['Batting_Avg'] ?? 0))
              .slice(0, 5)
              .map(r => ({ Player: r.Player, Batting_Avg: r.Batting_Avg, Strike_Rate: r.Strike_Rate, Runs_Scored: r.Runs_Scored })),
      dataset_info: {
        total_records: filtered.length,
        variables: ds.headers,
        formats: available.formats,
        selected: { kind, format, file: ds.file, metric: distMetric, metric_requested: metric },
        available,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

