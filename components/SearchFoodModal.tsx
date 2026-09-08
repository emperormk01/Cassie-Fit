
import React, { useState } from 'react';
import { X, Search, ChevronRight, Plus, History, Star, Heart } from 'lucide-react';

interface SearchFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites?: string[];
  onAdd?: (foodName: string) => void;
}

export const SearchFoodModal: React.FC<SearchFoodModalProps> = ({ isOpen, onClose, favorites = [], onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Recent');

  if (!isOpen) return null;

  const recentFoods = [
    { name: 'Jollof Rice', brand: 'Homemade', cal: 320, icon: '🍛' },
    { name: 'Owyn Protein Shake', brand: 'Owyn', cal: 180, icon: '🥤' },
    { name: 'Chicken Bowl', brand: 'Chipotle', cal: 540, icon: '🥣' },
    { name: 'Plantain Chips', brand: 'Generic', cal: 150, icon: '🍌' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 border-b border-slate-100 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
           <button 
             onClick={onClose}
             className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
           >
             <X size={24} />
           </button>
           <h2 className="text-xl font-bold text-slate-800">Add Food</h2>
           <div className="flex-1" />
           <button className="text-sky-500 font-bold text-sm">Create New</button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search for food (e.g. 'Arepas', 'Curry')" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-slate-100 text-slate-800 placeholder:text-slate-400 pl-12 pr-4 py-3.5 rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
         
         {/* Tabs */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['Recent', 'Favorites', 'My Meals', 'Recipes'].map((tab, i) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-sky-500 text-white shadow-md shadow-sky-200' : 'bg-white text-slate-500 border border-slate-100'}`}
              >
                {tab}
              </button>
            ))}
         </div>

         {/* Favorites List Logic */}
         {activeTab === 'Favorites' ? (
           <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                 <Heart size={14} className="text-rose-400" fill="currentColor" /> Your Favorites
              </h3>
              
              {favorites.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-3xl border border-slate-50">
                    <Heart size={48} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold">No favorites yet</p>
                    <p className="text-slate-300 text-xs mt-1">Mark foods as favorite in chat to see them here.</p>
                 </div>
              ) : (
                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {favorites.map((fav, index) => (
                      <button 
                        key={index} 
                        onClick={() => onAdd && onAdd(fav)}
                        className="w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors text-left group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                               <Heart size={20} fill="currentColor" />
                            </div>
                            <div>
                               <p className="font-bold text-slate-700">{fav}</p>
                               <p className="text-xs text-slate-400 font-semibold">Saved Item</p>
                            </div>
                         </div>
                         <div className="p-2 text-sky-500 bg-sky-50 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <Plus size={20} />
                         </div>
                      </button>
                    ))}
                 </div>
              )}
           </div>
         ) : (
           /* Default Recent View */
           <>
              <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <History size={14} /> Recently Added
                 </h3>
                 
                 <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {recentFoods.map((food, index) => (
                      <button 
                        key={index} 
                        onClick={() => onAdd && onAdd(food.name)}
                        className="w-full flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors text-left group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                               {food.icon}
                            </div>
                            <div>
                               <p className="font-bold text-slate-700">{food.name}</p>
                               <p className="text-xs text-slate-400 font-semibold">{food.brand} • {food.cal} kcal</p>
                            </div>
                         </div>
                         <div className="p-2 text-sky-500 bg-sky-50 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <Plus size={20} />
                         </div>
                      </button>
                    ))}
                 </div>
              </div>

              {/* Quick Add Categories */}
              <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Star size={14} /> Quick Add
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    {['Coffee', 'Naan', 'Hummus', 'Plantain'].map((item) => (
                       <button 
                         key={item} 
                         onClick={() => onAdd && onAdd(item)}
                         className="bg-white p-3 rounded-2xl border border-slate-100 text-slate-600 font-bold hover:border-sky-200 hover:text-sky-500 transition-colors text-left"
                       >
                          {item}
                       </button>
                    ))}
                 </div>
              </div>
           </>
         )}
      </div>
    </div>
  );
};
