export function calculateMean(data) {
  if (!Array.isArray(data) || data.length === 0) return 0
  return data.reduce((a, b) => a + b, 0) / data.length
}

export function calculateStdDev(data) {
  if (!Array.isArray(data) || data.length === 0) return 0
  const mean = calculateMean(data)
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
  return Math.sqrt(variance)
}

export function calculatePercentile(data, percentile) {
  if (!Array.isArray(data) || data.length === 0) return 0
  const sorted = [...data].sort((a, b) => a - b)
  const p = Math.max(0, Math.min(100, percentile))
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function detectOutliersIQR(data) {
  const sorted = [...data].sort((a, b) => a - b)
  const q1 = calculatePercentile(sorted, 25)
  const q3 = calculatePercentile(sorted, 75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  return { outliers: data.filter(x => x < lowerBound || x > upperBound), lowerBound, upperBound, q1, q3, iqr }
}

export function calculateCorrelation(x, y) {
  const n = Math.min(x.length, y.length)
  if (n === 0) return 0
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((sum, xi, i) => sum + xi * ys[i], 0)
  const sumX2 = xs.reduce((a, b) => a + b * b, 0)
  const sumY2 = ys.reduce((a, b) => a + b * b, 0)
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  return denominator === 0 ? 0 : numerator / denominator
}

export function linearRegression(x, y) {
  const n = Math.min(x.length, y.length)
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 }
  const xs = x.slice(0, n)
  const ys = y.slice(0, n)

  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((sum, xi, i) => sum + xi * ys[i], 0)
  const sumX2 = xs.reduce((a, b) => a + b * b, 0)

  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  const yMean = sumY / n
  const ssTotal = ys.reduce((a, b) => a + Math.pow(b - yMean, 2), 0)
  const ssResidual = ys.reduce((sum, yi, i) => {
    const predicted = slope * xs[i] + intercept
    return sum + Math.pow(yi - predicted, 2)
  }, 0)

  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal
  return { slope, intercept, r2 }
}