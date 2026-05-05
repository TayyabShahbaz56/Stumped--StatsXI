const API_KEY = process.env.CRICKETDATA_API_KEY
const BASE_URL = 'https://cricketdata.org'

export async function getLiveMatches() {
  try { const res = await fetch(`${BASE_URL}/currentMatches?apikey=${API_KEY}`, { next: { revalidate: 120 } }); const data = await res.json(); return data.data || [] }
  catch (error) { console.error('CricketData API Error:', error); return [] }
}

export async function getPlayerStats(playerId) {
  try { const res = await fetch(`${BASE_URL}/player/${playerId}?apikey=${API_KEY}`, { next: { revalidate: 3600 } }); return await res.json() }
  catch (error) { console.error('Player Stats Error:', error); return null }
}

export async function getMatchDetails(matchId) {
  try { const res = await fetch(`${BASE_URL}/match/${matchId}?apikey=${API_KEY}`, { next: { revalidate: 60 } }); return await res.json() }
  catch (error) { console.error('Match Details Error:', error); return null }
}

export async function getSeriesList() {
  try { const res = await fetch(`${BASE_URL}/series?apikey=${API_KEY}`, { next: { revalidate: 86400 } }); const data = await res.json(); return data.data || [] }
  catch (error) { console.error('Series List Error:', error); return [] }
}