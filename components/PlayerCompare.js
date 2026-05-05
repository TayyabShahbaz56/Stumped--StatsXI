'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Users, BarChart3 } from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/** Higher value is better */
function bandHigh(players, key) {
  const vals = players.map(p => p[key]).filter(v => typeof v === 'number' && Number.isFinite(v))
  if (!vals.length) return null
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  return { min, max, range }
}

/** Lower value is better (e.g. economy, bowling average) */
function scoreLow(band, v) {
  if (!band || typeof v !== 'number' || !Number.isFinite(v)) return 0
  return clamp(((band.max - v) / band.range) * 100, 0, 100)
}

function scoreHigh(band, v) {
  if (!band || typeof v !== 'number' || !Number.isFinite(v)) return 0
  return clamp(((v - band.min) / band.range) * 100, 0, 100)
}

export default function PlayerCompare({ maxPlayers = 5, kind = 'batting', format = 't20' }) {
  const [all, setAll] = useState([])
  const [selected, setSelected] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setSelected([])
      try {
        const res = await fetch(
          `/api/players?kind=${encodeURIComponent(kind)}&format=${encodeURIComponent(format)}&limit=200`
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load players')
        if (!cancelled) setAll(json.players ?? [])
      } catch {
        if (!cancelled) setAll([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kind, format])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return all.slice(0, 30)
    return all.filter(p => String(p.name).toLowerCase().includes(query)).slice(0, 30)
  }, [all, q])

  const selectedSet = useMemo(() => new Set(selected.map(p => p.id)), [selected])

  const add = p => {
    if (selectedSet.has(p.id)) return
    if (selected.length >= maxPlayers) return
    setSelected(prev => [...prev, p])
  }

  const remove = id => setSelected(prev => prev.filter(p => p.id !== id))

  const bandsBatting = useMemo(() => {
    if (!all.length || kind !== 'batting') return null
    return {
      batting_avg: bandHigh(all, 'batting_avg'),
      strike_rate: bandHigh(all, 'strike_rate'),
      runs: bandHigh(all, 'runs'),
    }
  }, [all, kind])

  const bandsBowling = useMemo(() => {
    if (!all.length || kind !== 'bowling') return null
    return {
      wickets: bandHigh(all, 'wickets'),
      economy_rate: bandHigh(all, 'economy_rate'),
      bowling_avg: bandHigh(all, 'bowling_avg'),
    }
  }, [all, kind])

  const radarData = useMemo(() => {
    if (selected.length === 0) return []
    if (kind === 'batting' && bandsBatting) {
      const rows = [
        { metric: 'Batting Avg', b: bandsBatting.batting_avg, key: 'batting_avg', low: false },
        { metric: 'Strike Rate', b: bandsBatting.strike_rate, key: 'strike_rate', low: false },
        { metric: 'Runs', b: bandsBatting.runs, key: 'runs', low: false },
      ]
      return rows.map(r => {
        const out = { metric: r.metric }
        for (const p of selected) {
          const v = p[r.key]
          out[p.name] = r.b && typeof v === 'number' ? scoreHigh(r.b, v) : 0
        }
        return out
      })
    }
    if (kind === 'bowling' && bandsBowling) {
      const rows = [
        { metric: 'Wickets', b: bandsBowling.wickets, key: 'wickets', low: false },
        { metric: 'Economy (↓ better)', b: bandsBowling.economy_rate, key: 'economy_rate', low: true },
        { metric: 'Bowling Avg (↓ better)', b: bandsBowling.bowling_avg, key: 'bowling_avg', low: true },
      ]
      return rows.map(r => {
        const out = { metric: r.metric }
        for (const p of selected) {
          const v = p[r.key]
          out[p.name] =
            r.b && typeof v === 'number' ? (r.low ? scoreLow(r.b, v) : scoreHigh(r.b, v)) : 0
        }
        return out
      })
    }
    return []
  }, [kind, bandsBatting, bandsBowling, selected])

  const barData = useMemo(() => {
    if (kind === 'bowling') {
      return selected.map(p => ({
        name: p.name.replace(/\s*\([^)]*\)\s*/g, ''),
        wickets: p.wickets ?? 0,
        economy_rate: p.economy_rate ?? 0,
        bowling_avg: p.bowling_avg ?? 0,
      }))
    }
    return selected.map(p => ({
      name: p.name.replace(/\s*\([^)]*\)\s*/g, ''),
      batting_avg: p.batting_avg ?? 0,
      strike_rate: p.strike_rate ?? 0,
      runs: p.runs ?? 0,
    }))
  }, [selected, kind ])

  const isBowling = kind === 'bowling'

  return (
    <div className="glass-panel p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-cricket-400" /> Compare Players
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Search and select up to {maxPlayers} players — metrics match your dashboard ({String(format).toUpperCase()}{' '}
            {isBowling ? 'bowling' : 'batting'}).
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Selected: <span className="text-slate-300 font-medium">{selected.length}/{maxPlayers}</span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={loading ? 'Loading players…' : 'Search players…'}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cricket-500 focus:outline-none"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(p => (
            <button
              key={p.id}
              onClick={() => remove(p.id)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cricket-500/10 border border-cricket-500/20 text-sm text-slate-200 hover:bg-cricket-500/15"
              title="Remove"
            >
              {p.name}
              <X size={14} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">Search results</p>
          <div className="max-h-64 overflow-auto space-y-2 pr-1">
            {filtered.map(p => {
              const disabled = selectedSet.has(p.id) || selected.length >= maxPlayers
              return (
                <button
                  key={p.id}
                  onClick={() => add(p)}
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    disabled
                      ? 'border-slate-800 bg-slate-900/40 text-slate-500 cursor-not-allowed'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.match_type ?? '—'}</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isBowling ? (
                      <>
                        Wkts: {typeof p.wickets === 'number' ? p.wickets : '—'} • Econ:{' '}
                        {typeof p.economy_rate === 'number' ? p.economy_rate.toFixed(2) : '—'} • Avg:{' '}
                        {typeof p.bowling_avg === 'number' ? p.bowling_avg.toFixed(2) : '—'}
                      </>
                    ) : (
                      <>
                        Avg: {typeof p.batting_avg === 'number' ? p.batting_avg.toFixed(2) : '—'} • SR:{' '}
                        {typeof p.strike_rate === 'number' ? p.strike_rate.toFixed(2) : '—'} • Runs:{' '}
                        {typeof p.runs === 'number' ? p.runs.toLocaleString() : '—'}
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
            <BarChart3 size={14} className="text-cricket-400" /> Normalized radar (0–100)
          </p>
          {selected.length < 2 ? (
            <div className="text-sm text-slate-500 py-10 text-center">Select at least 2 players to compare.</div>
          ) : radarData.length === 0 ? (
            <div className="text-sm text-slate-500 py-10 text-center">No comparable numeric fields in this dataset.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                {selected.map((p, idx) => (
                  <Radar
                    key={p.id}
                    dataKey={p.name}
                    stroke={['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'][idx % 5]}
                    fill={['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444'][idx % 5]}
                    fillOpacity={0.12}
                  />
                ))}
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {selected.length >= 2 && (
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">Raw metrics</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Legend />
              {isBowling ? (
                <>
                  <Bar dataKey="wickets" name="Wickets" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="economy_rate" name="Economy" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bowling_avg" name="Bowling Avg" fill="#10b981" radius={[6, 6, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="batting_avg" name="Batting Avg" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="strike_rate" name="Strike Rate" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="runs" name="Runs" fill="#a855f7" radius={[6, 6, 0, 0]} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
