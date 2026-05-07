'use client'
import { motion } from 'framer-motion'
import { Trophy, Users, Activity, Menu, X, TrendingUp, FlaskConical } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Activity },
  { href: '/analysis', label: 'Deep Analysis', icon: Trophy },
  { href: '/live', label: 'Live Matches', icon: Users },
  { href: '/players', label: 'Players', icon: Users },
  { href: '/form-tracker', label: 'Form Tracker', icon: TrendingUp },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/advanced', label: 'Advanced Stats', icon: FlaskConical },
]

export default function TeamHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Warm route bundles/data once header mounts to reduce click-to-render delay.
    NAV_ITEMS.forEach(item => router.prefetch(item.href))
  }, [router])
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-900 border-b border-emerald-500/30 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch className="flex items-center gap-3 sm:gap-4 min-w-0 group">
            <Image
              src="/logo.png"
              alt="Stumped! — StatsXI"
              width={52}
              height={52}
              className="h-11 w-11 sm:h-[52px] sm:w-[52px] rounded-full object-cover shrink-0 ring-2 ring-amber-500/35 shadow-md shadow-black/30 transition-transform duration-200 group-hover:scale-[1.03]"
              priority
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-cricket-400 tracking-tight truncate">Stumped!</h1>
              <p className="text-[10px] sm:text-xs text-cricket-300/70 uppercase tracking-widest truncate">
                StatsXI Cricket Analytics
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => router.prefetch(item.href)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${isActive ? 'bg-cricket-500/20 text-cricket-400 border border-cricket-500/30' : 'text-emerald-100 hover:bg-cricket-500/10'}`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2 bg-cricket-500/10 px-3 py-1 rounded-full border border-cricket-500/20">
            <Users size={14} className="text-cricket-400"/>
            <span className="text-xs text-cricket-300 font-medium">StatsXI</span>
          </div>
          <button className="md:hidden text-white" onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen?<X size={24}/>:<Menu size={24}/>}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.nav initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} className="md:hidden mt-4 space-y-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-emerald-100 hover:bg-cricket-500/10"
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </div>
    </motion.header>
  )
}