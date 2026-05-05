'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Trophy, Medal, Calendar, AlertCircle } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const PIE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#14b8a6']

export default function TournamentsPage() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [format, setFormat] = useState('ALL')

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch('/api/tournaments')
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load tournaments')
        if (!cancelled) {
          setRows(json.rows ?? [])
          setSummary(json.summary ?? null)
        }
      } catch {
        if (!cancelled) {
          setRows([])
          setSummary(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const formats = useMemo(() => {
    const set = new Set(rows.map(r => r.Format).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [rows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rows.filter(r => {
      const okFmt = format === 'ALL' ? true : r.Format === format
      if (!okFmt) return false
      if (!query) return true
      return (
        String(r['Series/Tournament'] ?? '')
          .toLowerCase()
          .includes(query) ||
        String(r.Winner ?? '')
          .toLowerCase()
          .includes(query) ||
        String(r.Season ?? '')
          .toLowerCase()
          .includes(query)
      )
    })
  }, [rows, q, format])

  const filteredSummary = useMemo(() => {
    if (!rows.length) return null
    const byFormat = {}
    const winCounts = {}
    const seriesSet = new Set()
    let inconclusive = 0
    for (const r of filtered) {
      const fmt = r.Format != null && String(r.Format).trim() ? String(r.Format) : 'Unknown'
      byFormat[fmt] = (byFormat[fmt] ?? 0) + 1
      const wRaw = String(r.Winner ?? '').trim()
      const wl = wRaw.toLowerCase()
      if (!wRaw || wl === 'drawn' || wl === 'no result' || wl === 'tied' || wl === 'abandoned') {
        inconclusive += 1
      } else {
        winCounts[wRaw] = (winCounts[wRaw] ?? 0) + 1
      }
      const s = r['Series/Tournament']
      if (s) seriesSet.add(String(s))
    }
    const topWinners = Object.entries(winCounts)
      .map(([name, wins]) => ({ name, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 12)
    return {
      total: filtered.length,
      uniqueSeries: seriesSet.size,
      inconclusive,
      byFormat: Object.entries(byFormat)
        .map(([formatName, count]) => ({ name: formatName, value: count }))
        .sort((a, b) => b.value - a.value),
      topWinners,
    }
  }, [rows, filtered])

  const displaySummary = filteredSummary ?? summary

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Trophy className="text-cricket-400" /> Tournaments & Winners
        </h1>
        <p className="text-slate-400 mt-2">
          Browse tournament history, explore win distributions by team and format, and drill into the table.
        </p>
      </motion.div>

      {!loading && displaySummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 rounded-xl"
          >
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar size={14} /> Rows (current view)
            </div>
            <div className="text-2xl font-bold text-white mt-1">{displaySummary.total}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }} className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500">Distinct series / tournaments</div>
            <div className="text-2xl font-bold text-cricket-400 mt-1">{displaySummary.uniqueSeries}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }} className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Medal size={14} /> Top winner (in view)
            </div>
            <div className="text-lg font-semibold text-white mt-1 truncate" title={displaySummary.topWinners?.[0]?.name}>
              {displaySummary.topWinners?.[0]?.name ?? '—'}
            </div>
            <div className="text-xs text-slate-400">{displaySummary.topWinners?.[0]?.wins ?? 0} wins</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }} className="glass-panel p-4 rounded-xl">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <AlertCircle size={14} /> Drawn / NR / tied
            </div>
            <div className="text-2xl font-bold text-amber-400/90 mt-1">{displaySummary.inconclusive}</div>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6">
          <h2 className="text-lg font-bold text-cricket-400 mb-2">Most tournament wins (current filters)</h2>
          <p className="text-xs text-slate-500 mb-4">Excludes drawn, no result, tied, and abandoned rows.</p>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={(filteredSummary ?? summary)?.topWinners?.slice(0, 10) ?? []}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" width={120} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                <Bar dataKey="wins" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6">
          <h2 className="text-lg font-bold text-cricket-400 mb-2">Records by format (current filters)</h2>
          <p className="text-xs text-slate-500 mb-4">Share of rows in the filtered result set.</p>
          {loading ? (
            <div className="h-[280px] flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={(filteredSummary ?? summary)?.byFormat ?? []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {((filteredSummary ?? summary)?.byFormat ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="glass-panel p-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search tournament / winner / season…"
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cricket-500 focus:outline-none"
          />
        </div>

        <select
          value={format}
          onChange={e => setFormat(e.target.value)}
          className="bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cricket-500"
        >
          {formats.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-panel p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="text-xs text-slate-500 mb-3">
              Showing <span className="text-slate-300 font-medium">{filtered.length}</span> rows
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-cricket-400">Series / Tournament</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Season</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Winner</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Margin</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Format</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filtered.slice(0, 250).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-200">{r['Series/Tournament']}</td>
                      <td className="px-4 py-3 text-slate-300">{r.Season}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{r.Winner}</td>
                      <td className="px-4 py-3 text-slate-300">{r.Margin}</td>
                      <td className="px-4 py-3 text-slate-300">{r.Format ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 250 && (
              <p className="text-xs text-slate-500 mt-3">Showing first 250 rows (performance safeguard).</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
