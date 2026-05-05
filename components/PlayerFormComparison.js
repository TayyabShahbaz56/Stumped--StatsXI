'use client'
import { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity, Target, Zap, Trophy, Search, RefreshCw, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function PlayerFormComparison({ fullPage = false, players: initialPlayers = [] }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [query, setQuery] = useState('')
  const [apiConfigured, setApiConfigured] = useState(true)
  const [dataSource, setDataSource] = useState('')
  const [liveMatchesFound, setLiveMatchesFound] = useState(0)

  useEffect(() => {
    if (initialPlayers?.length) {
      setPlayers(initialPlayers)
      setLoading(false)
      return
    }
    fetchPlayers('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPlayers = async (playerQuery) => {
    setLoading(true)
    try {
      const url = playerQuery ? `/api/player-form?player=${encodeURIComponent(playerQuery)}` : '/api/player-form'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load form data')
      setPlayers(data.players || [])
      setApiConfigured(Boolean(data.api_configured))
      setDataSource(data.data_source || '')
      setLiveMatchesFound(data.live_matches_found || 0)
    } catch (e) {
      setPlayers([])
      setApiConfigured(false)
      setDataSource('error')
    } finally {
      setLoading(false)
    }
  }

  const getFormIcon = (assessment) => {
    switch (assessment) {
      case 'above': return <TrendingUp size={20} className="text-emerald-400" />
      case 'below': return <TrendingDown size={20} className="text-red-400" />
      default: return <Minus size={20} className="text-yellow-400" />
    }
  }

  const getFormClass = (assessment) => {
    switch (assessment) {
      case 'above': return 'form-above'
      case 'below': return 'form-below'
      default: return 'form-average'
    }
  }

  const getFormText = (assessment) => {
    switch (assessment) {
      case 'above': return 'Above Career Average'
      case 'below': return 'Below Career Average'
      default: return 'At Career Level / Not Playing'
    }
  }

  const getBarColor = (assessment) => {
    switch (assessment) {
      case 'above': return '#10b981'
      case 'below': return '#ef4444'
      default: return '#f59e0b'
    }
  }

  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return players
    return players.filter(p => String(p.name).toLowerCase().includes(q) || String(p.team ?? '').toLowerCase().includes(q))
  }, [players, query])

  const chartData = visiblePlayers.map(p => ({
    name: String(p.name).split(' ')[0],
    career: p.career_sr,
    live: p.live_sr || 0,
    assessment: p.form_assessment,
    fullName: p.name
  }))

  return (
    <div className="space-y-6">
      {loading && players.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search inside results (name/team)…"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cricket-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchPlayers(query.trim())}
            className="inline-flex items-center gap-2 px-3 py-2 bg-cricket-500 hover:bg-cricket-600 rounded-lg text-white text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="glass-panel p-4 text-xs text-slate-400 flex items-start gap-3">
        <Info size={16} className="text-cricket-400 mt-0.5" />
        <div className="leading-relaxed">
          <div>
            <span className="text-slate-300 font-medium">Live source:</span> {apiConfigured ? 'CricAPI (real matches)' : 'Not configured'} •{' '}
            <span className="text-slate-300 font-medium">Live matches found:</span> {liveMatchesFound}
          </div>
          <div>
            <span className="text-slate-300 font-medium">Mode:</span> {dataSource || '—'} • Tip: type a player name and click Refresh to check that player’s current innings.
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h4 className="text-lg font-bold text-white mb-4">Career Strike Rate vs Live Strike Rate</h4>
        <ResponsiveContainer width="100%" height={fullPage ? 350 : 250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg">
                      <p className="text-white font-bold">{data.fullName}</p>
                      <p className="text-slate-400 text-sm">Career SR: {data.career}</p>
                      <p className="text-cricket-400 text-sm">Live SR: {data.live || 'N/A'}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="career" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Career SR" />
            <Bar dataKey="live" radius={[4, 4, 0, 0]} name="Live SR">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.assessment)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-4 justify-center text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"/> Career SR</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded"/> Above Form</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"/> Below Form</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded"/> Not Playing</span>
        </div>
      </div>

      <div className={`grid gap-4 ${fullPage ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {visiblePlayers.map((player, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setSelectedPlayer(selectedPlayer === idx ? null : idx)}
            className="glass-panel p-5 cursor-pointer hover:border-cricket-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-bold text-white">{player.name}</h4>
                <p className="text-xs text-slate-400">{player.team} • {player.match_type}</p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getFormClass(player.form_assessment)}`}>
                {getFormIcon(player.form_assessment)}
                {getFormText(player.form_assessment)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Trophy size={10}/> Career Avg</p>
                <p className="text-xl font-bold text-blue-400">{player.career_avg}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Activity size={10}/> Live Avg</p>
                <p className={`text-xl font-bold ${player.form_assessment === 'above' ? 'text-emerald-400' : player.form_assessment === 'below' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {player.live_runs > 0 ? (player.live_runs / (player.live_balls / 100 || 1)).toFixed(1) : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap size={10}/> Career SR</p>
                <p className="text-xl font-bold text-blue-400">{player.career_sr}</p>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Target size={10}/> Live SR</p>
                <p className={`text-xl font-bold ${player.form_assessment === 'above' ? 'text-emerald-400' : player.form_assessment === 'below' ? 'text-red-400' : 'text-yellow-400'}`}>
                  {player.live_sr > 0 ? player.live_sr : 'N/A'}
                </p>
              </div>
            </div>

            {player.form_assessment !== 'average' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">Form Delta:</span>
                <span className={`font-bold ${player.form_delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {player.form_delta > 0 ? '+' : ''}{player.form_delta.toFixed(1)}% SR
                </span>
              </div>
            )}

            <p className="text-xs text-slate-500 mt-3">Match Status: {player.match_status}</p>

            <AnimatePresence>
              {selectedPlayer === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-slate-700 space-y-2"
                >
                  <p className="text-sm text-slate-300">
                    <strong className="text-cricket-400">Career Runs:</strong> {player.career_runs?.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong className="text-cricket-400">Today's Runs:</strong> {player.live_runs || 'Not batting yet'}
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong className="text-cricket-400">Balls Faced:</strong> {player.live_balls || 'N/A'}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 italic">
                    {player.form_assessment === 'above' 
                      ? `${player.name} is performing exceptionally well today, with a strike rate ${player.form_delta.toFixed(1)}% higher than their career average.` 
                      : player.form_assessment === 'below'
                      ? `${player.name} is below their usual form today. Their strike rate is ${Math.abs(player.form_delta).toFixed(1)}% lower than career average.`
                      : `${player.name} is either not currently batting or performing at their expected career level.`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}