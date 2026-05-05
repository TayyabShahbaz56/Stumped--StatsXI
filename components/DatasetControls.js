'use client'
import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'

export default function DatasetControls({
  kind,
  setKind,
  format,
  setFormat,
  availableFormats = ['t20', 'odi', 'test'],
  metric,
  setMetric,
  availableMetrics = [],
  compact = false,
}) {
  const formats = availableFormats?.length ? availableFormats : ['t20', 'odi', 'test']
  const metrics = availableMetrics?.length ? availableMetrics : []

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`glass-panel ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-cricket-400" />
          <div>
            <div className="text-sm font-semibold text-white">Dataset filters</div>
            <div className="text-xs text-slate-400">Switch format and discipline without reloading the page.</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-2 bg-slate-900/40 border border-slate-800 rounded-xl p-1">
            {['batting', 'bowling'].map(k => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  kind === k ? 'bg-cricket-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cricket-500"
          >
            {formats.map(f => (
              <option key={f} value={f}>{String(f).toUpperCase()}</option>
            ))}
          </select>

          {setMetric && metrics.length > 0 && (
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cricket-500"
              title="Distribution metric"
            >
              {metrics.map(m => (
                <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </motion.div>
  )
}

