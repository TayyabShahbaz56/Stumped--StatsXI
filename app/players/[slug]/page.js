'use client'
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, Gauge, Trophy, Target, Activity } from 'lucide-react'
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
} from 'recharts'

function zScore(value, mean, std) {
  if (typeof value !== 'number' || typeof mean !== 'number' || typeof std !== 'number' || std === 0) return 0
  return (value - mean) / std
}

function PlayerDetailInner() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params?.slug

  const kind = (searchParams.get('kind') || 'batting').toLowerCase()
  const format = (searchParams.get('format') || 't20').toLowerCase()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const setDataset = useCallback(
    (nextKind, nextFormat) => {
      const q = new URLSearchParams(searchParams.toString())
      q.set('kind', nextKind)
      q.set('format', nextFormat)
      router.replace(`/players/${slug}?${q.toString()}`)
    },
    [router, searchParams, slug]
  )

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const qs = new URLSearchParams({
          kind,
          format,
        })
        const res = await fetch(`/api/players/${slug}?${qs}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load player')
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e?.message ?? 'Failed to load player')
        if (!cancelled) setData(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (slug) run()
    return () => {
      cancelled = true
    }
  }, [slug, kind, format])

  const radarData = useMemo(() => {
    if (!data?.summary) return []
    const s = data.summary
    if (data.kind === 'bowling') {
      return [
        {
          metric: 'Wickets',
          value: zScore(s.wickets.value, s.wickets.dataset_mean, s.wickets.dataset_std),
        },
        {
          metric: 'Economy (inv)',
          value: -zScore(s.economy_rate.value, s.economy_rate.dataset_mean, s.economy_rate.dataset_std),
        },
        {
          metric: 'Bowling avg (inv)',
          value: -zScore(s.bowling_avg.value, s.bowling_avg.dataset_mean, s.bowling_avg.dataset_std),
        },
      ].map(d => ({ ...d, value: Math.max(-2.5, Math.min(2.5, d.value)) }))
    }
    return [
      { metric: 'Batting Avg', value: zScore(s.batting_avg.value, s.batting_avg.dataset_mean, s.batting_avg.dataset_std) },
      { metric: 'Strike Rate', value: zScore(s.strike_rate.value, s.strike_rate.dataset_mean, s.strike_rate.dataset_std) },
      { metric: 'Runs', value: zScore(s.runs_scored.value, s.runs_scored.dataset_mean, s.runs_scored.dataset_std) },
    ].map(d => ({ ...d, value: Math.max(-2.5, Math.min(2.5, d.value)) }))
  }, [data])

  const bars = useMemo(() => {
    const p = data?.player
    if (!p) return []
    if (data?.kind === 'bowling') {
      return [
        { name: 'Wickets', value: p.wickets ?? 0 },
        { name: 'Runs conc.', value: typeof p.runs_conceded === 'number' ? p.runs_conceded : 0 },
        { name: 'Balls', value: typeof p.balls_bowled === 'number' ? p.balls_bowled : 0 },
        { name: 'Overs', value: typeof p.overs === 'number' ? Math.round(p.overs * 10) / 10 : 0 },
      ]
    }
    return [
      { name: '100s', value: p.hundreds ?? 0 },
      { name: '50s', value: p.fifties ?? 0 },
      { name: '4s', value: p.fours ?? 0 },
      { name: '6s', value: p.sixes ?? 0 },
    ]
  }, [data])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-spin w-12 h-12 border-4 border-cricket-500 border-t-transparent rounded-full mx-auto mt-24" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href="/players" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> Back to players
        </Link>
        <div className="glass-panel p-6 border border-red-500/30 text-red-200 mt-6">{error}</div>
      </div>
    )
  }

  const p = data?.player
  const isBowling = data?.kind === 'bowling'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/players" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> Back to players
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-500">Dataset: {data?.file ?? '—'}</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Kind</label>
            <select
              value={kind}
              onChange={e => setDataset(e.target.value, format)}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white"
            >
              <option value="batting">Batting</option>
              <option value="bowling">Bowling</option>
            </select>
            <label className="text-xs text-slate-500">Format</label>
            <select
              value={format}
              onChange={e => setDataset(kind, e.target.value)}
              className="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white"
            >
              <option value="t20">T20</option>
              <option value="odi">ODI</option>
              <option value="test">TEST</option>
            </select>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <h1 className="text-3xl font-bold text-white">{p?.name}</h1>
        <p className="text-slate-400 mt-2">
          {p?.span ? `Span: ${p.span}` : 'Career summary'} • Matches: {p?.matches ?? '—'} •{' '}
          {isBowling ? `Innings bowled: ${p?.innings ?? '—'}` : `Innings: ${p?.innings ?? '—'}`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {isBowling ? (
            <>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Trophy size={16} /> Wickets
                </div>
                <div className="text-3xl font-bold text-cricket-400">{p?.wickets ?? '—'}</div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Gauge size={16} /> Economy
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {typeof p?.economy_rate === 'number' ? p.economy_rate.toFixed(2) : '—'}
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Activity size={16} /> Bowling average
                </div>
                <div className="text-3xl font-bold text-white">
                  {typeof p?.bowling_avg === 'number' ? p.bowling_avg.toFixed(2) : '—'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Target size={16} /> Batting Average
                </div>
                <div className="text-3xl font-bold text-cricket-400">
                  {typeof p?.batting_avg === 'number' ? p.batting_avg.toFixed(2) : '—'}
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Gauge size={16} /> Strike Rate
                </div>
                <div className="text-3xl font-bold text-blue-400">
                  {typeof p?.strike_rate === 'number' ? p.strike_rate.toFixed(2) : '—'}
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Trophy size={16} /> Runs Scored
                </div>
                <div className="text-3xl font-bold text-white">
                  {typeof p?.runs === 'number' ? p.runs.toLocaleString() : '—'}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6">
          <h2 className="text-lg font-bold text-cricket-400 mb-4 flex items-center gap-2">
            <BarChart3 size={18} /> Dataset-relative performance (z-score)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            {isBowling
              ? 'Economy and bowling average use inverted z-scores so “higher on chart” still means better for the player.'
              : 'Shows how this player compares to the dataset mean (0). Values above 0 indicate above-average performance.'}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <PolarRadiusAxis domain={[-2.5, 2.5]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-6">
          <h2 className="text-lg font-bold text-cricket-400 mb-4">
            {isBowling ? 'Core bowling indicators' : 'Milestones & boundary breakdown'}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
        <h2 className="text-lg font-bold text-cricket-400 mb-4">Player record (tabular)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-cricket-400">Field</th>
                <th className="px-4 py-3 text-left text-cricket-400">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {isBowling
                ? [
                    ['Bowling SR', p?.bowling_sr],
                    ['Runs conceded', p?.runs_conceded],
                    ['Balls bowled', p?.balls_bowled],
                    ['Overs', p?.overs],
                  ].map(([k, v]) => (
                    <tr key={k} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-300">{k}</td>
                      <td className="px-4 py-3 text-white font-medium">{v ?? '—'}</td>
                    </tr>
                  ))
                : [
                    ['Highest Score', p?.hs],
                    ['Balls Faced', p?.balls_faced],
                    ['Not Out', p?.not_out],
                    ['0s', p?.zeros],
                    ['100s', p?.hundreds],
                    ['50s', p?.fifties],
                    ['4s', p?.fours],
                    ['6s', p?.sixes],
                  ].map(([k, v]) => (
                    <tr key={k} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-300">{k}</td>
                      <td className="px-4 py-3 text-white font-medium">{v ?? '—'}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default function PlayerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-spin w-12 h-12 border-4 border-cricket-500 border-t-transparent rounded-full mx-auto mt-24" />
        </div>
      }
    >
      <PlayerDetailInner />
    </Suspense>
  )
}
