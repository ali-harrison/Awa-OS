'use client'

import { useActionState } from 'react'
import { signIn } from './actions'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[380px]">

        {/* Wordmark */}
        <div className="mb-10">
          <h1 className="text-[#F5F0E8] font-mono text-3xl font-semibold tracking-widest uppercase">
            AWA/OS
          </h1>
          <p className="text-[#2A2A2A] font-mono text-xs tracking-widest uppercase mt-1">
            Te Wairama Digital
          </p>
        </div>

        {/* Form */}
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[#555050] font-mono text-xs uppercase tracking-widest"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              placeholder="you@tewairama.co.nz"
              className="
                bg-[#111111] text-[#F5F0E8] font-mono text-sm
                border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A]
                px-4 py-3 w-full
                placeholder:text-[#2A2A2A]
                outline-none
                transition-colors duration-150
              "
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[#555050] font-mono text-xs uppercase tracking-widest"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="
                bg-[#111111] text-[#F5F0E8] font-mono text-sm
                border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A]
                px-4 py-3 w-full
                placeholder:text-[#2A2A2A]
                outline-none
                transition-colors duration-150
              "
            />
          </div>

          {/* Error */}
          {state?.error && (
            <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="
              w-full mt-2
              bg-[#F5F0E8] text-[#0A0A0A]
              hover:bg-[#E8E3DB]
              disabled:opacity-40 disabled:cursor-not-allowed
              font-mono font-medium text-sm tracking-tight
              px-4 py-3
              transition-colors duration-150
              flex items-center justify-center gap-2
              cursor-pointer
            "
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
      </div>

      {/* Version tag */}
      <p className="fixed bottom-4 right-4 text-[#2A2A2A] font-mono text-[10px] tracking-widest">
        v0.1.0
      </p>
    </div>
  )
}
