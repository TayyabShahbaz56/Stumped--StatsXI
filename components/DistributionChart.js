'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DistributionChart({ data }) {
  if (!data) return null
  if (data.empty || !data.pdf_curve?.x?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl">
        Not enough numeric data for this metric, or distribution is undefined.
      </div>
    )
  }
  const xs = data.pdf_curve.x
  const ys = data.pdf_curve.y || []
  const chartData = xs
    .map((x, i) => {
      const xv = typeof x === 'number' && Number.isFinite(x) ? x : null
      const yv = typeof ys[i] === 'number' && Number.isFinite(ys[i]) ? ys[i] : 0
      if (xv == null) return null
      return { x: xv.toFixed(1), pdf: yv }
    })
    .filter(Boolean)
  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-slate-500 border border-dashed border-slate-700 rounded-xl">
        Could not plot distribution (invalid values).
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorPdf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
        <XAxis dataKey="x" stroke="#94a3b8" fontSize={12}/><YAxis stroke="#94a3b8" fontSize={12}/>
        <Tooltip contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}} itemStyle={{color:'#10b981'}}/>
        <Area type="monotone" dataKey="pdf" stroke="#10b981" fillOpacity={1} fill="url(#colorPdf)" name="Probability Density"/>
      </AreaChart>
    </ResponsiveContainer>
  )
}