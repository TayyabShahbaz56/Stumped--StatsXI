'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ScatterChart,
  Scatter, ReferenceLine, Cell
} from 'recharts'
import { Activity, Target, Zap, GitBranch } from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────
async function fetchAdvanced(endpoint, params = {}) {
  const qs = new URLSearchParams({ endpoint, ...params }).toString()
  const res = await fetch(`/api/advanced?${qs}`)
  return res.json()
}

const CRICKET  = '#10b981'
const ACCENT   = '#34d399'
const BLUE     = '#3b82f6'
const AMBER    = '#f59e0b'
const RED      = '#ef4444'
const PURPLE   = '#8b5cf6'

const zColor = (z) => {
  if (z >= 2)   return '#10b981'
  if (z >= 0.5) return '#34d399'
  if (z >= -0.5)return '#f59e0b'
  return '#ef4444'
}

// ── sub-components ────────────────────────────────────────────────────────────

function InfoBox({ label, value, sub }) {
  return (
    <div className="bg-slate-800/50 p-4 rounded-lg">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-cricket-400 mt-1">{sub}</p>}
    </div>
  )
}

function FormulaBox({ formula, interpretation }) {
  return (
    <div className="bg-slate-800/30 rounded-lg p-4 space-y-2">
      <p className="text-xs text-slate-400 uppercase tracking-wider">Formula</p>
      <p className="font-mono text-cricket-400 text-sm">{formula}</p>
      {interpretation && (
        <p className="text-sm text-slate-300 leading-relaxed">{interpretation}</p>
      )}
    </div>
  )
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full"
      />
    </div>
  )
}

function ApiError({ detail }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
      <p className="text-red-400 font-semibold mb-1">Python API Unavailable</p>
      <p className="text-slate-400 text-sm">{detail || 'Start the Python API with: python python-api/app.py'}</p>
    </div>
  )
}

// ── Poisson Panel ─────────────────────────────────────────────────────────────
function PoissonPanel() {
  const [data, setData]   = useState(null)
  const [lam,  setLam]    = useState(2.5)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetchAdvanced('poisson', { lam })
    setData(d)
    setLoading(false)
  }, [lam])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">λ — Avg wickets per match</label>
          <input
            type="number" min="0.1" max="10" step="0.1"
            value={lam}
            onChange={e => setLam(parseFloat(e.target.value) || 2.5)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-36 focus:border-cricket-500 focus:outline-none"
          />
        </div>
        <button onClick={load} className="px-4 py-2 bg-cricket-500 hover:bg-cricket-600 text-white rounded-lg text-sm font-medium transition-colors">
          Recalculate
        </button>
      </div>

      {loading ? <SectionLoader /> : data?.error ? <ApiError detail={data.detail} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoBox label="Lambda (λ)" value={data.lam} sub="avg wickets/match" />
            <InfoBox label="Mean"       value={data.mean} />
            <InfoBox label="Variance"   value={data.variance} sub="= λ for Poisson" />
            <InfoBox label="Std Dev"    value={data.std} />
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-cricket-400 mb-4">
              P(X = k) — Probability of taking exactly k wickets
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.bars} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="k" stroke="#94a3b8" label={{ value: 'Wickets (k)', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v, n) => [`${(v * 100).toFixed(2)}%`, n === 'probability' ? 'P(X=k)' : 'Cumulative']}
                />
                <Bar dataKey="probability" name="probability" radius={[4, 4, 0, 0]}>
                  {data.bars.map((entry, i) => (
                    <Cell key={i} fill={entry.k === data.mode ? AMBER : CRICKET} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="cumulative" stroke={AMBER} strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2">
              🟡 Highlighted bar = mode ({data.mode} wickets — most likely outcome)
            </p>
          </div>

          <FormulaBox formula={data.formula} interpretation={data.interpretation} />
        </>
      )}
    </div>
  )
}

// ── Binomial Panel ────────────────────────────────────────────────────────────
function BinomialPanel() {
  const [data, setData]   = useState(null)
  const [n,    setN]      = useState(20)
  const [p,    setP]      = useState(0.15)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetchAdvanced('binomial', { n, p })
    setData(d)
    setLoading(false)
  }, [n, p])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">n — Balls faced</label>
          <input type="number" min="1" max="120" step="1" value={n}
            onChange={e => setN(parseInt(e.target.value) || 20)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-28 focus:border-cricket-500 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">p — Boundary probability</label>
          <input type="number" min="0.01" max="0.99" step="0.01" value={p}
            onChange={e => setP(parseFloat(e.target.value) || 0.15)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white w-28 focus:border-cricket-500 focus:outline-none" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-cricket-500 hover:bg-cricket-600 text-white rounded-lg text-sm font-medium transition-colors">
          Recalculate
        </button>
      </div>

      {loading ? <SectionLoader /> : data?.error ? <ApiError detail={data.detail} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoBox label="n (trials)"  value={data.n}        sub="balls faced" />
            <InfoBox label="p (success)" value={`${(data.p * 100).toFixed(1)}%`} sub="boundary/ball" />
            <InfoBox label="Mean (μ)"    value={data.mean}     sub="expected boundaries" />
            <InfoBox label="Std Dev (σ)" value={data.std} />
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-cricket-400 mb-1">
              P(X = k) — Probability of hitting exactly k boundaries in {data.n} balls
            </h3>
            {data.normal_valid && (
              <p className="text-xs text-slate-400 mb-4">Normal approximation overlay shown (valid since n·p ≥ 5)</p>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.bars} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="k" stroke="#94a3b8" label={{ value: 'Boundaries (k)', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v) => [`${(v * 100).toFixed(2)}%`, 'P(X=k)']}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {data.bars.map((entry, i) => (
                    <Cell key={i} fill={entry.k === data.mode ? AMBER : BLUE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2">
              🟡 Highlighted bar = mode ({data.mode} boundaries — most likely outcome)
            </p>
          </div>

          <FormulaBox formula={data.formula} interpretation={data.interpretation} />
        </>
      )}
    </div>
  )
}

// ── Z-Score Panel ─────────────────────────────────────────────────────────────
function ZScorePanel() {
  const [data,   setData]   = useState(null)
  const [metric, setMetric] = useState('Batting_Avg')
  const [loading, setLoading] = useState(true)

  const metrics = ['Batting_Avg', 'Strike_Rate', 'Runs_Scored']

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetchAdvanced('zscore', { metric, top_n: 15 })
    setData(d)
    setLoading(false)
  }, [metric])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {metrics.map(m => (
          <button key={m} onClick={() => setMetric(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${metric === m ? 'bg-cricket-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {m.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? <SectionLoader /> : data?.error ? <ApiError detail={data.detail} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <InfoBox label="Metric"  value={data.metric.replace(/_/g, ' ')} />
            <InfoBox label="Mean (μ)" value={data.mean} />
            <InfoBox label="Std Dev (σ)" value={data.std} />
          </div>

          {/* Bell curve */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-cricket-400 mb-4">
              Normal Distribution — {data.metric.replace(/_/g, ' ')}
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.bell_curve} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="x" stroke="#94a3b8" tickFormatter={v => v.toFixed(0)}
                  label={{ value: data.metric.replace(/_/g, ' '), position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tickFormatter={v => v.toFixed(3)} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v) => [v.toFixed(5), 'PDF']} />
                <ReferenceLine x={data.mean} stroke={AMBER} strokeDasharray="4 4" label={{ value: `μ=${data.mean}`, fill: AMBER, fontSize: 11 }} />
                <ReferenceLine x={data.mean + data.std}  stroke="#6366f1" strokeDasharray="3 3" />
                <ReferenceLine x={data.mean - data.std}  stroke="#6366f1" strokeDasharray="3 3" />
                <ReferenceLine x={data.mean + 2 * data.std} stroke={RED} strokeDasharray="3 3" />
                <ReferenceLine x={data.mean - 2 * data.std} stroke={RED} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="y" stroke={CRICKET} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2">
              🟡 μ = mean &nbsp;|&nbsp; 🟣 ±1σ &nbsp;|&nbsp; 🔴 ±2σ
            </p>
          </div>

          {/* Ranked bar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-cricket-400 mb-4">Top 15 Players by Z-Score</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.top_players} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="player" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(v, n) => [v, n === 'z' ? 'Z-Score' : data.metric.replace(/_/g, ' ')]} />
                  <Bar dataKey="z" name="z" radius={[0, 4, 4, 0]}>
                    {data.top_players.map((entry, i) => (
                      <Cell key={i} fill={zColor(entry.z)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4">Bottom 15 Players by Z-Score</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.bot_players} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="player" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    formatter={(v) => [v, 'Z-Score']} />
                  <Bar dataKey="z" radius={[0, 4, 4, 0]}>
                    {data.bot_players.map((entry, i) => (
                      <Cell key={i} fill={zColor(entry.z)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <FormulaBox formula={data.formula} interpretation={data.interpretation} />
        </>
      )}
    </div>
  )
}

// ── Covariance Panel ──────────────────────────────────────────────────────────
function CovariancePanel() {
  const [data, setData]   = useState(null)
  const [kind, setKind]   = useState('batting')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetchAdvanced('covariance', { kind })
    setData(d)
    setLoading(false)
  }, [kind])

  useEffect(() => { load() }, [load])

  const cellColor = (val, isCov) => {
    if (isCov) return 'text-slate-300'
    const abs = Math.abs(val)
    if (abs > 0.7) return 'text-cricket-400 font-bold'
    if (abs > 0.4) return 'text-blue-400'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['batting', 'bowling'].map(k => (
          <button key={k} onClick={() => setKind(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${kind === k ? 'bg-cricket-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {k}
          </button>
        ))}
      </div>

      {loading ? <SectionLoader /> : data?.error ? <ApiError detail={data.detail} /> : (
        <>
          {/* Side-by-side matrices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Covariance */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-cricket-400 mb-4">Covariance Matrix</h3>
              <p className="text-xs text-slate-400 mb-3">Values in original units² — shows magnitude of joint variability</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-cricket-400">Metric</th>
                      {data.covariance.metrics.map(m => (
                        <th key={m} className="px-3 py-2 text-right text-cricket-400 text-xs">{m.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {data.covariance.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-white font-medium text-xs">{row.metric.replace(/_/g, ' ')}</td>
                        {row.values.map((v, j) => (
                          <td key={j} className={`px-3 py-2 text-right font-mono text-xs ${cellColor(v, true)}`}>
                            {v > 1000 ? v.toFixed(0) : v.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Correlation */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-blue-400 mb-4">Correlation Matrix (Pearson)</h3>
              <p className="text-xs text-slate-400 mb-3">Unitless — ranges from −1 to +1</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-blue-400">Metric</th>
                      {data.correlation.metrics.map(m => (
                        <th key={m} className="px-3 py-2 text-right text-blue-400 text-xs">{m.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {data.correlation.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-white font-medium text-xs">{row.metric.replace(/_/g, ' ')}</td>
                        {row.values.map((v, j) => (
                          <td key={j} className={`px-3 py-2 text-right font-mono text-xs ${cellColor(v, false)}`}>
                            {v.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-3">🟢 Strong (&gt;0.7) &nbsp;|&nbsp; 🔵 Moderate (&gt;0.4) &nbsp;|&nbsp; ⬜ Weak</p>
            </div>
          </div>

          {/* Scatter pairs */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-cricket-400 mb-4">Scatter Plot Matrix — Metric Pairs</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {data.scatter_pairs.map((pair, idx) => (
                <div key={idx}>
                  <p className="text-xs text-slate-400 mb-2 text-center">
                    {pair.x_label.replace(/_/g, ' ')} vs {pair.y_label.replace(/_/g, ' ')}
                    <span className="ml-2 text-cricket-400">r = {pair.corr}</span>
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 9 }}
                        label={{ value: pair.x_label.replace(/_/g, ' '), position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 9 }} />
                      <YAxis dataKey="y" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        formatter={(v, n) => [v, n === 'x' ? pair.x_label : pair.y_label]} />
                      <Scatter data={pair.points} fill={[CRICKET, BLUE, PURPLE][idx % 3]} opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>

          <FormulaBox formula={data.formula} interpretation={data.interpretation} />
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'poisson',    label: 'Poisson Distribution',   icon: Target,    color: 'text-cricket-400' },
  { id: 'binomial',   label: 'Binomial Distribution',  icon: Activity,  color: 'text-blue-400'    },
  { id: 'zscore',     label: 'Z-Score Analysis',        icon: Zap,       color: 'text-amber-400'   },
  { id: 'covariance', label: 'Covariance Matrix',       icon: GitBranch, color: 'text-purple-400'  },
]

export default function AdvancedPage() {
  const [activeTab, setActiveTab] = useState('poisson')

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Advanced Statistics</h1>
          <span className="px-2 py-1 bg-cricket-500/20 text-cricket-400 text-xs font-bold rounded uppercase tracking-wider">Python</span>
        </div>
        <p className="text-slate-400">
          Powered by a Python Flask microservice — Poisson, Binomial, Z-Score, and Covariance analysis on cricket data.
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cricket-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        <div className="glass-panel p-6">
          {activeTab === 'poisson'    && <PoissonPanel />}
          {activeTab === 'binomial'   && <BinomialPanel />}
          {activeTab === 'zscore'     && <ZScorePanel />}
          {activeTab === 'covariance' && <CovariancePanel />}
        </div>
      </motion.div>
    </div>
  )
}
