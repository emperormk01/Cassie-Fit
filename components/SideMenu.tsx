
import React from 'react';
import { X, Plus, MessageSquare, Target, Settings, ChevronRight, Crown } from 'lucide-react';
import { ChatSession } from '../types';
import { CassieMascot } from './CassieMascot';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onOpenGoals: () => void;
  onOpenSettings: () => void;
  isPremium?: boolean;
  onOpenPremium?: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onOpenGoals,
  onOpenSettings,
  isPremium = false,
  onOpenPremium
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#FDFBF7] dark:bg-slate-900 shadow-2xl z-[60] animate-in slide-in-from-right duration-300 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-[#FDFBF7] dark:bg-slate-900">
          <div className="flex items-center gap-3">
             <div className="bg-sky-50 dark:bg-slate-800 p-2 rounded-full">
               <CassieMascot expression="happy" size={32} />
             </div>
             <span className="font-bold text-lg text-slate-800 dark:text-white">Menu</span>
             {isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  PLUS
                </span>
             )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Upgrade Banner (If not premium) */}
          {!isPremium && onOpenPremium && (
             <button 
               onClick={() => {
                 onOpenPremium();
                 onClose();
               }}
               className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 p-4 rounded-[2rem] text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/20 text-left group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 flex justify-between items-center">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <Crown size={16} fill="currentColor" className="text-yellow-300" />
                         <span className="font-black text-sm uppercase tracking-wide">Cassie Plus</span>
                      </div>
                      <p className="text-sm font-medium text-purple-100">Unlock Voice & AI Vision</p>
                   </div>
                   <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <ChevronRight size={18} />
                   </div>
                </div>
             </button>
          )}

          {/* Main Actions */}
          <div className="space-y-2">
            <button 
               onClick={() => {
                 onNewChat();
                 onClose();
               }}
               className="w-full bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-[2rem] flex items-center justify-center gap-2 font-bold shadow-lg shadow-sky-200 dark:shadow-none transition-all active:scale-95"
            >
               <Plus size={20} />
               New Chat
            </button>

            <button 
               onClick={() => {
                 onOpenGoals();
                 onClose();
               }}
               className="w-full bg-white dark:bg-slate-800 border border-slate-50 dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-sky-200 dark:hover:border-slate-600 p-4 rounded-[2rem] flex items-center justify-between group transition-all"
            >
               <div className="flex items-center gap-3">
                  <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-500 p-2 rounded-xl">
                    <Target size={20} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Nutrition Goals</span>
               </div>
               <ChevronRight size={18} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
            </button>
          </div>

          {/* History Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2">Chat History</h3>
            <div className="space-y-2">
               {sessions.length === 0 ? (
                 <p className="text-sm text-slate-400 px-2 italic">No history yet.</p>
               ) : (
                 sessions.map((session) => (
                   <button
                     key={session.id}
                     onClick={() => {
                       onSelectSession(session.id);
                       onClose();
                     }}
                     className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-colors text-left ${
                       currentSessionId === session.id 
                         ? 'bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800' 
                         : 'bg-transparent hover:bg-stone-50 dark:hover:bg-slate-800 border border-transparent'
                     }`}
                   >
                     <MessageSquare 
                        size={18} 
                        className={currentSessionId === session.id ? 'text-sky-500' : 'text-slate-300'} 
                     />
                     <div className="flex-1 overflow-hidden">
                       <p className={`text-sm font-bold truncate ${
                         currentSessionId === session.id ? 'text-sky-700 dark:text-sky-300' : 'text-slate-600 dark:text-slate-400'
                       }`}>
                         {session.title}
                       </p>
                       <p className="text-[10px] text-slate-400 truncate">
                         {new Date(session.timestamp).toLocaleDateString()}
                       </p>
                     </div>
                   </button>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
