import React, { ReactNode, useState, useEffect } from 'react';
import { User, Notification } from '../types';
import { LayoutDashboard, PieChart, LogOut, Library, Menu, X, Bell, Database, ShieldCheck, Search, User as UserIcon, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface LayoutProps {
  children: ReactNode;
  user: User;
  currentView: 'dashboard' | 'reports' | 'data-explorer' | 'admin';
  onChangeView: (view: 'dashboard' | 'reports' | 'data-explorer' | 'admin') => void;
  onLogout: () => void;
  notifications: Notification[];
}

const Layout: React.FC<LayoutProps> = ({ children, user, currentView, onChangeView, onLogout, notifications }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'Analytics', icon: PieChart },
    { id: 'data-explorer', label: 'Explorer', icon: Database },
    { id: 'admin', label: 'System', icon: ShieldCheck },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'admin' || item.id === 'data-explorer') {
       return ['Vice-chancellor', 'Chief Librarian'].includes(user.role);
    }
    return true;
  });
  
  const viewMeta: Record<string, { title: string; description: string }> = {
    dashboard: { title: 'Overview', description: 'Role-based insights and KPIs' },
    reports: { title: 'Analytics Studio', description: 'Trends, filters, and performance' },
    'data-explorer': { title: 'Data Explorer', description: 'Browse warehouse tables' },
    admin: { title: 'System Admin', description: 'Audit logs and configuration' }
  };

  return (
    <div className={`flex h-screen bg-slate-50 font-sans overflow-hidden text-slate-900 transition-colors duration-300`}>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Sidebar: Dark Slate with Soft Indigo Accents */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 z-30 transition-colors duration-300">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Library className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">LibWare</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as any)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button 
              onClick={onLogout}
              className="w-full flex items-center px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all text-sm font-medium"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header: Clean White */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-20 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                  title="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="hidden md:flex flex-col">
                  <div className="flex items-center text-sm">
                    <span className="font-semibold text-slate-700">LibWare</span>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="font-semibold text-slate-900">{viewMeta[currentView].title}</span>
                  </div>
                </div>
                <div className="hidden lg:flex items-center bg-slate-100 rounded-lg px-3 py-1.5 w-80 transition-colors duration-300 ml-8 focus-within:ring-2 focus-within:ring-indigo-500/20">
                  <Search className="h-4 w-4 text-slate-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search database..." 
                    className="bg-transparent border-none outline-none text-sm text-slate-900 w-full placeholder:text-slate-400"
                  />
                </div>
            </div>

            <div className="flex items-center space-x-4">

                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
                >
                    <Bell className="h-5 w-5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[16px] flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 focus:outline-none hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
                  >
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="h-8 w-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="text-left hidden sm:block">
                          <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                      </div>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)}></div>
                      <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 shadow-lg rounded-xl z-40 py-1 animate-fade-in overflow-hidden">
                        <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center">
                          <UserIcon className="h-4 w-4 mr-2.5 text-slate-400" /> Profile
                        </button>
                        <button 
                          onClick={() => { setIsSettingsOpen(true); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center"
                        >
                          <Settings className="h-4 w-4 mr-2.5 text-slate-400" /> Settings
                        </button>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center">
                          <LogOut className="h-4 w-4 mr-2.5" /> Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
            </div>
        </header>
        
        {isMobileMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 z-50 p-6 shadow-xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <Library className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl text-white tracking-tight">LibWare</span>
              </div>
              <nav className="space-y-2">
                {filteredNavItems.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onChangeView(item.id as any); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                        isActive 
                          ? 'bg-indigo-600 text-white' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-8 border-t border-slate-800 pt-6">
                <button 
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all text-sm font-medium"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
           <div className="max-w-7xl mx-auto space-y-6">
             {children}
           </div>
        </main>

        {/* Notifications Slide-Over (Modern) */}
        {isNotificationsOpen && (
            <>
                <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px]" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-4 top-20 w-80 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 p-0 animate-fade-in overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                        <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? notifications.slice(0, 5).map(note => (
                            <div key={note.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="h-2 w-2 mt-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{note.title}</p>
                                        <p className="text-xs text-slate-500 mt-1">{note.time}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                              <Bell className="h-8 w-8 text-slate-200 mb-2" />
                              <p className="text-sm text-slate-500">No new notifications</p>
                          </div>
                        )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <button className="w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                              View All Activity
                          </button>
                      </div>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default Layout;
