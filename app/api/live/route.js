import { NextResponse } from 'next/server'

const API_KEY = process.env.CRICKETDATA_API_KEY
// cricketdata.org's API is served via CricAPI.
// The old `https://cricketdata.org/currentMatches` URLs 404; use the actual API host.
const BASE_URL = 'https://api.cricapi.com/v1'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

async function getLiveMatches() {
  if (!API_KEY) return { ok: false, data: [], error: 'Missing CRICKETDATA_API_KEY' }
  try {
    const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}&offset=0`, { next: { revalidate: 120 } })
    const json = await safeJson(res)
    const arr = Array.isArray(json?.data) ? json.data : []
    return { ok: res.ok, data: arr, error: res.ok ? null : json?.error ?? `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, data: [], error: e?.message ?? 'Failed to fetch live matches' }
  }
}

async function getRecentMatches() {
  if (!API_KEY) return { ok: false, data: [], error: 'Missing CRICKETDATA_API_KEY' }
  try {
    // CricAPI exposes recent-ish matches under /matches
    const res = await fetch(`${BASE_URL}/matches?apikey=${API_KEY}&offset=0`, { next: { revalidate: 300 } })
    const json = await safeJson(res)
    const arr = Array.isArray(json?.data) ? json.data : []
    return { ok: res.ok, data: arr, error: res.ok ? null : json?.error ?? `HTTP ${res.status}` }
  } catch (e) {
    return { ok: false, data: [], error: e?.message ?? 'Failed to fetch recent matches' }
  }
}

export async function GET() {
  const [live, recent] = await Promise.all([getLiveMatches(), getRecentMatches()])
  return NextResponse.json({
    live_matches: live.data,
    // keep recent payload small for UI
    recent_matches: (recent.data ?? []).slice(0, 20),
    api: {
      provider: 'cricapi',
      configured: Boolean(API_KEY),
      live_ok: live.ok,
      recent_ok: recent.ok,
      live_error: live.error,
      recent_error: recent.error,
    },
    api_status: live.data.length > 0 ? 'active' : 'no_live_matches',
  })
}

