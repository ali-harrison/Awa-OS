-- AWA/OS Seed: Base Questionnaire Template

insert into questionnaire_templates (id, name, client_type, questions)
values (
  uuid_generate_v4(),
  'Base Onboarding Questionnaire',
  'base',
  '[
    {"id": "q1", "question": "What is the primary goal of this project?", "hint": "e.g. brand awareness, lead generation, e-commerce sales", "required": true, "order": 1},
    {"id": "q2", "question": "Who is your target audience?", "hint": "Age range, location, interests, pain points", "required": true, "order": 2},
    {"id": "q3", "question": "Do you have an existing brand? (logo, colours, fonts)", "hint": "Share any brand guidelines or assets you have", "required": false, "order": 3},
    {"id": "q4", "question": "What websites or brands do you admire? Please share URLs.", "hint": "This helps us understand your visual direction", "required": false, "order": 4},
    {"id": "q5", "question": "What is your content plan? Do you have copy/images ready?", "hint": "Or will we need to source/create these together?", "required": true, "order": 5},
    {"id": "q6", "question": "What is your expected launch date?", "hint": "Please be realistic — we will work backwards from this", "required": true, "order": 6},
    {"id": "q7", "question": "Are there any integrations required?", "hint": "e.g. booking system, e-commerce, email marketing, CRM", "required": false, "order": 7},
    {"id": "q8", "question": "Who will manage the site after launch?", "hint": "Will you need training? Will we maintain it?", "required": true, "order": 8},
    {"id": "q9", "question": "Is there anything else we should know about this project?", "hint": "Constraints, sensitivities, history, must-haves", "required": false, "order": 9}
  ]'::jsonb
);

insert into questionnaire_templates (id, name, client_type, questions)
values (
  uuid_generate_v4(),
  'Charity / NFP Questionnaire',
  'charity',
  '[
    {"id": "q1", "question": "What is your organisation''s mission and who do you serve?", "hint": "A one or two sentence summary", "required": true, "order": 1},
    {"id": "q2", "question": "What outcomes do you need this website to achieve?", "hint": "Donations, volunteers, awareness, service bookings?", "required": true, "order": 2},
    {"id": "q3", "question": "Do you have charity/NFP registration details to display?", "hint": "Registration numbers, logos, accreditations", "required": false, "order": 3},
    {"id": "q4", "question": "Will you need a donation or payment integration?", "hint": "Stripe, PayPal, or a third-party donation platform?", "required": true, "order": 4},
    {"id": "q5", "question": "What is your existing online presence?", "hint": "Current website URL, social media links", "required": false, "order": 5},
    {"id": "q6", "question": "Who are your primary stakeholders and do they need to approve designs?", "hint": "Board members, funders, community groups?", "required": true, "order": 6},
    {"id": "q7", "question": "What is your content plan? Do you have copy/images ready?", "hint": "Or will we need to source/create these together?", "required": true, "order": 7},
    {"id": "q8", "question": "What is your expected launch date?", "hint": "Please be realistic — we will work backwards from this", "required": true, "order": 8}
  ]'::jsonb
);

insert into questionnaire_templates (id, name, client_type, questions)
values (
  uuid_generate_v4(),
  'E-Commerce Questionnaire',
  'ecom',
  '[
    {"id": "q1", "question": "What products or services will you sell?", "hint": "Product count, categories, digital vs physical", "required": true, "order": 1},
    {"id": "q2", "question": "Do you have existing product data, images and descriptions?", "hint": "Or will these need to be created?", "required": true, "order": 2},
    {"id": "q3", "question": "What payment gateways do you require?", "hint": "Stripe, Afterpay, PayPal, etc.", "required": true, "order": 3},
    {"id": "q4", "question": "What are your shipping requirements?", "hint": "NZ domestic, international, click and collect?", "required": true, "order": 4},
    {"id": "q5", "question": "What is your inventory management approach?", "hint": "Standalone, connected to POS, manual?", "required": false, "order": 5},
    {"id": "q6", "question": "Do you need returns/refunds functionality?", "hint": "Policy pages, automated workflows?", "required": false, "order": 6},
    {"id": "q7", "question": "What is your expected launch date?", "hint": "Please be realistic — we will work backwards from this", "required": true, "order": 7},
    {"id": "q8", "question": "Is there anything else we should know?", "hint": "Tax requirements, age verification, restrictions", "required": false, "order": 8}
  ]'::jsonb
);
