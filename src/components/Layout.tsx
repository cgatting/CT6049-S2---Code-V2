import React, { ReactNode, useEffect, useState } from 'react';
import {
  Bell,
  Database,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  PieChart,
  Settings,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Notification, User } from '../types';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'reports', label: 'Decision Studio', icon: PieChart },
    { id: 'data-explorer', label: 'Warehouse Explorer', icon: Database },
    { id: 'admin', label: 'Control Room', icon: ShieldCheck },
  ] as const;

  const filteredNavItems = navItems.filter(item => {
    if (item.id === 'admin' || item.id === 'data-explorer') {
      return ['Vice-chancellor', 'Chief Librarian'].includes(user.role);
    }
    return true;
  });

  const viewMeta: Record<LayoutProps['currentView'], { title: string; description: string }> = {
    dashboard: {
      title: 'Command Center',
      description: 'Assignment-aligned overview of the operational source, warehouse, and role intelligence.',
    },
    reports: {
      title: 'Decision Studio',
      description: 'Interactive analysis mapped directly to the decision-maker questions in the brief.',
    },
    'data-explorer': {
      title: 'Warehouse Explorer',
      description: 'Operational and dimensional table evidence for the assessment implementation.',
    },
    admin: {
      title: 'Control Room',
      description: 'ETL execution history, audit evidence, and governance controls.',
    },
  };

  const unreadCount = notifications.filter(note => !note.read).length;

  return (
    <div className="min-h-screen bg-[var(--app-wash)] text-slate-900">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-80 shrink-0 flex-col border-r border-white/50 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(48,103,140,0.35),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(209,115,76,0.25),transparent_30%)]" />

          <div className="relative z-10 px-7 pt-7 pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[var(--accent-copper)]/90 text-white flex items-center justify-center shadow-[0_16px_40px_rgba(209,115,76,0.25)]">
                <Library className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">CT6049 Assignment 2</p>
                <h1 className="text-2xl font-serif leading-none">LibWare Decision Studio</h1>
              </div>
            </div>

            <div className="mt-6 surface-dark rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-white/60">Assessment Focus</p>
                  <p className="mt-2 text-sm text-white/80 leading-6">
                    Operational database, dimensional warehouse, ETL, secure access, and role-led analytics.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-[var(--accent-copper)] shrink-0" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
                  <div className="text-xl font-semibold">10</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-1">Questions</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
                  <div className="text-xl font-semibold">12</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-1">Reports</div>
                </div>
                <div className="rounded-2xl bg-white/5 p-3 border border-white/10">
                  <div className="text-xl font-semibold">RBAC</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-white/50 mt-1">Protected</div>
                </div>
              </div>
            </div>
          </div>

          <nav className="relative z-10 flex-1 px-5 py-6 space-y-2">
            {filteredNavItems.map(item => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={`w-full text-left rounded-[24px] px-4 py-4 transition-all border ${
                    isActive
                      ? 'bg-white text-slate-950 border-white shadow-[0_18px_40px_rgba(255,255,255,0.12)]'
                      : 'bg-white/0 text-white/72 border-white/8 hover:bg-white/6 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-[var(--accent-copper)]' : 'text-white/60'}`} />
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className={`text-xs mt-1 ${isActive ? 'text-slate-500' : 'text-white/45'}`}>
                          {viewMeta[item.id].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="relative z-10 px-5 pb-6 space-y-4">
            <div className="surface-dark rounded-[28px] p-4">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="h-11 w-11 rounded-2xl border border-white/15 object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-white/55 uppercase tracking-[0.22em] mt-1 truncate">{user.role}</p>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full rounded-[20px] border border-white/12 px-4 py-3 text-white/75 hover:text-white hover:bg-white/6 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 border-b border-white/50 bg-[rgba(245,241,232,0.82)] backdrop-blur-xl">
            <div className="px-5 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="xl:hidden h-11 w-11 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center text-slate-700"
                  title="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <p className="eyebrow">Assessment Brief Alignment</p>
                  <h2 className="text-2xl font-serif text-slate-950 leading-tight">{viewMeta[currentView].title}</h2>
                  <p className="text-sm text-slate-600 mt-1 max-w-3xl">{viewMeta[currentView].description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden md:flex items-center gap-2 chip">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-teal)]" />
                  <span>JWT + RBAC</span>
                </div>
                <div className="hidden md:flex items-center gap-2 chip">
                  <Database className="h-4 w-4 text-[var(--accent-copper)]" />
                  <span>Warehouse Synced</span>
                </div>

                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative h-11 w-11 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center text-slate-700 hover:bg-white"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[var(--accent-copper)] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white/90 px-2 py-2 hover:bg-white transition-colors"
                  >
                    <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-2xl object-cover border border-slate-200" />
                    <div className="hidden lg:block text-left pr-2">
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">{user.role}</p>
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-14 z-40 w-56 rounded-[24px] border border-slate-200 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.16)] p-2">
                        <button className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                          <UserIcon className="h-4 w-4 text-slate-400" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          Settings
                        </button>
                        <div className="my-2 border-t border-slate-100" />
                        <button
                          onClick={onLogout}
                          className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-6 lg:py-8">
            <div className="max-w-[1500px] mx-auto">{children}</div>
          </main>

          {isMobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
              <div className="fixed left-0 top-0 bottom-0 z-50 w-[86vw] max-w-sm bg-slate-950 text-white px-5 py-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-[var(--accent-copper)] flex items-center justify-center">
                      <Library className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">CT6049</p>
                      <h3 className="font-serif text-xl">LibWare</h3>
                    </div>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="h-10 w-10 rounded-2xl bg-white/8 flex items-center justify-center">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {filteredNavItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onChangeView(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full rounded-[22px] px-4 py-4 text-left border ${
                          isActive ? 'bg-white text-slate-950 border-white' : 'bg-white/0 text-white/75 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-[var(--accent-copper)]' : 'text-white/55'}`} />
                          <div>
                            <p className="font-semibold">{item.label}</p>
                            <p className={`text-xs mt-1 ${isActive ? 'text-slate-500' : 'text-white/45'}`}>
                              {viewMeta[item.id].description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mt-8 w-full rounded-[20px] border border-white/12 px-4 py-3 text-white/80 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}

          {isNotificationsOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsNotificationsOpen(false)} />
              <div className="absolute right-5 top-24 lg:right-8 z-40 w-[22rem] rounded-[28px] border border-slate-200 bg-white shadow-[0_35px_80px_rgba(15,23,42,0.18)] overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="eyebrow">Activity Feed</p>
                    <h3 className="text-lg font-serif text-slate-950">Notifications</h3>
                  </div>
                  <button onClick={() => setIsNotificationsOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="max-h-[24rem] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 6).map(note => (
                      <div key={note.id} className="px-5 py-4 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-copper)] mt-1.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{note.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{note.time}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-12 text-center text-slate-500">
                      <Bell className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;
