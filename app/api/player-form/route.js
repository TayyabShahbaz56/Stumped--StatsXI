import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'
import { processCricketCSV } from '@/lib/dataProcessor'

const API_KEY = process.env.CRICKETDATA_API_KEY
const BASE_URL = 'https://api.cricapi.com/v1'

function calcFormAssessment(careerSR, liveSR) {
  if (!careerSR || liveSR === 0) return { assessment: 'average', delta: 0 }
  const delta = ((liveSR - careerSR) / careerSR) * 100
  const assessment = delta > 15 ? 'above' : delta < -15 ? 'below' : 'average'
  return { assessment, delta }
}

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function getLiveMatches() {
  if (!API_KEY) return []
  try {
    const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`, { next: { revalidate: 120 } })
    const data = await safeJson(res)
    return Array.isArray(data?.data) ? data.data : []
  } catch {
    return []
  }
}

async function getMatchScorecard(matchId) {
  if (!API_KEY) return null
  try {
    const res = await fetch(`${BASE_URL}/match_scorecard?apikey=${API_KEY}&id=${matchId}`, { next: { revalidate: 60 } })
    return await safeJson(res)
  } catch {
    return null
  }
}

function normalizeTeam(teamInfo) {
  return teamInfo?.shortname ?? teamInfo?.name ?? 'Unknown'
}

function findCareerRow(validCareer, playerName) {
  const target = String(playerName ?? '').toLowerCase()
  if (!target) return null
  // Try exact-ish slug match first, then includes.
  const exact = validCareer.find(r => String(r.Player ?? '').toLowerCase() === target)
  if (exact) return exact
  return validCareer.find(r => String(r.Player ?? '').toLowerCase().includes(target) || target.includes(String(r.Player ?? '').toLowerCase()))
}

function extractBattingInnings(scorecardJson) {
  const cards = scorecardJson?.data?.scorecard
  if (!Array.isArray(cards)) return []
  const innings = []
  for (const inn of cards) {
    const batting = Array.isArray(inn?.batting) ? inn.batting : []
    for (const b of batting) {
      innings.push({
        name: b?.batsman?.name ?? '',
        runs: Number(b?.r ?? 0),
        balls: Number(b?.b ?? 0),
        fours: Number(b?.['4s'] ?? 0),
        sixes: Number(b?.['6s'] ?? 0),
        sr: Number(b?.sr ?? 0),
      })
    }
  }
  return innings
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerQuery = String(searchParams.get('player') ?? '').trim()

    const csvPath = path.join(process.cwd(), 'data', 'twb.csv')
    const csvText = readFileSync(csvPath, 'utf-8')
    const { data: careerData } = processCricketCSV(csvText)

    const validCareer = careerData.filter(
      r => r['Player'] && typeof r['Batting_Avg'] === 'number' && typeof r['Strike_Rate'] === 'number'
    )

    const liveMatches = await getLiveMatches()
    const players = []

    if (liveMatches.length > 0) {
      for (const match of liveMatches.slice(0, 8)) {
        const matchId = match.id
        if (!matchId) continue
        const scorecard = await getMatchScorecard(matchId)
        if (!scorecard?.data) continue
        const battingData = extractBattingInnings(scorecard)
        for (const batsman of battingData) {
          const playerName = batsman?.name ?? ''
          if (!playerName) continue
          if (playerQuery && !playerName.toLowerCase().includes(playerQuery.toLowerCase())) continue

          const careerRow = findCareerRow(validCareer, playerName)
          if (!careerRow) continue

          const careerAvg = careerRow['Batting_Avg']
          const careerSR = careerRow['Strike_Rate']
          const careerRuns = careerRow['Runs_Scored'] ?? 0
          const liveRuns = Number(batsman.runs ?? 0)
          const liveBalls = Number(batsman.balls ?? 0)
          const liveSR = Number(batsman.sr ?? (liveBalls > 0 ? (liveRuns / liveBalls) * 100 : 0))
          const { assessment, delta } = calcFormAssessment(careerSR, liveSR)

          players.push({
            name: playerName,
            team: normalizeTeam(match?.teamInfo?.[0]) ?? match?.teams?.[0] ?? 'Unknown',
            career_avg: Math.round(careerAvg * 100) / 100,
            career_sr: Math.round(careerSR * 100) / 100,
            career_runs: Math.round(careerRuns),
            live_runs: liveRuns,
            live_sr: Math.round(liveSR * 100) / 100,
            live_balls: liveBalls,
            match_status: match.status ?? 'In Progress',
            form_assessment: assessment,
            form_delta: Math.round(delta * 100) / 100,
            match_type: match.matchType ?? 'T20',
            match_name: match.name ?? null,
            match_id: matchId,
          })
        }
      }
    }

    // If a specific player was requested but is not found in live matches, return a clean "no live innings" response.
    if (playerQuery && players.length === 0) {
      const careerRow = validCareer.find(r => String(r.Player ?? '').toLowerCase().includes(playerQuery.toLowerCase()))
      if (careerRow) {
        return NextResponse.json({
          players: [
            {
              name: careerRow.Player,
              team: 'Career dataset',
              career_avg: Math.round(careerRow.Batting_Avg * 100) / 100,
              career_sr: Math.round(careerRow.Strike_Rate * 100) / 100,
              career_runs: Math.round(careerRow.Runs_Scored ?? 0),
              live_runs: 0,
              live_sr: 0,
              live_balls: 0,
              match_status: 'No live innings found',
              form_assessment: 'average',
              form_delta: 0,
              match_type: careerRow.Match_Type ?? 'T20',
              match_name: null,
              match_id: null,
            },
          ],
          data_source: liveMatches.length > 0 ? 'career_only_no_live_innings' : 'career_only_no_api',
          live_matches_found: liveMatches.length,
          total_players: 1,
          api_configured: Boolean(API_KEY),
        })
      }
    }

    if (players.length === 0 && validCareer.length > 0) {
      const top6 = [...validCareer].sort((a, b) => b['Batting_Avg'] - a['Batting_Avg']).slice(0, 6)
      for (const row of top6) {
        const careerAvg = row['Batting_Avg']
        const careerSR = row['Strike_Rate']
        const careerRuns = row['Runs_Scored'] ?? 0
        const liveRuns = Math.floor(Math.random() * 100)
        const liveBalls = 20 + Math.floor(Math.random() * 60)
        const liveSR = liveBalls > 0 ? (liveRuns / liveBalls) * 100 : 0
        const { assessment, delta } = calcFormAssessment(careerSR, liveSR)
        players.push({
          name: row['Player'],
          team: row['Team'] ?? 'International',
          career_avg: Math.round(careerAvg * 100) / 100,
          career_sr: Math.round(careerSR * 100) / 100,
          career_runs: Math.round(careerRuns),
          live_runs: liveRuns,
          live_sr: Math.round(liveSR * 100) / 100,
          live_balls: liveBalls,
          match_status: liveRuns > 0 ? 'In Progress' : 'Not Batting',
          form_assessment: assessment,
          form_delta: Math.round(delta * 100) / 100,
          match_type: row['Match_Type'] ?? 'T20',
        })
      }
    }

    return NextResponse.json({
      players,
      data_source: liveMatches.length > 0 ? 'hybrid' : 'kaggle_simulated',
      live_matches_found: liveMatches.length,
      total_players: players.length,
      api_configured: Boolean(API_KEY),
    })
  } catch (err) {
    return NextResponse.json({ error: err.message, players: [] }, { status: 500 })
  }
}

