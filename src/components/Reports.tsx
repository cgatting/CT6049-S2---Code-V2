import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Filter, Download, ChevronDown, AlertCircle, ArrowRight, BadgeCheck } from 'lucide-react';
import { User, UserRole } from '../types';
import { roleQuestionMap } from '../lib/brief';
import { Loading } from './ui/Loading';

interface ReportsProps {
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ user }) => {
  // Dimensions align with API capabilities: 'faculty' or 'course'
  // Everyone gets Faculty/Course views. Finance gets Fines view via specific components.
  const availableDimensions = [
    { id: 'faculty', label: 'Faculty Performance' },
    { id: 'course', label: 'Course Trends' }
  ];

  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m'>('6m');
  const [dimension, setDimension] = useState('faculty');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [finesData, setFinesData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [avgDurationData, setAvgDurationData] = useState<any[]>([]); // For Q9
  const [deadStockData, setDeadStockData] = useState<any[]>([]);     // For Q10
  const [peakDaysData, setPeakDaysData] = useState<any[]>([]);       // Peak Days
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  const [atRiskData, setAtRiskData] = useState<any[]>([]);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const relevantQuestions = roleQuestionMap(user.role);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 0. Filters
        const filtersRes = await fetch('/api/reports/filters', { headers });
        if (filtersRes.ok) {
            const { categories, formats } = await filtersRes.json();
            setAvailableCategories(['All', ...categories]);
            setAvailableFormats(['All', ...formats]);
        }

        // 1. Monthly Trends
        const monthlyRes = await fetch(`/api/reports/monthly-trends?groupBy=${dimension}&category=${categoryFilter}&format=${formatFilter}`, { headers });
        if (monthlyRes.ok) setMonthlyData(await monthlyRes.json());

        // 2. Fines
        const finesRes = await fetch('/api/reports/fines-overview', { headers });
        if (finesRes.ok) setFinesData(await finesRes.json());

        // 3. Top Categories
        const catRes = await fetch('/api/reports/popular-categories', { headers });
        if (catRes.ok) {
           const rawCats = await catRes.json();
           setCategoryData(rawCats.map((c: any, i: number) => ({
             cat: c.name,
             count: c.value,
             color: ['bg-indigo-600', 'bg-slate-600', 'bg-amber-500', 'bg-emerald-600', 'bg-rose-500'][i % 5]
           })));
        }

        // 4. Avg Duration
        const durRes = await fetch('/api/reports/avg-duration', { headers });
        if (durRes.ok) setAvgDurationData(await durRes.json());

        // 5. Dead Stock
        const deadRes = await fetch('/api/reports/dead-stock', { headers });
        if (deadRes.ok) setDeadStockData(await deadRes.json());

        // 6. Peak Days
        const peakRes = await fetch('/api/reports/peak-days', { headers });
        if (peakRes.ok) setPeakDaysData(await peakRes.json());

        // 7. Demographics
        const demoRes = await fetch('/api/reports/demographics', { headers });
        if (demoRes.ok) setDemographicsData(await demoRes.json());

        // 8. At Risk
        const riskRes = await fetch('/api/reports/at-risk', { headers });
        if (riskRes.ok) setAtRiskData(await riskRes.json());

      } catch (e) {
        console.error("Failed to fetch report data", e);
        setError("Unable to retrieve analytics data from the warehouse. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dimension, categoryFilter, formatFilter]); // Re-fetch when filters change

  // Filter Data by Time Range
  const getFilteredData = () => {
    let data = [...monthlyData];
    if (timeRange === '1m') return data.slice(-1);
    if (timeRange === '3m') return data.slice(-3);
    return data.slice(-6);
  };

  const filteredData = getFilteredData();

  // Extract unique keys for dynamic lines/areas
  const getDataKeys = () => {
    if (filteredData.length === 0) return [];
    // Keys are all properties except 'month' and 'period'
    return Object.keys(filteredData[0]).filter(k => k !== 'month' && k !== 'period');
  };
  
  const dataKeys = getDataKeys();
  const colors = ['#6366f1', '#0f172a', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6'];

  const handleExportReport = () => {
    const csvRows = [];
    
    // Header
    csvRows.push(['ANALYTICS REPORT']);
    csvRows.push([`Date: ${new Date().toLocaleDateString()}`]);
    csvRows.push([`Filters: Dimension=${dimension} | Category=${categoryFilter} | Format=${formatFilter} | TimeRange=${timeRange}`]);
    csvRows.push([]);

    // 1. Monthly Trends
    csvRows.push(['MONTHLY TRENDS']);
    if (filteredData.length > 0) {
        const keys = Object.keys(filteredData[0]).filter(k => k !== 'month' && k !== 'period');
        csvRows.push(['Period', ...keys]);
        filteredData.forEach(row => {
            const values = keys.map(k => row[k]);
            csvRows.push([row.period, ...values]);
        });
    } else {
        csvRows.push(['No data available']);
    }
    csvRows.push([]);

    // 2. Popular Categories
    csvRows.push(['POPULAR CATEGORIES']);
    csvRows.push(['Category', 'Count']);
    categoryData.forEach(row => {
        csvRows.push([row.cat, row.count]);
    });
    csvRows.push([]);

    // 3. Peak Days
    csvRows.push(['PEAK BORROWING DAYS']);
    csvRows.push(['Day', 'Loans']);
    peakDaysData.forEach(row => {
        csvRows.push([row.day, row.value]);
    });

    const csvContent = csvRows.map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
          <p className="font-serif font-bold mb-1 text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill || entry.stroke }}></div>
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono font-medium">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) return <Loading className="h-[60vh]" text="Analyzing warehouse data..." />;

  if (error) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="bg-rose-50 p-4 rounded-full mb-4 animate-bounce"><AlertCircle className="h-8 w-8 text-rose-500" /></div>
      <h3 className="text-lg font-bold text-slate-900">Analysis Failed</h3>
      <p className="text-slate-500 max-w-md mt-2 mb-6">{error}</p>
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">Retry Analysis</button>
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="grid xl:grid-cols-[1.08fr_0.92fr] gap-6">
        <div className="surface-dark rounded-[34px] p-6 lg:p-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(209,115,76,0.2),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,118,110,0.16),transparent_26%)]" />
          <div className="relative z-10">
            <p className="eyebrow text-white/55">Decision Studio</p>
            <h1 className="mt-3 text-4xl font-serif text-white">Interactive reports mapped to the brief</h1>
            <p className="mt-4 text-white/72 leading-8 max-w-3xl">
              Compare warehouse data across time, faculty, course, category, and format to answer the decision-maker
              questions assigned to {user.role}.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="chip-dark">
                <BadgeCheck className="h-4 w-4 text-[var(--accent-copper)]" />
                {relevantQuestions.length} questions in current role scope
              </span>
              <span className="chip-dark">
                <Filter className="h-4 w-4 text-[var(--accent-teal)]" />
                Faculty, course, category, and format filters
              </span>
            </div>
          </div>
        </div>

        <div className="surface rounded-[34px] p-6 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Question Coverage</p>
              <h2 className="mt-2 text-3xl font-serif text-slate-950">Reports in scope for this role</h2>
            </div>
            <button onClick={handleExportReport} className="btn-primary shrink-0">
              <Download className="h-4 w-4" />
              Export evidence
            </button>
          </div>

          <div className="mt-6 grid gap-3">
            {relevantQuestions.map(question => (
              <div key={question.id} className="rounded-[24px] border border-slate-200 bg-white/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="chip">{question.id}</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-3 font-semibold text-slate-900">{question.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{question.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="surface p-2 rounded-3xl flex flex-wrap gap-2 items-center">
        <div className="flex items-center px-4 py-2 border-r border-slate-100 mr-2">
            <Filter className="h-4 w-4 text-indigo-500 mr-2" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Filters</span>
        </div>
        
        <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-200/60">
            {['1m', '3m', '6m'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t as any)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  timeRange === t 
                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {t === '1m' ? '1 Month' : t === '3m' ? '3 Months' : '6 Months'}
              </button>
            ))}
        </div>

        <div className="ml-auto flex items-center pr-2 gap-3">
            {/* Category Filter */}
            <div className="relative group">
                <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer min-w-[150px]"
                >
                    {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>

            {/* Format Filter */}
            <div className="relative group">
                <select 
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer min-w-[150px]"
                >
                    {availableFormats.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt === 'All' ? 'All Formats' : fmt}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>

            <div className="w-px h-8 bg-slate-200 mx-2"></div>

            <div className="relative group">
                <select 
                    value={dimension}
                    onChange={(e) => setDimension(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-200 hover:bg-white transition-all cursor-pointer min-w-[180px]"
                >
                    {availableDimensions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Volume Trends (Stacked Area) - PUBLIC */}
        <div className="surface-strong p-8 rounded-3xl relative overflow-hidden hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
          <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
            <div>
                <p className="eyebrow">Q1 / Q2</p>
                <h3 className="text-xl font-serif font-bold text-slate-900">Borrowing Volume</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">Total loans segmented by {dimension}</p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
                <Filter className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
                {dataKeys.map((key, i) => (
                    <Area 
                        key={key}
                        type="monotone" 
                        dataKey={key} 
                        stroke={colors[i % colors.length]} 
                        strokeWidth={2} 
                        fillOpacity={0.1} 
                        fill={colors[i % colors.length]} 
                    />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Categories - PUBLIC */}
        <div className="surface-strong p-8 rounded-3xl lg:col-span-1 flex flex-col hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
           <div className="mb-6 border-b border-slate-100 pb-4">
             <p className="eyebrow">Q3</p>
             <h3 className="text-xl font-serif font-bold text-slate-900">Popular Categories</h3>
             <p className="text-sm text-slate-400 font-medium mt-1">Most borrowed book types</p>
           </div>
           <div className="space-y-6 flex-1">
             {(categoryData.length > 0 ? categoryData : [{cat: 'No Data', count: 0, color: 'bg-slate-200'}]).map((item, idx) => (
               <div key={idx} className="group">
                 <div className="flex mb-2 items-center justify-between">
                   <div className="flex items-center">
                     <span className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 text-xs font-bold flex items-center justify-center mr-4 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                       {idx + 1}
                     </span>
                     <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                       {item.cat}
                     </span>
                   </div>
                   <div className="text-right">
                     <span className="text-sm font-mono font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                       {item.count.toLocaleString()}
                     </span>
                   </div>
                 </div>
                 <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-slate-50 border border-slate-100">
                   <div 
                        style={{ width: categoryData.length > 0 ? `${(item.count / (categoryData[0].count * 1.1)) * 100}%` : '0%' }} 
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${item.color} transition-all duration-1000 ease-out`}
                    ></div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Chart 2.5: Peak Borrowing Days (New) - PUBLIC */}
        <div className="surface-strong p-8 rounded-3xl lg:col-span-2 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
          <div className="mb-6 border-b border-slate-100 pb-4">
             <p className="eyebrow">Q3</p>
             <h3 className="text-xl font-serif font-bold text-slate-900">Peak Borrowing Days</h3>
             <p className="text-sm text-slate-400 font-medium mt-1">Which days of the week are busiest?</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakDaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Loans" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- SENSITIVE SECTIONS --- */}

        {/* Chart 3: Average Duration Bar/Line - VC, CL, DH ONLY */}
        {['Vice-chancellor', 'Chief Librarian', 'Departmental Head'].includes(user.role) && (
            <div className="surface-strong p-8 rounded-3xl lg:col-span-1 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
            <div className="mb-6 border-b border-slate-100 pb-4">
                <p className="eyebrow">Q7</p>
                <h3 className="text-xl font-serif font-bold text-slate-900">Avg. Loan Duration (Days)</h3>
                <p className="text-sm text-slate-400 font-medium mt-1">How long students keep books by Faculty</p>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgDurationData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" name="Avg Days" stroke="#ec4899" strokeWidth={3} dot={{r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}

        {/* Chart 4: Financials (Fines) - VC, FD ONLY */}
        {['Vice-chancellor', 'Finance Director'].includes(user.role) && (
            <div className="surface-strong p-8 rounded-3xl lg:col-span-1 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
            <p className="eyebrow">Q4</p>
            <h3 className="text-xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Fines Overview</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                <div className="h-64 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={finesData.length > 0 ? finesData : [{name: 'No Data', value: 1, fill: '#eee'}]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {(finesData.length > 0 ? finesData : [{name: 'No Data', value: 1, fill: '#eee'}]).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                    {finesData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.fill }}></div>
                            <span className="text-sm font-medium text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 font-mono">${(item.value || 0).toLocaleString()}</span>
                    </div>
                    ))}
                </div>
            </div>
            </div>
        )}

        {/* Chart 5: Dead Stock - VC, CL ONLY */}
        {['Vice-chancellor', 'Chief Librarian'].includes(user.role) && (
            <div className="surface-strong p-8 rounded-3xl lg:col-span-2 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
                <div className="mb-6 border-b border-slate-100 pb-4 flex justify-between items-end">
                    <div>
                        <p className="eyebrow">Q8</p>
                        <h3 className="text-xl font-serif font-bold text-slate-900">Inventory Alerts: Dead Stock</h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">Books that have never been borrowed (Potential for removal)</p>
                    </div>
                    <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-[0.2em] flex items-center">
                        <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
                        Action Required
                    </div>
                </div>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="min-w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50/80 backdrop-blur-sm font-bold tracking-[0.2em] border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {deadStockData.length > 0 ? deadStockData.map((book, i) => (
                                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{book.title}</td>
                                    <td className="px-6 py-4 font-medium">{book.author}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {book.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><span className="bg-rose-50 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-100 flex w-fit items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Unused
                                    </span></td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No dead stock found. Efficient inventory!</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Chart 6: Student Demographics - AD ONLY */}
        {['Admission Director', 'Vice-chancellor'].includes(user.role) && (
            <div className="surface-strong p-8 rounded-3xl lg:col-span-1 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
                <div className="mb-6 border-b border-slate-100 pb-4">
                    <p className="eyebrow">Q5</p>
                    <h3 className="text-xl font-serif font-bold text-slate-900">Demographics</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">Loans by Student Year Group</p>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fontWeight: 'bold'}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Loans" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        {/* Chart 7: At-Risk Students - AD, DH ONLY */}
        {['Admission Director', 'Departmental Head', 'Vice-chancellor'].includes(user.role) && (
            <div className="surface-strong p-8 rounded-3xl lg:col-span-1 hover:shadow-2xl hover:shadow-slate-200/70 transition-shadow duration-300">
                <div className="mb-6 border-b border-slate-100 pb-4">
                    <p className="eyebrow">Q6</p>
                    <h3 className="text-xl font-serif font-bold text-slate-900">At-Risk Students</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">High fines & overdue rates</p>
                </div>
                <div className="overflow-hidden">
                    {atRiskData.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                    {s.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900">{s.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{s.faculty}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-rose-600">${s.total_fines}</p>
                                <p className="text-[10px] font-bold text-slate-400">{s.overdue_count} Overdue</p>
                            </div>
                        </div>
                    ))}
                    {atRiskData.length === 0 && <p className="text-center text-xs text-slate-400 py-4">No at-risk students found.</p>}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
