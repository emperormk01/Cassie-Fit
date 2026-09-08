
import React, { useState, useMemo } from 'react';
import { 
  Award, Lock, Star, Zap, ChefHat, Target, 
  Calendar, Sunrise, Flame, X, Trophy, Medal, 
  ChevronRight, CheckCircle2 
} from 'lucide-react';
import { DailyLogItem, UserTargets } from '../types';

interface MilestonesProps {
  dailyLog?: DailyLogItem[];
  targets?: UserTargets;
  streak?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isUnlocked: boolean;
  current: number;
  target: number;
  color: string;
  bg: string;
}

export const Milestones: React.FC<MilestonesProps> = ({ 
  dailyLog = [], 
  targets = { calories: 2000, protein: 150, carbs: 200, fat: 60, planMode: 'standard' },
  streak = 0
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Achievement Logic Engine ---
  const achievements: Achievement[] = useMemo(() => {
    // 1. Pre-calculate Stats
    const totalLogs = dailyLog.length;
    
    // Group logs by date
    const logsByDate: Record<string, DailyLogItem[]> = {};
    dailyLog.forEach(log => {
        const date = new Date(log.timestamp).toDateString();
        if (!logsByDate[date]) logsByDate[date] = [];
        logsByDate[date].push(log);
    });
    
    const uniqueDays = Object.keys(logsByDate).length;
    
    let breakfastCount = 0;
    let perfectMacroDays = 0;
    let perfectCalorieDays = 0;

    Object.values(logsByDate).forEach(dayLogs => {
        const dayCals = dayLogs.reduce((acc, i) => acc + i.calories, 0);
        const dayProt = dayLogs.reduce((acc, i) => acc + i.protein, 0);

        // Check Breakfast
        if (dayLogs.some(l => l.mealType === 'Breakfast')) breakfastCount++;

        // Check Protein Target (>= 90% of target)
        if (dayProt >= targets.protein * 0.9) perfectMacroDays++;

        // Check Calorie Target (+/- 15%)
        const calDiff = Math.abs(dayCals - targets.calories);
        if (calDiff <= targets.calories * 0.15) perfectCalorieDays++;
    });

    // 2. Define Achievements
    const list: Omit<Achievement, 'isUnlocked'>[] = [
      {
        id: 'streak_3',
        title: 'Momentum Builder',
        description: 'Reach a 3-day streak',
        icon: <Zap size={20} />,
        tier: 'bronze',
        current: streak,
        target: 3,
        color: 'text-yellow-500',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30'
      },
      {
        id: 'streak_7',
        title: 'Unstoppable',
        description: 'Reach a 7-day streak',
        icon: <Flame size={20} />,
        tier: 'silver',
        current: streak,
        target: 7,
        color: 'text-orange-500',
        bg: 'bg-orange-100 dark:bg-orange-900/30'
      },
      {
         id: 'streak_30',
         title: 'Titanium Discipline',
         description: 'Reach a 30-day streak',
         icon: <Trophy size={20} />,
         tier: 'gold',
         current: streak,
         target: 30,
         color: 'text-purple-500',
         bg: 'bg-purple-100 dark:bg-purple-900/30'
      },
      {
        id: 'logs_1',
        title: 'First Step',
        description: 'Log your first meal',
        icon: <ChefHat size={20} />,
        tier: 'bronze',
        current: totalLogs,
        target: 1,
        color: 'text-sky-500',
        bg: 'bg-sky-100 dark:bg-sky-900/30'
      },
      {
        id: 'logs_20',
        title: 'Data Collector',
        description: 'Log 20 total items',
        icon: <Calendar size={20} />,
        tier: 'silver',
        current: totalLogs,
        target: 20,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/30'
      },
      {
         id: 'breakfast_5',
         title: 'Early Riser',
         description: 'Log breakfast 5 times',
         icon: <Sunrise size={20} />,
         tier: 'bronze',
         current: breakfastCount,
         target: 5,
         color: 'text-amber-500',
         bg: 'bg-amber-100 dark:bg-amber-900/30'
      },
      {
         id: 'protein_5',
         title: 'Protein Pro',
         description: 'Hit protein target 5 times',
         icon: <Award size={20} />,
         tier: 'silver',
         current: perfectMacroDays,
         target: 5,
         color: 'text-indigo-500',
         bg: 'bg-indigo-100 dark:bg-indigo-900/30'
      },
      {
         id: 'cal_perfect_10',
         title: 'Precision Master',
         description: 'Hit calorie goal 10 times',
         icon: <Target size={20} />,
         tier: 'gold',
         current: perfectCalorieDays,
         target: 10,
         color: 'text-emerald-500',
         bg: 'bg-emerald-100 dark:bg-emerald-900/30'
      }
    ];

    // 3. Process Status
    return list.map(a => ({
        ...a,
        isUnlocked: a.current >= a.target
    }));

  }, [dailyLog, targets, streak]);

  // Sort: Unlocked first, then by closest to completion
  const sortedAchievements = useMemo(() => {
     return [...achievements].sort((a, b) => {
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        // Both locked: sort by % complete (descending)
        return (b.current / b.target) - (a.current / a.target);
     });
  }, [achievements]);

  // Widget View: Show top 4 most relevant (Prioritize 'Almost There' or 'Just Unlocked')
  const widgetDisplay = sortedAchievements.slice(0, 4);

  return (
    <>
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 mt-6 animate-in slide-in-from-bottom duration-500">
       <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-3">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-500">
               <Star size={20} fill="currentColor" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-white text-lg">Milestones</h3>
         </div>
         <span className="text-xs font-bold text-slate-400">
            {achievements.filter(a => a.isUnlocked).length} / {achievements.length} Unlocked
         </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
         {widgetDisplay.map((m) => (
           <div 
             key={m.id} 
             className={`p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all relative overflow-hidden group ${
               m.isUnlocked 
                 ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm' 
                 : 'bg-slate-50 dark:bg-slate-900/50 border-slate-50 dark:border-slate-800'
             }`}
           >
              {/* Shine effect for unlocked */}
              {m.isUnlocked && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:via-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />}

              <div className={`p-3 rounded-full ${m.bg} ${m.color} relative transition-transform duration-300 group-hover:scale-110`}>
                 {m.icon}
                 {!m.isUnlocked && (
                   <div className="absolute -bottom-1 -right-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-full border-2 border-white dark:border-slate-900">
                      <Lock size={10} className="text-slate-500 dark:text-slate-400" />
                   </div>
                 )}
              </div>
              <div className="flex flex-col gap-0.5 w-full">
                  <span className={`text-xs font-bold truncate ${m.isUnlocked ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                    {m.title}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">{m.description}</span>
              </div>
              
              {m.isUnlocked ? (
                 <div className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full mt-auto">
                    <CheckCircle2 size={10} /> Completed
                 </div>
              ) : (
                 <div className="w-full mt-auto">
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1 px-1">
                        <span>{Math.round((m.current/m.target)*100)}%</span>
                        <span>{m.current}/{m.target}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-400 dark:bg-slate-500 transition-all duration-1000 ease-out" 
                          style={{ width: `${(m.current / m.target) * 100}%` }} 
                        />
                    </div>
                 </div>
              )}
           </div>
         ))}
      </div>
      
      <button 
        onClick={() => setIsModalOpen(true)}
        className="w-full mt-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center justify-center gap-1 group"
      >
         View All Achievements 
         <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

    {/* --- View All Modal --- */}
    {isModalOpen && (
      <>
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
        />
        <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[500px] max-h-[85vh] bg-[#FDFBF7] dark:bg-slate-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] z-[100] shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center z-10">
               <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Achievements</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">
                     Level up your journey
                  </p>
               </div>
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
               >
                  <X size={24} />
               </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FDFBF7] dark:bg-slate-950">
               
               {/* Summary Stats */}
               <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-4 rounded-2xl text-white text-center shadow-lg shadow-orange-200 dark:shadow-none">
                     <div className="text-2xl font-black">{achievements.filter(a => a.isUnlocked).length}</div>
                     <div className="text-[10px] font-bold uppercase opacity-80">Earned</div>
                  </div>
                   <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                     <div className="text-2xl font-black text-slate-800 dark:text-white">{achievements.length}</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700">
                     <div className="text-2xl font-black text-sky-500">{Math.round((achievements.filter(a => a.isUnlocked).length / achievements.length) * 100)}%</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase">Complete</div>
                  </div>
               </div>

               {/* Achievement List */}
               {sortedAchievements.map((m) => {
                  // Determine Tier Border Color
                  const borderColor = m.tier === 'gold' ? 'border-yellow-200 dark:border-yellow-800' 
                                    : m.tier === 'silver' ? 'border-slate-200 dark:border-slate-600'
                                    : 'border-orange-100 dark:border-orange-900';
                  
                  return (
                    <div 
                      key={m.id}
                      className={`relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 border-2 transition-all duration-300 ${
                        m.isUnlocked 
                           ? `${borderColor} shadow-sm opacity-100` 
                           : 'border-slate-100 dark:border-slate-800 opacity-60 grayscale-[0.5]'
                      }`}
                    >
                       <div className="flex items-start gap-4">
                          <div className={`shrink-0 w-14 h-14 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center shadow-inner`}>
                             {m.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">{m.title}</h4>
                                {m.isUnlocked && (
                                   <Medal size={16} className={
                                      m.tier === 'gold' ? 'text-yellow-500' 
                                      : m.tier === 'silver' ? 'text-slate-400' 
                                      : 'text-orange-400'
                                   } />
                                )}
                             </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                                {m.description}
                             </p>
                             
                             {/* Progress Bar */}
                             <div className="relative pt-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                                   <span>{m.isUnlocked ? 'Completed' : 'In Progress'}</span>
                                   <span>{Math.min(m.current, m.target)} / {m.target}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                   <div 
                                     className={`h-full rounded-full transition-all duration-1000 ${m.isUnlocked ? 'bg-green-500' : 'bg-sky-500'}`}
                                     style={{ width: `${(Math.min(m.current, m.target) / m.target) * 100}%` }}
                                   />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
               })}
               
               <div className="h-4" /> {/* Bottom spacer */}
            </div>
        </div>
      </>
    )}
    </>
  );
};
