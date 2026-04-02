// AWA/OS — Transactional email templates
// All rendered as plain HTML strings for Resend

export interface WelcomeClientVars {
  clientName: string
  projectName: string
  portalUrl: string
}

export interface QuestionnaireLinkVars {
  clientName: string
  projectName: string
  questionnaireUrl: string
}

export interface ProposalFollowUpVars {
  clientName: string
  projectName: string
}

export interface InvoiceSentVars {
  clientName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  paymentLink: string
}

export interface TestimonialRequestVars {
  clientName: string
  projectName: string
}

// ─── Template renderer ────────────────────────────────────────────────────────

const base = (body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { background: #0A0A0A; color: #F5F0E8; font-family: 'Courier New', monospace; padding: 40px 24px; max-width: 560px; margin: 0 auto; }
    .logo { font-size: 18px; font-weight: bold; letter-spacing: 4px; color: #F5F0E8; margin-bottom: 32px; }
    .divider { border: none; border-top: 1px solid #1A1A1A; margin: 24px 0; }
    p { font-size: 14px; line-height: 1.7; color: #8A8580; margin: 0 0 16px; }
    .highlight { color: #F5F0E8; }
    .btn { display: inline-block; background: #F5F0E8; color: #0A0A0A; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 13px; margin: 16px 0; }
    .footer { font-size: 11px; color: #2A2A2A; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="logo">AWA/OS</div>
  ${body}
  <hr class="divider">
  <p class="footer">Te Wairama Digital — tewairama.digital<br>This is an automated message from AWA/OS.</p>
</body>
</html>
`

export const templates = {
  welcome_client: {
    subject: (v: WelcomeClientVars) => `Welcome to your project — ${v.projectName}`,
    html: (v: WelcomeClientVars) => base(`
      <p>Kia ora <span class="highlight">${v.clientName}</span>,</p>
      <p>Welcome — I'm excited to be working with you on <span class="highlight">${v.projectName}</span>.</p>
      <p>Your project portal is now live. You can use it to track progress, view files, and pay invoices.</p>
      <a href="${v.portalUrl}" class="btn">View your portal →</a>
      <p>I'll be in touch shortly with your questionnaire so we can get started.</p>
      <p class="highlight">— Ali, Te Wairama Digital</p>
    `),
  },

  questionnaire_link: {
    subject: (v: QuestionnaireLinkVars) => `Your project questionnaire — ${v.projectName}`,
    html: (v: QuestionnaireLinkVars) => base(`
      <p>Kia ora <span class="highlight">${v.clientName}</span>,</p>
      <p>To get your project underway, I need a few details from you. It should take around 10–15 minutes.</p>
      <a href="${v.questionnaireUrl}" class="btn">Complete questionnaire →</a>
      <p>Once submitted, I'll review your answers and prepare your proposal.</p>
      <p class="highlight">— Ali, Te Wairama Digital</p>
    `),
  },

  proposal_follow_up: {
    subject: (v: ProposalFollowUpVars) => `Following up on your proposal — ${v.projectName}`,
    html: (v: ProposalFollowUpVars) => base(`
      <p>Kia ora <span class="highlight">${v.clientName}</span>,</p>
      <p>Just checking in on the proposal I sent for <span class="highlight">${v.projectName}</span>.</p>
      <p>If you have any questions or would like to discuss anything, feel free to reply to this email.</p>
      <p class="highlight">— Ali, Te Wairama Digital</p>
    `),
  },

  invoice_sent: {
    subject: (v: InvoiceSentVars) => `Invoice ${v.invoiceNumber} — ${v.amount} due ${v.dueDate}`,
    html: (v: InvoiceSentVars) => base(`
      <p>Kia ora <span class="highlight">${v.clientName}</span>,</p>
      <p>Please find invoice <span class="highlight">${v.invoiceNumber}</span> attached — <span class="highlight">${v.amount}</span> due by <span class="highlight">${v.dueDate}</span>.</p>
      <a href="${v.paymentLink}" class="btn">Pay now →</a>
      <p>Bank transfer details are included on the invoice if you prefer.</p>
      <p class="highlight">— Ali, Te Wairama Digital</p>
    `),
  },

  testimonial_request: {
    subject: (v: TestimonialRequestVars) => `How did we do? — ${v.projectName}`,
    html: (v: TestimonialRequestVars) => base(`
      <p>Kia ora <span class="highlight">${v.clientName}</span>,</p>
      <p>It was a pleasure working with you on <span class="highlight">${v.projectName}</span> — congratulations on the launch!</p>
      <p>If you have a moment, a brief testimonial would mean a lot. Just reply to this email with a few words about your experience.</p>
      <p class="highlight">— Ali, Te Wairama Digital</p>
    `),
  },
}

export type TemplateKey = keyof typeof templates
