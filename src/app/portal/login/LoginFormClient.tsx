'use client'

import { useActionState } from 'react'
import { portalLoginAction } from './actions'

export function LoginFormClient({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState(portalLoginAction, null)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8">
          <h1 className="text-[#F5F0E8] font-mono text-2xl font-semibold tracking-widest uppercase mb-1">
            AWA/OS
          </h1>
          <p className="text-[#555050] font-mono text-xs tracking-widest uppercase">
            Client portal
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="slug" value={slug} />

          <div className="flex flex-col gap-1.5">
            <label className="text-[#555050] font-mono text-xs uppercase tracking-widest">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="your@email.com"
              className="bg-[#111111] text-[#F5F0E8] font-mono text-sm border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A] px-4 py-3 outline-none transition-colors duration-150 placeholder:text-[#2A2A2A]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#555050] font-mono text-xs uppercase tracking-widest">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="bg-[#111111] text-[#F5F0E8] font-mono text-sm border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A] px-4 py-3 outline-none transition-colors duration-150 placeholder:text-[#2A2A2A]"
            />
          </div>

          {state?.error && (
            <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full mt-2 bg-[#F5F0E8] text-[#0A0A0A] hover:bg-[#E8E3DB] disabled:opacity-40 font-mono font-medium text-sm px-4 py-3 transition-colors duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            {pending ? (
              <>
                <span className="inline-block w-3 h-3 border border-[#0A0A0A] border-t-transparent animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in →'
            )}
          </button>
        </form>

        <p className="text-[#2A2A2A] font-mono text-xs mt-8 text-center">
          Need access? Contact your project manager.
        </p>
      </div>
      <p className="fixed bottom-4 right-4 text-[#2A2A2A] font-mono text-[10px] tracking-widest">v0.1.0</p>
    </div>
  )
}
