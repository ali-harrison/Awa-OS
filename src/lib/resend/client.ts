import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const FROM_ADDRESS = 'AWA OS <no-reply@tewairama.digital>'

// ─── EMAIL TEMPLATE KEYS ──────────────────────────────────────────────────────

export const EMAIL_TEMPLATES = {
  WELCOME_CLIENT: 'welcome_client',
  QUESTIONNAIRE_LINK: 'questionnaire_link',
  PROPOSAL: 'proposal',
  CONTRACT: 'contract',
  INVOICE: 'invoice',
  PAYMENT_RECEIVED: 'payment_received',
  PROJECT_COMPLETE: 'project_complete',
  TESTIMONIAL_REQUEST: 'testimonial_request',
  REMINDER_QUESTIONNAIRE: 'reminder_questionnaire',
  REMINDER_PROPOSAL: 'reminder_proposal',
} as const

export type EmailTemplateKey = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES]
