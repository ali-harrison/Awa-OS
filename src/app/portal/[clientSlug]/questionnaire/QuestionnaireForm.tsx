'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { submitQuestionnaireAction } from './actions'
import type { QuestionnaireTemplate, QuestionnaireResponse, QuestionItem } from '@/types'

const card = {
  background: '#0f0f0f',
  border: '1px solid #1f1f1f',
  borderRadius: 6,
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
} as const

export function QuestionnaireForm({
  template,
  projectId,
  existingResponse,
}: {
  template: QuestionnaireTemplate
  projectId: string
  existingResponse: QuestionnaireResponse | null
}) {
  const questions: QuestionItem[] = [...template.questions].sort((a, b) => a.order - b.order)

  const [answers, setAnswers] = useState<Record<string, string>>(existingResponse?.responses ?? {})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(existingResponse?.completed ?? false)
  const [error, setError] = useState<string | null>(null)

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        {/* Confirmation banner */}
        <div style={{ ...card, border: '1px solid rgba(245,158,11,0.25)', padding: '24px' }}>
          <p className="font-mono text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>Questionnaire received</p>
          <p className="font-mono text-sm leading-relaxed" style={{ color: '#555555' }}>
            Thank you — we&apos;ll review your answers and be in touch shortly.
          </p>
          {existingResponse?.submitted_at && (
            <p className="font-mono text-xs mt-3" style={{ color: '#555555' }}>
              Submitted {new Date(existingResponse.submitted_at).toLocaleDateString('en-NZ', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Read-only answers */}
        <div style={{ ...card, padding: '24px' }} className="flex flex-col gap-6">
          {questions.map((q) => answers[q.id] && (
            <div key={q.id} className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: '#555555' }}>{q.question}</p>
              <p className="font-mono text-sm font-medium" style={{ color: '#f0ece3' }}>{answers[q.id]}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const unanswered = questions.filter((q) => q.required && !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      setError(`Please answer all required questions (${unanswered.length} remaining).`)
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await submitQuestionnaireAction(projectId, template.id, answers)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Files notice */}
      <div style={{ background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: 6, padding: '12px 16px' }}>
        <p className="font-mono text-xs font-medium mb-1" style={{ color: '#f59e0b' }}>Files & assets</p>
        <p className="font-mono text-xs leading-relaxed" style={{ color: '#555555' }}>
          Files & assets can be uploaded in the Files tab once your project is set up. No need to attach anything here.
        </p>
      </div>

      {/* Required notice */}
      <p className="font-mono text-xs" style={{ color: '#555555' }}>
        Questions marked <span style={{ color: '#ef4444' }}>*</span> are required. You can come back and your answers will be saved.
      </p>

      {/* Questions */}
      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2">
          <label className="font-mono text-sm font-medium" style={{ color: '#f0ece3' }}>
            <span className="mr-2" style={{ color: '#555555' }}>{String(i + 1).padStart(2, '0')}.</span>
            {q.question}
            {q.required && <span className="ml-1" style={{ color: '#ef4444' }}>*</span>}
          </label>
          {q.hint && (
            <p className="font-mono text-xs" style={{ color: '#555555' }}>{q.hint}</p>
          )}
          <textarea
            value={answers[q.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            rows={3}
            className="w-full font-mono text-sm px-3 py-2 outline-none resize-y transition-colors duration-150"
            style={{ background: '#111111', color: '#f0ece3', border: '1px solid #2a2a2a', borderRadius: 4 }}
            placeholder="Your answer…"
            onFocus={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#2a2a2a'}
          />
        </div>
      ))}

      {error && (
        <p className="font-mono text-xs px-3 py-2" style={{ color: '#ef4444', background: '#ef444411', border: '1px solid #ef444433', borderRadius: 4 }}>
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} className="self-start">
        Submit questionnaire →
      </Button>
    </form>
  )
}
