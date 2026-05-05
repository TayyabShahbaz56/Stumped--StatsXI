'use client'

import { motion } from 'framer-motion'

/**
 * Wraps each route segment to give a quick fade when navigating.
 * Dev mode stays heavier than production; this mainly improves perceived responsiveness.
 */
export default function Template({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
