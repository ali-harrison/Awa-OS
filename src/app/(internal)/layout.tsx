import { Sidebar } from '@/components/layout/Sidebar'

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col bg-[radial-gradient(70%_40%_at_60%_-5%,color-mix(in_srgb,var(--color-amber)_7%,transparent),transparent)] md:flex-row">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
