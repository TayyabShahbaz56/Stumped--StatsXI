'use client'
import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Calculator, TrendingUp, Activity, Target, Table2 } from 'lucide-react'
import DatasetControls from '../../components/DatasetControls'

export default function AnalysisPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('descriptive')
  const [kind, setKind] = useState('batting')
  const [format, setFormat] = useState('t20')
  const [metric, setMetric] = useState('Batting_Avg')

  const availableMetrics = useMemo(() => {
    const keys = Object.keys(stats?.descriptive ?? {})
    return keys.length ? keys : (kind === 'bowling' ? ['Economy_Rate', 'Wickets', 'Bowling_Avg'] : ['Batting_Avg', 'Strike_Rate', 'Runs_Scored'])
  }, [stats, kind])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!cancelled) setLoading(true)
      const url = `/api/stats?kind=${encodeURIComponent(kind)}&format=${encodeURIComponent(format)}&metric=${encodeURIComponent(metric)}`
      try {
        const res = await fetch(url)
        const json = await res.json()
        if (!cancelled) setStats(json)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [kind, format, metric])

  useEffect(() => {
    setMetric(kind === 'bowling' ? 'Economy_Rate' : 'Batting_Avg')
  }, [format, kind])

  const tabs = [
    { id: 'descriptive', label: 'Descriptive Stats', icon: Calculator },
    { id: 'probability', label: 'Probability', icon: Target },
    { id: 'regression', label: 'Regression', icon: TrendingUp },
    { id: 'correlation', label: 'Correlation', icon: Activity },
  ]
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Deep Statistical Analysis</h1>
        <p className="text-slate-400">Comprehensive statistical methods applied to cricket data</p>
      </motion.div>

      <div className="mb-6">
        <DatasetControls
          kind={kind}
          setKind={setKind}
          format={format}
          setFormat={setFormat}
          availableFormats={stats?.dataset_info?.available?.formats}
          metric={metric}
          setMetric={setMetric}
          availableMetrics={availableMetrics}
          compact
        />
      </div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab===tab.id?'bg-cricket-500 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <tab.icon size={16}/>{tab.label}
          </button>
        ))}
      </div>
      {loading && !stats ? (
        <div className="glass-panel p-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-cricket-500 border-t-transparent rounded-full" />
          </div>
        </div>
      ) : (
      <div className="space-y-8">
        {activeTab==='descriptive' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div className="glass-panel p-6 mb-6">
              <h2 className="text-xl font-bold text-cricket-400 mb-4 flex items-center gap-2"><Table2 size={20}/>Descriptive Statistics Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800"><tr><th className="px-4 py-3 text-left text-cricket-400">Metric</th><th className="px-4 py-3 text-right text-cricket-400">Mean</th><th className="px-4 py-3 text-right text-cricket-400">Median</th><th className="px-4 py-3 text-right text-cricket-400">Std Dev</th><th className="px-4 py-3 text-right text-cricket-400">Min</th><th className="px-4 py-3 text-right text-cricket-400">Max</th><th className="px-4 py-3 text-right text-cricket-400">Skewness</th></tr></thead>
                  <tbody className="divide-y divide-slate-700">
                    {Object.entries(stats.descriptive||{}).map(([metric,values])=> (
                      <tr key={metric} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-white font-medium">{metric.replace(/_/g,' ')}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.mean?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.median?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.std?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.min?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.max?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-slate-300">{values.skewness?.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-cricket-400 mb-4">{(stats?.distribution?.metric||metric).replace(/_/g,' ')} Histogram</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={(stats?.distribution?.histogram?.counts || []).map((c, i) => ({
                      bin: i + 1,
                      count: c,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155"/><XAxis dataKey="bin" stroke="#94a3b8"/><YAxis stroke="#94a3b8"/>
                    <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155'}}/><Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-cricket-400 mb-4">Available Formats</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(stats?.dataset_info?.formats || []).map((f, idx) => ({ name: String(f).toUpperCase(), value: idx + 1 }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color,index)=>(<Cell key={`cell-${index}`} fill={color}/>))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab==='probability' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-cricket-400 mb-4">Distribution Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-800/50 p-4 rounded-lg"><p className="text-sm text-slate-400">Mean (μ)</p><p className="text-2xl font-bold text-white">{stats.distribution?.mean?.toFixed(2)}</p></div>
                <div className="bg-slate-800/50 p-4 rounded-lg"><p className="text-sm text-slate-400">Std Dev (σ)</p><p className="text-2xl font-bold text-white">{stats.distribution?.std?.toFixed(2)}</p></div>
                <div className="bg-slate-800/50 p-4 rounded-lg"><p className="text-sm text-slate-400">Shapiro-Wilk p-value</p><p className="text-2xl font-bold text-white">{stats.distribution?.shapiro_p?.toFixed(4)}</p><p className="text-xs text-cricket-400 mt-1">{stats.distribution?.shapiro_p>0.05?'✓ Normal Distribution':'✗ Not Normal'}</p></div>
              </div>
              <div className="bg-slate-800/30 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Interpretation:</h4>
                <p className="text-sm text-slate-400 leading-relaxed">The selected metric <span className="text-slate-200 font-medium">{(stats.distribution?.metric||metric).replace(/_/g,' ')}</span> has mean {stats.distribution?.mean?.toFixed(2)} and standard deviation {stats.distribution?.std?.toFixed(2)}. (Normality test fields are optional; you can include Shapiro-Wilk if you later add a stats library.)</p>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab==='regression' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-cricket-400 mb-4">Multiple Regression Models</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">Model: {stats.regression?.x_label?.replace(/_/g,' ') || 'X'} → {stats.regression?.y_label?.replace(/_/g,' ') || 'Y'}</h3>
                  <p className="text-sm text-slate-400 mb-4">Equation: {stats.regression?.y_label || 'Y'} = {stats.regression?.slope?.toFixed(2)} × {stats.regression?.x_label || 'X'} + {stats.regression?.intercept?.toFixed(2)}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">R² Score:</span><span className="text-cricket-400 font-medium">{stats.regression?.r2?.toFixed(3)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Correlation:</span><span className="text-cricket-400 font-medium">{Math.sqrt(stats.regression?.r2||0)?.toFixed(3)}</span></div>
                  </div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h3 className="font-medium text-white mb-2">Prediction Calculator</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400">Enter {stats.regression?.x_label || 'X'}:</label>
                      <input type="number" placeholder="e.g., 150" className="w-full mt-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:border-cricket-500 focus:outline-none" onChange={(e)=>{const x=parseFloat(e.target.value);if(Number.isFinite(x)&&stats.regression){const predicted=stats.regression.slope*x+stats.regression.intercept;const el=document.getElementById('prediction-result');if(el)el.textContent=`Predicted ${stats.regression.y_label||'Y'}: ${predicted.toFixed(2)}`}}}/>
                    </div>
                    <p id="prediction-result" className="text-cricket-400 font-bold text-lg"></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab==='correlation' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}>
            <div className="glass-panel p-6">
              <h2 className="text-xl font-bold text-cricket-400 mb-4">Correlation Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-cricket-400">Variable</th>
                      {(stats?.correlation?.metrics ?? []).map(metricName => (
                        <th key={metricName} className="px-4 py-3 text-right text-cricket-400">
                          {metricName.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {(stats?.correlation?.rows ?? []).map((row,idx)=>(
                      <tr key={idx} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-white font-medium">{String(row.metric).replace(/_/g, ' ')}</td>
                        {row.values.map((val,i)=>(<td key={i} className={`px-4 py-3 text-right font-mono ${Math.abs(val)>0.7?'text-cricket-400 font-bold':Math.abs(val)>0.4?'text-blue-400':'text-slate-400'}`}>{val.toFixed(2)}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-4">* Values range from -1 (perfect negative) to +1 (perfect positive). Bold green indicates strong correlation.</p>
            </div>
          </motion.div>
        )}
      </div>
      )}
    </div>
  )
}