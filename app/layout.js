import './globals.css'
import { Inter } from 'next/font/google'
import TeamHeader from '../components/TeamHeader'
const inter = Inter({ subsets: ['latin'] })
export const metadata = {
  title: 'Stumped! | StatsXI - Cricket Analytics',
  description: 'Advanced cricket player performance analytics by StatsXI with real-time form tracking',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TeamHeader />
        <main className="min-h-screen bg-slate-950 text-white">{children}</main>
      </body>
    </html>
  )
}