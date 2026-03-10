import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Database, Download, Search, Table } from 'lucide-react';
import { User } from '../types';
import { tableCatalog } from '../lib/brief';
import { exportToCSV } from '../utils/export';
import { Loading } from './ui/Loading';

interface DataExplorerProps {
  user: User;
}

const DataExplorer: React.FC<DataExplorerProps> = ({ user }) => {
  const [table, setTable] = useState('fact_loans');
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTable = useMemo(
    () => tableCatalog.find(entry => entry.id === table) || tableCatalog[0],
    [table]
  );

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/data/${table}?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setMeta(json.meta);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [table]);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredData = normalizedQuery
    ? data.filter(row =>
        headers.some(header => {
          const value = row[header];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(normalizedQuery);
        })
      )
    : data;

  return (
    <div className="space-y-6 font-sans">
      <div className="grid xl:grid-cols-[1.08fr_0.92fr] gap-6">
        <div className="surface-dark rounded-[34px] p-6 lg:p-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,115,76,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.16),transparent_26%)]" />
          <div className="relative z-10">
            <p className="eyebrow text-white/55">Evidence Explorer</p>
            <h1 className="mt-3 text-4xl font-serif text-white">Operational-to-warehouse traceability</h1>
            <p className="mt-4 max-w-3xl text-white/72 leading-8">
              Inspect the operational source tables and the dimensional warehouse side by side to evidence the ETL
              pathway and analytical schema used by the application.
            </p>
          </div>
        </div>

        <div className="surface rounded-[34px] p-6 lg:p-8">
          <p className="eyebrow">Selected Table</p>
          <h2 className="mt-2 text-3xl font-serif text-slate-950">{selectedTable.label}</h2>
          <p className="mt-4 text-slate-600 leading-7">{selectedTable.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className={`chip ${selectedTable.stage === 'Operational' ? '' : 'chip-teal'}`}>{selectedTable.stage}</span>
            <span className="chip">{meta.total.toLocaleString()} rows</span>
            <span className="chip">Role: {user.role}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <p className="eyebrow">Table Access</p>
          <h2 className="mt-2 text-3xl font-serif text-slate-950">Browse source and dimensional tables</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search visible records"
              className="w-full bg-white border border-slate-200 rounded-[20px] pl-9 pr-3 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgba(15,118,110,0.18)] focus:border-[var(--accent-teal)]"
            />
          </div>
          <button onClick={() => exportToCSV(filteredData, `${table}_export`)} className="btn-primary">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="surface rounded-[30px] p-4">
          <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-200">
            <div className="h-10 w-10 rounded-2xl bg-[rgba(209,115,76,0.12)] text-[var(--accent-copper)] flex items-center justify-center">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow">Catalog</p>
              <p className="font-semibold text-slate-900">Available tables</p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {tableCatalog.map(entry => {
              const active = entry.id === table;
              return (
                <button
                  key={entry.id}
                  onClick={() => setTable(entry.id)}
                  className={`w-full text-left rounded-[22px] px-4 py-4 border transition ${
                    active
                      ? 'border-[var(--accent-teal)] bg-[rgba(15,118,110,0.05)]'
                      : 'border-transparent bg-white/60 hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{entry.label}</p>
                    <span className={`chip ${entry.stage === 'Warehouse' ? 'chip-teal' : ''}`}>{entry.stage}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface-strong rounded-[30px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-[11px] text-slate-500 uppercase bg-white/80 font-bold tracking-[0.2em] border-b border-white/80">
                <tr>
                  {headers.map(header => (
                    <th key={header} className="px-6 py-4 whitespace-nowrap">
                      {header.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {loading ? (
                  <tr>
                    <td colSpan={headers.length || 1} className="px-6 py-12">
                      <Loading text="Fetching records..." />
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={index} className="bg-white/70 hover:bg-white transition-colors">
                      {headers.map(header => (
                        <td key={`${index}-${header}`} className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                          {row[header] === null ? <span className="text-slate-300 italic text-xs">NULL</span> : row[header].toString()}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length || 1} className="px-6 py-12 text-center text-slate-400">
                      No data found for this table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-white/70 px-4 py-3 flex items-center justify-between border-t border-white/80 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Showing <span className="font-bold text-slate-900">{((meta.page - 1) * meta.limit) + 1}</span> to{' '}
                  <span className="font-bold text-slate-900">{Math.min(meta.page * meta.limit, meta.total)}</span> of{' '}
                  <span className="font-bold text-slate-900">{meta.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => fetchData(meta.page - 1)}
                    disabled={meta.page === 1}
                    className="relative inline-flex items-center px-2.5 py-2.5 rounded-l-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border-y border-slate-200 bg-white text-sm font-bold text-slate-700">
                    Page {meta.page}
                  </span>
                  <button
                    onClick={() => fetchData(meta.page + 1)}
                    disabled={meta.page >= meta.pages}
                    className="relative inline-flex items-center px-2.5 py-2.5 rounded-r-xl border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
