import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'
import { processCricketCSV } from '@/lib/dataProcessor'
import { detectOutliersIQR } from '@/lib/statistics'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const metric = body.metric ?? 'Batting_Avg'

    const csvPath = path.join(process.cwd(), 'data', 'twb.csv')
    const csvText = readFileSync(csvPath, 'utf-8')
    const { data } = processCricketCSV(csvText)

    const col = data.map(r => r[metric]).filter(v => typeof v === 'number' && !isNaN(v))
    if (!col.length) return NextResponse.json({ error: `No numeric data for metric: ${metric}` }, { status: 400 })

    const { outliers, lowerBound, upperBound, q1, q3 } = detectOutliersIQR(col)
    const sorted = [...col].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    const outlierDetails = data
      .filter(r => {
        const v = r[metric]
        return typeof v === 'number' && (v < lowerBound || v > upperBound)
      })
      .slice(0, 10)
      .map(r => ({ Player: r['Player'], [metric]: r[metric] }))

    return NextResponse.json({
      metric,
      count: outliers.length,
      percentage: (outliers.length / col.length) * 100,
      bounds: { lower: lowerBound, upper: upperBound },
      quartiles: { q1, median, q3 },
      outliers: outlierDetails,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

