'use client'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts'

export default function RegressionPlot({ data }) {
  if (!data?.sample_data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-sm text-slate-400 border border-dashed border-slate-700 rounded-xl px-4 text-center">
        <p>{data?.note || 'Not enough paired data for regression (e.g. Test batting may not include strike rate).'}</p>
      </div>
    )
  }
  const minX = Math.min(...data.sample_data.map(d=>d.x))
  const maxX = Math.max(...data.sample_data.map(d=>d.x))
  const lineData = [{x:minX,y:data.slope*minX+data.intercept},{x:maxX,y:data.slope*maxX+data.intercept}]
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>
        <XAxis type="number" dataKey="x" name={data.x_label || 'X'} stroke="#94a3b8" fontSize={12}/>
        <YAxis type="number" dataKey="y" name={data.y_label || 'Y'} stroke="#94a3b8" fontSize={12}/>
        <Tooltip cursor={{strokeDasharray:'3 3'}} contentStyle={{backgroundColor:'#1e293b',border:'1px solid #334155',borderRadius:'8px'}}/>
        <Scatter name="Actual Data" data={data.sample_data} fill="#3b82f6" fillOpacity={0.6}/>
        <Line data={lineData} dataKey="y" stroke="#10b981" strokeWidth={2} dot={false} name="Regression Line"/>
      </ScatterChart>
    </ResponsiveContainer>
  )
}