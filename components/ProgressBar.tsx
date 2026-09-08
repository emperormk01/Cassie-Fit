import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'sky' | 'tangerine' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  color = 'sky', 
  height = 'md',
  showLabel = false
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colors = {
    sky: 'bg-sky-400',
    tangerine: 'bg-tangerine-400',
    blue: 'bg-blue-400',
    green: 'bg-emerald-400',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-400'
  };

  const bgColors = {
    sky: 'bg-sky-100',
    tangerine: 'bg-tangerine-100',
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    yellow: 'bg-yellow-100'
  };

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-1">
        {showLabel && (
          <span className="text-xs font-semibold text-gray-500">{percentage.toFixed(0)}%</span>
        )}
      </div>
      <div className={`w-full ${bgColors[color]} rounded-full overflow-hidden ${heights[height]}`}>
        <div 
          className={`${colors[color]} h-full rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};