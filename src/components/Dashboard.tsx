import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookMarked,
  ChartColumn,
  Database,
  HardDriveDownload,
  LockKeyhole,
  ShieldCheck,
  TimerReset,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { AppOverview, User, UserRole } from '../types';
import { capabilityPillars, roleNarratives, roleQuestionMap } from '../lib/brief';
import AdmissionDirectorDashboard from './dashboards/AdmissionDirectorDashboard';
import DepartmentHeadDashboard from './dashboards/DepartmentHeadDashboard';
import FinanceDirectorDashboard from './dashboards/FinanceDirectorDashboard';
import LibrarianDashboard from './dashboards/LibrarianDashboard';
import ViceChancellorDashboard from './dashboards/ViceChancellorDashboard';
import { Loading } from './ui/Loading';

interface DashboardProps {
  user: User;
  onNavigate: (view: 'reports' | 'admin' | 'data-explorer') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [overview, setOverview] = useState<AppOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/app/overview', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setOverview(await res.json());
        }
      } catch (error) {
        console.error('Failed to load overview', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const roleNarrative = roleNarratives[user.role];
  const roleQuestions = useMemo(() => roleQuestionMap(user.role), [user.role]);

  if (loading || !overview) {
    return <Loading className="h-[60vh]" text="Building warehouse command center..." />;
  }

  const metricCards = [
    {
      label: 'Operational Loans',
      value: overview.operational.loans.toLocaleString(),
      note: 'Source transactions seeded for ETL',
      icon: BookMarked,
    },
    {
      label: 'Warehouse Facts',
      value: overview.warehouse.facts.toLocaleString(),
      note: `${overview.warehouse.indexes} indexes active for analysis`,
      icon: Database,
    },
    {
      label: 'Secured Accounts',
      value: overview.brief.securedAccounts.toLocaleString(),
      note: `${overview.governance.failedLogins24h} failed logins in the last 24h`,
      icon: LockKeyhole,
    },
    {
      label: 'Fine Exposure',
      value: `£${overview.circulation.fineExposure.toFixed(2)}`,
      note: `${overview.circulation.deadStock} unused titles flagged`,
      icon: TriangleAlert,
    },
  ];

  const evidenceCards = [
    {
      label: 'Active Loans',
      value: overview.circulation.activeLoans.toLocaleString(),
      note: 'Live circulation workload',
      icon: HardDriveDownload,
    },
    {
      label: 'Overdue Items',
      value: overview.circulation.overdueItems.toLocaleString(),
      note: 'Student risk and recovery pressure',
      icon: TimerReset,
    },
    {
      label: 'Audit Events',
      value: overview.governance.authEvents.toLocaleString(),
      note: 'Recorded authentication activity',
      icon: ShieldCheck,
    },
    {
      label: 'Decision Questions',
      value: overview.brief.decisionQuestions.toString(),
      note: `${overview.brief.interactiveReports} interactive report views`,
      icon: ChartColumn,
    },
  ];

  const pipelineSteps = [
    {
      title: 'Operational Source',
      detail: `${overview.operational.books} books, ${overview.operational.students} students, ${overview.operational.loans} loans`,
    },
    {
      title: 'ETL Execution',
      detail: overview.warehouse.lastEtl
        ? `${overview.warehouse.lastEtl.status} • ${overview.warehouse.lastEtl.records_processed.toLocaleString()} records`
        : 'No ETL history recorded yet',
    },
    {
      title: 'Dimensional Warehouse',
      detail: `${overview.warehouse.books} book rows, ${overview.warehouse.students} student rows, ${overview.warehouse.timeKeys} time keys`,
    },
    {
      title: 'Decision Support',
      detail: `${overview.brief.interactiveReports} report surfaces for role-based analysis`,
    },
  ];

  const etlTimestamp = overview.warehouse.lastEtl?.end_time || overview.warehouse.lastEtl?.start_time;

  const renderRoleDashboard = () => {
    switch (user.role) {
      case UserRole.VICE_CHANCELLOR:
        return <ViceChancellorDashboard />;
      case UserRole.FINANCE_DIRECTOR:
        return <FinanceDirectorDashboard />;
      case UserRole.CHIEF_LIBRARIAN:
        return <LibrarianDashboard />;
      case UserRole.DEPT_HEAD:
        return <DepartmentHeadDashboard />;
      case UserRole.ADMISSION_DIRECTOR:
        return <AdmissionDirectorDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <section className="surface-dark rounded-[36px] p-6 lg:p-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,115,76,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.18),transparent_26%)]" />
        <div className="relative z-10 grid xl:grid-cols-[1.2fr_0.8fr] gap-8">
          <div>
            <p className="eyebrow text-white/55">Role Narrative</p>
            <h1 className="mt-3 text-4xl lg:text-5xl font-serif leading-tight text-white">
              {roleNarrative.label}
            </h1>
            <p className="mt-4 max-w-3xl text-white/76 leading-8">
              {roleNarrative.focus} This command center is aligned to the CT6049 brief and surfaces the full delivery
              chain from operational source data through ETL refresh into warehouse reporting.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="chip-dark">
                <BadgeCheck className="h-4 w-4 text-[var(--accent-copper)]" />
                {overview.brief.decisionQuestions} decision-maker questions
              </span>
              <span className="chip-dark">
                <Database className="h-4 w-4 text-[var(--accent-teal)]" />
                {overview.warehouse.indexes} warehouse indexes
              </span>
              <span className="chip-dark">
                <Users className="h-4 w-4 text-white/80" />
                {overview.brief.securedAccounts} secured accounts
              </span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {metricCards.map(card => (
              <div key={card.label} className="rounded-[28px] border border-white/10 bg-white/6 p-5">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
                    <card.icon className="h-5 w-5 text-[var(--accent-copper)]" />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">{roleNarrative.accent}</span>
                </div>
                <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-white/45">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-white/62">{card.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm text-white/65">
          <span>
            Last warehouse refresh:{' '}
            <strong className="text-white">
              {etlTimestamp ? new Date(etlTimestamp).toLocaleString() : 'No ETL execution recorded'}
            </strong>
          </span>
          <button onClick={() => onNavigate('reports')} className="btn-ghost-dark">
            Open decision studio
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="surface-strong rounded-[32px] p-6 lg:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Brief Coverage</p>
              <h2 className="mt-2 text-3xl font-serif text-slate-950">Application evidence against the brief</h2>
            </div>
            <span className="chip">Assignment aligned</span>
          </div>

          <div className="mt-6 space-y-4">
            {capabilityPillars.map(pillar => (
              <div key={pillar.title} className="rounded-[24px] border border-slate-200 bg-white/75 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[rgba(15,118,110,0.1)] text-[var(--accent-teal)] flex items-center justify-center shrink-0">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{pillar.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">{pillar.evidence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-[32px] p-6 lg:p-7">
          <p className="eyebrow">Warehouse Lifecycle</p>
          <h2 className="mt-2 text-3xl font-serif text-slate-950">Operational to analytical flow</h2>

          <div className="mt-6 space-y-4">
            {pipelineSteps.map((step, index) => (
              <div key={step.title} className="rounded-[26px] border border-slate-200 bg-white/80 p-5 flex gap-4">
                <div className="w-11 shrink-0">
                  <div className="h-11 w-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {overview.governance.currentBudget && (
            <div className="mt-6 rounded-[26px] border border-slate-200 bg-[rgba(15,118,110,0.05)] p-5">
              <p className="eyebrow">Finance Signal</p>
              <p className="mt-2 text-slate-900 font-semibold">
                Budget {overview.governance.currentBudget.year}: £{overview.governance.currentBudget.spent.toLocaleString()} spent of £
                {overview.governance.currentBudget.total.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Remaining headroom: £{overview.governance.currentBudget.remaining.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
        <div className="surface rounded-[32px] p-6 lg:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Question Bank</p>
              <h2 className="mt-2 text-3xl font-serif text-slate-950">Questions relevant to {user.role}</h2>
            </div>
            <span className="chip">{roleQuestions.length} assigned</span>
          </div>

          <div className="mt-6 space-y-4">
            {roleQuestions.map(question => (
              <button
                key={question.id}
                type="button"
                onClick={() => onNavigate(question.destination === 'dashboard' ? 'reports' : question.destination)}
                className="w-full rounded-[26px] border border-slate-200 bg-white/80 p-5 text-left hover:border-[var(--accent-teal)] hover:bg-[rgba(15,118,110,0.03)] transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="chip">{question.id}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-4 font-semibold text-slate-900">{question.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{question.prompt}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">{question.evidence}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {evidenceCards.map(card => (
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
      </section>

      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Role Evidence Layer</p>
            <h2 className="mt-2 text-3xl font-serif text-slate-950">Detailed insight for {user.role}</h2>
            <p className="mt-2 text-slate-600 max-w-3xl">
              The panels below provide the role-specific analysis views used by each decision-maker to answer the
              questions identified in the assessment brief.
            </p>
          </div>

          <button onClick={() => onNavigate('reports')} className="btn-primary">
            Open full analytics
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div>{renderRoleDashboard()}</div>
      </section>
    </div>
  );
};

export default Dashboard;
