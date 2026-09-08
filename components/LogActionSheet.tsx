import React from 'react';
import { X, Scan, Search, Scale, Camera } from 'lucide-react';

interface LogActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: () => void;
  onSearch: () => void;
  onWeight: () => void;
  onPhoto: () => void;
}

export const LogActionSheet: React.FC<LogActionSheetProps> = ({ 
  isOpen, 
  onClose,
  onScan,
  onSearch,
  onWeight,
  onPhoto
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Sheet - Floating Style */}
      <div className="fixed bottom-6 left-4 right-4 bg-[#FDFBF7] dark:bg-slate-900 rounded-[2.5rem] p-6 z-[80] animate-in slide-in-from-bottom-10 duration-300 shadow-2xl border border-white/50 dark:border-slate-800 ring-1 ring-black/5">
        
        <div className="flex justify-between items-center mb-6 px-2">
           <h3 className="text-xl font-black text-slate-800 dark:text-white">Log something</h3>
           <button 
             onClick={onClose} 
             className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
           >
             <X size={20} />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {/* Scan Food */}
           <button 
             onClick={onScan}
             className="flex flex-col items-center justify-center gap-3 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 border border-sky-100 dark:border-sky-800/30 p-5 rounded-[2rem] transition-colors group relative overflow-hidden"
           >
              {/* Glass Orb Icon */}
              <div className="bg-gradient-to-br from-white to-white/40 dark:from-sky-500/20 dark:to-sky-500/5 border border-white/60 dark:border-sky-500/20 p-4 rounded-full shadow-lg shadow-sky-500/10 backdrop-blur-xl text-sky-500 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Scan size={28} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 relative z-10">Scan Barcode</span>
              {/* Decorative Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-sky-200/20 rounded-full blur-2xl group-hover:bg-sky-300/30 transition-colors" />
           </button>

           {/* Search Food */}
           <button 
             onClick={onSearch}
             className="flex flex-col items-center justify-center gap-3 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-800/30 p-5 rounded-[2rem] transition-colors group relative overflow-hidden"
           >
              <div className="bg-gradient-to-br from-white to-white/40 dark:from-orange-500/20 dark:to-orange-500/5 border border-white/60 dark:border-orange-500/20 p-4 rounded-full shadow-lg shadow-orange-500/10 backdrop-blur-xl text-orange-500 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Search size={28} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 relative z-10">Search Food</span>
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl group-hover:bg-orange-300/30 transition-colors" />
           </button>

           {/* Log Weight */}
           <button 
             onClick={onWeight}
             className="flex flex-col items-center justify-center gap-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 border border-purple-100 dark:border-purple-800/30 p-5 rounded-[2rem] transition-colors group relative overflow-hidden"
           >
              <div className="bg-gradient-to-br from-white to-white/40 dark:from-purple-500/20 dark:to-purple-500/5 border border-white/60 dark:border-purple-500/20 p-4 rounded-full shadow-lg shadow-purple-500/10 backdrop-blur-xl text-purple-500 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Scale size={28} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 relative z-10">Log Weight</span>
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl group-hover:bg-purple-300/30 transition-colors" />
           </button>

            {/* Snap Photo */}
           <button 
             onClick={onPhoto}
             className="flex flex-col items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/30 p-5 rounded-[2rem] transition-colors group relative overflow-hidden"
           >
              <div className="bg-gradient-to-br from-white to-white/40 dark:from-emerald-500/20 dark:to-emerald-500/5 border border-white/60 dark:border-emerald-500/20 p-4 rounded-full shadow-lg shadow-emerald-500/10 backdrop-blur-xl text-emerald-500 group-hover:scale-110 transition-transform duration-300 relative z-10">
                 <Camera size={28} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-slate-700 dark:text-slate-200 relative z-10">Snap Photo</span>
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-200/20 rounded-full blur-2xl group-hover:bg-emerald-300/30 transition-colors" />
           </button>
        </div>
      </div>
    </>
  );
};