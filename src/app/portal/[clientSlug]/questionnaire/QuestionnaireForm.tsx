'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { submitQuestionnaireAction } from './actions'
import type { QuestionnaireTemplate, QuestionnaireResponse, QuestionItem } from '@/types'

export function QuestionnaireForm({
  template,
  projectId,
  existingResponse,
}: {
  template: QuestionnaireTemplate
  projectId: string
  existingResponse: QuestionnaireResponse | null
}) {
  const questions: QuestionItem[] = [
    ...template.questions,
  ].sort((a, b) => a.order - b.order)

  const [answers, setAnswers] = useState<Record<string, string>>(
    existingResponse?.responses ?? {}
  )
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(existingResponse?.completed ?? false)
  const [error, setError] = useState<string | null>(null)

  if (submitted) {
    return (
      <div className="border border-[#4CAF7D33] bg-[#4CAF7D0A] px-6 py-8 text-center">
        <p className="text-[#4CAF7D] font-mono text-sm font-medium mb-2">Questionnaire received</p>
        <p className="text-[#8A8580] font-mono text-sm leading-relaxed">
          Thank you — we&apos;ll review your answers and be in touch shortly.
        </p>
        {existingResponse?.submitted_at && (
          <p className="text-[#555050] font-mono text-xs mt-4">
            Submitted {new Date(existingResponse.submitted_at).toLocaleDateString('en-NZ', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}
        {/* Show read-only answers */}
        <div className="mt-8 text-left flex flex-col gap-4">
          {questions.map((q) => answers[q.id] && (
            <div key={q.id} className="border-l-2 border-[#1A1A1A] pl-4">
              <p className="text-[#555050] font-mono text-xs mb-1">{q.question}</p>
              <p className="text-[#F5F0E8] font-mono text-sm">{answers[q.id]}</p>
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
      <p className="text-[#555050] font-mono text-xs border border-[#1A1A1A] px-3 py-2">
        Questions marked <span className="text-[#E05252]">*</span> are required. Take your time — you can come back to this page and your answers will be saved.
      </p>

      {questions.map((q, i) => (
        <div key={q.id} className="flex flex-col gap-2">
          <label className="text-[#F5F0E8] font-mono text-sm font-medium">
            <span className="text-[#555050] mr-2">{String(i + 1).padStart(2, '0')}.</span>
            {q.question}
            {q.required && <span className="text-[#E05252] ml-1">*</span>}
          </label>
          {q.hint && (
            <p className="text-[#555050] font-mono text-xs">{q.hint}</p>
          )}
          <textarea
            value={answers[q.id] ?? ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            rows={3}
            className="w-full bg-[#111111] text-[#F5F0E8] border border-[#2A2A2A] hover:border-[#3A3A3A] focus:border-[#C9963A] font-mono text-sm px-3 py-2 outline-none resize-y placeholder:text-[#555050] transition-colors duration-150"
            placeholder="Your answer…"
          />
        </div>
      ))}

      {error && (
        <p className="text-[#E05252] font-mono text-xs border border-[#E0525233] bg-[#E0525211] px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" loading={submitting} className="self-start">
        Submit questionnaire →
      </Button>
    </form>
  )
}
