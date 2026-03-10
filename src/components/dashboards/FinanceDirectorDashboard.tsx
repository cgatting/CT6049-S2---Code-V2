import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertOctagon, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, Cell, ReferenceLine } from 'recharts';
import { Loading } from '../ui/Loading';
import { KPICard, SectionHeader, CustomTooltip } from './Shared';

const FinanceDirectorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/dashboard/fd/financials', { headers });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading || !data) return <Loading className="h-64" text="Loading financials..." />;

  const waterfallData = [
      { name: 'Budget', value: data.budget.total, fill: '#1e293b' }, // slate-800
      { name: 'Spent', value: -data.budget.spent, fill: '#ef4444' }, // red-500
      { name: 'Remaining', value: data.budget.remaining, fill: '#22c55e' } // green-500
  ];

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard metric={{label: 'Utilization', value: `${Math.round((data.budget.spent/data.budget.total)*100)}%`, change: 5, trend: 'neutral'}} icon={DollarSign} />
         <KPICard metric={{label: 'Fines Revenue', value: `$${data.finesTrend.reduce((a:any, b:any) => a + b.revenue, 0).toLocaleString()}`, change: 12, trend: 'up'}} icon={TrendingUp} />
         <KPICard metric={{label: 'Replacement Risk', value: `$${data.lostCost.toLocaleString()}`, change: -5, trend: 'down'}} icon={AlertOctagon} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <SectionHeader title="Budget Allocation" subtitle="Fiscal year breakdown" />
               <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={waterfallData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                           <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                           <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                           <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                               {waterfallData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.fill} />
                               ))}
                           </Bar>
                       </BarChart>
                   </ResponsiveContainer>
               </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <SectionHeader title="Revenue Stream" subtitle="Income from penalties over time" />
               <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={data.finesTrend}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                           <Tooltip content={<CustomTooltip />} cursor={{stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3'}} />
                           <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={0.1} fill="#4f46e5" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
           </div>
       </div>

       <div className="bg-slate-900 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
           <div>
               <h3 className="text-xl font-bold text-white mb-2">Cost-Per-Use Analysis</h3>
               <p className="text-slate-400 text-sm max-w-md">
                   Audit low-ROI subscriptions marked for license non-renewal based on current usage patterns.
               </p>
           </div>
           <button className="flex items-center bg-white text-slate-900 px-6 py-3 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors shadow-sm whitespace-nowrap">
               <FileText className="h-4 w-4 mr-2" />
               Generate Audit
           </button>
       </div>
    </div>
  );
};

export default FinanceDirectorDashboard;
