import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './components/Dashboard';
import { UserRole } from './types';
import { beforeEach, expect, test, vi } from 'vitest';
import React from 'react';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  ReferenceLine: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  RadialBarChart: ({ children }: any) => <div>{children}</div>,
  RadialBar: () => <div />,
}));

const mockUser = {
  id: '1',
  name: 'Test User',
  role: UserRole.VICE_CHANCELLOR,
  avatar: 'https://ui-avatars.com/api/?name=Test+User',
};

const mockOverview = {
  refreshedAt: '2026-03-10T09:00:00.000Z',
  role: 'Vice-chancellor',
  brief: {
    decisionQuestions: 10,
    interactiveReports: 12,
    securedAccounts: 5,
  },
  operational: {
    books: 100,
    students: 500,
    loans: 10000,
    staff: 5,
  },
  warehouse: {
    books: 100,
    students: 500,
    facts: 10000,
    timeKeys: 365,
    indexes: 6,
    etlRuns: 4,
    lastEtl: {
      log_id: 4,
      start_time: '2026-03-10T08:59:00.000Z',
      end_time: '2026-03-10T09:00:00.000Z',
      status: 'SUCCESS',
      records_processed: 10000,
    },
  },
  circulation: {
    activeLoans: 300,
    overdueItems: 20,
    deadStock: 8,
    fineExposure: 425.5,
  },
  governance: {
    successfulLogins24h: 8,
    failedLogins24h: 1,
    authEvents: 25,
    currentBudget: {
      year: 2024,
      total: 500000,
      spent: 420000,
      remaining: 80000,
    },
  },
};

const mockKpi = {
  activeUsers: 10200,
  totalStudents: 20000,
  retentionRate: 78,
  digitalTransition: 64,
  engagement: [
    { period: 'Jan', count: 120 },
    { period: 'Feb', count: 140 },
  ],
};

beforeEach(() => {
  global.fetch = vi.fn((url) => {
    const asString = url.toString();

    if (asString.includes('/api/app/overview')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockOverview),
      });
    }

    if (asString.includes('/api/dashboard/vc/kpi')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockKpi),
      });
    }

    if (asString.includes('/api/dashboard/vc/heatmap')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ faculty: 'Science', category: 'Books', value: 10 }]),
      });
    }

    return Promise.reject(new Error(`Unknown URL: ${url}`));
  }) as any;
});

test('renders the dashboard command center for the user role', async () => {
  render(<Dashboard user={mockUser} onNavigate={vi.fn()} />);

  await waitFor(() => {
    expect(screen.getByText('Institutional oversight')).toBeInTheDocument();
  });

  expect(screen.getByText(/Questions relevant to Vice-chancellor/i)).toBeInTheDocument();
  expect(screen.getByText('Operational Loans')).toBeInTheDocument();
});

test('renders the embedded executive evidence cards after loading', async () => {
  render(<Dashboard user={mockUser} onNavigate={vi.fn()} />);

  await waitFor(() => {
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  expect(screen.getByText('Retention Reach')).toBeInTheDocument();
  expect(screen.getByText('Strategic Benchmarks')).toBeInTheDocument();
});
