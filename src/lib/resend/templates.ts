// AWA/OS — Transactional email templates
// All rendered as table-based HTML for maximum email client compatibility

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

// ─── Base layout ──────────────────────────────────────────────────────────────

const base = (body: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>AWA/OS</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:32px;">
              <span style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;letter-spacing:0.15em;color:#f0ece3;text-transform:uppercase;">AWA/OS</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#111111;border:1px solid #222222;padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;border-top:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #222222;padding-top:20px;margin-top:8px;">
                <tr>
                  <td>
                    <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#555555;line-height:1.6;">
                      <strong style="color:#999999;">Te Wairama Digital</strong> &mdash; tewairama.digital<br>
                      This is an automated message. Reply directly to this email to get in touch.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

// ─── Shared partials ──────────────────────────────────────────────────────────

const greeting = (name: string) =>
  `<p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;color:#f0ece3;line-height:1.6;">Kia ora <strong>${name}</strong>,</p>`

const p = (text: string) =>
  `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;color:#999999;line-height:1.7;">${text}</p>`

const highlight = (text: string) =>
  `<strong style="color:#f0ece3;">${text}</strong>`

const cta = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#f59e0b;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#0a0a0a;text-decoration:none;letter-spacing:0.03em;">${label}</a>
      </td>
    </tr>
  </table>`

const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #222222;font-size:0;">&nbsp;</td></tr>
  </table>`

const sign = () =>
  `<p style="margin:0;font-family:Arial,sans-serif;font-size:14px;color:#f0ece3;line-height:1.6;">&mdash; Ali, Te Wairama Digital</p>`

// ─── Templates ────────────────────────────────────────────────────────────────

export const templates = {

  welcome_client: {
    subject: (v: WelcomeClientVars) => `Welcome to your project — ${v.projectName}`,
    html: (v: WelcomeClientVars) => base(`
      ${greeting(v.clientName)}
      ${p(`Welcome — I'm excited to be working with you on ${highlight(v.projectName)}.`)}
      ${p('Your project portal is now live. Use it to track progress, complete your questionnaire, view files, and pay invoices.')}
      ${p('Click below to set up your password and access your portal for the first time.')}
      ${cta(v.portalUrl, 'Set up your portal →')}
      ${p("If the button doesn't work, copy and paste this link into your browser:")}
      <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:12px;color:#555555;word-break:break-all;">${v.portalUrl}</p>
      ${divider()}
      ${sign()}
    `),
  },

  questionnaire_link: {
    subject: (v: QuestionnaireLinkVars) => `Your project questionnaire — ${v.projectName}`,
    html: (v: QuestionnaireLinkVars) => base(`
      ${greeting(v.clientName)}
      ${p(`To get ${highlight(v.projectName)} underway, I need a few details from you.`)}
      ${p('The questionnaire covers your goals, audience, brand, content, and timeline. It should take around 10–15 minutes.')}
      ${cta(v.questionnaireUrl, 'Complete questionnaire →')}
      ${p('Once submitted, I\'ll review your answers and follow up with next steps.')}
      ${divider()}
      ${sign()}
    `),
  },

  proposal_follow_up: {
    subject: (v: ProposalFollowUpVars) => `Following up on your proposal — ${v.projectName}`,
    html: (v: ProposalFollowUpVars) => base(`
      ${greeting(v.clientName)}
      ${p(`Just checking in on the proposal I sent for ${highlight(v.projectName)}.`)}
      ${p('Happy to walk you through anything, adjust the scope, or answer any questions you have before you decide.')}
      ${p('Just reply to this email and we can go from there.')}
      ${divider()}
      ${sign()}
    `),
  },

  invoice_sent: {
    subject: (v: InvoiceSentVars) => `Invoice ${v.invoiceNumber} — ${v.amount} due ${v.dueDate}`,
    html: (v: InvoiceSentVars) => base(`
      ${greeting(v.clientName)}
      ${p(`Please find invoice ${highlight(v.invoiceNumber)} attached to this email.`)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #222222;">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #222222;">
            <span style="font-family:Arial,sans-serif;font-size:11px;color:#555555;text-transform:uppercase;letter-spacing:0.08em;">Amount due</span><br>
            <strong style="font-family:Arial,sans-serif;font-size:20px;color:#f0ece3;">${v.amount}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 16px;">
            <span style="font-family:Arial,sans-serif;font-size:11px;color:#555555;text-transform:uppercase;letter-spacing:0.08em;">Due by</span><br>
            <strong style="font-family:Arial,sans-serif;font-size:14px;color:#f0ece3;">${v.dueDate}</strong>
          </td>
        </tr>
      </table>
      ${v.paymentLink ? cta(v.paymentLink, 'Pay now →') : ''}
      ${p('Bank transfer details are included on the attached invoice if you prefer to pay that way.')}
      ${p('Reply to this email if you have any questions.')}
      ${divider()}
      ${sign()}
    `),
  },

  testimonial_request: {
    subject: (v: TestimonialRequestVars) => `How did we do? — ${v.projectName}`,
    html: (v: TestimonialRequestVars) => base(`
      ${greeting(v.clientName)}
      ${p(`It was a pleasure working with you on ${highlight(v.projectName)} — congratulations on the launch!`)}
      ${p('If you have a moment, a few words about your experience would mean a lot. Testimonials help other businesses know what to expect when working with Te Wairama Digital.')}
      ${p('Just reply to this email with whatever feels natural — a sentence or two is plenty.')}
      ${divider()}
      ${sign()}
    `),
  },

}

export type TemplateKey = keyof typeof templates
