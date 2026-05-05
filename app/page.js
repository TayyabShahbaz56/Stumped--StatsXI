'use client'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import StatsCards from '../components/StatsCards'
import DistributionChart from '../components/DistributionChart'
import RegressionPlot from '../components/RegressionPlot'
import LiveMatches from '../components/LiveMatches'
import PlayerRadar from '../components/PlayerRadar'
import ConfidenceInterval from '../components/ConfidenceInterval'
import OutlierDetection from '../components/OutlierDetection'
import PlayerFormComparison from '../components/PlayerFormComparison'
import PlayerCompare from '../components/PlayerCompare'
import DatasetControls from '../components/DatasetControls'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(true)
  const [kind, setKind] = useState('batting')
  const [format, setFormat] = useState('t20')
  const [metric, setMetric] = useState('Batting_Avg')

  const availableMetrics = useMemo(() => {
    const keys = Object.keys(stats?.descriptive ?? {})
    return keys.length ? keys : (kind === 'bowling' ? ['Economy_Rate', 'Wickets', 'Bowling_Avg'] : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored'])
  }, [stats, kind])

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3400)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!cancelled) setLoading(true)
      try {
        const url = `/api/stats?kind=${encodeURIComponent(kind)}&format=${encodeURIComponent(format)}&metric=${encodeURIComponent(metric)}`
        const res = await fetch(url)
        const d = await res.json()
        if (!res.ok) throw new Error(d?.error ?? 'Failed to load stats')
        if (!cancelled) setStats(d)
      } catch {
        if (!cancelled) setStats(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [kind, format, metric])

  useEffect(() => {
    setMetric(kind === 'bowling' ? 'Economy_Rate' : 'Batting_Avg')
  }, [format, kind])

  if (showWelcome) {
    return (
      <div className="min-h-[78vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center gap-5"
        >
          <Image
            src="/logo.png"
            alt="Stumped logo"
            width={150}
            height={150}
            className="rounded-full ring-4 ring-emerald-500/35 shadow-xl shadow-black/40"
            priority
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
            STUMPED! <span className="text-cricket-400">by StatsXI</span>
          </h1>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold text-white">Cricket Performance <span className="text-cricket-400">Analytics</span></h2>
        <p className="text-slate-400 max-w-2xl mx-auto">Advanced statistical analysis combining historical datasets with real-time CricAPI live match data. Featuring regression modeling, probability distributions, confidence intervals, outlier detection, and interactive player comparison.</p>
      </motion.div>
      <DatasetControls
        kind={kind}
        setKind={setKind}
        format={format}
        setFormat={setFormat}
        availableFormats={stats?.dataset_info?.available?.formats}
        metric={metric}
        setMetric={setMetric}
        availableMetrics={availableMetrics}
      />
      {loading && !stats ? (
        <div className="glass-panel p-10">
          <div className="flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
          </div>
        </div>
      ) : (
        <>
      <StatsCards data={stats?.descriptive} datasetInfo={stats?.dataset_info}/>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6">
        <PlayerCompare kind={kind} format={format} />
      </motion.div>
      {kind === 'batting' && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6 border-2 border-cricket-500/30">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-cricket-500/20 text-cricket-400 text-xs font-bold rounded uppercase tracking-wider">Live</span>
            <h3 className="text-xl font-bold text-white">Player Form Tracker</h3>
          </div>
          <p className="text-sm text-slate-400 mb-6">Search any player and compare their career strike-rate with current live innings (when available).</p>
          <PlayerFormComparison/>
        </motion.div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{duration:0.18}} className="glass-panel p-6">
          <h3 className="text-xl font-bold text-cricket-400 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-cricket-500 rounded-full"/>Regression: {stats?.regression?.y_label?.replace(/_/g,' ')||'Y'} vs {stats?.regression?.x_label?.replace(/_/g,' ')||'X'}</h3>
          <RegressionPlot data={stats?.regression}/>
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg space-y-2">
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Model:</strong> Linear Regression</p>
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">R² Score:</strong> {stats?.regression?.r2?.toFixed(3)||'N/A'}</p>
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Equation:</strong> {stats?.regression?.y_label||'Y'} = {stats?.regression?.slope?.toFixed(2)||'N/A'} x {stats?.regression?.x_label||'X'} + {stats?.regression?.intercept?.toFixed(2)||'N/A'}</p>
          </div>
        </motion.div>
        <motion.div initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{duration:0.18}} className="glass-panel p-6">
          <h3 className="text-xl font-bold text-cricket-400 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-cricket-500 rounded-full"/>{(stats?.distribution?.metric||metric).replace(/_/g,' ')} Distribution</h3>
          <DistributionChart data={stats?.distribution}/>
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg space-y-1">
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Distribution:</strong> Normal (Gaussian)</p>
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Mean:</strong> {stats?.distribution?.mean?.toFixed(2)||'N/A'}</p>
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Std Dev:</strong> {stats?.distribution?.std?.toFixed(2)||'N/A'}</p>
            <p className="text-sm text-slate-300"><strong className="text-cricket-400">Shapiro-Wilk p-value:</strong> {stats?.distribution?.shapiro_p?.toFixed(4)||'N/A'}</p>
          </div>
        </motion.div>
      </div>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6">
        <h3 className="text-xl font-bold text-cricket-400 mb-4">95% Confidence Intervals</h3>
        <ConfidenceInterval data={stats?.confidence_intervals}/>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800"><tr><th className="px-4 py-3 text-left text-cricket-400">Metric</th><th className="px-4 py-3 text-left text-cricket-400">Mean</th><th className="px-4 py-3 text-left text-cricket-400">Lower CI</th><th className="px-4 py-3 text-left text-cricket-400">Upper CI</th><th className="px-4 py-3 text-left text-cricket-400">Margin of Error</th></tr></thead>
            <tbody className="divide-y divide-slate-700">
              {stats?.confidence_intervals?.map((ci,idx)=>(
                <tr key={idx} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-300">{ci.metric}</td>
                  <td className="px-4 py-3 text-slate-300">{ci.mean.toFixed(2)}</td>
                  <td className="px-4 py-3 text-cricket-400">{ci.lower.toFixed(2)}</td>
                  <td className="px-4 py-3 text-cricket-400">{ci.upper.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-400">±{ci.margin.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6">
        <h3 className="text-xl font-bold text-cricket-400 mb-4">Outlier Detection (IQR Method)</h3>
        <OutlierDetection data={stats?.outliers}/>
      </motion.div>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6">
        {kind === 'batting' ? (
          <>
            <h3 className="text-xl font-bold text-cricket-400 mb-4">Player Performance Radar</h3>
            <PlayerRadar data={stats?.player_comparison}/>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold text-cricket-400 mb-4">Top Bowlers (by Wickets)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-cricket-400">Player</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Wickets</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Economy</th>
                    <th className="px-4 py-3 text-left text-cricket-400">Bowling Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {(stats?.player_comparison ?? []).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-200">{p.Player}</td>
                      <td className="px-4 py-3 text-slate-200">{p.Wickets ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-200">{typeof p.Economy_Rate === 'number' ? p.Economy_Rate.toFixed(2) : '—'}</td>
                      <td className="px-4 py-3 text-slate-200">{typeof p.Bowling_Avg === 'number' ? p.Bowling_Avg.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="glass-panel p-6">
        <h3 className="text-xl font-bold text-cricket-400 mb-4 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>Live Matches (Real-Time API)</h3>
        <LiveMatches/>
      </motion.div>
        </>
      )}
    </div>
  )
}