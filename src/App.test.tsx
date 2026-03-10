import { render, screen } from '@testing-library/react';
import App from './App';
import { expect, test, vi } from 'vitest';
import React from 'react';

// Mock components that might be complex or have dependencies we don't want to test here
vi.mock('./components/Login', () => ({
  default: ({ onLogin }: { onLogin: any }) => (
    <div data-testid="login-component">
      <h1>Login</h1>
      <button onClick={() => onLogin({ username: 'testuser', role: 'STAFF' })}>Mock Login</button>
    </div>
  ),
}));

vi.mock('./components/Layout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout-component">{children}</div>,
}));

test('renders login component when not authenticated', () => {
  render(<App />);
  expect(screen.getByTestId('login-component')).toBeInTheDocument();
  expect(screen.getByText('Login')).toBeInTheDocument();
});
