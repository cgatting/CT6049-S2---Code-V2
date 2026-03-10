import React, { useState, useEffect } from 'react';
import { MapPin, GraduationCap, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Loading } from '../ui/Loading';
import { KPICard, SectionHeader, CustomTooltip } from './Shared';

const AdmissionDirectorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/dashboard/ad/stats', { headers });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading || !data) return <Loading className="h-64" text="Loading admissions data..." />;

  const radialData = data.regions.map((r: any, i: number) => ({
      name: r.name,
      uv: r.value,
      fill: ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff', '#f5f3ff'][i]
  }));

  const totalRegionalReach = data.regions.reduce((sum: number, item: any) => sum + item.value, 0);
  const latestGrowth = data.growth[data.growth.length - 1]?.subscriptions || 0;
  const previousGrowth = data.growth[data.growth.length - 2]?.subscriptions || 0;
  const growthDelta = previousGrowth > 0
    ? Math.round(((latestGrowth - previousGrowth) / previousGrowth) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <KPICard metric={{label: 'Regional Reach', value: totalRegionalReach.toLocaleString(), change: 0, trend: 'neutral'}} icon={MapPin} />
         <KPICard metric={{label: 'Top Tier Ratio', value: `${data.topTierPercentage}%`, change: 2, trend: 'up'}} icon={GraduationCap} />
         <KPICard metric={{label: 'Borrowing Growth', value: `${growthDelta >= 0 ? '+' : ''}${growthDelta}%`, change: growthDelta, trend: growthDelta >= 0 ? 'up' : 'down'}} icon={TrendingUp} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <SectionHeader title="Regional Distribution" subtitle="Engagement by territory" />
               <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={15} data={radialData}>
                           <RadialBar background dataKey="uv" cornerRadius={10} />
                           <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px', color: '#64748b'}} />
                           <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                       </RadialBarChart>
                   </ResponsiveContainer>
               </div>
           </div>

           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <SectionHeader title="Digital Subscription Growth" subtitle="Yearly expansion metrics" />
               <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={data.growth}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                           <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                           <Tooltip content={<CustomTooltip />} cursor={{stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3'}} />
                           <Area type="monotone" dataKey="subscriptions" stroke="#4f46e5" strokeWidth={2} fillOpacity={0.1} fill="#4f46e5" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
           </div>
       </div>

       <div className="bg-slate-900 rounded-xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="max-w-xl">
               <h2 className="text-xl font-bold text-white mb-3">Collection Strength Indicator</h2>
               <p className="text-slate-400 text-sm leading-relaxed mb-6">
                   Library holds <span className="text-indigo-400 font-semibold">{data.topTierPercentage}% premium research assets</span>. This gives admissions a measurable signal for how well the collection supports competitive recruitment messages.
               </p>
               <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors shadow-sm">
                   Export Prospectus Data
               </button>
           </div>
           
           <div className="bg-slate-800 rounded-2xl p-8 text-center min-w-[200px] border border-slate-700">
                <span className="block text-5xl font-bold text-white leading-none mb-2">{data.topTierPercentage}%</span>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Premium Assets</span>
           </div>
       </div>
    </div>
  );
};

export default AdmissionDirectorDashboard;
