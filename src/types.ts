export enum UserRole {
  VICE_CHANCELLOR = 'Vice-chancellor',
  DEPT_HEAD = 'Departmental Head',
  ADMISSION_DIRECTOR = 'Admission Director',
  FINANCE_DIRECTOR = 'Finance Director',
  CHIEF_LIBRARIAN = 'Chief Librarian',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface KPIMetric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface BorrowingData {
  month: string;
  Science: number;
  Arts: number;
  Engineering: number;
  Business: number;
}

export interface FacultyStat {
  name: string;
  borrowed: number;
  returned: number;
  overdue: number;
}

export interface FinesData {
  name: string;
  value: number;
  fill: string;
}

export interface PredictionPoint {
  month: string;
  actual?: number;
  predicted: number;
  confidenceLow: number;
  confidenceHigh: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  category: 'Budget' | 'Inventory' | 'Facility';
}

export interface Notification {
  id: string;
  title: string;
  time: string;
  type: 'alert' | 'info' | 'success';
  read: boolean;
}

export interface AppOverview {
  refreshedAt: string;
  role?: string;
  brief: {
    decisionQuestions: number;
    interactiveReports: number;
    securedAccounts: number;
  };
  operational: {
    books: number;
    students: number;
    loans: number;
    staff: number;
  };
  warehouse: {
    books: number;
    students: number;
    facts: number;
    timeKeys: number;
    indexes: number;
    etlRuns: number;
    lastEtl?: {
      log_id: number;
      start_time: string;
      end_time: string | null;
      status: 'RUNNING' | 'SUCCESS' | 'FAILED';
      records_processed: number;
    };
  };
  circulation: {
    activeLoans: number;
    overdueItems: number;
    deadStock: number;
    fineExposure: number;
  };
  governance: {
    successfulLogins24h: number;
    failedLogins24h: number;
    authEvents: number;
    currentBudget: {
      year: number;
      total: number;
      spent: number;
      remaining: number;
    } | null;
  };
}
