import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from './components/Dashboard';
import { UserRole } from './types';
import { expect, test, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock Recharts because it doesn't play well with JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div></div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div></div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => <div></div>,
  ReferenceLine: () => <div></div>,
  XAxis: () => <div></div>,
  YAxis: () => <div></div>,
  CartesianGrid: () => <div></div>,
  Tooltip: () => <div></div>,
}));

const mockUser = {
  id: '1',
  username: 'testuser',
  name: 'Test User',
  role: UserRole.VICE_CHANCELLOR,
  avatar: 'https://ui-avatars.com/api/?name=Test+User'
};

const mockKpi = {
  activeUsers: 10200,
  totalStudents: 20000,
  retentionRate: 78,
  digitalTransition: 64,
  engagement: [
    { period: 'Jan', count: 120 },
    { period: 'Feb', count: 140 }
  ]
};

const mockStats = [
  { name: 'Engineering', loans: 450 },
  { name: 'Science', loans: 320 }
];

beforeEach(() => {
  global.fetch = vi.fn((url) => {
        if (url.toString().includes('kpi')) {
          return Promise.resolve({
              ok: true,
                json: () => Promise.resolve(mockKpi),
          });
      }
        if (url.toString().includes('heatmap')) {
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve([{ faculty: 'Science', category: 'Books', value: 10 }]),
            });
        }
      if (url.toString().includes('loans-by-faculty')) {
            return Promise.resolve({
               ok: true,
               json: () => Promise.resolve(mockStats),
           });
       }
       // Mock other endpoints to prevent Promise.all failure
       if (url.toString().includes('demographics') || url.toString().includes('at-risk')) {
           return Promise.resolve({
               ok: true,
               json: () => Promise.resolve([]),
           });
       }
       return Promise.reject(new Error(`Unknown URL: ${url}`));
   }) as any;
 });

test('renders dashboard with user greeting', async () => {
  render(<Dashboard user={mockUser} />);
  
  await waitFor(() => {
      const greetingRegex = /Good (morning|afternoon|evening)/i;
      expect(screen.getByText(greetingRegex)).toBeInTheDocument();
  });
  expect(screen.getByText('Test User')).toBeInTheDocument();
});

test('renders KPI metrics after loading', async () => {
  render(<Dashboard user={mockUser} />);
  
  await waitFor(() => {
      expect(screen.getByText('Active Users')).toBeInTheDocument();
  });
  
  expect(screen.getByText('Total Students')).toBeInTheDocument();
  expect(screen.getByText('Engagement Score')).toBeInTheDocument();
  expect(screen.getByText('ROI Index')).toBeInTheDocument();
});
