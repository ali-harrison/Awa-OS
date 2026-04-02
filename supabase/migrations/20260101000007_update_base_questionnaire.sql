-- Update base questionnaire template with full 19-question set

update questionnaire_templates
set
  name = 'Base Onboarding Questionnaire',
  questions = '[
    {"id": "q1",  "question": "What is the primary goal of this project?",                          "hint": "e.g. brand awareness, lead generation, e-commerce sales",                                          "required": true,  "order": 1},
    {"id": "q2",  "question": "Who is your target audience?",                                       "hint": "Age range, location, interests, pain points",                                                       "required": true,  "order": 2},
    {"id": "q3",  "question": "Who are your main competitors? Please share their URLs.",            "hint": "This helps us understand your market and positioning",                                              "required": false, "order": 3},
    {"id": "q4",  "question": "What websites or brands do you admire? Please share URLs only.",    "hint": "This helps us understand your visual direction",                                                    "required": false, "order": 4},
    {"id": "q5",  "question": "Do you have an existing brand? (logo, colours, fonts)",             "hint": "If yes, upload everything in the Files tab after submitting this form",                            "required": true,  "order": 5},
    {"id": "q6",  "question": "Do you have photography, or will stock imagery be needed?",         "hint": "Custom photography, stock, AI-generated, or a mix",                                                "required": false, "order": 6},
    {"id": "q7",  "question": "What is your content plan? Do you have copy and images ready?",    "hint": "Or will we need to source or create these together?",                                              "required": true,  "order": 7},
    {"id": "q8",  "question": "Will you write copy or do you need copywriting included?",          "hint": "Be honest — this affects timeline and cost significantly",                                         "required": false, "order": 8},
    {"id": "q9",  "question": "What is your budget range for this project?",                       "hint": "This helps us scope the work realistically and recommend the right approach",                      "required": true,  "order": 9},
    {"id": "q10", "question": "Is this a fixed scope project or do you anticipate ongoing work?",  "hint": "e.g. one-off build, retainer, phased rollout",                                                     "required": false, "order": 10},
    {"id": "q11", "question": "Do you have a domain and hosting already? If so, where?",           "hint": "e.g. GoDaddy, Cloudflare, Vercel — or we can set this up for you",                               "required": false, "order": 11},
    {"id": "q12", "question": "Do you have any platform preferences or restrictions?",             "hint": "e.g. WordPress, Webflow, custom build — or leave it to us",                                       "required": false, "order": 12},
    {"id": "q13", "question": "Are there any integrations required?",                              "hint": "e.g. booking system, e-commerce, email marketing, CRM, payment gateway",                         "required": false, "order": 13},
    {"id": "q14", "question": "What is your expected launch date?",                                "hint": "Please be realistic — we will work backwards from this",                                           "required": true,  "order": 14},
    {"id": "q15", "question": "Who is the main point of contact and decision maker?",              "hint": "Name, role, and preferred contact method",                                                         "required": true,  "order": 15},
    {"id": "q16", "question": "Are there other stakeholders who need to approve work?",            "hint": "Knowing this upfront prevents delays mid-project",                                                 "required": false, "order": 16},
    {"id": "q17", "question": "Who will manage the site after launch?",                            "hint": "Will you need training? Will we handle ongoing maintenance?",                                      "required": true,  "order": 17},
    {"id": "q18", "question": "How will you measure if this project is successful?",               "hint": "e.g. leads generated, sales, bookings, traffic, brand perception",                                "required": false, "order": 18},
    {"id": "q19", "question": "Is there anything else we should know about this project?",         "hint": "Constraints, sensitivities, history, hard must-haves, or dealbreakers",                           "required": false, "order": 19}
  ]'::jsonb
where client_type = 'base';
