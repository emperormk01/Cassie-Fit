import React from 'react';
import { Flame, Check, Zap } from 'lucide-react';

export interface DayStatus {
  label: string;
  hasLog: boolean;
  isToday: boolean;
  date: string;
}

interface StreakCardProps {
  streak: number;
  history?: DayStatus[];
}

export const StreakCard: React.FC<StreakCardProps> = ({ 
  streak = 0,
  history = [] // Default empty to prevent crash
}) => {
  
  // Dynamic Motivational Message
  const getMessage = () => {
    if (streak === 0) return "Start your journey today!";
    if (streak < 3) return "You're just getting started!";
    if (streak < 7) return "You're on fire! Keep it up!";
    if (streak < 14) return "Unstoppable! Two weeks soon!";
    return "Legendary discipline! 🏆";
  };

  return (
    <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-[2.5rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden mb-6 group transition-all duration-500 hover:shadow-orange-500/40">
      
      {/* Animated Background Decor */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 animate-[pulse_4s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-xl transform -translate-x-1/2 translate-y-1/2" />
      
      {/* Floating Particles (CSS only for perf) */}
      {streak > 0 && (
         <>
           <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-60 animate-[ping_3s_linear_infinite]" />
           <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white rounded-full opacity-40 animate-[ping_2s_linear_infinite_reverse]" />
         </>
      )}

      <div className="relative z-10 flex justify-between items-start">
        <div className="flex flex-col">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
            <Flame 
              size={14} 
              className={`text-yellow-300 fill-yellow-300 ${streak > 0 ? 'animate-[bounce_2s_infinite]' : ''}`} 
            />
            <span className="text-xs font-bold tracking-wide uppercase">
              {streak > 0 ? 'Current Streak' : 'No Active Streak'}
            </span>
          </div>

          {/* Counter */}
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-5xl font-black tracking-tighter drop-shadow-sm animate-in zoom-in duration-500">
              {streak}
            </h2>
            <span className="text-lg font-bold text-orange-100">days</span>
          </div>
          
          <p className="text-xs text-orange-100 font-bold mt-1 opacity-90 flex items-center gap-1">
             {streak > 3 && <Zap size={12} fill="currentColor" className="text-yellow-300" />}
             {getMessage()}
          </p>
        </div>

        {/* Days Visualization */}
        <div className="flex gap-1.5 pt-2">
            {history.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 group/day">
                    <div 
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative
                        ${day.hasLog 
                           ? 'bg-white border-white text-orange-500 shadow-md scale-100' 
                           : day.isToday
                             ? 'bg-white/20 border-white text-white animate-pulse'
                             : 'bg-transparent border-white/20 text-white/40'
                        }
                      `}
                    >
                        {day.hasLog ? (
                           <Check size={14} strokeWidth={4} className="animate-in zoom-in duration-300" />
                        ) : (
                           <div className={`w-1 h-1 rounded-full ${day.isToday ? 'bg-white' : 'bg-white/30'}`} />
                        )}
                        
                        {/* Tooltip for Date on Hover (Mobile touch support varies, good for desktop view) */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-2 py-1 rounded-md opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                           {day.date.split(' ').slice(0,3).join(' ')}
                        </div>
                    </div>
                    
                    <span className={`text-[9px] font-bold uppercase ${day.isToday ? 'text-white' : 'text-white/60'}`}>
                      {day.label}
                    </span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};