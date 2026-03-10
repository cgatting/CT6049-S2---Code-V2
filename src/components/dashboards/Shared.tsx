import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { KPIMetric } from '../../types';

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-slate-800 text-xs p-3 border border-slate-200 shadow-lg rounded-lg">
        <p className="font-semibold mb-2 text-slate-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
            <span className="text-slate-500 font-medium">{entry.name}:</span>
            <span className="font-mono font-medium text-indigo-600">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const KPICard: React.FC<{ metric: KPIMetric; icon: React.ElementType; color?: string }> = ({ metric, icon: Icon, color = 'prussian' }) => {
  // Simplify color map for a cleaner look, primarily using white cards with colored accents
  const isPositive = metric.trend === 'up';

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-indigo-50 p-3 rounded-lg">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        {metric.change !== 0 && (
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(metric.change)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{metric.label}</p>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{metric.value}</h3>
      </div>
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-6 flex flex-col justify-between gap-1">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
);
