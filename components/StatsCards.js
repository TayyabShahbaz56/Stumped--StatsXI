'use client'
import { motion } from 'framer-motion'
import { TrendingUp, Target, Award, Zap, Database, BadgeInfo, Shield, Activity } from 'lucide-react'

function isNum(x) {
  return typeof x === 'number' && Number.isFinite(x)
}

function statCard({ title, value, subtitle, detail, icon, color }) {
  return { title, value, subtitle, detail, icon, color }
}

export default function StatsCards({ data, datasetInfo }) {
  if (!data) return null

  const cards = []

  const avg = data.Batting_Avg
  if (avg && isNum(avg.mean)) {
    cards.push(
      statCard({
        title: 'Batting Average',
        value: avg.mean.toFixed(2),
        subtitle: isNum(avg.median) ? `Median: ${avg.median.toFixed(2)}` : 'Median: —',
        detail: isNum(avg.min) && isNum(avg.max) ? `Range: ${avg.min.toFixed(1)} - ${avg.max.toFixed(1)}` : 'Range: —',
        icon: Target,
        color: 'from-emerald-500 to-teal-600',
      })
    )
  }

  const sr = data.Strike_Rate
  if (sr && isNum(sr.mean)) {
    cards.push(
      statCard({
        title: 'Strike Rate',
        value: sr.mean.toFixed(2),
        subtitle: isNum(sr.median) ? `Median: ${sr.median.toFixed(2)}` : 'Median: —',
        detail: isNum(sr.min) && isNum(sr.max) ? `Range: ${sr.min.toFixed(0)} - ${sr.max.toFixed(0)}` : 'Range: —',
        icon: Zap,
        color: 'from-blue-500 to-indigo-600',
      })
    )
  }

  const runs = data.Runs_Scored
  if (runs && isNum(runs.mean)) {
    cards.push(
      statCard({
        title: 'Runs Scored',
        value: runs.mean.toFixed(0),
        subtitle: 'Mean (per player record)',
        detail: isNum(runs.max) ? `Max: ${runs.max.toFixed(0)} runs` : 'Max: —',
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-600',
      })
    )
  }

  if (avg && isNum(avg.std)) {
    cards.push(
      statCard({
        title: 'Consistency',
        value: avg.std.toFixed(2),
        subtitle: 'Std deviation (Avg)',
        detail: 'Lower means more consistent',
        icon: Award,
        color: 'from-cyan-500 to-blue-600',
      })
    )
  }

  if (datasetInfo?.total_records) {
    cards.push(
      statCard({
        title: 'Dataset Size',
        value: `${datasetInfo.total_records}`,
        subtitle: `Formats: ${(datasetInfo.formats ?? []).join(', ') || '—'}`,
        detail: 'Local dataset powering the analysis',
        icon: Database,
        color: 'from-slate-700 to-slate-800',
      })
    )
  }

  // Small “what am I seeing?” card, helps explain why some metrics are missing.
  const selectedKind = datasetInfo?.selected?.kind
  const selectedFormat = datasetInfo?.selected?.format

  const wkts = data.Wickets
  const econ = data.Economy_Rate
  const bowlAvg = data.Bowling_Avg

  if (selectedKind === 'bowling' || wkts || econ || bowlAvg) {
    if (wkts && isNum(wkts.mean)) {
      cards.push(
        statCard({
          title: 'Wickets',
          value: wkts.mean.toFixed(1),
          subtitle: isNum(wkts.median) ? `Median: ${wkts.median.toFixed(0)}` : 'Median: —',
          detail: isNum(wkts.max) ? `Max: ${wkts.max.toFixed(0)}` : 'Max: —',
          icon: Shield,
          color: 'from-orange-500 to-red-600',
        })
      )
    }
    if (econ && isNum(econ.mean)) {
      cards.push(
        statCard({
          title: 'Economy Rate',
          value: econ.mean.toFixed(2),
          subtitle: isNum(econ.median) ? `Median: ${econ.median.toFixed(2)}` : 'Median: —',
          detail: isNum(econ.min) && isNum(econ.max) ? `Range: ${econ.min.toFixed(2)} - ${econ.max.toFixed(2)}` : 'Range: —',
          icon: Activity,
          color: 'from-yellow-500 to-amber-600',
        })
      )
    }
  }

  cards.push(
    statCard({
      title: 'Note',
      value: `${String(selectedFormat ?? 't20').toUpperCase()} ${selectedKind ?? 'batting'}`,
      subtitle: 'Metrics adapt to chosen dataset',
      detail: 'Use the filters above to switch batting/bowling + format.',
      icon: BadgeInfo,
      color: 'from-emerald-900 to-slate-900',
    })
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card,idx)=> (
        <motion.div key={card.title} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:idx*0.1}} className={`bg-gradient-to-br ${card.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">{card.title}</p>
              <p className="text-white text-3xl font-bold mt-2">{card.value}</p>
              <p className="text-white/70 text-xs mt-1">{card.subtitle}</p>
              <p className="text-white/50 text-xs mt-2">{card.detail}</p>
            </div>
            <card.icon className="text-white/30" size={28}/>
          </div>
        </motion.div>
      ))}
    </div>
  )
}