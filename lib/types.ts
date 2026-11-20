export type MagicFilterType = "All" | "Manual Review" | "Rejected" | "Approved";
export type JobStatus = "Not Applied" | "Applied" | "Interviewing" | "Hired";
export type DateFilterType = "All Time" | "Today" | "Last 24 hours" | "Last 7 days" | "Last 30 days";
export type CreamFilterType = "All" | "Cream only" | "Non-cream";

export interface ModelScore {
  model: "J" | "C" | "Rejected";
  score: number;
}

export interface Job {
  id: string;
  title: string;
  company?: string;
  savedDate: string;
  savedTime: string;
  savedTimestamp: number;
  magicVerdict: "Manual Review" | "Rejected" | "Approved";
  verdictScore: number;
  modelScores: ModelScore[];
  isCream: boolean;
  creamCount?: number;
  technology: string;
  budgetType: "Fixed" | "Hourly";
  budgetAmount: string;
  budgetNumeric: number;
  posted: string;
  postedMinutesAgo: number;
  totalSpent: string;
  totalSpentNumeric: number;
  location: string;
  status: JobStatus;
  url: string;
}

export interface FilterState {
  search: string;
  magicFilter: MagicFilterType;
  technology: string;
  location: string;
  status: string;
  date: DateFilterType;
  cream: CreamFilterType;
}

export type SortField = "savedDate" | "budget" | "posted" | "totalSpent";
export type SortDirection = "asc" | "desc";

export interface ScoreMetric {
  label: string;
  hint: string;
  current: number;
  max: number;
}

export interface DetailedJobInfo {
  clientScore: number;
  jobScore: number;
  chatgptScore: number;
  claudeScore: number;
  clientSummary: string;
  jobSummary: string;
  clientMetrics: ScoreMetric[];
  jobMetrics: ScoreMetric[];
  description: { intro: string; bulletsTitle: string; bullets: string[]; outro: string[] };
  skills: string[];
  highlightSkill: string;
  specs: {
    workload: string;
    duration: string;
    experienceLevel: string;
    projectType: string;
    historyProjectsCount: number;
    categoryBreadcrumb: string;
  };
}

export interface TrackableLink {
  id: string;
  title: string;
  status: "Opened" | "Not opened";
  url: string;
  views: number;
  lastViewed: string;
  author: string;
  createdAt: string;
}
