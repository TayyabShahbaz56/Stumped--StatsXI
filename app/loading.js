import Image from 'next/image'

export default function Loading() {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center gap-5 px-4 py-16">
      <Image
        src="/logo.png"
        alt=""
        width={64}
        height={64}
        className="rounded-full object-cover shadow-lg shadow-black/40 ring-2 ring-emerald-500/30"
        priority
      />
      <div className="flex flex-col items-center gap-2">
        <div
          className="h-9 w-9 rounded-full border-2 border-emerald-500/40 border-t-emerald-400 animate-spin"
          aria-hidden
        />
        <p className="text-xs tracking-wide text-slate-500">Loading…</p>
      </div>
    </div>
  )
}
