import React, { useState, useEffect } from 'react';
import { Users, Target, BookOpen } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Loading } from '../ui/Loading';
import { KPICard, SectionHeader, CustomTooltip } from './Shared';

const ViceChancellorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [kpiRes, mapRes] = await Promise.all([
            fetch('/api/dashboard/vc/kpi', { headers }),
            fetch('/api/dashboard/vc/heatmap', { headers })
        ]);
        if (kpiRes.ok) setData(await kpiRes.json());
        if (mapRes.ok) setHeatmap(await mapRes.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading || !data) return <Loading className="h-64" text="Loading metrics..." />;

  const handleDownloadAudit = () => {
    if (!data) return;

    const csvContent = [
      ['STRATEGIC AUDIT REPORT'],
      [`Date: ${new Date().toLocaleDateString()}`],
      [],
      ['KEY METRICS'],
      ['Metric', 'Value'],
      ['Active Users', data.activeUsers],
      ['Total Students', data.totalStudents],
      ['Retention Rate', `${data.retentionRate}%`],
      ['Digital Transition', `${data.digitalTransition}%`],
      [],
      ['ENGAGEMENT TRENDS'],
      ['Period', 'Count'],
      ...data.engagement.map((item: any) => [item.period, item.count])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `strategic_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metrics = [
      { label: 'Active Users', value: data.activeUsers.toLocaleString(), change: 0, trend: 'neutral' as const },
      { label: 'Total Students', value: data.totalStudents.toLocaleString(), change: 0, trend: 'neutral' as const },
      { label: 'Retention Reach', value: `${data.retentionRate}%`, change: data.retentionRate, trend: 'up' as const },
      { label: 'Digital Transition', value: `${data.digitalTransition}%`, change: data.digitalTransition, trend: 'up' as const },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <KPICard key={i} metric={m} icon={[Users, Users, Target, BookOpen][i]} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="Institutional Engagement" subtitle="Monthly borrowing volume trends" />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.engagement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '3 3'}} />
                <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={2} 
                    fillOpacity={0.1} 
                    fill="#4f46e5" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl shadow-lg text-white flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-white mb-6">Strategic Benchmarks</h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wide mb-2 text-slate-400">
                            <span>Retention Correlation</span>
                            <span className="text-white">{data.retentionRate}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.retentionRate}%` }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wide mb-2 text-slate-400">
                            <span>Digital Transition</span>
                            <span className="text-white">{data.digitalTransition}%</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.digitalTransition}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={handleDownloadAudit}
                className="w-full mt-8 py-3 bg-white text-slate-900 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors shadow-sm">
                Download Audit Report
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <SectionHeader title="Resource Heatmap" subtitle="Utilization intensity by faculty department" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from(new Set(heatmap.map(h => h.faculty))).slice(0, 8).map(faculty => {
                  const items = heatmap.filter(h => h.faculty === faculty);
                  const total = items.reduce((acc, curr) => acc + curr.value, 0);
                  return (
                      <div key={faculty} className="p-5 border border-slate-100 bg-slate-50 rounded-lg hover:border-indigo-200 hover:shadow-sm transition-all group">
                          <h4 className="font-semibold text-sm text-slate-900 mb-1">{faculty}</h4>
                          <p className="text-xs font-medium text-slate-500 mb-4">{total} total hits</p>
                          <div className="space-y-2">
                              {items.slice(0, 3).map((item: any) => (
                                  <div key={item.category} className="flex justify-between text-xs text-slate-600">
                                      <span>{item.category}</span>
                                      <span className="font-mono font-medium text-slate-900">{item.value}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};

export default ViceChancellorDashboard;
