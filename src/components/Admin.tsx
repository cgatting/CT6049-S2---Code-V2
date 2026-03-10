import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  CheckCircle,
  Clock,
  Database,
  Lock,
  Play,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { AppOverview, User } from '../types';
import { Loading } from './ui/Loading';

interface AdminProps {
  user: User;
  onAddNotification?: (title: string, type: 'info' | 'success' | 'alert') => void;
}

interface EtlLog {
  log_id: number;
  start_time: string;
  end_time: string | null;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED';
  message: string;
  records_processed: number;
}

interface AuthLog {
  log_id: number;
  username: string;
  timestamp: string;
  success: number;
  ip_address: string;
}

const Admin: React.FC<AdminProps> = ({ user, onAddNotification }) => {
  const [logs, setLogs] = useState<EtlLog[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'etl' | 'security'>('etl');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const [etlRes, authRes, overviewRes] = await Promise.all([
        fetch('/api/etl/history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/auth-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/app/overview', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (etlRes.ok) setLogs(await etlRes.json());
      if (authRes.ok) setAuthLogs(await authRes.json());
      if (overviewRes.ok) setOverview(await overviewRes.json());
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const runEtl = async () => {
    if (!confirm('Are you sure you want to trigger the ETL process? This will reload the warehouse data.')) return;

    setRunning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/etl/run', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        onAddNotification?.('Manual ETL completed successfully', 'success');
        fetchLogs();
      } else {
        onAddNotification?.('Manual ETL failed', 'alert');
      }
    } catch (error) {
      console.error(error);
      onAddNotification?.('ETL connection error', 'alert');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString();
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'Running...';
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return `${((e - s) / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="surface-dark rounded-[34px] p-6 lg:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,115,76,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.18),transparent_26%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-white/55">Governance Surface</p>
            <h1 className="mt-3 text-4xl font-serif text-white">Warehouse control room</h1>
            <p className="mt-4 max-w-3xl text-white/72 leading-8">
              Validate ETL execution, security activity, and warehouse readiness. This view exists to make the
              assignment evidence explicit for data refresh, security, and administrative controls.
            </p>
          </div>
          {activeTab === 'etl' && (
            <button
              onClick={runEtl}
              disabled={running}
              className={`rounded-[22px] px-6 py-4 font-semibold inline-flex items-center gap-2 ${
                running
                  ? 'bg-white/20 text-white cursor-not-allowed'
                  : 'bg-white text-slate-950 hover:bg-[var(--accent-copper)] hover:text-white transition-colors'
              }`}
            >
              {running ? <RotateCcw className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
              {running ? 'Processing ETL...' : 'Run manual ETL'}
            </button>
          )}
        </div>
      </div>

      {overview && (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Last ETL Status',
              value: overview.warehouse.lastEtl?.status || 'No runs',
              note: overview.warehouse.lastEtl
                ? `${overview.warehouse.lastEtl.records_processed.toLocaleString()} records processed`
                : 'No execution recorded yet',
              icon: Activity,
            },
            {
              label: 'Warehouse Facts',
              value: overview.warehouse.facts.toLocaleString(),
              note: `${overview.warehouse.indexes} indexes available`,
              icon: Database,
            },
            {
              label: 'Failed Logins 24h',
              value: overview.governance.failedLogins24h.toLocaleString(),
              note: `${overview.governance.successfulLogins24h.toLocaleString()} successful sign-ins`,
              icon: Lock,
            },
            {
              label: 'Control Coverage',
              value: 'RBAC',
              note: `${overview.brief.securedAccounts.toLocaleString()} protected user accounts`,
              icon: BadgeCheck,
            },
          ].map(card => (
            <div key={card.label} className="surface-strong rounded-[28px] p-5">
              <div className="h-11 w-11 rounded-2xl bg-[rgba(209,115,76,0.12)] text-[var(--accent-copper)] flex items-center justify-center">
                <card.icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('etl')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'etl' ? 'border-[var(--accent-copper)] text-[var(--accent-copper)]' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Warehouse ETL
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-[var(--accent-copper)] text-[var(--accent-copper)]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Security Audit
        </button>
      </div>

      <div className="surface-strong rounded-[32px] overflow-hidden min-h-[400px]">
        {activeTab === 'etl' ? (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-slate-500" />
                ETL execution history
              </h3>
              <button onClick={fetchLogs} className="text-sm text-[var(--accent-teal)] hover:text-[var(--accent-copper)] font-bold uppercase tracking-[0.2em]">
                Refresh log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-[0.2em] text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Start Time</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Processed</th>
                    <th className="px-6 py-4">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8">
                        <Loading text="Loading logs..." />
                      </td>
                    </tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500">#{log.log_id}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : log.status === 'FAILED'
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}
                          >
                            {log.status === 'SUCCESS' && <CheckCircle className="h-3 w-3 mr-1.5" />}
                            {log.status === 'FAILED' && <AlertTriangle className="h-3 w-3 mr-1.5" />}
                            {log.status === 'RUNNING' && <RotateCcw className="h-3 w-3 mr-1.5 animate-spin" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{formatDate(log.start_time)}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{getDuration(log.start_time, log.end_time)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{log.records_processed.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h3 className="font-bold text-slate-800 flex items-center">
                <Shield className="h-4 w-4 mr-2 text-slate-500" />
                System access logs
              </h3>
              <button onClick={fetchLogs} className="text-sm text-[var(--accent-teal)] hover:text-[var(--accent-copper)] font-bold uppercase tracking-[0.2em]">
                Refresh log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase tracking-[0.2em] text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authLogs.map(log => (
                    <tr key={log.log_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">{log.username}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            log.success ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                          }`}
                        >
                          {log.success ? 'Login Success' : 'Login Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.ip_address}</td>
                    </tr>
                  ))}
                  {authLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        No audit logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
