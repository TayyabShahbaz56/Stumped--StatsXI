'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, User } from 'lucide-react'
import Link from 'next/link'

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/players?limit=100`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load players')
        if (!cancelled) setPlayers(json.players ?? [])
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load players')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return players
    return players.filter(p => String(p.name).toLowerCase().includes(q))
  }, [players, searchQuery])
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Player Profiles</h1>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
        <input type="text" placeholder="Search players or teams..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:border-cricket-500 focus:outline-none"/>
      </div>
      {error && (
        <div className="glass-panel p-4 border border-red-500/30 text-red-200 mb-6">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(loading ? Array.from({ length: 6 }, (_, i) => ({ _skeleton: true, id: i })) : filtered).map((player,idx)=> (
          <motion.div key={player.id ?? idx} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}} className="glass-panel p-6 hover:border-cricket-500/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-cricket-500/20 rounded-full flex items-center justify-center"><User className="text-cricket-400" size={24}/></div>
              <span className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded">{player.match_type ?? 'T20'}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {player._skeleton ? (
                <span className="inline-block h-5 w-2/3 bg-slate-800 rounded animate-pulse" />
              ) : (
                <Link href={`/players/${player.slug}`} className="hover:text-cricket-300">
                  {player.name}
                </Link>
              )}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{player.span ? `Span: ${player.span}` : 'T20 dataset (career summary)'}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 p-2 rounded-lg"><p className="text-xs text-slate-500">Average</p><p className="text-lg font-bold text-cricket-400">{typeof player.batting_avg === 'number' ? player.batting_avg.toFixed(2) : '—'}</p></div>
              <div className="bg-slate-800/50 p-2 rounded-lg"><p className="text-xs text-slate-500">Strike Rate</p><p className="text-lg font-bold text-blue-400">{typeof player.strike_rate === 'number' ? player.strike_rate.toFixed(2) : '—'}</p></div>
              <div className="bg-slate-800/50 p-2 rounded-lg"><p className="text-xs text-slate-500">Runs</p><p className="text-lg font-bold text-white">{typeof player.runs === 'number' ? player.runs.toLocaleString() : '—'}</p></div>
              <div className="bg-slate-800/50 p-2 rounded-lg"><p className="text-xs text-slate-500">Matches</p><p className="text-lg font-bold text-white">{typeof player.matches === 'number' ? player.matches : '—'}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}