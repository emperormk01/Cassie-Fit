
import React from 'react';
import { X, Flame, Utensils, MessageCircle, Sparkles, Heart } from 'lucide-react';
import { DailyLogItem } from '../types';
import { Button } from './Button';

interface LogDetailsModalProps {
  item: DailyLogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAskCassie?: (item: DailyLogItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ item, isOpen, onClose, onAskCassie, isFavorite, onToggleFavorite }) => {
  if (!isOpen || !item) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] animate-in fade-in" 
        onClick={onClose} 
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 z-[80] shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
         
         {/* Close Button */}
         <button 
           onClick={onClose} 
           className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
         >
            <X size={20} />
         </button>
         
         <div className="flex flex-col items-center mb-6 pt-2">
            <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shadow-lg border-2 border-slate-100 dark:border-slate-700 mb-4 bg-slate-50 flex items-center justify-center relative">
               {item.image ? (
                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
               ) : (
                 <Utensils size={32} className="text-slate-300" />
               )}
            </div>
            
            <div className="flex items-center gap-2">
               <h2 className="text-2xl font-black text-slate-800 dark:text-white text-center leading-tight mb-1">{item.name}</h2>
               {onToggleFavorite && (
                  <button 
                    onClick={onToggleFavorite}
                    className={`p-2 rounded-full transition-colors ${isFavorite ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-300 hover:text-rose-400'}`}
                  >
                     <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
                  </button>
               )}
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mt-1">
               <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{item.mealType}</span>
               <span>•</span>
               <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-800/30 flex flex-col items-center justify-center col-span-2">
               <div className="flex items-center gap-2 mb-1">
                  <Flame size={18} className="text-orange-500" fill="currentColor" />
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">Calories</span>
               </div>
               <span className="text-3xl font-black text-slate-800 dark:text-white">{item.calories}</span>
            </div>

            <div className="bg-sky-50 dark:bg-sky-900/20 p-3 rounded-2xl border border-sky-100 dark:border-sky-800/30 text-center">
               <div className="text-[10px] font-bold text-sky-500 mb-1 uppercase tracking-wider">Protein</div>
               <div className="text-xl font-black text-slate-800 dark:text-white">{item.protein}g</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-800/30 text-center">
               <div className="text-[10px] font-bold text-red-500 mb-1 uppercase tracking-wider">Carbs</div>
               <div className="text-xl font-black text-slate-800 dark:text-white">{item.carbs}g</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl border border-purple-100 dark:border-purple-800/30 text-center col-span-2">
               <div className="text-[10px] font-bold text-purple-500 mb-1 uppercase tracking-wider">Fat</div>
               <div className="text-xl font-black text-slate-800 dark:text-white">{item.fat}g</div>
            </div>
         </div>

         <div className="flex flex-col gap-3">
             {/* Ask Cassie Button */}
            {onAskCassie && (
              <button
                onClick={() => onAskCassie(item)}
                className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
              >
                  <div className="bg-white/20 p-1 rounded-full group-hover:rotate-12 transition-transform">
                     <Sparkles size={18} />
                  </div>
                  Ask Cassie Breakdown
              </button>
            )}

            <Button variant="secondary" fullWidth onClick={onClose}>Close</Button>
         </div>
      </div>
    </>
  );
};
