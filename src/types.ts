// AWA/OS — Central Type Definitions

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type ClientType = 'charity' | 'gym' | 'consultant' | 'ecom' | 'other'
export type ClientStatus = 'lead' | 'prospect' | 'active' | 'completed' | 'paused'

export type ProjectStatus =
  | 'onboarding'
  | 'questionnaire_sent'
  | 'questionnaire_received'
  | 'proposal_sent'
  | 'contract_sent'
  | 'deposit_pending'
  | 'deposit_paid'
  | 'in_progress'
  | 'review'
  | 'complete'

export type ProjectTier = 'tier1' | 'tier2' | 'tier3'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type QuestionnaireClientType = 'charity' | 'gym' | 'consultant' | 'ecom' | 'other' | 'base'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'
export type FileType = 'brand_asset' | 'document' | 'image' | 'contract' | 'invoice' | 'other'
export type FileUploader = 'client' | 'internal'
export type CalendarEventType = 'deadline' | 'meeting' | 'milestone' | 'reminder'
export type EmailStatus = 'sent' | 'failed'

// ─── DATABASE ROWS ────────────────────────────────────────────────────────────

export interface Client {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  company: string | null
  type: ClientType
  slug: string
  status: ClientStatus
  portal_access: boolean
  notes: string | null
}

/** Everything the internal UI needs. Leaves out the password hash and portal token, which must never reach a browser. */
export const CLIENT_COLUMNS = 'id, created_at, name, email, phone, company, type, slug, status, portal_access, notes'

export interface Project {
  id: string
  client_id: string
  created_at: string
  name: string
  status: ProjectStatus
  stage_updated_at: string
  start_date: string | null
  estimated_completion: string | null
  tier: ProjectTier | null
  value: number | null
  internal_notes: string | null
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  due_date: string | null
  visible_to_client: boolean
  created_at: string
}

export interface QuestionItem {
  id: string
  question: string
  hint: string | null
  required: boolean
  order: number
}

export interface QuestionnaireTemplate {
  id: string
  name: string
  client_type: QuestionnaireClientType
  questions: QuestionItem[]
}

export interface QuestionnaireResponse {
  id: string
  project_id: string
  template_id: string
  custom_questions: QuestionItem[]
  responses: Record<string, string>
  submitted_at: string | null
  completed: boolean
}

export interface LineItem {
  description: string
  quantity: number
  unit_price: number // in cents
  amount: number // in cents
}

export interface Invoice {
  id: string
  project_id: string | null
  client_id: string
  invoice_number: string
  status: InvoiceStatus
  amount: number // in cents
  gst_included: boolean
  due_date: string | null
  paid_at: string | null
  stripe_payment_link: string | null
  line_items: LineItem[]
  created_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  client_id: string
  name: string
  type: FileType
  storage_path: string
  uploaded_by: FileUploader
  created_at: string
}

export interface CalendarEvent {
  id: string
  project_id: string | null
  title: string
  description: string | null
  start_at: string
  end_at: string
  type: CalendarEventType
  visible_to_client: boolean
}

export interface EmailLog {
  id: string
  client_id: string
  project_id: string | null
  template_key: string
  subject: string
  sent_at: string
  status: EmailStatus
}

// ─── NEXT-STEP ENGINE ─────────────────────────────────────────────────────────

export const NEXT_ACTIONS: Record<ProjectStatus, string> = {
  onboarding: 'Send welcome email + questionnaire link',
  questionnaire_sent: 'Awaiting questionnaire — send reminder if >5 days',
  questionnaire_received: 'Review responses → send proposal',
  proposal_sent: 'Awaiting approval — follow up if >3 days',
  contract_sent: 'Awaiting signature',
  deposit_pending: 'Invoice sent — awaiting deposit payment',
  deposit_paid: 'Kick off project — create task list',
  in_progress: 'Check task completion → move to review when ready',
  review: 'Client reviewing — gather feedback',
  complete: 'Send testimonial request → archive project',
}

// ─── SHARED OPTION LISTS ──────────────────────────────────────────────────────

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'questionnaire_sent', label: 'Questionnaire Sent' },
  { value: 'questionnaire_received', label: 'Questionnaire Received' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'contract_sent', label: 'Contract Sent' },
  { value: 'deposit_pending', label: 'Deposit Pending' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'complete', label: 'Complete' },
]

/** Pipeline stages, in order. */
export const PROJECT_STAGES: ProjectStatus[] = PROJECT_STATUS_OPTIONS.map((o) => o.value)

export const CLIENT_TYPE_OPTIONS: { value: ClientType; label: string }[] = [
  { value: 'charity', label: 'Charity / NFP' },
  { value: 'gym', label: 'Gym / Fitness' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'ecom', label: 'E-Commerce' },
  { value: 'other', label: 'Other' },
]

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
]

export const EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'reminder', label: 'Reminder' },
]

// ─── INVOICE NUMBERS ──────────────────────────────────────────────────────────

/** Generate invoice number: TWD-{YEAR}-{4-digit-sequence} */
export function formatInvoiceNumber(year: number, sequence: number): string {
  return `TWD-${year}-${String(sequence).padStart(4, '0')}`
}
