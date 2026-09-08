import React from 'react';

interface DailyGoalRingProps {
  consumed: number;
  target: number;
  unit?: string;
}

export const DailyGoalRing: React.FC<DailyGoalRingProps> = ({ 
  consumed, 
  target, 
  unit = 'kcal' 
}) => {
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (consumed / target) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-50">
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background Ring */}
          <circle
            stroke="#F3F4F6"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
          {/* Progress Ring */}
          <circle
            stroke="#38BDF8" 
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
            fill="transparent"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute flex flex-col items-center text-center">
          <span className="text-3xl font-extrabold text-slate-800">{consumed}</span>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            of {target} {unit}
          </span>
        </div>
      </div>
      
      <div className="mt-2 text-center">
         <p className="text-sm font-semibold text-sky-600">You're doing great!</p>
      </div>
    </div>
  );
};