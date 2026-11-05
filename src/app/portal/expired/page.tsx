import Link from 'next/link'
import { AuthShell } from '@/components/brand/AuthShell'

export default function ExpiredPage() {
  return (
    <AuthShell
      title="Link expired."
      subtitle="This portal link has expired or has already been used."
    >
      <div className="flex flex-col gap-3 text-sm">
        <Link href="/portal/login" className="font-medium text-bone transition-colors hover:text-amber">
          Already set your password? Log in →
        </Link>
        <a href="mailto:ali@tewairama.digital" className="text-muted transition-colors hover:text-amber">
          Need a new link? ali@tewairama.digital
        </a>
      </div>
    </AuthShell>
  )
}
