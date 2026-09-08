
import React, { useMemo } from 'react';
import { Activity, Dna, Zap, Shield, TrendingUp } from 'lucide-react';
import { BioHealthScore, UserProfileData, DailyLogItem } from '../types';

interface BioHealthScoreCardProps {
  userProfile?: UserProfileData | null;
  dailyLog: DailyLogItem[];
}

// Helper to calculate score based on inputs
const calculateScore = (profile: UserProfileData | null | undefined, log: DailyLogItem[]): BioHealthScore => {
  if (!profile) return { 
      totalScore: 0, biologicalLoad: 0, habitVelocity: 0, resilienceIndex: 'Unknown', insight: 'Complete your profile to see your score.' 
  };

  // 1. Biological Load (Non-controllable factors)
  // Base load increases with age and conditions
  let bioLoad = 20; 
  const age = parseInt(profile.age) || 30;
  if (age > 40) bioLoad += (age - 40) * 0.8;
  if (profile.conditions?.length) bioLoad += profile.conditions.length * 8;
  if (profile.mobilityNeeds?.length) bioLoad += profile.mobilityNeeds.length * 5;
  bioLoad = Math.min(90, Math.max(10, bioLoad));

  // 2. Habit Velocity (Controllable factors)
  // Driven by consistency and quality
  let habitVel = 40; // Base
  if (log.length > 0) habitVel += 20; // Active today
  if (log.length >= 3) habitVel += 15; // Consistent logging
  
  // Protein Bonus
  const protein = log.reduce((acc, item) => acc + item.protein, 0);
  if (protein > 80) habitVel += 15;
  
  // Activity Bonus
  if (profile.activityLevel === 'High') habitVel += 10;
  else if (profile.activityLevel === 'Moderate') habitVel += 5;
  
  habitVel = Math.min(100, Math.max(10, habitVel));

  // 3. Tension / Final Score
  // If Habits > Biology, score is high.
  // We normalize to a 0-100 scale where 50 is equilibrium.
  const rawScore = 50 + (habitVel - bioLoad);
  const totalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let resilienceIndex = 'Developing';
  let insight = "Your biological load is currently higher than your habit velocity. Focus on small, consistent wins.";
  
  if (totalScore > 80) {
      resilienceIndex = 'Peak Performance';
      insight = "Your habits are completely outpacing your biological constraints. You are building metabolic reserve.";
  } else if (totalScore > 60) {
      resilienceIndex = 'High';
      insight = "Your lifestyle is effectively managing your biological baseline. Keep this momentum.";
  } else if (totalScore > 40) {
      resilienceIndex = 'Balanced';
      insight = "You are in equilibrium. To improve, try adding one more protein-rich meal.";
  }

  return { totalScore, biologicalLoad: Math.round(bioLoad), habitVelocity: Math.round(habitVel), resilienceIndex, insight };
};

export const BioHealthScoreCard: React.FC<BioHealthScoreCardProps> = ({ userProfile, dailyLog }) => {
  const scoreData = useMemo(() => calculateScore(userProfile, dailyLog), [userProfile, dailyLog]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-sky-500/5 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden mb-6">
       
       {/* Background Elements */}
       <div className="absolute top-0 right-0 w-32 h-32 bg-sky-100 dark:bg-sky-900/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
       <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

       <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <Activity size={16} className="text-sky-500" />
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio-Dynamic Score</span>
                </div>
                <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-none">{scoreData.totalScore}</h3>
             </div>
             <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{scoreData.resilienceIndex}</span>
             </div>
          </div>

          {/* Tension Gauge Visualization */}
          <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden flex">
             {/* Biological Load (Left, Purple/Red) */}
             <div 
               className="h-full bg-gradient-to-r from-purple-400 to-rose-400 opacity-80" 
               style={{ width: '50%' }} // Fixed center point visually, but markers move
             />
             {/* Habit Velocity (Right, Sky/Teal) */}
             <div 
               className="h-full bg-gradient-to-r from-sky-400 to-teal-400" 
               style={{ width: '50%' }}
             />
             
             {/* Tension Marker */}
             <div 
               className="absolute top-0 bottom-0 w-1.5 bg-white dark:bg-slate-900 border-x-2 border-slate-300 dark:border-slate-600 shadow-md transition-all duration-700 ease-out z-10"
               style={{ left: `${scoreData.totalScore}%` }}
             />
          </div>

          {/* Factors Breakdown */}
          <div className="flex justify-between items-center mb-6">
             <div className="text-left">
                <div className="flex items-center gap-1.5 text-purple-500 mb-0.5">
                   <Dna size={14} />
                   <span className="text-[10px] font-bold uppercase">Biological Load</span>
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                   {scoreData.biologicalLoad}<span className="text-[10px] text-slate-400">%</span>
                </div>
             </div>

             <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-sky-500 mb-0.5">
                   <span className="text-[10px] font-bold uppercase">Habit Velocity</span>
                   <Zap size={14} fill="currentColor" />
                </div>
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                   {scoreData.habitVelocity}<span className="text-[10px] text-slate-400">%</span>
                </div>
             </div>
          </div>

          {/* Dynamic Insight */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3 items-start">
             <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm text-sky-500 shrink-0">
                <Shield size={16} />
             </div>
             <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                {scoreData.insight}
             </p>
          </div>
       </div>
    </div>
  );
};
