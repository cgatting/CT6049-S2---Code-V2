import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Layout from './components/Layout';
import Admin from './components/Admin';
import Reports from './components/Reports';
import DataExplorer from './components/DataExplorer';
import { UserRole } from './types';

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch
global.fetch = vi.fn((url) => {
    if (typeof url === 'string' && url.includes('/filters')) {
        return Promise.resolve({
            ok: true,
            json: async () => ({ categories: ['Science'], formats: ['Digital'] }),
        });
    }
    // Return empty array for charts/tables lists
    return Promise.resolve({
        ok: true,
        json: async () => [],
    });
}) as any;

const mockUser = {
  id: '1',
  name: 'Test Admin',
  role: UserRole.VICE_CHANCELLOR,
  avatar: 'avatar.png'
};

describe('Feature Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Feature 1 & 3: Settings Modal', async () => {
    render(
      <Layout 
        user={mockUser} 
        currentView="dashboard" 
        onChangeView={() => {}} 
        onLogout={() => {}} 
        notifications={[]}
      >
        <div>Content</div>
      </Layout>
    );

    // Open Settings Modal via User Menu
    const userMenuBtn = screen.getByText('Test Admin').closest('button');
    fireEvent.click(userMenuBtn!);
    
    const settingsBtn = screen.getByText('Settings');
    fireEvent.click(settingsBtn);
    
    // Check if Modal is open
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  test('Feature 8: Data Explorer Enhanced (Export & Filter)', async () => {
    render(<DataExplorer user={mockUser} />);
    
    // Check Export Button
    expect(screen.getByText('Export')).toBeInTheDocument();
    
    // Check Table Selector
    expect(screen.getByText('Target Table')).toBeInTheDocument();
  });

  test('Feature 6: Admin Audit Logs View', async () => {
    render(<Admin user={mockUser} />);
    
    // Check Tabs
    expect(screen.getByText('Security Audit')).toBeInTheDocument();
    
    // Click Tab
    fireEvent.click(screen.getByText('Security Audit'));
    expect(screen.getByText('System Access Logs')).toBeInTheDocument();
  });

  test('Feature 4 & 5: Reports (Demographics & At-Risk)', async () => {
     render(<Reports user={mockUser} />);
     
     // We need to wait for fetch
     await waitFor(() => {
         expect(screen.getByText('Demographics')).toBeInTheDocument();
         expect(screen.getByText('At-Risk Students')).toBeInTheDocument();
     });
  });
});
