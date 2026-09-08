
import React from 'react';
import { ArrowRight, TrendingDown, RefreshCw } from 'lucide-react';
import { SubstitutionItem } from '../types';

interface ChatSubstitutionCardProps {
  items: SubstitutionItem[];
}

export const ChatSubstitutionCard: React.FC<ChatSubstitutionCardProps> = ({ items }) => {
  return (
    <div className="flex flex-col gap-3 mt-3 w-full max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-500">
      {items.map((item, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
            
            {/* Header / Context */}
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                    <RefreshCw size={14} />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Smart Swap</span>
            </div>

            <div className="flex items-center justify-between mb-4 relative">
                {/* Connector Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 dark:bg-slate-700 -z-10" />

                {/* Original */}
                <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl text-sm font-bold text-slate-400 line-through decoration-red-400 decoration-2">
                    {item.original}
                </div>

                {/* Arrow */}
                <div className="bg-white dark:bg-slate-900 p-1 text-slate-300">
                    <ArrowRight size={16} />
                </div>

                {/* Substitute */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl text-lg font-black text-slate-800 dark:text-white leading-tight shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                    {item.substitute}
                </div>
            </div>

            {/* Delta Badge */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-3 border border-slate-100 dark:border-slate-700/50 flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {item.delta}
                </span>
            </div>

            {/* Reason */}
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic border-l-2 border-emerald-200 dark:border-emerald-800 pl-3">
                 "{item.reason}"
             </p>
        </div>
      ))}
    </div>
  );
};
