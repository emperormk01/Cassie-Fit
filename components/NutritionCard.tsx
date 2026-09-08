import React from 'react';
import { ProgressBar } from './ProgressBar';
import { NutritionData } from '../types';

interface NutritionCardProps {
  data: NutritionData;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ data }) => {
  const percentage = (data.value / data.total) * 100;
  const left = data.total - data.value;

  const glassClasses = {
    sky: 'bg-gradient-to-br from-sky-500/20 to-sky-500/5 border border-sky-500/20 text-sky-600',
    tangerine: 'bg-gradient-to-br from-tangerine-500/20 to-tangerine-500/5 border border-tangerine-500/20 text-tangerine-600',
    blue: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 text-blue-600',
    green: 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 text-emerald-600',
    red: 'bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/20 text-red-600',
    purple: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 text-purple-600',
    yellow: 'bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border border-yellow-500/20 text-yellow-600',
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col h-full hover:shadow-[0_4px_12px_rgba(56,189,248,0.15)] transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-2xl backdrop-blur-sm ${glassClasses[data.color] || 'bg-slate-50 text-slate-500'}`}>
          {data.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-700">{data.label}</h3>
          <p className="text-xs text-slate-400 font-medium">{data.value} / {data.total}{data.unit}</p>
        </div>
      </div>
      
      <div className="mt-auto">
        <ProgressBar 
          value={data.value} 
          max={data.total} 
          color={data.color} 
          height="sm" 
        />
        <p className="text-[10px] text-right mt-1.5 text-slate-400 font-medium">
          {left > 0 ? `${left.toFixed(0)}${data.unit} left` : 'Goal met!'}
        </p>
      </div>
    </div>
  );
};