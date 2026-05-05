'use client'
import { useState } from 'react'

export default function OutlierDetection({ data }) {
  if (!data) return null
  const [selectedMetric, setSelectedMetric] = useState(data[0]?.metric)
  const selected = data.find(d=>d.metric===selectedMetric)
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {data.map(d=>(
          <button key={d.metric} onClick={()=>setSelectedMetric(d.metric)} className={`px-3 py-1 rounded text-sm transition-all ${selectedMetric===d.metric?'bg-cricket-500 text-white':'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
            {d.metric.replace(/_/g,' ')}
          </button>
        ))}
      </div>
      {selected && (
        <div className="bg-slate-800/50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center"><p className="text-sm text-slate-400">Outliers Detected</p><p className="text-3xl font-bold text-red-400">{selected.count}</p></div>
            <div className="text-center"><p className="text-sm text-slate-400">Valid Range</p><p className="text-lg font-medium text-cricket-400">{selected.lower_bound.toFixed(2)} - {selected.upper_bound.toFixed(2)}</p></div>
            <div className="text-center"><p className="text-sm text-slate-400">IQR</p><p className="text-lg font-medium text-blue-400">{selected.q1.toFixed(2)} - {selected.q3.toFixed(2)}</p></div>
          </div>
          <div className="relative h-20 bg-slate-700/30 rounded-lg overflow-hidden mt-4">
            <div className="absolute inset-y-0 left-0 w-[5%] bg-slate-600/30"/>
            <div className="absolute inset-y-0 right-0 w-[5%] bg-slate-600/30"/>
            <div className="absolute top-1/2 -translate-y-1/2 h-10 bg-cricket-500/40 border-x-2 border-cricket-500" style={{left:'15%',width:'70%'}}/>
            <div className="absolute top-1/2 -translate-y-1/2 w-1 h-14 bg-white" style={{left:'50%'}}/>
            <div className="absolute top-1/2 -translate-y-1/2 left-[2%] w-3 h-3 bg-red-500 rounded-full"/>
            <div className="absolute top-1/2 -translate-y-1/2 right-[2%] w-3 h-3 bg-red-500 rounded-full"/>
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2 px-1"><span>Min</span><span>Q1</span><span>Median</span><span>Q3</span><span>Max</span></div>
        </div>
      )}
    </div>
  )
}