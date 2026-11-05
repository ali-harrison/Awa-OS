import { River } from '@/components/river/River'
import { Wordmark } from './Wordmark'

/** The front door, shared by every login-style page: a big river running behind the form. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-x-[-8%] top-[22%] h-[64vh] -rotate-6">
        <River />
      </div>

      <header className="relative px-6 py-6 md:px-12">
        <Wordmark className="text-sm" />
      </header>

      <main className="relative flex flex-1 items-center px-5 pb-16 md:px-12 lg:px-[11%]">
        <div className="w-full max-w-[420px] animate-rise rounded-3xl border border-line bg-ink/85 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="font-display text-[44px] leading-[1.05] text-bone">{title}</h1>
          {subtitle && <p className="mt-2.5 text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </main>

      <p className="absolute right-6 bottom-5 hidden font-mono text-[12px] text-dim sm:block md:right-12">
        <span className="text-muted">awa</span> · river
      </p>
    </div>
  )
}
