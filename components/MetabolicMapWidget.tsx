
import React, { useState, useEffect } from 'react';
import { Activity, Dna, TrendingDown, Footprints, Info } from 'lucide-react';
import { UserProfileData } from '../types';

interface MetabolicMapWidgetProps {
  userProfile?: UserProfileData | null;
}

// Simplified MoTrPAC-inspired pathways
const PATHWAYS = [
  { id: 'glut4', name: 'Insulin Sensitivity (GLUT4)', x: 20, y: 30, color: '#38BDF8' },
  { id: 'ampk', name: 'Cellular Energy (AMPK)', x: 50, y: 50, color: '#F472B6' },
  { id: 'mitochondria', name: 'Mitochondrial Biogenesis', x: 80, y: 30, color: '#FACC15' },
  { id: 'inflammation', name: 'Systemic Inflammation', x: 50, y: 80, color: '#FB923C' },
];

export const MetabolicMapWidget: React.FC<MetabolicMapWidgetProps> = ({ userProfile }) => {
  const [simulatedSteps, setSimulatedSteps] = useState(3000);
  const [riskReduction, setRiskReduction] = useState(0);
  const [activePathways, setActivePathways] = useState<string[]>([]);

  // Simulate Predictive Logic
  useEffect(() => {
    // Base Calculation: More steps = higher activation
    // In a real app, this would use MoTrPAC datasets regressed against user age/weight
    
    // 1. Calculate Activation Thresholds
    const newActive: string[] = [];
    if (simulatedSteps > 2000) newActive.push('glut4'); // Glucose transport happens early
    if (simulatedSteps > 4500) newActive.push('ampk'); // Enzyme activation
    if (simulatedSteps > 7000) newActive.push('mitochondria'); // Biogenesis
    if (simulatedSteps > 9000) newActive.push('inflammation'); // Long-term anti-inflammatory
    
    setActivePathways(newActive);

    // 2. Calculate Chronic Disease Risk Reduction
    // Logistic-style curve: steep gains early, diminishing returns after 12k
    const baselineRisk = 100;
    const reductionFactor = Math.min(0.60, (simulatedSteps / 15000)); // Max 60% reduction
    
    // Adjust for User Profile (Age penalty, but activity buffers it)
    let ageFactor = 1;
    if (userProfile?.age) {
        const age = parseInt(userProfile.age) || 30;
        if (age > 50) ageFactor = 1.2; // Higher baseline risk, so reduction is more valuable
    }

    const calculatedReduction = Math.round((reductionFactor * 100) * ageFactor);
    setRiskReduction(Math.min(50, calculatedReduction)); // Cap at 50% for realism

  }, [simulatedSteps, userProfile]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <Dna size={16} className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Predictive Wellness Model</span>
           </div>
           <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
              Metabolic <br/>Impact Map
           </h3>
        </div>
        
        {/* Risk Gauge */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800">
            <div className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400 uppercase mb-0.5">Risk Reduction</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
               <TrendingDown size={20} />
               {riskReduction}%
            </div>
        </div>
      </div>

      {/* Molecular Map Visualization */}
      <div className="relative w-full h-48 bg-slate-50 dark:bg-slate-800/50 rounded-3xl mb-6 border border-slate-100 dark:border-slate-800 overflow-hidden">
         {/* Connecting Lines (SVG) */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path 
              d="M 20% 30% Q 50% 50% 80% 30%" 
              stroke={activePathways.includes('mitochondria') ? '#FACC15' : '#E2E8F0'} 
              strokeWidth="2" fill="none" 
              className="transition-colors duration-1000"
            />
            <path 
              d="M 20% 30% Q 35% 60% 50% 80%" 
              stroke={activePathways.includes('inflammation') ? '#FB923C' : '#E2E8F0'} 
              strokeWidth="2" fill="none" 
              className="transition-colors duration-1000"
            />
            <path 
              d="M 80% 30% Q 65% 60% 50% 80%" 
              stroke={activePathways.includes('inflammation') ? '#FB923C' : '#E2E8F0'} 
              strokeWidth="2" fill="none" 
              className="transition-colors duration-1000"
            />
            <line 
              x1="50%" y1="50%" x2="50%" y2="80%" 
              stroke={activePathways.includes('inflammation') ? '#FB923C' : '#E2E8F0'} 
              strokeWidth="2" 
              className="transition-colors duration-1000"
            />
         </svg>

         {/* Nodes */}
         {PATHWAYS.map((p) => {
            const isActive = activePathways.includes(p.id);
            return (
               <div 
                 key={p.id}
                 className={`absolute w-fit max-w-[80px] flex flex-col items-center justify-center transition-all duration-700 transform -translate-x-1/2 -translate-y-1/2`}
                 style={{ left: `${p.x}%`, top: `${p.y}%` }}
               >
                  <div 
                    className={`w-4 h-4 rounded-full mb-2 shadow-sm transition-all duration-500 ${isActive ? 'scale-125 shadow-lg shadow-current' : 'bg-slate-300 dark:bg-slate-600 scale-100'}`}
                    style={{ backgroundColor: isActive ? p.color : undefined, boxShadow: isActive ? `0 0 15px ${p.color}` : 'none' }}
                  />
                  <span className={`text-[9px] font-bold text-center leading-tight transition-colors ${isActive ? 'text-slate-700 dark:text-white opacity-100' : 'text-slate-400 opacity-60'}`}>
                     {p.name}
                  </span>
               </div>
            );
         })}
      </div>

      {/* Simulator Controls */}
      <div>
         <div className="flex justify-between items-end mb-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
               <Footprints size={14} /> Daily Step Projection
            </label>
            <span className="text-xl font-black text-sky-500">{simulatedSteps.toLocaleString()}</span>
         </div>
         
         <input 
           type="range" 
           min="1000" 
           max="15000" 
           step="500" 
           value={simulatedSteps}
           onChange={(e) => setSimulatedSteps(parseInt(e.target.value))}
           className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
         />
         
         <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>Sedentary</span>
            <span>Active</span>
            <span>Athlete</span>
         </div>
      </div>

      <div className="mt-6 flex gap-3 bg-sky-50 dark:bg-sky-900/20 p-3 rounded-xl border border-sky-100 dark:border-sky-800/30">
         <Info className="text-sky-500 shrink-0 mt-0.5" size={16} />
         <p className="text-xs text-sky-800 dark:text-sky-200 leading-relaxed">
            <span className="font-bold">MoTrPAC Insight:</span> Increasing activity to {simulatedSteps.toLocaleString()} steps triggers {activePathways.length} key metabolic pathways, notably improving {activePathways.includes('mitochondria') ? 'cellular energy efficiency' : 'glucose uptake'}.
         </p>
      </div>

    </div>
  );
};
