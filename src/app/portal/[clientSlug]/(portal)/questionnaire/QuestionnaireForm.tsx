'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormError, Textarea } from '@/components/ui/Input'
import { saveQuestionnaireDraftAction, submitQuestionnaireAction } from './actions'
import { formatDate } from '@/lib/format'
import type { QuestionnaireTemplate, QuestionnaireResponse, QuestionItem } from '@/types'

export function QuestionnaireForm({
  template,
  projectId,
  clientSlug,
  existingResponse,
}: {
  template: QuestionnaireTemplate
  projectId: string
  clientSlug: string
  existingResponse: QuestionnaireResponse | null
}) {
  const questions: QuestionItem[] = [...template.questions].sort((a, b) => a.order - b.order)

  const [answers, setAnswers] = useState<Record<string, string>>(existingResponse?.responses ?? {})
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [submitted, setSubmitted] = useState(existingResponse?.completed ?? false)
  const [error, setError] = useState<string | null>(null)

  if (submitted) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="border-pounamu/30">
          <p className="font-display text-2xl text-pounamu">Questionnaire received</p>
          <p className="mt-1 text-muted">
            Thank you — we&apos;ll review your answers and be in touch shortly.
          </p>
          {existingResponse?.submitted_at && (
            <p className="mt-2 font-mono text-xs text-dim">
              Submitted {formatDate(existingResponse.submitted_at, 'long')}
            </p>
          )}
        </Card>

        <Card padding="none" className="divide-y divide-line overflow-hidden">
          {questions.map((q) => answers[q.id] && (
            <div key={q.id} className="px-6 py-4">
              <p className="mb-1 text-[13px] text-dim">{q.question}</p>
              <p className="text-sm leading-relaxed text-bone">{answers[q.id]}</p>
            </div>
          ))}
        </Card>
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
    const result = await submitQuestionnaireAction(clientSlug, projectId, template.id, answers)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true)
    setDraftSaved(false)
    setError(null)
    const result = await saveQuestionnaireDraftAction(clientSlug, projectId, template.id, answers)
    setSavingDraft(false)
    if (result.error) setError(result.error)
    else setDraftSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-dim">
        Questions marked <span className="text-coral">*</span> are required. Save a draft to come back and finish later.
        Files can go in the Files tab, so there&apos;s no need to attach anything here.
      </p>

      <Card padding="none" className="divide-y divide-line">
        {questions.map((q, i) => (
          <div key={q.id} className="flex flex-col gap-2 px-6 py-5">
            <label htmlFor={q.id} className="text-[15px] font-medium text-bone">
              <span className="mr-2.5 font-mono text-xs text-amber">{String(i + 1).padStart(2, '0')}</span>
              {q.question}
              {q.required && <span className="ml-1 text-coral">*</span>}
            </label>
            {q.hint && <p className="text-[13px] text-dim">{q.hint}</p>}
            <Textarea
              id={q.id}
              value={answers[q.id] ?? ''}
              onChange={(e) => {
                setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                setDraftSaved(false)
              }}
              rows={3}
              placeholder="Your answer…"
            />
          </div>
        ))}
      </Card>

      {error && <FormError>{error}</FormError>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={submitting} disabled={savingDraft}>
          Submit questionnaire →
        </Button>
        <Button type="button" variant="secondary" loading={savingDraft} disabled={submitting} onClick={handleSaveDraft}>
          Save draft
        </Button>
        {draftSaved && <span className="text-sm text-pounamu">Draft saved</span>}
      </div>
    </form>
  )
}
