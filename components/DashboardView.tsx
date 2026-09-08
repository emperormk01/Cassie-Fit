
import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  ChevronRight,
  Utensils,
  Apple,
  Fish,
  Droplet,
  Plus,
  Sun
} from 'lucide-react';
import { GoalRow } from './GoalRow';
import { WeeklyInsights } from './WeeklyInsights';
import { Milestones } from './Milestones';
import { StreakCard, DayStatus } from './StreakCard';
import { BioHealthScoreCard } from './BioHealthScoreCard';
import { MetabolicMapWidget } from './MetabolicMapWidget';
import { UserProfileData, DailyLogItem, UserTargets } from '../types';
import { LogDetailsModal } from './LogDetailsModal';

interface DashboardViewProps {
  userProfile?: UserProfileData | null;
  dailyLog: DailyLogItem[];
  targets: UserTargets;
  onAskCassie: (item: DailyLogItem) => void;
  onAddLog: () => void;
  onStartCheckIn: () => void;
  favorites?: string[];
  onToggleFavorite?: (foodName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  userProfile, 
  dailyLog, 
  targets, 
  onAskCassie, 
  onAddLog, 
  onStartCheckIn,
  favorites = [],
  onToggleFavorite
}) => {
  const [selectedLogItem, setSelectedLogItem] = useState<DailyLogItem | null>(null);

  // Date Formatting
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const todayDateStr = today.toDateString();

  // Filter logs to only show today's entries for the daily summary and list
  // ADDED: Deduplication step to ensure visual integrity even if state has duplicates
  const todaysLogs = useMemo(() => {
    // 1. Filter by date (Safety check for valid timestamp)
    const dayItems = dailyLog.filter(item => {
        if (!item.timestamp) return false;
        return new Date(item.timestamp).toDateString() === todayDateStr;
    });
    
    // 2. Deduplicate by ID
    const uniqueMap = new Map();
    dayItems.forEach(item => {
        // Only add if ID not present. This keeps the first occurrence.
        if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
        }
    });
    
    return Array.from(uniqueMap.values());
  }, [dailyLog, todayDateStr]);

  // Calculate current totals based on TODAY'S unique logs
  const currentCalories = todaysLogs.reduce((sum, item) => sum + item.calories, 0);
  const currentProtein = todaysLogs.reduce((sum, item) => sum + item.protein, 0);
  const currentCarbs = todaysLogs.reduce((sum, item) => sum + item.carbs, 0);
  const currentFat = todaysLogs.reduce((sum, item) => sum + item.fat, 0);

  // --- Streak Logic Calculation (Uses FULL history) ---
  const streakData = useMemo(() => {
     // 1. Identify all unique dates that have logs
     const loggedDates = new Set(
       dailyLog.map(item => new Date(item.timestamp).toDateString())
     );

     // 2. Calculate Streak Count (Consecutive days backwards)
     let streak = 0;
     
     // Determine where to start counting
     let checkDate = new Date(today);
     
     if (loggedDates.has(todayDateStr)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
     } else {
        // Check if yesterday exists to maintain a previous streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!loggedDates.has(yesterday.toDateString())) {
           // Streak broken
           checkDate = null as any; 
        } else {
           checkDate = yesterday;
        }
     }

     if (checkDate) {
        while (true) {
           const dateStr = checkDate.toDateString();
           if (loggedDates.has(dateStr)) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
           } else {
              break;
           }
        }
     }

     // 3. Generate History for the Last 7 Days (Ending Today)
     const history: DayStatus[] = [];
     for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toDateString();
        
        history.push({
           label: d.toLocaleDateString('en-US', { weekday: 'narrow' }), // M, T, W...
           date: dateStr,
           hasLog: loggedDates.has(dateStr),
           isToday: dateStr === todayDateStr
        });
     }

     return { streak, history };
  }, [dailyLog, todayDateStr]); 

  // Helper to determine icon/color based on meal type
  const getMealStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast': return { color: 'amber', iconClass: 'from-amber-400/20 to-amber-400/5 text-amber-600 dark:text-amber-400 border-amber-400/20' };
      case 'lunch': return { color: 'sky', iconClass: 'from-sky-400/20 to-sky-400/5 text-sky-600 dark:text-sky-400 border-sky-400/20' };
      case 'dinner': return { color: 'indigo', iconClass: 'from-indigo-400/20 to-indigo-400/5 text-indigo-600 dark:text-indigo-400 border-indigo-400/20' };
      default: return { color: 'emerald', iconClass: 'from-emerald-400/20 to-emerald-400/5 text-emerald-600 dark:text-emerald-400 border-emerald-400/20' };
    }
  };

  return (
    <div className="px-6 py-6 pb-32 space-y-6 animate-in fade-in duration-500">
      
      {/* Date Header & Top Actions */}
      <div className="flex items-end justify-between px-2 pb-2">
         <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">Daily<br/>Summary</h2>
            <p className="text-sky-500 font-bold uppercase tracking-wider text-sm">{dateString}</p>
         </div>
         
         <div className="flex items-center gap-3">
             {/* Add Button */}
             <button 
                onClick={onAddLog}
                className="bg-gradient-to-br from-tangerine-400 to-tangerine-500 text-white w-14 h-14 rounded-2xl shadow-lg shadow-tangerine-500/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all border border-white/20"
                aria-label="Add Log"
             >
                <Plus size={28} strokeWidth={3} />
             </button>

             {/* Calories Left Widget */}
             <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-2xl min-w-[4.5rem]">
                <div className="text-center">
                   <div className="text-[10px] font-bold text-slate-400 uppercase">Left</div>
                   <div className="text-xl font-black text-sky-600 dark:text-sky-400 leading-none">{Math.max(0, targets.calories - currentCalories)}</div>
                   <div className="text-[10px] font-bold text-slate-400">kcal</div>
                </div>
             </div>
         </div>
      </div>

      {/* Morning Check In Banner */}
      <button 
        onClick={onStartCheckIn}
        className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white p-4 rounded-[2rem] shadow-lg shadow-sky-200 dark:shadow-sky-900/20 flex items-center justify-between mb-6 group relative overflow-hidden"
      >
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
         
         <div className="flex items-center gap-4 relative z-10">
             <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Sun size={24} className="text-white" fill="currentColor" />
             </div>
             <div className="text-left">
                <div className="text-xs font-bold opacity-80 uppercase tracking-wide text-blue-50">Daily Health Loop</div>
                <div className="font-bold text-lg">Start Morning Check-in</div>
             </div>
         </div>
         <div className="bg-white/20 p-2 rounded-full relative z-10 group-hover:scale-110 transition-transform">
             <ChevronRight size={20} />
         </div>
      </button>

      {/* Bio-Dynamic Health Score */}
      <BioHealthScoreCard userProfile={userProfile} dailyLog={dailyLog} />

      {/* Predictive Wellness Model */}
      <MetabolicMapWidget userProfile={userProfile} />

      {/* Streak Card */}
      <StreakCard streak={streakData.streak} history={streakData.history} />

      {/* Upper Log Section - Shows ONLY Today's Logs */}
      <section>
        <h2 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 px-2">Today's Log</h2>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 space-y-1 transition-colors min-h-[100px]">
          {todaysLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full">
                  <Utensils size={24} className="opacity-50" />
               </div>
              <p className="text-sm font-medium">Your log is empty today.</p>
              <button 
                onClick={onAddLog} 
                className="text-sm bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 font-bold px-4 py-2 rounded-xl border border-sky-100 dark:border-sky-800 hover:bg-sky-100 transition-colors"
              >
                Start Logging
              </button>
            </div>
          ) : (
            todaysLogs.map((item) => {
              const style = getMealStyle(item.mealType);
              return (
                <button 
                  key={item.id} 
                  onClick={() => setSelectedLogItem(item)}
                  className="w-full flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    {item.image ? (
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`bg-gradient-to-br border p-3 rounded-2xl shadow-sm backdrop-blur-sm transition-all duration-300 ${style.iconClass}`}>
                        <Utensils size={20} />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-700 dark:text-slate-200">{item.name}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{item.mealType} • {item.calories} kcal</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-700" />
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Goals Section */}
      <section>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 px-2">Goals</h2>
          <div className="flex flex-col gap-4">
            
            {/* Calories */}
            <GoalRow 
              icon={<Flame size={20} fill="currentColor" />}
              label="Calories"
              current={currentCalories}
              target={targets.calories}
              unit=""
              color="yellow"
            />

            {/* Carbs */}
            <GoalRow 
              icon={<Apple size={20} fill="currentColor" />}
              label="Carbs"
              current={currentCarbs}
              target={targets.carbs}
              unit="g"
              color="red"
              isOver={currentCarbs > targets.carbs}
            />

            {/* Protein */}
            <GoalRow 
              icon={<Fish size={20} fill="currentColor" />}
              label="Protein"
              current={currentProtein}
              target={targets.protein}
              unit="g"
              color="red"
            />

            {/* Fat */}
            <GoalRow 
              icon={<Droplet size={20} fill="currentColor" />}
              label="Fat"
              current={currentFat}
              target={targets.fat}
              unit="g"
              color="green"
            />
          </div>
      </section>

      {/* Weekly Insights (Passes full dailyLog for history) */}
      <section>
         <WeeklyInsights dailyLog={dailyLog} targets={targets} />
      </section>

      {/* Milestones (Passes full dailyLog for history) */}
      <section>
         <Milestones dailyLog={dailyLog} targets={targets} streak={streakData.streak} />
      </section>

      {/* Footer Summary - Dark Glass */}
      <section className="bg-slate-800/90 dark:bg-slate-800/80 backdrop-blur-md rounded-[2rem] p-5 flex items-center justify-center gap-4 shadow-xl mx-2 border border-slate-700/50 mt-8">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="text-orange-300 drop-shadow-sm">🔥</span> <span>{currentCalories}</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="text-blue-300">C</span> <span>{currentCarbs}</span>
          </div>
            <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="text-red-300">P</span> <span>{currentProtein}</span>
          </div>
            <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="text-yellow-300">F</span> <span>{currentFat}</span>
          </div>
      </section>
      
      {/* End Marker */}
      <div className="text-center pt-4 pb-2">
         <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">End of Summary</span>
      </div>

      {/* Details Modal */}
      <LogDetailsModal 
        item={selectedLogItem} 
        isOpen={!!selectedLogItem} 
        onClose={() => setSelectedLogItem(null)} 
        onAskCassie={(item) => {
          onAskCassie(item);
          setSelectedLogItem(null);
        }}
        isFavorite={selectedLogItem ? favorites.includes(selectedLogItem.name) : false}
        onToggleFavorite={onToggleFavorite ? () => selectedLogItem && onToggleFavorite(selectedLogItem.name) : undefined}
      />
    </div>
  );
};
