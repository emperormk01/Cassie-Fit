
import React from 'react';
import { MapPin, Star, Navigation, ExternalLink, Utensils, ShoppingBag } from 'lucide-react';
import { PlaceItem } from '../types';

interface ChatPlaceCardProps {
  place: PlaceItem;
}

export const ChatPlaceCard: React.FC<ChatPlaceCardProps> = ({ place }) => {
  
  const handleOpenMap = () => {
    // Open Google Maps search
    const query = encodeURIComponent(`${place.name} ${place.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const isStore = place.type.toLowerCase().includes('grocery') || place.type.toLowerCase().includes('store') || place.type.toLowerCase().includes('market');

  return (
    <div className="w-full max-w-sm mt-3 animate-in slide-in-from-bottom-3 duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-1 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
         
         {/* Top Image / Map Placeholder Pattern */}
         <div className="h-24 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-t-[1.8rem] relative overflow-hidden">
            {/* Decorative Map Pattern */}
            <div className="absolute inset-0 opacity-10" 
                 style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
            </div>
            
            <div className="absolute top-3 right-3">
               <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-slate-500 border border-white/50 shadow-sm">
                  {place.type}
               </span>
            </div>

            {/* Icon Bubble */}
            <div className="absolute -bottom-6 left-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-50 dark:border-slate-700 flex items-center justify-center z-10">
               {isStore ? (
                  <ShoppingBag size={20} className="text-purple-500" />
               ) : (
                  <Utensils size={20} className="text-orange-500" />
               )}
            </div>
         </div>

         {/* Content */}
         <div className="pt-8 pb-4 px-6">
            <div className="flex justify-between items-start mb-1">
               <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{place.name}</h3>
               {place.rating && (
                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-md">
                     <Star size={10} fill="currentColor" className="text-yellow-500" />
                     <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{place.rating}</span>
                  </div>
               )}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
               {place.price && <span className="text-slate-600 dark:text-slate-300">{place.price}</span>}
               {place.price && <span>•</span>}
               <span className="flex items-center gap-1">
                  <MapPin size={10} /> {place.location}
               </span>
            </div>

            {/* Cassie's Note */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-800">
               <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                  <span className="font-bold text-sky-500 not-italic mr-1">Cassie's Pick:</span>
                  {place.reason}
               </p>
            </div>

            {/* Actions */}
            <button 
               onClick={handleOpenMap}
               className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
               <Navigation size={16} />
               Get Directions
            </button>
         </div>
      </div>
    </div>
  );
};
