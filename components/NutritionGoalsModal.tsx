
import React, { useState } from 'react';
import { X, Target, Clock, CheckCircle2, Edit2, Flame, Apple, Fish, HeartHandshake, Armchair, Zap, BatteryCharging } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { UserProfileData, UserTargets, ScheduleItem } from '../types';

interface NutritionGoalsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  userProfile: UserProfileData | null;
  targets: UserTargets;
  schedule: ScheduleItem[];
  onEdit?: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const NutritionGoalsModal: React.FC<NutritionGoalsModalProps> = ({ 
  isOpen = true, 
  onClose, 
  userProfile, 
  targets,
  schedule,
  onEdit,
  onScroll
}) => {
  if (!isOpen) return null;

  // Local state for toggling "Day Mode"
  // In a real app, this would lift up to App.tsx to affect global targets
  const [isGentleMode, setIsGentleMode] = useState(targets.planMode === 'gentle');

  const goalType = userProfile?.goal ? userProfile.goal.replace(' ⚖️', '').replace(' 💪', '') : 'Lose Weight';
  
  // Dynamic Values based on mode
  const displayCalories = isGentleMode ? Math.round(targets.calories * 1.1) : targets.calories; // Maintenance buffer
  const displayModeText = isGentleMode ? "Gentle / Recovery" : "Standard Plan";
  const displayModeIcon = isGentleMode ? <HeartHandshake size={12} strokeWidth={3} /> : <Target size={12} strokeWidth={3} />;
  
  // Gentle Schedule Logic (Transformer)
  const displaySchedule = isGentleMode ? schedule.map(s => {
      let newLabel = s.label;
      if (newLabel.toLowerCase().includes('workout') || newLabel.toLowerCase().includes('gym')) {
          newLabel = '10min Seated Stretch';
      }
      if (newLabel.toLowerCase().includes('run')) {
          newLabel = 'Gentle Walk';
      }
      return { ...s, label: newLabel };
  }) : schedule;

  return (
    <div className="h-full w-full bg-[#FDFBF7] dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300 font-sans">
      
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#FDFBF7]/90 dark:bg-slate-950/90 backdrop-blur-xl z-20 border-b border-slate-50 dark:border-slate-800">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Your Plan</h2>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto px-6 pb-32 pt-2 no-scrollbar overscroll-contain"
        onScroll={onScroll}
      >
         
         {/* Energy Toggle Switch */}
         <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 mb-6 flex relative">
             <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 transition-all duration-300 ${isGentleMode ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`} />
             
             <button 
                onClick={() => setIsGentleMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl relative z-10 transition-colors ${!isGentleMode ? 'text-sky-600 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'}`}
             >
                <Zap size={16} className={!isGentleMode ? "fill-sky-500 text-sky-500" : ""} />
                <span className="text-sm">Standard</span>
             </button>
             
             <button 
                onClick={() => setIsGentleMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl relative z-10 transition-colors ${isGentleMode ? 'text-teal-600 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500 font-medium'}`}
             >
                <BatteryCharging size={16} className={isGentleMode ? "fill-teal-500 text-teal-500" : ""} />
                <span className="text-sm">Low Energy?</span>
             </button>
         </div>

         {/* Hero Card */}
         <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl mb-8 animate-in zoom-in-95 duration-500 transition-colors duration-500 ${isGentleMode ? 'bg-gradient-to-br from-teal-500 to-emerald-600 shadow-teal-500/20' : 'bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-500/20'}`}>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className={`absolute bottom-0 left-0 p-16 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2 ${isGentleMode ? 'bg-emerald-400/20' : 'bg-blue-400/20'}`} />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold mb-4 border border-white/20">
                 {displayModeIcon}
                 <span>{displayModeText}</span>
              </div>
              <h3 className="text-3xl font-black mb-2 leading-none">{goalType}</h3>
              <p className="text-white/80 font-medium text-sm max-w-[65%] leading-relaxed">
                 {isGentleMode 
                    ? "Focusing on recovery and feel-good movement today." 
                    : `Optimized for your ${userProfile?.activityLevel?.toLowerCase() || 'standard'} activity level.`}
              </p>
            </div>
            
            <div className="absolute -right-2 -bottom-6 transform rotate-[10deg] filter drop-shadow-lg transition-transform duration-500">
               <CassieMascot expression={isGentleMode ? "sleeping" : "happy"} size={150} />
            </div>
         </div>

         {/* Daily Targets Grid */}
         <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Daily Targets</h3>
            <button 
              onClick={onEdit}
              className="text-xs font-bold text-sky-500 flex items-center gap-1 hover:text-sky-600 transition-colors"
            >
               <Edit2 size={12} /> Edit
            </button>
         </div>

         <div className="grid grid-cols-2 gap-3 mb-8">
            {/* Calories (Large) */}
            <div className="col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-50 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1 text-orange-500">
                     <Flame size={18} fill="currentColor" />
                     <span className="text-xs font-bold uppercase">Calories</span>
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white">{displayCalories} <span className="text-sm font-bold text-slate-400">kcal</span></div>
                  {isGentleMode && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">Maintenance Mode</span>}
               </div>
               <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                   <Target size={24} />
               </div>
            </div>

            {/* Protein */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-sky-500">
                     <Fish size={16} fill="currentColor" />
                     <span className="text-xs font-bold uppercase">Protein</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{targets.protein}g</div>
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                   <div className="w-[70%] h-full bg-sky-400 rounded-full" />
                </div>
            </div>

            {/* Carbs */}
             <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-50 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 mb-2 text-red-500">
                     <Apple size={16} fill="currentColor" />
                     <span className="text-xs font-bold uppercase">Carbs</span>
                </div>
                <div className="text-2xl font-black text-slate-800 dark:text-white">{targets.carbs}g</div>
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                   <div className="w-[50%] h-full bg-red-400 rounded-full" />
                </div>
            </div>
         </div>

         {/* Meal Routine Timeline */}
         <div className="mb-4 px-1">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggested Schedule</h3>
         </div>
         
         <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:top-4 before:bottom-4 before:left-3 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
            {displaySchedule.map((item, i) => {
               // Assign colors based on label logic or index
               let color = 'bg-slate-400';
               const labelLower = item.label.toLowerCase();
               let Icon = Clock;

               if (labelLower.includes('breakfast')) color = 'bg-amber-400';
               else if (labelLower.includes('lunch')) color = 'bg-sky-400';
               else if (labelLower.includes('dinner')) color = 'bg-indigo-400';
               else if (labelLower.includes('snack')) color = 'bg-emerald-400';
               else if (labelLower.includes('stretch') || labelLower.includes('gentle')) { 
                   color = 'bg-teal-400'; 
                   Icon = Armchair;
               }

               return (
               <div key={i} className="relative pl-6 group">
                  <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-[#FDFBF7] dark:border-slate-950 ${color} shadow-sm z-10`} />
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-50 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-100 dark:hover:border-slate-700 transition-all">
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                           <Clock size={12} /> {item.time}
                        </span>
                        <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                           <CheckCircle2 size={16} />
                        </div>
                     </div>
                     <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {labelLower.includes('stretch') && <Icon size={16} className="text-teal-500" />}
                        {item.label}
                     </h4>
                  </div>
               </div>
            )})}
         </div>

         {/* Bottom Action */}
         <div className="mt-8">
            <button 
               onClick={onEdit}
               className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-[2rem] shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
               Edit Targets & Schedule
            </button>
         </div>

      </div>
    </div>
  );
};
