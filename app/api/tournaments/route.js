import { NextResponse } from 'next/server'
import { loadDatasets } from '@/lib/datasets'

function summarizeTournaments(rows) {
  const byFormat = {}
  const winCounts = {}
  const seriesSet = new Set()
  let inconclusive = 0

  for (const r of rows) {
    const fmt = r.Format != null && String(r.Format).trim() ? String(r.Format) : 'Unknown'
    byFormat[fmt] = (byFormat[fmt] ?? 0) + 1

    const wRaw = String(r.Winner ?? '').trim()
    const wl = wRaw.toLowerCase()
    if (!wRaw || wl === 'drawn' || wl === 'no result' || wl === 'tied' || wl === 'abandoned') {
      inconclusive += 1
    } else {
      winCounts[wRaw] = (winCounts[wRaw] ?? 0) + 1
    }

    const s = r['Series/Tournament']
    if (s) seriesSet.add(String(s))
  }

  const topWinners = Object.entries(winCounts)
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 20)

  return {
    total: rows.length,
    uniqueSeries: seriesSet.size,
    inconclusive,
    byFormat: Object.entries(byFormat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    topWinners,
  }
}

export async function GET() {
  try {
    const { datasets } = loadDatasets()
    const tournamentSets = datasets.filter(d => d.kind === 'tournament')
    const rows = tournamentSets.flatMap(ds =>
      (ds.data ?? []).map(r => ({
        ...r,
        Format: r.Format ?? ds.format?.toUpperCase() ?? null,
      }))
    )
    const summary = summarizeTournaments(rows)
    return NextResponse.json({ rows, total: rows.length, summary })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
