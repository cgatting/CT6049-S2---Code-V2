import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Loading } from '../ui/Loading';
import { SectionHeader, CustomTooltip } from './Shared';

const DepartmentHeadDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const selectedFaculty = 'Science';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(`/api/dashboard/dh/stats?faculty=${selectedFaculty}`, { headers });
        if (res.ok) setData(await res.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading || !data) return <Loading className="h-64" text="Loading department data..." />;

  const totalResources = data.resources.reduce((sum: number, item: any) => sum + item.value, 0);
  const digitalShare = totalResources > 0 ? Math.round((data.resources[0]?.value || 0) / totalResources * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between">
             <div>
                 <span className="bg-indigo-50 text-indigo-700 px-3 py-1 font-semibold text-xs rounded-full uppercase tracking-wide">Faculty Scope</span>
                 <h2 className="text-3xl font-bold text-slate-900 mb-2 mt-4">{selectedFaculty} Department</h2>
                 <p className="text-slate-500 text-sm font-medium">Departmental resource analytics for the assignment demo faculty</p>
             </div>
             <div className="flex space-x-12 mt-8 md:mt-0 bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="text-center">
                     <p className="text-4xl font-bold text-slate-900">{data.comparison.department.toLocaleString()}</p>
                     <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-2">Active Loans</p>
                 </div>
                 <div className="w-px bg-slate-200"></div>
                 <div className="text-center">
                     <p className="text-4xl font-bold text-indigo-600">{Math.round((data.comparison.department / data.comparison.universityAvg) * 100)}%</p>
                     <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-2">v. Uni Avg</p>
                 </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <SectionHeader title="Top Subject Areas" subtitle="Resource distribution" />
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.categories} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                            <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                <SectionHeader title="Format Preference" subtitle="Physical vs. Digital" />
                <div className="flex-1 flex items-center justify-center py-4">
                    <div className="relative w-64 h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.resources}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    cornerRadius={4}
                                >
                                    {data.resources.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#e2e8f0'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <p className="text-4xl font-bold text-slate-900 leading-none">
                                    {digitalShare}%
                                </p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">Digital</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                <h3 className="text-slate-900 font-semibold text-lg">Benchmarking Table</h3>
            </div>
            <div className="p-0">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white border-b border-slate-100">
                            <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Metric</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 text-xs text-right uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 text-xs text-right uppercase tracking-wider">Uni Avg</th>
                            <th className="px-6 py-4 font-semibold text-slate-500 text-xs text-right uppercase tracking-wider">Delta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        <tr className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900">Total Loans</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 text-right">{data.comparison.department.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-500 text-right">{data.comparison.universityAvg.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${data.comparison.department > data.comparison.universityAvg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {data.comparison.department > data.comparison.universityAvg ? '+' : ''}
                                    {Math.round(((data.comparison.department - data.comparison.universityAvg) / data.comparison.universityAvg) * 100)}%
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default DepartmentHeadDashboard;
