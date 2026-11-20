// MOCK DATA — replace with the LinkedIn scraping / generation API.
export type Position = { title: string; company: string; period: string; type?: string; location?: string; desc?: string };
export type Profile = {
  id: string; name: string; headline: string; role: string; company: string; linkedin: string; location: string;
  email: string | null; about: string | null; current: Position; previous: Position[];
  education: { school: string; detail: string; years: string }[]; skills: string[]; scrapedAt: string; added: string;
  // Real backend only: scraping state, data-source details and the profile's import history.
  enrichment?: string; enrichmentError?: string | null; apifyRun?: string | null; dataset?: string | null; emailSearched?: string | null;
  imports?: { source: string; name: string | null; at: string }[]; detailLoaded?: boolean;
};

export const PLATFORMS: Record<string, string[]> = {
  "Claude (Anthropic)": ["Claude Sonnet 5", "Claude Opus 5", "Claude Haiku 5"],
  "ChatGPT (OpenAI)": ["GPT-5", "GPT-5 mini"],
};
export const TEMPLATES = [
  "LinkedIn Outreach Message - Harsh Vardhan (LinkedInOutreach)",
  "Intro + Company Deck",
  "Follow-up After Connection",
];

export const PROFILES: Profile[] = [
  {
    id: "parag-mehta", name: "Parag Mehta", headline: "Owner, Auscorp IT", role: "Company Owner", company: "Auscorp IT",
    linkedin: "linkedin.com/in/parag-mehta-2760006", location: "Greater Perth Area", email: null, about: null,
    current: { title: "Company Owner", company: "Auscorp IT", period: "2000-08 – Present", type: "Full-time", location: "Perth, Western Australia, Australia" },
    previous: [
      { title: "Director", company: "Quick Corporate Australia", period: "1997-02 – 2000-03", location: "Perth, Australia", desc: "I joined the company as a manager when it was known as Quick Cup Australia with a total staff strength of 6. I quickly identified the potential of the company and was involved with its name change to Quick Corporate Australia. I was involved with the designing of their 1st product catalogue. I was also responsible for planning and implementing an efficient warehouse and distribution system. When I left the organisation, I was …" },
      { title: "Netware Engineer", company: "PC World", period: "1995 – 1996" },
    ],
    education: [
      { school: "MEI Polytechnic", detail: "Diploma in Electronics and Telecommunication Engineering", years: "1987 – 1990" },
      { school: "Little Flower High School", detail: "High School", years: "1977 – 1985" },
    ],
    skills: ["Printer Support", "Computer Hardware", "Laser Printers", "New Business Development", "Business Strategy", "Account Management", "Business Planning", "Marketing Strategy", "Sales Management", "Strategic Planning", "Team Leadership", "Negotiation", "Customer Service", "Start-ups", "B2B"],
    scrapedAt: "20 Nov 2026, 5:51 pm", added: "20 Nov 2026, 5:41 pm",
  },
  {
    id: "elena-rossi", name: "Elena Rossi", headline: "Head of Digital, Northwind Retail", role: "Head of Digital", company: "Northwind Retail",
    linkedin: "linkedin.com/in/elena-rossi-digital", location: "Milan, Italy", email: "elena@northwind.example", about: "Leading e-commerce and CX for a 200-store retail group.",
    current: { title: "Head of Digital", company: "Northwind Retail", period: "2021-03 – Present", type: "Full-time", location: "Milan, Italy" },
    previous: [{ title: "E-commerce Manager", company: "Fable Apparel", period: "2016 – 2021", location: "Milan, Italy" }],
    education: [{ school: "Politecnico di Milano", detail: "MSc Management Engineering", years: "2008 – 2013" }],
    skills: ["E-commerce", "Shopify Plus", "CX", "Analytics", "Team Leadership"], scrapedAt: "20 Nov 2026, 5:52 pm", added: "20 Nov 2026, 5:41 pm",
  },
  {
    id: "marcus-lee", name: "Marcus Lee", headline: "CTO, Harbor Goods", role: "CTO", company: "Harbor Goods",
    linkedin: "linkedin.com/in/marcus-lee-cto", location: "Singapore", email: "marcus@harbor.example", about: "Engineering leader scaling marketplace platforms.",
    current: { title: "Chief Technology Officer", company: "Harbor Goods", period: "2019-06 – Present", type: "Full-time", location: "Singapore" },
    previous: [{ title: "VP Engineering", company: "Bluepeak Labs", period: "2014 – 2019", location: "Singapore" }],
    education: [{ school: "NUS", detail: "BSc Computer Science", years: "2005 – 2009" }],
    skills: ["Node.js", "Architecture", "AWS", "Hiring", "Marketplaces"], scrapedAt: "20 Nov 2026, 5:52 pm", added: "20 Nov 2026, 5:41 pm",
  },
  {
    id: "sara-khan", name: "Sara Khan", headline: "Founder, Meridian Health", role: "Founder & CEO", company: "Meridian Health",
    linkedin: "linkedin.com/in/sara-khan-meridian", location: "Dubai, UAE", email: null, about: null,
    current: { title: "Founder & CEO", company: "Meridian Health", period: "2018-01 – Present", type: "Full-time", location: "Dubai, UAE" },
    previous: [{ title: "Product Lead", company: "Quanta Systems", period: "2012 – 2017", location: "Dubai, UAE" }],
    education: [{ school: "AUS", detail: "BSc Information Systems", years: "2006 – 2010" }],
    skills: ["Healthtech", "Product", "Fundraising", "B2B"], scrapedAt: "20 Nov 2026, 5:53 pm", added: "20 Nov 2026, 5:41 pm",
  },
  {
    id: "tom-baker", name: "Tom Baker", headline: "Director of Operations, Quanta Systems", role: "Director of Operations", company: "Quanta Systems",
    linkedin: "linkedin.com/in/tom-baker-ops", location: "Manchester, UK", email: "tom@quanta.example", about: "Operations and process automation for logistics software.",
    current: { title: "Director of Operations", company: "Quanta Systems", period: "2020-09 – Present", type: "Full-time", location: "Manchester, UK" },
    previous: [{ title: "Operations Manager", company: "Northwind Retail", period: "2013 – 2020", location: "Leeds, UK" }],
    education: [{ school: "University of Manchester", detail: "BA Business", years: "2005 – 2008" }],
    skills: ["Operations", "Process Automation", "Logistics", "Vendor Management"], scrapedAt: "20 Nov 2026, 5:53 pm", added: "20 Nov 2026, 5:41 pm",
  },
];

// Extra profiles that "Scrap Now" appends.
export const SCRAPE_POOL: Profile[] = [
  { ...PROFILES[1], id: "nina-patel", name: "Nina Patel", headline: "VP Marketing, Fable Apparel", role: "VP Marketing", company: "Fable Apparel", linkedin: "linkedin.com/in/nina-patel-mktg", location: "London, UK", email: "nina@fable.example" },
  { ...PROFILES[2], id: "diego-alvarez", name: "Diego Alvarez", headline: "Co-founder, Bluepeak Labs", role: "Co-founder", company: "Bluepeak Labs", linkedin: "linkedin.com/in/diego-alvarez-bp", location: "Madrid, Spain", email: null },
  { ...PROFILES[4], id: "grace-oneill", name: "Grace O'Neill", headline: "COO, Orbit Foods", role: "COO", company: "Orbit Foods", linkedin: "linkedin.com/in/grace-oneill-coo", location: "Dublin, Ireland", email: "grace@orbit.example" },
];

export function allProfiles(extra: Profile[] = []) { return [...PROFILES, ...extra]; }

export function buildFollowUp(p: Profile) {
  const first = p.name.split(" ")[0];
  return `Hi ${first},

Just following up on my earlier note. I know things get busy at ${p.company}, so no pressure at all.

If it helps, I can share a short company deck and two case studies from teams similar to yours. Would a quick 15-minute call next week suit you?

Many thanks,
Harsh Vardhan
CEO @ Webethics Solutions`;
}

// MOCK generation — replace with the real AI endpoint.
export function buildMessage(p: Profile, template: string, _model: string) {
  return { ...buildInitial(p, template), followUp: buildFollowUp(p) };
}

function buildInitial(p: Profile, template: string) {
  const first = p.name.split(" ")[0];
  const sign = "Many thanks,\nHarsh Vardhan\nCEO @ Webethics Solutions";
  if (template.startsWith("Intro"))
    return { subject: `Webethics Solutions + ${p.company}`, body: `Hi ${first},\n\nI came across ${p.company} and liked what you are building as ${p.role}.\n\nWebethics Solutions is a 50-person team of developers, designers and architects. We help growing businesses ship faster without setting up a full in-house team.\n\nI have attached our company deck. Happy to walk you through relevant work whenever suits you.\n\n${sign}` };
  if (template.startsWith("Follow-up"))
    return { subject: `Following up, ${first}`, body: `Hi ${first},\n\nThanks for connecting. I wanted to follow up and see whether engineering capacity is something ${p.company} is thinking about right now.\n\nIf useful, I can share two short case studies from similar teams.\n\n${sign}` };
  const place = p.location.replace("Greater ", "").replace(" Area", "");
  return { subject: "Quick hello from Webethics Solutions", body: `Hi ${first},\n\nI noticed we're connected on LinkedIn but haven't had the chance to talk, so I wanted to say a quick hello.\n\nI had a look at your profile and saw that you run ${p.company} out in ${place}.\n\nI run Webethics Solutions. For 11+ years we've worked with founders and growing businesses as a team of 50 developers, designers and architects, helping them build products and ship faster without setting up a full in-house team.\n\nWould it be useful if I sent over our company deck?\n\n${sign}` };
}
