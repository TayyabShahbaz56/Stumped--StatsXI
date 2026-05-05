'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'

export default function PlayerRadar({ data }) {
  if (!data) return null
  const radarData = [
    { subject: 'Batting Avg', A: 85, B: 65, fullMark: 100 },
    { subject: 'Strike Rate', A: 90, B: 70, fullMark: 100 },
    { subject: 'Runs', A: 80, B: 85, fullMark: 100 },
    { subject: 'Consistency', A: 75, B: 80, fullMark: 100 },
    { subject: 'Form', A: 95, B: 60, fullMark: 100 },
    { subject: 'Impact', A: 88, B: 72, fullMark: 100 },
  ]
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
        <PolarGrid stroke="#334155"/>
        <PolarAngleAxis dataKey="subject" tick={{fill:'#94a3b8',fontSize:12}}/>
        <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:'#64748b',fontSize:10}}/>
        <Radar name="Top Performer" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.3}/>
        <Radar name="League Average" dataKey="B" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3}/>
        <Legend wrapperStyle={{color:'#94a3b8'}}/>
      </RadarChart>
    </ResponsiveContainer>
  )
}