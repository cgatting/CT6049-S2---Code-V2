import { UserRole } from '../types';

export interface DecisionQuestion {
  id: string;
  title: string;
  owner: UserRole[];
  prompt: string;
  evidence: string;
  destination: 'dashboard' | 'reports' | 'admin' | 'data-explorer';
}

export interface CapabilityPillar {
  title: string;
  description: string;
  evidence: string;
}

export interface TableCatalogEntry {
  id: string;
  label: string;
  stage: 'Operational' | 'Warehouse';
  description: string;
}

export const decisionQuestions: DecisionQuestion[] = [
  {
    id: 'Q1',
    title: 'Borrowing demand by faculty',
    owner: [UserRole.VICE_CHANCELLOR, UserRole.DEPT_HEAD],
    prompt: 'Which faculties generate the highest borrowing activity and overdue pressure?',
    evidence: 'Loans by faculty, overdue rates, and role dashboards.',
    destination: 'reports',
  },
  {
    id: 'Q2',
    title: 'Monthly trend comparison',
    owner: [UserRole.VICE_CHANCELLOR, UserRole.FINANCE_DIRECTOR, UserRole.DEPT_HEAD],
    prompt: 'How do borrowing volumes change over one, three, and six month periods by faculty or course?',
    evidence: 'Interactive trend comparison with category and format filters.',
    destination: 'reports',
  },
  {
    id: 'Q3',
    title: 'Collection popularity',
    owner: [UserRole.CHIEF_LIBRARIAN, UserRole.ADMISSION_DIRECTOR],
    prompt: 'Which categories and formats are most popular with students?',
    evidence: 'Popular categories, peak borrowing days, and format preference views.',
    destination: 'reports',
  },
  {
    id: 'Q4',
    title: 'Fines and financial exposure',
    owner: [UserRole.FINANCE_DIRECTOR, UserRole.VICE_CHANCELLOR],
    prompt: 'How much value is tied up in collected fines, outstanding fines, and replacement risk?',
    evidence: 'Fines overview, budget utilization, and replacement cost analysis.',
    destination: 'reports',
  },
  {
    id: 'Q5',
    title: 'Student engagement demographics',
    owner: [UserRole.ADMISSION_DIRECTOR, UserRole.VICE_CHANCELLOR],
    prompt: 'Which student years and regions show the strongest library engagement?',
    evidence: 'Demographics, regional distribution, and growth views.',
    destination: 'reports',
  },
  {
    id: 'Q6',
    title: 'At-risk student monitoring',
    owner: [UserRole.DEPT_HEAD, UserRole.ADMISSION_DIRECTOR, UserRole.VICE_CHANCELLOR],
    prompt: 'Which students have repeated overdues or high fine balances?',
    evidence: 'At-risk table and overdue-focused role dashboards.',
    destination: 'reports',
  },
  {
    id: 'Q7',
    title: 'Average loan duration',
    owner: [UserRole.CHIEF_LIBRARIAN, UserRole.DEPT_HEAD, UserRole.VICE_CHANCELLOR],
    prompt: 'How long are books kept by faculty and where is usage friction emerging?',
    evidence: 'Average duration report and faculty-level borrowing analysis.',
    destination: 'reports',
  },
  {
    id: 'Q8',
    title: 'Dead stock detection',
    owner: [UserRole.CHIEF_LIBRARIAN, UserRole.VICE_CHANCELLOR],
    prompt: 'Which titles have never been borrowed and should be reviewed for retention?',
    evidence: 'Dead stock inventory alert and warehouse explorer evidence.',
    destination: 'reports',
  },
  {
    id: 'Q9',
    title: 'Warehouse refresh assurance',
    owner: [UserRole.CHIEF_LIBRARIAN, UserRole.VICE_CHANCELLOR],
    prompt: 'When was the warehouse last refreshed and how many records were processed?',
    evidence: 'ETL execution history, warehouse counts, and command-center status.',
    destination: 'admin',
  },
  {
    id: 'Q10',
    title: 'Operational-to-warehouse traceability',
    owner: [UserRole.CHIEF_LIBRARIAN, UserRole.VICE_CHANCELLOR],
    prompt: 'Can decision-makers inspect operational source tables and dimensional warehouse tables side by side?',
    evidence: 'Operational and warehouse tables in the explorer, with star-schema context.',
    destination: 'data-explorer',
  },
];

export const capabilityPillars: CapabilityPillar[] = [
  {
    title: 'Operational Database',
    description: 'Source tables store books, students, staff, and loan transactions used for warehouse loading.',
    evidence: 'Seeded operational tables and explorer coverage.',
  },
  {
    title: 'Dimensional Warehouse',
    description: 'A star schema supports analytical workloads through dimensions for books, students, and time.',
    evidence: 'Warehouse tables, fact counts, and index visibility.',
  },
  {
    title: 'ETL and Refresh Control',
    description: 'Warehouse loads are logged, repeatable, and manually triggerable for assessment evidence.',
    evidence: 'ETL history, last refresh timestamp, and processed record counts.',
  },
  {
    title: 'Security and RBAC',
    description: 'JWT authentication, role-based routes, and audit logs protect decision-support access.',
    evidence: 'Login events, restricted views, and per-role dashboards.',
  },
  {
    title: 'Interactive Decision Support',
    description: 'Reports answer decision-maker questions using filters, charts, exports, and comparative views.',
    evidence: 'Question bank, analytics studio, and role-specific dashboards.',
  },
];

export const roleNarratives: Record<UserRole, { label: string; focus: string; accent: string }> = {
  [UserRole.VICE_CHANCELLOR]: {
    label: 'Institutional oversight',
    focus: 'Track university-wide engagement, digital adoption, and strategic resource value.',
    accent: 'Executive',
  },
  [UserRole.DEPT_HEAD]: {
    label: 'Department benchmarking',
    focus: 'Compare departmental borrowing behaviour against university averages and subject demand.',
    accent: 'Faculty',
  },
  [UserRole.ADMISSION_DIRECTOR]: {
    label: 'Recruitment intelligence',
    focus: 'Use demographic and region-based engagement signals to support admissions positioning.',
    accent: 'Admissions',
  },
  [UserRole.FINANCE_DIRECTOR]: {
    label: 'Financial governance',
    focus: 'Review budget utilization, fine revenue, and replacement-risk exposure.',
    accent: 'Finance',
  },
  [UserRole.CHIEF_LIBRARIAN]: {
    label: 'Operational stewardship',
    focus: 'Supervise refresh health, stock circulation, dead stock, and access control.',
    accent: 'Operations',
  },
};

export const tableCatalog: TableCatalogEntry[] = [
  {
    id: 'op_books',
    label: 'Operational Books',
    stage: 'Operational',
    description: 'Transactional catalog source containing book metadata, prices, and formats.',
  },
  {
    id: 'op_students',
    label: 'Operational Students',
    stage: 'Operational',
    description: 'Student source data used to derive faculty, course, region, and year dimensions.',
  },
  {
    id: 'op_loans',
    label: 'Operational Loans',
    stage: 'Operational',
    description: 'Borrowing transactions that feed the ETL pipeline into the fact table.',
  },
  {
    id: 'dim_books',
    label: 'Book Dimension',
    stage: 'Warehouse',
    description: 'Descriptive warehouse dimension used to group book-related analysis.',
  },
  {
    id: 'dim_students',
    label: 'Student Dimension',
    stage: 'Warehouse',
    description: 'Analytical student dimension used for faculty, course, year, and region slicing.',
  },
  {
    id: 'dim_time',
    label: 'Time Dimension',
    stage: 'Warehouse',
    description: 'Calendar dimension supporting month, quarter, year, and day-of-week comparisons.',
  },
  {
    id: 'fact_loans',
    label: 'Loan Fact',
    stage: 'Warehouse',
    description: 'Central fact table storing borrowing activity, overdue indicators, and fine amounts.',
  },
];

export const roleQuestionMap = (role: UserRole) =>
  decisionQuestions.filter(question => question.owner.includes(role));
