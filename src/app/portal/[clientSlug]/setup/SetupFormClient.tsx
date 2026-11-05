'use client'

import { useActionState } from 'react'
import { AuthShell } from '@/components/brand/AuthShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { setupPasswordAction } from './actions'

export default function SetupFormClient({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(setupPasswordAction, null)

  return (
    <AuthShell title="Nau mai." subtitle="Welcome. Set a password to open your project portal.">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="token" value={token} />
        <Input
          label="Password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <Input
          label="Confirm password"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Type it again"
        />
        {state?.error && <p className="text-sm text-coral">{state.error}</p>}
        <Button type="submit" size="lg" loading={pending} className="mt-2 w-full">
          {pending ? 'Setting up…' : 'Create password →'}
        </Button>
      </form>
    </AuthShell>
  )
}
