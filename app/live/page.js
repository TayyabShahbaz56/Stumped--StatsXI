'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, RefreshCw, Calendar, MapPin, Trophy } from 'lucide-react'

function formatScore(score) {
  if (!score) return null
  if (typeof score === 'string') return score
  if (Array.isArray(score)) {
    return score
      .map(s => {
        if (!s || typeof s !== 'object') return null
        const inning = s.inning ? `${s.inning}: ` : ''
        const r = s.r ?? '-'
        const w = s.w ?? '-'
        const o = s.o ?? '-'
        return `${inning}${r}/${w} (${o})`
      })
      .filter(Boolean)
      .join(' | ')
  }
  if (typeof score === 'object') {
    const inning = score.inning ? `${score.inning}: ` : ''
    const r = score.r ?? '-'
    const w = score.w ?? '-'
    const o = score.o ?? '-'
    return `${inning}${r}/${w} (${o})`
  }
  return String(score)
}

export default function LivePage() {
  const [matches, setMatches] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/live')
      const data = await res.json()
      setMatches(data.live_matches||[])
      setRecent(data.recent_matches||[])
      setLastUpdated(new Date().toLocaleTimeString())
    } catch(err) { console.error('Failed to fetch:',err) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchData(); const interval=setInterval(fetchData,120000); return()=>clearInterval(interval) }, [])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Radio className="text-red-500 animate-pulse"/>Live Cricket Center</h1>
          <p className="text-slate-400 mt-1">Real-time data from CricketData API</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-cricket-500 hover:bg-cricket-600 rounded-lg text-white text-sm font-medium transition-colors"><RefreshCw size={16} className={loading?'animate-spin':''}/>Refresh</button>
      </div>
      {lastUpdated && <p className="text-xs text-slate-500 mb-6">Last updated: {lastUpdated}</p>}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>Currently Live</h2>
        {matches.length===0?(
          <div className="glass-panel p-12 text-center"><Radio size={48} className="mx-auto text-slate-600 mb-4"/><p className="text-slate-400">No live matches at the moment</p><p className="text-sm text-slate-600 mt-2">Check back during match hours or view recent matches below</p></div>
        ):(
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match,idx)=> (
              <motion.div key={idx} initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}} transition={{duration:0.15}} className="glass-panel p-6 hover:border-red-500/30 transition-all">
                <div className="flex items-center justify-between mb-4"><span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">LIVE</span><span className="text-xs text-slate-500">{match.matchType||'T20'}</span></div>
                <h3 className="text-lg font-bold text-white mb-2">{match.name}</h3>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex items-center gap-2"><Trophy size={14}/><span>{match.series||'International'}</span></div>
                  <div className="flex items-center gap-2"><MapPin size={14}/><span>{match.venue||'Venue TBA'}</span></div>
                </div>
                {match.score && <div className="mt-3 p-2 bg-slate-800/50 rounded-lg"><p className="text-cricket-400 font-mono font-bold">{formatScore(match.score)}</p></div>}
                <div className="mt-4 pt-4 border-t border-slate-700"><p className="text-xs text-slate-500">{match.status}</p></div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar size={20} className="text-cricket-400"/>Recent Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(recent||[]).slice(0,8).map((match,idx)=> (
            <motion.div key={idx} initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.12}} className="glass-panel p-4 opacity-75 hover:opacity-100 transition-opacity">
              <p className="text-xs text-slate-500 mb-2">{match.date||'Recent'}</p>
              <h4 className="text-sm font-medium text-white mb-1">{match.name}</h4>
              <p className="text-xs text-cricket-400">{match.result||'Completed'}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}