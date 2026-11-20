// MOCK DATA — replace with the existing system's tables: instruction_prompts, upwork_prompt_examples, upwork_keywords, case_studies, claude_settings, chatgpt_settings.
export type Prompt = { id: string; name: string; title: string; prompt_text: string; active: boolean; created_at: string };
export type Example = { id: number; label: "yes" | "no"; title: string; description_summary: string; score: number; is_dev_work: boolean; matched_stack: string[]; reasoning: string };
export type Keyword = { id: number; keyword: string };
export type CaseStudy = { id: string; title: string; industry: string; stack: string[]; problem_solved: string; outcome_metric: string; project_url: string; created_at: string };
export type AiSettings = { api_key: string | null; model: string; model_cover_letter: string; model_client_info: string; updated_at: string | null };

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export const SEED_PROMPTS: Prompt[] = [
  { id: "p-1", name: "upwork_job_scoring_v3", title: "Upwork Job Scoring", active: true, created_at: day(90),
    prompt_text: "You are an expert at evaluating Upwork job posts for a software agency. Score each job from 0 to 100 using the agency's stack (Shopify Plus, Next.js, Laravel, React, Python, Node.js), the budget (fixed jobs under $500 are rejected) and the client's history. Return the score, a verdict (Approved, Manual Review or Rejected) and a short reason." },
  { id: "p-2", name: "email_marketing_v1", title: "Email Marketing Prompt", active: true, created_at: day(60),
    prompt_text: "Write a four-email outreach sequence (an initial email and three follow-ups) for the lead below. Keep each email under 120 words, reference the lead's role and company, and end with a soft question. Never promise results or pricing." },
  { id: "p-3", name: "linkedin_outreach_v1", title: "LinkedIn Outreach Message", active: true, created_at: day(40),
    prompt_text: "Write a personalised, professional email (subject and body) to the person described below, using only their name, headline, current title, current company, location and About text. Do not invent facts." },
  { id: "p-4", name: "email_marketing_followup_v1", title: "Email Marketing Follow-ups", active: false, created_at: day(20),
    prompt_text: "Write the three follow-up emails for the sequence. Each follow-up adds one new idea and stays under 90 words." },
];

export const SEED_EXAMPLES: Example[] = [
  { id: 4, label: "yes", title: "Shopify Plus B2B migration", description_summary: "Verified client needs a B2B portal on Shopify Plus with company accounts and net terms.", score: 92, is_dev_work: true, matched_stack: ["Shopify Plus", "Liquid", "Node.js"], reasoning: "Strong stack match, budget above $5,000 and a client with a long hiring history." },
  { id: 3, label: "yes", title: "Laravel webhook refactor", description_summary: "Existing Laravel app needs queue tuning and a webhook refactor.", score: 81, is_dev_work: true, matched_stack: ["Laravel", "PHP", "MySQL"], reasoning: "Clear scope in the agency's core stack." },
  { id: 2, label: "no", title: "Fixed $20 landing page", description_summary: "Single landing page for a very small fixed budget.", score: 18, is_dev_work: true, matched_stack: ["HTML", "CSS"], reasoning: "Budget is below the $500 fixed-price minimum." },
  { id: 1, label: "no", title: "SEO content writer", description_summary: "Looking for blog writers, no development work.", score: 6, is_dev_work: false, matched_stack: [], reasoning: "Not development work." },
];

export const SEED_KEYWORDS: Keyword[] = ["API Integration", "Headless", "Hydrogen", "Laravel", "Next.js", "Node.js", "Python", "React", "Shopify", "Shopify Plus", "Stripe", "WordPress"].map((keyword, i) => ({ id: i + 1, keyword }));

export const SEED_CASE_STUDIES: CaseStudy[] = [
  { id: "c-1", title: "Shopify Plus Wholesale Portal", industry: "Retail / E-commerce", stack: ["Shopify Plus", "Node.js"], problem_solved: "Wholesale buyers ordered by email and spreadsheet. We built a B2B portal with company accounts, net terms and reorder lists.", outcome_metric: "$1.2M B2B revenue in year one", project_url: "https://example.com/case/wholesale-portal", created_at: day(80) },
  { id: "c-2", title: "B2B High Conversion Landing Pages", industry: "SaaS", stack: ["Next.js", "Figma"], problem_solved: "Paid traffic landed on a slow generic page. We rebuilt the funnel with fast, testable landing pages.", outcome_metric: "+34% conversion in 8 weeks", project_url: "https://example.com/case/landing-pages", created_at: day(70) },
  { id: "c-3", title: "Logistics Webhook Platform", industry: "Logistics", stack: ["Laravel", "Redis"], problem_solved: "Carrier webhooks were dropped under load. We moved processing to queues with retries and idempotency.", outcome_metric: "99.99% delivery, 6x throughput", project_url: "https://example.com/case/webhooks", created_at: day(55) },
  { id: "c-4", title: "Marketplace Data Pipeline", industry: "Data", stack: ["Python", "Airflow"], problem_solved: "Product data from 40 suppliers arrived in different formats. We built an ETL pipeline with validation.", outcome_metric: "Catalog updates in minutes, not days", project_url: "", created_at: day(30) },
];

export const SEED_CLAUDE: AiSettings = { api_key: null, model: "claude-sonnet-5", model_cover_letter: "claude-sonnet-5", model_client_info: "claude-sonnet-5", updated_at: null };
export const SEED_GPT: AiSettings = { api_key: null, model: "gpt-5.6-terra", model_cover_letter: "gpt-5.6-terra", model_client_info: "gpt-5.6-terra", updated_at: null };
