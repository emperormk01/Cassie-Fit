
import React, { useMemo } from 'react';
import { Home, BarChart2, Zap, User } from 'lucide-react';

interface NavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isVisible: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange, isVisible }) => {
  
  const tabs = useMemo(() => [
    { id: 'home', icon: Home, label: 'Chat', color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { id: 'stats', icon: BarChart2, label: 'Stats', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'plan', icon: Zap, label: 'Plan', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'profile', icon: User, label: 'Profile', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ], []);

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-[150%] opacity-0'
      }`}
    >
      <nav className="flex items-center gap-2 p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-[2rem] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] ring-1 ring-white/20">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all duration-300 group overflow-hidden ${
                isActive ? '' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              aria-label={tab.label}
            >
              {/* Active Background - Fades In/Out */}
              <div 
                className={`absolute inset-0 transition-opacity duration-300 ${tab.bg} ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Icon */}
              <Icon 
                size={24} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`relative z-10 transition-all duration-300 transform ${
                  isActive 
                    ? `${tab.color} scale-110 drop-shadow-sm` 
                    : 'text-slate-400 dark:text-slate-500 scale-100 group-hover:scale-105 group-hover:text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
