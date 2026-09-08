import React, { useMemo, useState, useEffect } from 'react';
import { Activity, Zap, Utensils, TrendingUp, AlertCircle, ArrowRight, Fish } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { DailyLogItem, UserTargets } from '../types';

interface WeeklyInsightsProps {
  dailyLog?: DailyLogItem[];
  targets?: UserTargets;
}

export const WeeklyInsights: React.FC<WeeklyInsightsProps> = ({ 
  dailyLog = [], 
  targets = { calories: 2000, protein: 150, carbs: 200, fat: 60, planMode: 'standard' } 
}) => {
  const [animateBars, setAnimateBars] = useState(false);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // --- Process Data for Last 7 Days ---
  const weeklyData = useMemo(() => {
    const days = [];
    const today = new Date();
    
    // Arrays for chart data (0-100 scale)
    const energy = [];
    const protein = [];
    const consistency = [];

    let totalScoreSum = 0;
    let proteinDeficitCount = 0;
    let highCarbCount = 0;
    let perfectDays = 0;

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toDateString();
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
        
        // Filter logs for this day
        const dayLogs = dailyLog.filter(l => new Date(l.timestamp).toDateString() === dateStr);
        
        // Sums
        const dayCal = dayLogs.reduce((acc, curr) => acc + curr.calories, 0);
        const dayProt = dayLogs.reduce((acc, curr) => acc + curr.protein, 0);
        const dayCarbs = dayLogs.reduce((acc, curr) => acc + curr.carbs, 0);

        // 1. Energy % (Capped at 100 for visual, but we track overage logic separately)
        // If 0 logs, 0 height.
        const energyPct = dayLogs.length ? Math.min(100, (dayCal / targets.calories) * 100) : 5;
        
        // 2. Protein % 
        const proteinPct = dayLogs.length ? Math.min(100, (dayProt / targets.protein) * 100) : 5;

        // 3. Consistency Score
        // Formula: 100 - deviation %
        let dayScore = 0;
        if (dayLogs.length > 0) {
           const deviation = Math.abs(targets.calories - dayCal) / targets.calories;
           dayScore = Math.max(10, Math.min(100, (1 - deviation) * 100));
        } else {
           dayScore = 5; // Empty state
        }

        // Analytics
        if (dayProt < targets.protein * 0.7 && dayLogs.length > 0) proteinDeficitCount++;
        if (dayCarbs > targets.carbs * 1.1) highCarbCount++;
        if (dayScore > 85) perfectDays++;
        totalScoreSum += dayScore;

        days.push(dayLabel);
        energy.push(Math.round(energyPct));
        protein.push(Math.round(proteinPct));
        consistency.push(Math.round(dayScore));
    }

    const avgScore = Math.round(totalScoreSum / 7);

    return { 
       days, energy, protein, consistency, avgScore, proteinDeficitCount, highCarbCount, perfectDays 
    };
  }, [dailyLog, targets]);

  // --- Dynamic Pattern Detection ---
  const getPatternInsight = () => {
     if (weeklyData.perfectDays >= 4) {
        return {
           icon: <Zap size={16} />,
           label: "High Performance",
           detail: "Consistent Focus",
           desc: "Your consistency score is sky high this week. You're hitting your calorie targets with precision."
        };
     }
     if (weeklyData.proteinDeficitCount >= 3) {
        return {
           icon: <Fish size={16} />,
           label: "Protein Gap",
           detail: "Below Target",
           desc: "You missed your protein goal on multiple days. Try adding a shake or greek yogurt as a snack."
        };
     }
     if (weeklyData.highCarbCount >= 3) {
        return {
           icon: <Activity size={16} />,
           label: "Carb Heavy",
           detail: "Energy Spikes",
           desc: "Higher carb intake detected. This might be causing those mid-afternoon energy crashes."
        };
     }
     return {
        icon: <TrendingUp size={16} />,
        label: "Building Data",
        detail: "Keep Logging",
        desc: "Log consistently for 3 more days to unlock advanced metabolic pattern recognition."
     };
  };

  const insight = getPatternInsight();

  // --- Dynamic Cassie Feedback ---
  const getFeedback = () => {
     if (weeklyData.avgScore > 80) return "You are crushing it this week! Your metabolic map is glowing green. Keep this rhythm going into the weekend!";
     if (weeklyData.avgScore > 50) return "Solid effort! We're building good momentum. Let's focus on hitting that protein target a bit more consistently.";
     return "Rough week? That's okay! Progress isn't linear. Let's try to log just one perfect meal today to get back on track.";
  };

  const ChartColumn = ({ label, data, colorClass, icon }: { label: string, data: number[], colorClass: string, icon: React.ReactNode }) => (
    <div className="flex flex-col gap-2">
       <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
       </div>
       <div className="flex items-end justify-between h-24 gap-1.5">
          {data.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group">
               {/* Tooltip */}
               <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-8 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 z-10">
                  {val}%
               </div>
               
               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm rounded-b-lg relative h-full overflow-hidden flex items-end">
                  <div 
                    className={`w-full rounded-t-sm rounded-b-lg transition-all duration-[1500ms] ease-out ${colorClass}`}
                    style={{ height: animateBars ? `${Math.max(5, val)}%` : '5%' }} 
                  />
               </div>
               <span className="text-[9px] text-slate-300 font-bold">{weeklyData.days[i]}</span>
            </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center gap-3 mb-6">
         <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-500">
            <TrendingUp size={20} />
         </div>
         <h3 className="font-black text-slate-800 dark:text-white text-lg">Weekly Reflection</h3>
      </div>

      <div className="space-y-8 mb-6">
         <ChartColumn 
           label="Calorie Consistency" 
           data={weeklyData.energy} 
           colorClass="bg-yellow-400" 
           icon={<Activity size={14} className="text-yellow-500" />}
         />
         <ChartColumn 
           label="Protein Intake" 
           data={weeklyData.protein} 
           colorClass="bg-blue-400" 
           icon={<Fish size={14} className="text-blue-500" />}
         />
         <ChartColumn 
           label="Target Score" 
           data={weeklyData.consistency} 
           colorClass="bg-emerald-400" 
           icon={<Utensils size={14} className="text-emerald-500" />}
         />
      </div>

      {/* Pattern Recognition Section (Dynamic) */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Pattern Recognition</h3>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
           
           <div className="flex items-start gap-3 mb-2 relative z-10">
             <div className="bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-sm text-sky-500">
                <AlertCircle size={16} />
             </div>
             <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{insight.label}</span>
           </div>
           
           <div className="flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl backdrop-blur-sm relative z-10 border border-white/50 dark:border-white/5">
              <div className="text-center">
                 <div className="text-xl mb-1 flex justify-center text-slate-600 dark:text-slate-300">{insight.icon}</div>
                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Trend</div>
              </div>
              <ArrowRight size={16} className="text-slate-300" />
              <div className="text-center">
                 <div className="text-lg font-black text-slate-700 dark:text-slate-200 leading-tight">{weeklyData.avgScore}</div>
                 <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Score</div>
              </div>
           </div>
           
           <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium px-1 relative z-10">
             {insight.desc}
           </p>

           {/* Decor */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Cassie's Feedback (Dynamic) */}
      <div className="bg-sky-50 dark:bg-sky-900/10 rounded-2xl p-4 flex gap-4 items-start relative overflow-hidden border border-sky-100 dark:border-sky-800/30">
         <div className="flex-shrink-0">
            <CassieMascot expression="happy" size={48} />
         </div>
         <div className="relative z-10">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
               <span className="font-bold text-sky-600 dark:text-sky-400 block mb-1">Weekly Update</span>
               {getFeedback()}
            </p>
         </div>
         {/* Decor */}
         <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sky-200/20 dark:bg-sky-400/10 rounded-full blur-2xl" />
      </div>
    </div>
  );
};