import React from 'react';
import { ProgressBar } from './ProgressBar';

interface GoalRowProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  target: number;
  unit: string;
  color: 'sky' | 'tangerine' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  isOver?: boolean;
}

export const GoalRow: React.FC<GoalRowProps> = ({ 
  icon, 
  label, 
  current, 
  target, 
  unit, 
  color,
  isOver = false
}) => {
  
  const glassClasses = {
    red: 'bg-gradient-to-br from-red-500/20 to-red-500/5 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-400/20 shadow-[0_4px_12px_rgba(239,68,68,0.1)]',
    green: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-400/20 shadow-[0_4px_12px_rgba(16,185,129,0.1)]',
    yellow: 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 dark:border-yellow-400/20 shadow-[0_4px_12px_rgba(234,179,8,0.1)]',
    purple: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-purple-400/20 shadow-[0_4px_12px_rgba(168,85,247,0.1)]',
    sky: 'bg-gradient-to-br from-sky-500/20 to-sky-500/5 text-sky-600 dark:text-sky-400 border border-sky-500/20 dark:border-sky-400/20 shadow-[0_4px_12px_rgba(14,165,233,0.1)]',
    tangerine: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-orange-600 dark:text-orange-400 border border-orange-500/20 dark:border-orange-400/20 shadow-[0_4px_12px_rgba(249,115,22,0.1)]',
    blue: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-blue-400/20 shadow-[0_4px_12px_rgba(59,130,246,0.1)]',
  };

  const defaultClass = 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-50 dark:border-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex items-center gap-4 transition-colors">
      {/* Glass Icon Container */}
      <div className={`p-3.5 rounded-2xl flex-shrink-0 transition-colors backdrop-blur-sm ${glassClasses[color] || defaultClass}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold text-slate-700 dark:text-slate-200">{label}</h4>
          <div className="text-sm">
            <span className={`font-bold ${isOver ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {current}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">
               {' '}/ {target}{unit}
            </span>
          </div>
        </div>
        <ProgressBar value={current} max={target} color={color} height="sm" />
      </div>
    </div>
  );
};