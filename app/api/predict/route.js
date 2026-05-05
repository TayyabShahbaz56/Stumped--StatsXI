import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'
import { processCricketCSV } from '@/lib/dataProcessor'
import { linearRegression } from '@/lib/statistics'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const strikeRate = Number(body.strike_rate ?? 150)
    const matchType = body.match_type ?? 'T20'

    const csvPath = path.join(process.cwd(), 'data', 'twb.csv')
    const csvText = readFileSync(csvPath, 'utf-8')
    const { data } = processCricketCSV(csvText)

    let filtered = data.filter(r => typeof r['Strike_Rate'] === 'number' && typeof r['Runs_Scored'] === 'number')
    if (matchType) {
      const fmt = filtered.filter(r => String(r['Match_Type'] ?? '').toLowerCase().includes(String(matchType).toLowerCase()))
      if (fmt.length > 10) filtered = fmt
    }

    const xArr = filtered.map(r => r['Strike_Rate'])
    const yArr = filtered.map(r => r['Runs_Scored'])
    const { slope, intercept, r2 } = linearRegression(xArr, yArr)
    const prediction = slope * strikeRate + intercept

    const residuals = xArr.map((x, i) => yArr[i] - (slope * x + intercept))
    const mse = residuals.reduce((s, r) => s + r * r, 0) / residuals.length
    const stdError = Math.sqrt(mse)

    return NextResponse.json({
      strike_rate: strikeRate,
      predicted_runs: prediction,
      confidence_interval: { lower: prediction - 1.96 * stdError, upper: prediction + 1.96 * stdError },
      r2_score: r2,
      sample_size: filtered.length,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

