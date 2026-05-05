import { NextResponse } from 'next/server'
import { getDataset } from '@/lib/datasets'

function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = String(searchParams.get('q') ?? '').trim().toLowerCase()
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? 50)))
    const kind = String(searchParams.get('kind') ?? 'batting').toLowerCase()
    const format = String(searchParams.get('format') ?? 't20').toLowerCase()

    const ds = getDataset({ kind, format })
    if (!ds?.data?.length) {
      return NextResponse.json({ total: 0, players: [], kind, format, file: null })
    }

    let rows = ds.data.filter(r => r.Player)
    if (q) {
      rows = rows.filter(r => String(r.Player).toLowerCase().includes(q))
    }

    if (kind === 'bowling') {
      const players = rows.slice(0, limit).map(r => ({
        id: String(r.Player_ID ?? r.Player),
        slug: slugify(r.Player),
        name: r.Player,
        span: r.Span ?? null,
        matches: typeof r.Mat === 'number' ? r.Mat : null,
        innings: typeof r.Inns === 'number' ? r.Inns : null,
        wickets: typeof r.Wickets === 'number' ? r.Wickets : null,
        economy_rate: typeof r.Economy_Rate === 'number' ? r.Economy_Rate : null,
        bowling_avg: typeof r.Bowling_Avg === 'number' ? r.Bowling_Avg : null,
        bowling_sr: typeof r.Bowling_SR === 'number' ? r.Bowling_SR : null,
        runs_conceded: typeof r.Runs_Conceded === 'number' ? r.Runs_Conceded : null,
        match_type: r.Match_Type ?? format.toUpperCase(),
      }))
      return NextResponse.json({ total: rows.length, players, kind, format, file: ds.file })
    }

    const players = rows.slice(0, limit).map(r => ({
      id: String(r.Player_ID ?? r.Player),
      slug: slugify(r.Player),
      name: r.Player,
      span: r.Span ?? null,
      matches: typeof r.Mat === 'number' ? r.Mat : null,
      innings: typeof r.Inns === 'number' ? r.Inns : null,
      not_out: typeof r.NO === 'number' ? r.NO : null,
      runs: typeof r.Runs_Scored === 'number' ? r.Runs_Scored : null,
      hs: r.HS ?? null,
      batting_avg: typeof r.Batting_Avg === 'number' ? r.Batting_Avg : null,
      strike_rate: typeof r.Strike_Rate === 'number' ? r.Strike_Rate : null,
      hundreds: typeof r['100'] === 'number' ? r['100'] : null,
      fifties: typeof r['50'] === 'number' ? r['50'] : null,
      fours: typeof r['4s'] === 'number' ? r['4s'] : null,
      sixes: typeof r['6s'] === 'number' ? r['6s'] : null,
      match_type: r.Match_Type ?? format.toUpperCase(),
    }))

    return NextResponse.json({ total: rows.length, players, kind, format, file: ds.file })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
