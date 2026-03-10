import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  fullScreen?: boolean;
  text?: string;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, text = 'LOADING SYSTEM...', className = '' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[rgba(245,241,232,0.9)] z-50 flex flex-col items-center justify-center">
        <div className="surface-strong p-8 flex flex-col items-center max-w-sm text-center">
            <Loader2 className="h-12 w-12 text-[var(--accent-copper)] animate-spin mb-4" />
            <p className="text-slate-950 font-semibold text-lg tracking-[0.2em] uppercase animate-pulse">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="h-8 w-8 text-[var(--accent-copper)] animate-spin mb-3" />
      <p className="text-slate-700 text-xs font-semibold uppercase tracking-[0.24em]">{text}</p>
    </div>
  );
};
