'use client'

import { useActionState } from 'react'
import { AuthShell } from '@/components/brand/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { portalLoginAction } from './actions'

export function LoginFormClient({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(portalLoginAction, null)

  return (
    <AuthShell title="Kia ora." subtitle="Sign in to follow your project.">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="slug" value={slug} />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          placeholder="your@email.com"
        />
        <Input label="Password" name="password" type="password" required autoComplete="current-password" />
        {state?.error && <p className="text-sm text-coral">{state.error}</p>}
        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {pending ? 'Signing in…' : 'Sign in →'}
        </Button>
        <p className="text-center text-sm text-dim">Need access? Contact your project manager.</p>
      </form>
    </AuthShell>
  )
}
