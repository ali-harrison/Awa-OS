'use client'

import { useState, useTransition, type FormEvent } from 'react'

/**
 * Submit a form through a Server Action that returns `{ error }` on failure and
 * null on success. Drives the pending state and error message, and keeps what the
 * user typed if the action fails (a plain `<form action>` clears the fields either way).
 */
export function useFormSubmit(
  action: (formData: FormData) => Promise<{ error: string } | null>,
  onSuccess?: () => void
) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const result = await action(formData)
      setError(result?.error ?? null)
      if (!result) {
        form.reset()
        onSuccess?.()
      }
    })
  }

  return { onSubmit, error, pending }
}
