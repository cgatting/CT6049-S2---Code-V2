import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Layout from './components/Layout';
import Admin from './components/Admin';
import Reports from './components/Reports';
import DataExplorer from './components/DataExplorer';
import { UserRole } from './types';

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
}));

const mockUser = {
  id: '1',
  name: 'Test Admin',
  role: UserRole.VICE_CHANCELLOR,
  avatar: 'avatar.png',
};

const mockOverview = {
  refreshedAt: '2026-03-10T09:00:00.000Z',
  role: 'Vice-chancellor',
  brief: {
    decisionQuestions: 10,
    interactiveReports: 12,
    securedAccounts: 5,
  },
  operational: { books: 100, students: 500, loans: 10000, staff: 5 },
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
  circulation: { activeLoans: 300, overdueItems: 20, deadStock: 8, fineExposure: 425.5 },
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

global.fetch = vi.fn((url) => {
  const asString = typeof url === 'string' ? url : url.toString();

  if (asString.includes('/api/reports/filters')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ categories: ['Science'], formats: ['Digital'] }),
    });
  }

  if (asString.includes('/api/data/')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({ data: [], meta: { page: 1, limit: 20, total: 0, pages: 1 } }),
    });
  }

  if (asString.includes('/api/app/overview')) {
    return Promise.resolve({
      ok: true,
      json: async () => mockOverview,
    });
  }

  if (asString.includes('/api/etl/history')) {
    return Promise.resolve({
      ok: true,
      json: async () => [],
    });
  }

  if (asString.includes('/api/admin/auth-logs')) {
    return Promise.resolve({
      ok: true,
      json: async () => [],
    });
  }

  return Promise.resolve({
    ok: true,
    json: async () => [],
  });
}) as any;

describe('Feature Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Feature 1 & 3: Settings Modal', async () => {
    render(
      <Layout user={mockUser} currentView="dashboard" onChangeView={() => {}} onLogout={() => {}} notifications={[]}>
        <div>Content</div>
      </Layout>
    );

    fireEvent.click(screen.getByRole('button', { name: /test admin/i }));
    fireEvent.click(screen.getByText('Settings'));

    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  test('Feature 8: Data Explorer Enhanced (Export & Filter)', async () => {
    render(<DataExplorer user={mockUser} />);

    expect(screen.getByText('Export')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Available tables')).toBeInTheDocument();
    });
  });

  test('Feature 6: Admin Audit Logs View', async () => {
    render(<Admin user={mockUser} />);

    expect(screen.getByText('Security Audit')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Security Audit'));

    await waitFor(() => {
      expect(screen.getByText(/System access logs/i)).toBeInTheDocument();
    });
  });

  test('Feature 4 & 5: Reports (Demographics & At-Risk)', async () => {
    render(<Reports user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Demographics')).toBeInTheDocument();
      expect(screen.getByText('At-Risk Students')).toBeInTheDocument();
    });
  });
});
