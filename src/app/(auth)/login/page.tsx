'use client'

import { useActionState } from 'react'
import { AuthShell } from '@/components/brand/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signIn } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <AuthShell title="Kia ora." subtitle="Sign in to AWA/OS.">
      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Email"
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@tewairama.digital"
        />
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        {state?.error && <p className="text-sm text-coral">{state.error}</p>}
        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {pending ? 'Signing in…' : 'Sign in →'}
        </Button>
      </form>
    </AuthShell>
  )
}
