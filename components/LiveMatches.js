'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Clock, MapPin, Trophy, AlertCircle } from 'lucide-react'

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

export default function LiveMatches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apiMeta, setApiMeta] = useState(null)
  useEffect(() => { fetchLiveMatches(); const interval=setInterval(fetchLiveMatches,120000); return()=>clearInterval(interval) }, [])
  const fetchLiveMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/live')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'API Error')
      setMatches(data.live_matches || [])
      setApiMeta(data.api || null)
    } catch (err) {
      setError('Failed to load live matches.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && matches.length===0) return <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-cricket-500 border-t-transparent rounded-full"/></div>
  if (error && matches.length===0) return <div className="text-center py-8"><AlertCircle className="mx-auto text-yellow-500 mb-2" size={32}/><p className="text-slate-400">{error}</p><button onClick={fetchLiveMatches} className="mt-4 px-4 py-2 bg-cricket-500 rounded-lg text-white text-sm">Retry</button></div>
  if (matches.length===0) return (
    <div className="text-center py-8">
      <Radio size={48} className="mx-auto text-slate-600 mb-4"/>
      <p className="text-slate-400">No live matches currently</p>
      <p className="text-sm text-slate-600 mt-2">Refreshes every 2 minutes • Check during match hours</p>
      {apiMeta && (
        <p className="text-xs text-slate-500 mt-3">
          Provider: {apiMeta.provider} • Key: {apiMeta.configured ? 'configured' : 'missing'}{apiMeta.live_error ? ` • Live: ${apiMeta.live_error}` : ''}
        </p>
      )}
    </div>
  )
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.slice(0,6).map((match,idx)=> (
        <motion.div key={idx} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:idx*0.1}} className="glass-panel p-5 hover:border-red-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/>LIVE</span>
            <span className="text-xs text-slate-500">{match.matchType||'T20'}</span>
          </div>
          <h4 className="font-bold text-white mb-2 text-sm">{match.name}</h4>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2"><Trophy size={12}/><span>{match.series||'International'}</span></div>
            <div className="flex items-center gap-2"><MapPin size={12}/><span>{match.venue||'Venue TBA'}</span></div>
            <div className="flex items-center gap-2"><Clock size={12}/><span>{match.status||'In Progress'}</span></div>
          </div>
          {match.score && <div className="mt-3 p-2 bg-slate-800/50 rounded-lg"><p className="text-cricket-400 font-mono text-sm font-bold">{formatScore(match.score)}</p></div>}
        </motion.div>
      ))}
    </div>
  )
}