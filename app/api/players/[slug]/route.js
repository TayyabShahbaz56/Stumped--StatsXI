import { NextResponse } from 'next/server'
import { getDataset } from '@/lib/datasets'
import { calculateMean, calculateStdDev } from '@/lib/statistics'

function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET(request, { params }) {
  try {
    const slug = String(params.slug ?? '').toLowerCase()
    const { searchParams } = new URL(request.url)
    const kind = String(searchParams.get('kind') ?? 'batting').toLowerCase()
    const format = String(searchParams.get('format') ?? 't20').toLowerCase()

    const ds = getDataset({ kind, format })
    if (!ds?.data?.length) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    const data = ds.data
    const row =
      data.find(r => slugify(r.Player) === slug) ??
      data.find(r => String(r.Player_ID ?? '').toLowerCase() === slug) ??
      null

    if (!row) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

    if (kind === 'bowling') {
      const numCol = arr => arr.filter(v => typeof v === 'number' && !Number.isNaN(v))
      const wicketsList = numCol(data.map(r => r.Wickets))
      const economyList = numCol(data.map(r => r.Economy_Rate))
      const bowlAvgList = numCol(data.map(r => r.Bowling_Avg))

      const summary = {
        wickets: {
          value: row.Wickets,
          dataset_mean: calculateMean(wicketsList),
          dataset_std: calculateStdDev(wicketsList),
        },
        economy_rate: {
          value: row.Economy_Rate,
          dataset_mean: calculateMean(economyList),
          dataset_std: calculateStdDev(economyList),
        },
        bowling_avg: {
          value: row.Bowling_Avg,
          dataset_mean: calculateMean(bowlAvgList),
          dataset_std: calculateStdDev(bowlAvgList),
        },
      }

      return NextResponse.json({
        kind,
        format,
        file: ds.file,
        player: {
          id: String(row.Player_ID ?? row.Player),
          slug: slugify(row.Player),
          name: row.Player,
          span: row.Span ?? null,
          match_type: row.Match_Type ?? format.toUpperCase(),
          matches: row.Mat ?? null,
          innings: row.Inns ?? null,
          wickets: row.Wickets ?? null,
          economy_rate: row.Economy_Rate ?? null,
          bowling_avg: row.Bowling_Avg ?? null,
          bowling_sr: row.Bowling_SR ?? null,
          runs_conceded: row.Runs_Conceded ?? null,
          balls_bowled: row.Balls_Bowled ?? null,
          overs: row.Overs ?? null,
        },
        summary,
      })
    }

    const battingAvgs = data.map(r => r.Batting_Avg).filter(v => typeof v === 'number' && !Number.isNaN(v))
    const strikeRates = data.map(r => r.Strike_Rate).filter(v => typeof v === 'number' && !Number.isNaN(v))
    const runs = data.map(r => r.Runs_Scored).filter(v => typeof v === 'number' && !Number.isNaN(v))

    const summary = {
      batting_avg: {
        value: row.Batting_Avg,
        dataset_mean: calculateMean(battingAvgs),
        dataset_std: calculateStdDev(battingAvgs),
      },
      strike_rate: {
        value: row.Strike_Rate,
        dataset_mean: calculateMean(strikeRates),
        dataset_std: calculateStdDev(strikeRates),
      },
      runs_scored: {
        value: row.Runs_Scored,
        dataset_mean: calculateMean(runs),
        dataset_std: calculateStdDev(runs),
      },
    }

    return NextResponse.json({
      kind,
      format,
      file: ds.file,
      player: {
        id: String(row.Player_ID ?? row.Player),
        slug: slugify(row.Player),
        name: row.Player,
        span: row.Span ?? null,
        match_type: row.Match_Type ?? format.toUpperCase(),
        matches: row.Mat ?? null,
        innings: row.Inns ?? null,
        not_out: row.NO ?? null,
        runs: row.Runs_Scored ?? null,
        hs: row.HS ?? null,
        batting_avg: row.Batting_Avg ?? null,
        strike_rate: row.Strike_Rate ?? null,
        hundreds: row['100'] ?? null,
        fifties: row['50'] ?? null,
        zeros: row['0'] ?? null,
        fours: row['4s'] ?? null,
        sixes: row['6s'] ?? null,
        balls_faced: row.BF ?? null,
      },
      summary,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
