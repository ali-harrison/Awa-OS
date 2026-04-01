import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export const FROM_ADDRESS = 'AWA/OS <noreply@tewairama.co.nz>'

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
