import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import { processCricketCSV, processBowlingCSV, processTournamentCSV } from '@/lib/dataProcessor'

function detectDatasetKind(filename) {
  const f = filename.toLowerCase()
  if (f.includes('tournament')) return 'tournament'
  if (f.includes('bowling')) return 'bowling'
  if (f.includes('batting')) return 'batting'
  if (f === 'twb.csv') return 'batting'
  return 'unknown'
}

function detectFormat(filename) {
  const f = filename.toLowerCase()
  if (f.includes('t20')) return 't20'
  if (f.includes('odi')) return 'odi'
  if (f.includes('test')) return 'test'
  return 'unknown'
}

let cached = null

export function loadDatasets() {
  if (cached) return cached

  const dataDir = path.join(process.cwd(), 'data')
  const files = readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.csv'))

  const datasets = []
  for (const file of files) {
    const filePath = path.join(dataDir, file)
    const csvText = readFileSync(filePath, 'utf-8')
    const kind = detectDatasetKind(file)
    const format = detectFormat(file)

    let parsed
    if (kind === 'batting') parsed = processCricketCSV(csvText, { kind: 'batting', defaultMatchType: format.toUpperCase() })
    else if (kind === 'bowling') parsed = processBowlingCSV(csvText, { defaultMatchType: format.toUpperCase() })
    else if (kind === 'tournament') parsed = processTournamentCSV(csvText, { format: format.toUpperCase() })
    else parsed = processCricketCSV(csvText, { kind: 'batting', defaultMatchType: format.toUpperCase() })

    datasets.push({
      id: file,
      file,
      kind,
      format,
      headers: parsed.headers,
      data: parsed.data,
    })
  }

  const available = {
    formats: Array.from(new Set(datasets.map(d => d.format).filter(f => f && f !== 'unknown'))).sort(),
    kinds: Array.from(new Set(datasets.map(d => d.kind))).sort(),
    files: datasets.map(d => ({ id: d.id, kind: d.kind, format: d.format })),
  }

  cached = { datasets, available }
  return cached
}

export function getDataset({ kind, format }) {
  const { datasets } = loadDatasets()
  const k = (kind ?? 'batting').toLowerCase()
  const f = (format ?? 't20').toLowerCase()

  const exact = datasets.find(d => d.kind === k && d.format === f)
  if (exact) return exact

  // common fallback: t20 batting is `twb.csv` in this project
  if (k === 'batting' && f === 't20') {
    const twb = datasets.find(d => d.file.toLowerCase() === 'twb.csv')
    if (twb) return twb
  }

  return datasets.find(d => d.kind === k) ?? datasets[0] ?? null
}

