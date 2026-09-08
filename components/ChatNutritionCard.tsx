
import React, { useState } from 'react';
import { Flame, Target, Apple, Droplet, Plus, Heart, Check } from 'lucide-react';
import { NutritionResponse } from '../types';

interface ChatNutritionCardProps {
  data: NutritionResponse;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onLog?: () => void;
}

export const ChatNutritionCard: React.FC<ChatNutritionCardProps> = ({ 
  data, 
  isFavorite, 
  onToggleFavorite,
  onLog 
}) => {
  const [isLogged, setIsLogged] = useState(false);

  const handleLog = () => {
    if (isLogged) return;
    if (onLog) {
        onLog();
        setIsLogged(true);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-stone-50 mt-2 w-full max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800">{data.foodName}</h3>
          <div className="flex items-center gap-1 text-orange-500 font-bold mt-0.5">
            <Flame size={16} fill="currentColor" />
            <span>{data.calories} kcal</span>
          </div>
        </div>
        
        <div className="flex gap-2">
            {/* Favorite Button */}
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
                  isFavorite 
                    ? 'text-rose-500 bg-rose-50' 
                    : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50'
                }`}
              >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
              </button>
            )}
            
            {/* Log Button */}
            {onLog && (
              <button 
                onClick={handleLog}
                disabled={isLogged}
                className={`p-2 rounded-full transition-colors border shadow-sm w-9 h-9 flex items-center justify-center ${
                    isLogged 
                    ? 'bg-green-50 text-green-500 border-green-200 cursor-default' 
                    : 'bg-sky-50 text-sky-500 border-sky-100 hover:bg-sky-100 hover:border-sky-200 active:scale-95'
                }`}
              >
                {isLogged ? <Check size={20} strokeWidth={3} /> : <Plus size={20} />}
              </button>
            )}
        </div>
      </div>

      {/* Macros Grid - Glass Styles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 border border-sky-100 p-3 rounded-2xl flex flex-col items-center backdrop-blur-sm">
          <Target size={16} className="text-sky-500 mb-1" />
          <span className="text-xs text-slate-400 font-bold uppercase">Protein</span>
          <span className="font-black text-slate-700">{data.macros.protein}g</span>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100 p-3 rounded-2xl flex flex-col items-center backdrop-blur-sm">
          <Apple size={16} className="text-red-500 mb-1" />
          <span className="text-xs text-slate-400 font-bold uppercase">Carbs</span>
          <span className="font-black text-slate-700">{data.macros.carbs}g</span>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100 p-3 rounded-2xl flex flex-col items-center backdrop-blur-sm">
          <Droplet size={16} className="text-purple-500 mb-1" fill="currentColor" />
          <span className="text-xs text-slate-400 font-bold uppercase">Fat</span>
          <span className="font-black text-slate-700">{data.macros.fat}g</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
         <p className="text-sm text-slate-600 italic">
           <span className="font-bold text-sky-600 not-italic mr-1">Cassie says:</span>
           {data.recommendation}
         </p>
      </div>

      {/* Combinations */}
      {data.combinations && data.combinations.length > 0 && (
        <div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Best Combinations</p>
           <div className="flex flex-wrap gap-2">
              {data.combinations.map((combo, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  {combo}
                </span>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};
