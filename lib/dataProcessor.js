function safeParseNumber(v) {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null
  // common cricket notation: "94*" => 94
  const cleaned = s.replace(/\*+$/g, '')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

function sanitizeString(v) {
  const s = String(v ?? '').trim()
  return s.replace(/^"+|"+$/g, '')
}

function normalizeBattingRow(raw, { defaultMatchType } = {}) {
  // Normalize different dataset schemas into a consistent shape used by the app.
  // Current dataset `twb.csv` headers: Player, Mat, Inns, Runs, Ave, SR, 4s, 6s, etc.
  const player = sanitizeString(raw.Player ?? raw.player ?? raw.Batsman ?? raw.Name)

  const battingAvg =
    safeParseNumber(raw.Batting_Avg) ??
    safeParseNumber(raw.Ave) ??
    safeParseNumber(raw.Average) ??
    safeParseNumber(raw.AVG)

  const strikeRate =
    safeParseNumber(raw.Strike_Rate) ??
    safeParseNumber(raw.SR) ??
    safeParseNumber(raw.StrikeRate)

  const runsScored =
    safeParseNumber(raw.Runs_Scored) ??
    safeParseNumber(raw.Runs) ??
    safeParseNumber(raw.R)

  const wickets = safeParseNumber(raw.Wickets) ?? safeParseNumber(raw.Wkts) ?? null
  const economyRate = safeParseNumber(raw.Economy_Rate) ?? safeParseNumber(raw.Econ) ?? null

  // `twb.csv` doesn’t include match format; treat it as T20 batting dataset by default.
  const matchType = sanitizeString(raw.Match_Type ?? raw.Format ?? raw.matchType ?? defaultMatchType ?? 'T20')

  const id =
    sanitizeString(raw.Player_ID ?? raw.ID ?? raw.id ?? raw[''] ?? '') ||
    player

  return {
    ...raw,
    Player_ID: id,
    Player: player,
    Match_Type: matchType,
    Batting_Avg: battingAvg,
    Strike_Rate: strikeRate,
    Runs_Scored: runsScored,
    Wickets: wickets,
    Economy_Rate: economyRate,
  }
}

function normalizeBowlingRow(raw, { defaultMatchType } = {}) {
  const player = sanitizeString(raw.Player ?? raw.player ?? raw.Bowler ?? raw.Name)

  const wickets = safeParseNumber(raw.Wickets) ?? safeParseNumber(raw.Wkts) ?? safeParseNumber(raw.W) ?? null
  const economy =
    safeParseNumber(raw.Economy_Rate) ??
    safeParseNumber(raw.Econ) ??
    safeParseNumber(raw.Economy) ??
    null
  const bowlAvg =
    safeParseNumber(raw.Bowling_Avg) ??
    safeParseNumber(raw.Ave) ??
    safeParseNumber(raw.Average) ??
    null
  const bowlSR =
    safeParseNumber(raw.Bowling_SR) ??
    safeParseNumber(raw.SR) ??
    safeParseNumber(raw.StrikeRate) ??
    null

  const runsConceded =
    safeParseNumber(raw.Runs_Conceded) ??
    safeParseNumber(raw.Runs) ??
    safeParseNumber(raw.R) ??
    null

  const balls =
    safeParseNumber(raw.Balls) ??
    safeParseNumber(raw.B) ??
    safeParseNumber(raw.Deliveries) ??
    null

  const overs = safeParseNumber(raw.Overs) ?? null

  const matchType = sanitizeString(raw.Match_Type ?? raw.Format ?? raw.matchType ?? defaultMatchType ?? 'T20')

  const id =
    sanitizeString(raw.Player_ID ?? raw.ID ?? raw.id ?? raw[''] ?? '') ||
    player

  return {
    ...raw,
    Player_ID: id,
    Player: player,
    Match_Type: matchType,
    Wickets: wickets,
    Economy_Rate: economy,
    Bowling_Avg: bowlAvg,
    Bowling_SR: bowlSR,
    Runs_Conceded: runsConceded,
    Balls_Bowled: balls,
    Overs: overs,
  }
}

export function processCricketCSV(csvText, opts = {}) {
  const lines = csvText.split(/\r?\n/)
  const headers = lines[0]
    .split(',')
    .map(h => sanitizeString(h))

  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]?.trim()) continue
    const values = lines[i].split(',').map(v => sanitizeString(v))
    const row = {}
    headers.forEach((header, index) => {
      const value = values[index]
      const forceString = header === 'Span' || header === 'HS'
      const numValue = forceString ? null : safeParseNumber(value)
      row[header] = numValue == null ? value : numValue
    })
    data.push(normalizeBattingRow(row, { defaultMatchType: opts.defaultMatchType }))
  }

  const normalizedHeaders = Array.from(
    new Set([...headers, 'Player_ID', 'Match_Type', 'Batting_Avg', 'Strike_Rate', 'Runs_Scored', 'Wickets', 'Economy_Rate'])
  )

  return { headers: normalizedHeaders, data, summary: generateSummary(data, normalizedHeaders) }
}

export function processBowlingCSV(csvText, opts = {}) {
  const lines = csvText.split(/\r?\n/)
  const headers = lines[0].split(',').map(h => sanitizeString(h))
  const data = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]?.trim()) continue
    const values = lines[i].split(',').map(v => sanitizeString(v))
    const row = {}
    headers.forEach((header, index) => {
      const value = values[index]
      const forceString = header === 'Span' || header === 'BBI' || header === 'BBM' || header === 'Mat'
      const numValue = forceString ? null : safeParseNumber(value)
      row[header] = numValue == null ? value : numValue
    })
    data.push(normalizeBowlingRow(row, { defaultMatchType: opts.defaultMatchType }))
  }

  const normalizedHeaders = Array.from(
    new Set([
      ...headers,
      'Player_ID',
      'Match_Type',
      'Wickets',
      'Economy_Rate',
      'Bowling_Avg',
      'Bowling_SR',
      'Runs_Conceded',
      'Balls_Bowled',
      'Overs',
    ])
  )

  return { headers: normalizedHeaders, data, summary: generateSummary(data, normalizedHeaders) }
}

export function processTournamentCSV(csvText, opts = {}) {
  const lines = csvText.split(/\r?\n/)
  const headers = lines[0].split(',').map(h => sanitizeString(h))
  const data = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]?.trim()) continue
    const values = lines[i].split(',').map(v => sanitizeString(v))
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index]
    })
    data.push({
      ...row,
      Format: opts.format ?? null,
    })
  }
  return { headers: Array.from(new Set([...headers, 'Format'])), data }
}

function generateSummary(data, headers) {
  const numericHeaders = headers.filter(h => data.some(row => typeof row[h] === 'number' && !Number.isNaN(row[h])))
  const summary = {}

  numericHeaders.forEach(header => {
    const values = data.map(row => row[header]).filter(v => typeof v === 'number' && !Number.isNaN(v))
    if (values.length === 0) return
    const sorted = [...values].sort((a, b) => a - b)
    summary[header] = {
      count: values.length,
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      q1: sorted[Math.floor(sorted.length * 0.25)],
      q3: sorted[Math.floor(sorted.length * 0.75)],
    }
  })

  return summary
}

export function filterByFormat(data, format) {
  if (!format) return data
  const q = String(format).toLowerCase()
  return data.filter(row => String(row.Match_Type ?? row.Format ?? '').toLowerCase().includes(q))
}

export function getTopPlayers(data, metric, limit = 10) {
  return [...data]
    .filter(row => typeof row[metric] === 'number' && !Number.isNaN(row[metric]))
    .sort((a, b) => b[metric] - a[metric])
    .slice(0, limit)
}