'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from 'recharts'

export default function ConfidenceInterval({ data }) {
  if (!data) return null
  const chartData = data.map(ci=>({name:ci.metric.replace(/_/g,' '),mean:ci.mean,lower:ci.lower,upper:ci.upper,error:[ci.mean-ci.lower,ci.upper-ci.mean]}))
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/><YAxis stroke="#94a3b8" fontSize={12}/>
        <Tooltip content={({active,payload})=>{if(active&&payload&&payload.length){const d=payload[0].payload;return(<div className="bg-slate-900 border border-slate-700 p-3 rounded-lg"><p className="text-white font-medium">{d.name}</p><p className="text-cricket-400">Mean: {d.mean.toFixed(2)}</p><p className="text-blue-400">95% CI: [{d.lower.toFixed(2)}, {d.upper.toFixed(2)}]</p></div>)}return null}}/>
        <Bar dataKey="mean" fill="#10b981" radius={[4,4,0,0]}><ErrorBar dataKey="error" width={4} strokeWidth={2} stroke="#3b82f6"/></Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}