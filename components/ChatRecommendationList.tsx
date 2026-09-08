
import React, { useState } from 'react';
import { Plus, Check, Flame, Fish, Apple, Droplet, ArrowRight, Heart } from 'lucide-react';
import { RecommendationItem } from '../types';

interface ChatRecommendationListProps {
  items: RecommendationItem[];
  onLog: (item: RecommendationItem) => void;
  favorites?: string[];
  onToggleFavorite?: (foodName: string) => void;
}

export const ChatRecommendationList: React.FC<ChatRecommendationListProps> = ({ items, onLog, favorites = [], onToggleFavorite }) => {
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const handleAdd = (item: RecommendationItem) => {
    onLog(item);
    setAddedItems(prev => new Set(prev).add(item.name));
  };

  return (
    <div className="flex flex-col gap-3 mt-3 w-full max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-500">
      <div className="flex items-center gap-2 mb-1 pl-1">
        <div className="bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 p-1 rounded-full">
           <ArrowRight size={12} />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cassie's Picks</span>
      </div>

      {items.map((item, idx) => {
        const isAdded = addedItems.has(item.name);
        const isFavorite = favorites.includes(item.name);
        
        return (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-50 dark:border-slate-800 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-3">
               <div className="flex-1 mr-4">
                  <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-1">{item.name}</h4>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">"{item.reason}"</p>
               </div>
               
               <div className="flex gap-2">
                 {/* Favorite Button */}
                 {onToggleFavorite && (
                    <button
                      onClick={() => onToggleFavorite(item.name)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
                        isFavorite 
                          ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' 
                          : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                       <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
                    </button>
                 )}

                 <button 
                   onClick={() => !isAdded && handleAdd(item)}
                   disabled={isAdded}
                   className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                     isAdded 
                       ? 'bg-green-500 text-white cursor-default scale-100' 
                       : 'bg-sky-50 dark:bg-slate-800 text-sky-500 hover:bg-sky-500 hover:text-white scale-100 active:scale-95'
                   }`}
                 >
                   {isAdded ? <Check size={20} strokeWidth={3} /> : <Plus size={22} />}
                 </button>
               </div>
            </div>

            {/* Compact Macros */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
               <div className="flex items-center gap-1">
                  <Flame size={14} className="text-orange-500" fill="currentColor" />
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{item.calories}</span>
               </div>
               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
               <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="text-sky-500">{item.protein}p</span>
                  <span className="text-red-500">{item.carbs}c</span>
                  <span className="text-purple-500">{item.fat}f</span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
