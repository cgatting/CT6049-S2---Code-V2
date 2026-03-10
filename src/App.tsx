import React, { useState } from 'react';
import { User, Notification } from './types';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Admin from './components/Admin';
import DataExplorer from './components/DataExplorer';

type AppView = 'dashboard' | 'reports' | 'admin' | 'data-explorer';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('currentUser');
      if (!token || !storedUser) return null;
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  });
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleLogin = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const addNotification = (title: string, type: 'info' | 'success' | 'alert') => {
    const newNote: Notification = {
      id: Date.now().toString(),
      title,
      time: 'Just now',
      type,
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout
      user={currentUser}
      currentView={currentView}
      onChangeView={setCurrentView}
      onLogout={handleLogout}
      notifications={notifications}
    >
      {currentView === 'dashboard' && <Dashboard user={currentUser} onNavigate={setCurrentView} />}
      {currentView === 'reports' && <Reports user={currentUser} />}
      {currentView === 'admin' && <Admin user={currentUser} onAddNotification={addNotification} />}
      {currentView === 'data-explorer' && <DataExplorer user={currentUser} />}
    </Layout>
  );
};

export default App;
