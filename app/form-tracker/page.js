'use client'
import { motion } from 'framer-motion'
import PlayerFormComparison from '../../components/PlayerFormComparison'
import { TrendingUp, Info } from 'lucide-react'

export default function FormTrackerPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3"><TrendingUp className="text-cricket-400"/>Player Form Tracker</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">Premium feature combining Kaggle career statistics with real-time CricketData API match performance. Track if players are performing above, below, or at their career averages.</p>
      </motion.div>
      <div className="glass-panel p-6 mb-8">
        <div className="flex items-start gap-3">
          <Info className="text-cricket-400 mt-1 flex-shrink-0" size={20}/>
          <div className="text-sm text-slate-400">
            <p className="text-white font-medium mb-1">How it works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><span className="text-emerald-400">Career Stats</span> — Historical data from Kaggle dataset (averages, strike rates, totals)</li>
              <li><span className="text-blue-400">Live Match</span> — Real-time performance from CricAPI (current innings & strike rate)</li>
              <li><span className="text-yellow-400">Form Assessment</span> — Dynamic comparison showing if player is above/below/at career level</li>
            </ul>
          </div>
        </div>
      </div>
      <PlayerFormComparison fullPage />
    </div>
  )
}