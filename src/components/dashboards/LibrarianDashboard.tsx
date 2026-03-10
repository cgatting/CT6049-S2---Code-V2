import React, { useState, useEffect } from 'react';
import { Layers, ShieldCheck, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Loading } from '../ui/Loading';
import { SectionHeader, CustomTooltip } from './Shared';

const LibrarianDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/dashboard/cl/ops', { headers });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading || !data) return <Loading className="h-64" text="Loading operations..." />;

  const inventoryData = [
      { name: 'On Shelf', value: data.inventory.onShelf, fill: '#e2e8f0' },
      { name: 'On Loan', value: data.inventory.onLoan, fill: '#4f46e5' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
               <div className="p-3 bg-red-50 rounded-lg">
                   <Layers className="h-6 w-6 text-red-600" />
               </div>
               <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dead Stock</p>
                   <p className="text-3xl font-bold text-slate-900">{data.deadStock}</p>
               </div>
           </div>
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
               <div className="p-3 bg-blue-50 rounded-lg">
                   <Activity className="h-6 w-6 text-blue-600" />
               </div>
               <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Circulation</p>
                   <p className="text-3xl font-bold text-slate-900">{data.inventory.onLoan}</p>
               </div>
           </div>
           <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm flex items-center space-x-4">
               <div className="p-3 bg-green-100 rounded-lg">
                   <ShieldCheck className="h-6 w-6 text-green-700" />
               </div>
               <div>
                   <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">System Status</p>
                   <p className="text-sm font-bold text-green-900">All Nodes Nominal</p>
               </div>
           </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <SectionHeader title="Inventory Ratio" subtitle="Current stock location" />
               <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                           <Pie
                               data={inventoryData}
                               innerRadius={60}
                               outerRadius={80}
                               paddingAngle={5}
                               dataKey="value"
                               cornerRadius={4}
                           >
                               {inventoryData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.fill} />
                               ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                       </PieChart>
                   </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4 mt-8">
                   <div className="p-3 rounded-lg bg-slate-50 text-center">
                       <span className="block text-xs font-semibold text-slate-500 uppercase">On Shelf</span>
                       <span className="font-mono font-bold text-slate-900">{data.inventory.onShelf}</span>
                   </div>
                   <div className="p-3 rounded-lg bg-indigo-50 text-center">
                       <span className="block text-xs font-semibold text-indigo-600 uppercase">On Loan</span>
                       <span className="font-mono font-bold text-indigo-900">{data.inventory.onLoan}</span>
                   </div>
               </div>
           </div>

           <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                   <div>
                       <h3 className="text-lg font-bold text-slate-900">High Velocity Titles</h3>
                       <p className="text-sm text-slate-500">Top circulating items this period</p>
                   </div>
                   <button className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Refresh">
                       <RefreshCw className="h-4 w-4" />
                   </button>
               </div>
               <div className="space-y-3">
                   {data.topBooks.slice(0, 5).map((book: any, i: number) => (
                       <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100">
                           <div className="flex items-center space-x-4">
                               <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 font-mono text-xs font-bold">#{i + 1}</span>
                               <span className="text-sm font-medium text-slate-900">{book.title}</span>
                           </div>
                           <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                               {book.loans} units
                           </span>
                       </div>
                   ))}
               </div>
           </div>
       </div>

       <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden">
           <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
               <ShieldCheck className="h-5 w-5 text-green-400" />
               <h3 className="text-lg font-bold text-white">Security Audit Stream</h3>
           </div>
           <div className="overflow-x-auto">
               <table className="w-full text-left text-xs">
                   <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                       <tr>
                           <th className="px-6 py-3 font-semibold">Timestamp</th>
                           <th className="px-6 py-3 font-semibold">Operator</th>
                           <th className="px-6 py-3 font-semibold">Network IP</th>
                           <th className="px-6 py-3 font-semibold text-right">Result</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                       {data.authLogs.slice(0, 6).map((log: any) => (
                           <tr key={log.log_id} className="hover:bg-slate-800/50 transition-colors">
                               <td className="px-6 py-4 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                               <td className="px-6 py-4 font-medium text-white">{log.username}</td>
                               <td className="px-6 py-4 font-mono text-slate-500">{log.ip_address}</td>
                               <td className="px-6 py-4 text-right">
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${log.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                       {log.success ? 'Granted' : 'Denied'}
                                   </span>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};

export default LibrarianDashboard;