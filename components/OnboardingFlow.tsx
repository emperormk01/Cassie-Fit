
import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Activity, Heart, Battery, Armchair } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { Button } from './Button';
import { UserProfileData } from '../types';

interface OnboardingFlowProps {
  onComplete: (data: UserProfileData) => void;
  initialData?: any; // Data passed from Google Auth
}

const TOTAL_STEPS = 13; // Increased steps

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, initialData }) => {
  const [step, setStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Form Data State
  const [data, setData] = useState<UserProfileData>({
    name: initialData?.name || initialData?.given_name || '',
    goal: '',
    age: '',
    gender: '',
    activityLevel: '',
    eatingStyle: '',
    height: '',
    weight: '',
    mealsPerDay: '',
    allergies: [],
    conditions: [],
    mobilityNeeds: [],
    avatarUrl: initialData?.picture
  });

  const progress = Math.min(100, (step / (TOTAL_STEPS - 1)) * 100);

  // Helper to advance step with a small delay for animation
  const nextStep = (delay = 300) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(prev => prev + 1);
      setIsAnimating(false);
    }, delay);
  };

  const updateData = (key: keyof UserProfileData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  // Step 12: Auto-advance after simulation
  useEffect(() => {
    if (step === 11) {
      const timer = setTimeout(() => {
        nextStep(0);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Render specific content based on step
  const renderContent = () => {
    // Common styles for consistency
    const bubbleClass = "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-[2rem] shadow-sm border border-white/50 dark:border-slate-700 text-center relative w-full animate-in zoom-in-95 duration-500";
    const inputClass = "w-full bg-white/50 dark:bg-slate-800/50 border-2 border-white/50 dark:border-slate-700 focus:border-sky-400 focus:bg-white dark:focus:bg-slate-800 rounded-2xl p-4 text-center font-bold text-lg text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all shadow-inner";

    switch (step) {
      case 0: // Welcome
        return (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="relative">
               <div className="absolute inset-0 bg-yellow-100/50 rounded-full blur-3xl opacity-50 animate-pulse" />
               <CassieMascot expression="happy" size={140} className="relative z-10" />
            </div>
            <div className={`${bubbleClass} max-w-xs`}>
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/80 dark:bg-slate-800/80 rotate-45 border-t border-l border-white/50 dark:border-slate-700 transform" />
               <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                 {data.name ? `Hi ${data.name}! ` : 'Hello! '} I will help you build a healthier daily routine that suits your lifestyle.
               </p>
            </div>
            <Button onClick={() => nextStep()} className="mt-4 px-12 shadow-xl shadow-sky-200/50">Begin</Button>
          </div>
        );

      case 1: // Name
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className="relative">
                <CassieMascot expression="curious" size={120} />
                <div className="absolute -bottom-2 -right-4 text-4xl animate-bounce">🏷️</div>
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">What should I call you?</p>
             </div>
             <input 
               autoFocus
               type="text" 
               placeholder="Your Name"
               value={data.name}
               onChange={(e) => updateData('name', e.target.value)}
               className={inputClass}
               onKeyDown={(e) => e.key === 'Enter' && data.name && nextStep()}
             />
             <Button disabled={!data.name} onClick={() => nextStep()} fullWidth>Continue</Button>
          </div>
        );

      case 2: // Primary Goal
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <CassieMascot expression="happy" size={100} />
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">Thanks, {data.name}. I will shape your plan around this.</p>
             </div>
             <div className="grid grid-cols-1 gap-3 w-full">
                {['Weight Balance ⚖️', 'Fitness Support 💪', 'Improved Nutrition 🥗', 'Lifestyle Clarity 🧘'].map(goal => (
                  <button
                    key={goal}
                    onClick={() => { updateData('goal', goal); nextStep(); }}
                    className="bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 border border-white/50 dark:border-slate-700 hover:border-sky-200 p-4 rounded-2xl font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 text-left flex justify-between items-center shadow-sm"
                  >
                    {goal}
                    <ChevronRight size={18} className="text-slate-400" />
                  </button>
                ))}
             </div>
          </div>
        );

      case 3: // Age & Gender
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className="relative">
               <CassieMascot expression="neutral" size={100} />
               <div className="absolute top-0 -right-6 text-4xl">📋</div>
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">This helps me understand your nutrition needs.</p>
             </div>
             
             <div className="w-full space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-2">Age Range</label>
                   <div className="grid grid-cols-4 gap-2 mt-1">
                      {['18-24', '25-34', '35-50', '50+'].map(age => (
                         <button 
                           key={age}
                           onClick={() => updateData('age', age)}
                           className={`p-3 rounded-xl text-xs sm:text-sm font-bold border transition-colors ${data.age === age ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-white/50 dark:border-slate-700 hover:bg-white'}`}
                         >
                           {age}
                         </button>
                      ))}
                   </div>
                </div>
                
                <div>
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-2">Gender</label>
                   <div className="grid grid-cols-3 gap-2 mt-1">
                      {['Female', 'Male', 'Other'].map(g => (
                         <button 
                           key={g}
                           onClick={() => updateData('gender', g)}
                           className={`p-3 rounded-xl text-sm font-bold border transition-colors ${data.gender === g ? 'bg-rose-400 text-white border-rose-400 shadow-md' : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-white/50 dark:border-slate-700 hover:bg-white'}`}
                         >
                           {g}
                         </button>
                      ))}
                   </div>
                </div>
             </div>
             <Button disabled={!data.age || !data.gender} onClick={() => nextStep()} fullWidth>Next</Button>
          </div>
        );

      case 4: // Activity Level
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className={`transition-transform duration-500 ${data.activityLevel === 'High' ? 'animate-bounce' : ''}`}>
                <CassieMascot expression={data.activityLevel === 'Sedentary' ? 'sleeping' : 'happy'} size={100} />
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">I will adjust your calorie targets and meal timing.</p>
             </div>
             <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  { l: 'Sedentary', i: '🛋️', d: 'Mostly sitting' },
                  { l: 'Light', i: '🚶', d: 'Walking, light chores' },
                  { l: 'Moderate', i: '🏃', d: 'Exercise 3-5x/week' },
                  { l: 'High', i: '🔥', d: 'Intense daily training' }
                ].map(item => (
                  <button
                    key={item.l}
                    onClick={() => { updateData('activityLevel', item.l); nextStep(); }}
                    className="bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-slate-700 border border-white/50 dark:border-slate-700 hover:border-orange-200 p-4 rounded-2xl text-left transition-all active:scale-95 group shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                       <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-600">{item.i} {item.l}</span>
                       <span className="text-xs text-slate-400 font-medium">{item.d}</span>
                    </div>
                  </button>
                ))}
             </div>
          </div>
        );

      case 5: // Movement Comfort (NEW STEP)
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className="relative">
                <CassieMascot expression="neutral" size={100} />
                <div className="absolute -bottom-2 -left-2 text-3xl animate-pulse">🦴</div>
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">
                   I want to keep you safe. Do you have any joint or mobility concerns?
                </p>
             </div>
             <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  { l: 'Fully Mobile', i: <Activity size={18} className="text-green-500" /> },
                  { l: 'Joint Sensitivity', i: <Armchair size={18} className="text-orange-500" /> },
                  { l: 'Injury Recovery', i: <Battery size={18} className="text-red-400" /> },
                  { l: 'Seated Only', i: <Armchair size={18} className="text-purple-500" /> }
                ].map(item => (
                   <button
                    key={item.l}
                    onClick={() => { 
                       // Store mobility specifically, or append to conditions if simpler
                       updateData('mobilityNeeds', [item.l]); 
                       nextStep();
                    }}
                    className="bg-white/50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-slate-700 border border-white/50 dark:border-slate-700 hover:border-sky-200 p-4 rounded-2xl text-left transition-all active:scale-95 flex items-center gap-3 shadow-sm"
                  >
                     <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm">{item.i}</div>
                     <span className="font-bold text-slate-700 dark:text-slate-200">{item.l}</span>
                  </button>
                ))}
             </div>
          </div>
        );

      case 6: // Eating Style
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <CassieMascot expression="happy" size={100} />
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">I understand your eating style.</p>
             </div>
             <div className="flex flex-wrap gap-3 justify-center">
                {['Regular Diet', 'Vegetarian 🥦', 'Vegan 🌱', 'Gluten Free 🌾', 'Low Carb 🥩', 'High Protein 🍗', 'Pescatarian 🐟'].map(style => (
                  <button
                    key={style}
                    onClick={() => { updateData('eatingStyle', style); nextStep(); }}
                    className="bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 px-4 py-3 rounded-full font-bold text-slate-600 dark:text-slate-300 text-sm shadow-sm transition-all active:scale-95"
                  >
                    {style}
                  </button>
                ))}
             </div>
          </div>
        );

      case 7: // Body Stats
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className="relative">
                <CassieMascot expression="neutral" size={100} />
                <div className="absolute -bottom-2 -left-4 text-4xl">📏</div>
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">Thanks. This helps me calculate your personalized guidance.</p>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700 shadow-sm">
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Height</label>
                   <input 
                      type="text" 
                      placeholder="e.g. 5'9"
                      value={data.height}
                      onChange={(e) => updateData('height', e.target.value)}
                      className="w-full text-center font-black text-2xl text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-300"
                   />
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-white/50 dark:border-slate-700 shadow-sm">
                   <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Weight (lbs)</label>
                   <input 
                      type="number" 
                      placeholder="150"
                      value={data.weight}
                      onChange={(e) => updateData('weight', e.target.value)}
                      className="w-full text-center font-black text-2xl text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-300"
                   />
                </div>
             </div>
             <Button disabled={!data.height || !data.weight} onClick={() => nextStep()} fullWidth>Next</Button>
          </div>
        );

      case 8: // Schedule
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <div className="relative">
               <CassieMascot expression="neutral" size={100} />
               <div className="absolute top-0 right-0 text-3xl animate-pulse">⏰</div>
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">I will match your plan to your routine.</p>
             </div>
             <div className="grid grid-cols-1 gap-3 w-full">
                {['2 Meals', '3 Meals (Standard)', '3 Meals + Snacks', 'Intermittent Fasting'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => { updateData('mealsPerDay', opt); nextStep(); }}
                    className="bg-white/50 dark:bg-slate-800/50 hover:bg-purple-50 dark:hover:bg-slate-700 border border-white/50 dark:border-slate-700 hover:border-purple-200 p-4 rounded-2xl font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95 text-center shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
             </div>
          </div>
        );

      case 9: // Allergies
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500 h-full">
             <CassieMascot expression="curious" size={100} />
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">I will avoid these in your suggestions.</p>
             </div>
             
             <div className="flex flex-wrap gap-3 justify-center mb-auto">
                {['Nuts 🥜', 'Dairy 🥛', 'Shellfish 🦐', 'Eggs 🥚', 'Gluten 🍞', 'Soy 🫘', 'None ✅'].map(allergy => {
                   const isSelected = data.allergies.includes(allergy);
                   return (
                    <button
                      key={allergy}
                      onClick={() => {
                        if (allergy === 'None ✅') {
                           updateData('allergies', ['None']);
                           setTimeout(() => nextStep(), 300);
                        } else {
                           const newAllergies = isSelected 
                             ? data.allergies.filter(a => a !== allergy)
                             : [...data.allergies.filter(a => a !== 'None'), allergy];
                           updateData('allergies', newAllergies);
                        }
                      }}
                      className={`px-4 py-3 rounded-full font-bold text-sm shadow-sm transition-all border ${
                        isSelected 
                          ? 'bg-rose-400 text-white border-rose-400 scale-105' 
                          : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-white/50 dark:border-slate-700 hover:bg-white'
                      }`}
                    >
                      {allergy}
                    </button>
                   );
                })}
             </div>
             <Button onClick={() => nextStep()} className="w-full mt-4">Confirm</Button>
          </div>
        );

       case 10: // Health Conditions
        return (
          <div className="flex flex-col items-center gap-6 w-full animate-in slide-in-from-right duration-500">
             <CassieMascot expression="neutral" size={100} />
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-medium">I will stay mindful of this condition.</p>
             </div>
             
             <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  { l: 'Heart Health', i: <Heart size={18} className="text-red-400" /> },
                  { l: 'Digestion', i: <Activity size={18} className="text-orange-400" /> },
                  { l: 'Low Energy', i: <Battery size={18} className="text-purple-400" /> },
                  { l: 'None', i: <Check size={18} className="text-green-400" /> }
                ].map(item => (
                   <button
                    key={item.l}
                    onClick={() => { 
                       updateData('conditions', [item.l]); 
                       nextStep();
                    }}
                    className="bg-white/50 dark:bg-slate-800/50 hover:bg-sky-50 dark:hover:bg-slate-700 border border-white/50 dark:border-slate-700 hover:border-sky-200 p-4 rounded-2xl text-left transition-all active:scale-95 flex items-center gap-3 shadow-sm"
                  >
                     <div className="bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm">{item.i}</div>
                     <span className="font-bold text-slate-700 dark:text-slate-200">{item.l}</span>
                  </button>
                ))}
             </div>
          </div>
        );

      case 11: // Building Plan (Animation)
        return (
          <div className="flex flex-col items-center justify-center gap-8 h-full w-full animate-in zoom-in duration-700">
             <div className="relative">
                <div className="absolute inset-0 bg-sky-100/50 rounded-full blur-2xl animate-pulse" />
                <CassieMascot expression="happy" size={140} className="relative z-10 animate-bounce" />
             </div>
             <div className={bubbleClass}>
                <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-4">Building your nutritional plan...</p>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 animate-in slide-in-from-left fade-in duration-500 delay-300">
                      <Check size={16} className="text-green-500" /> Calculating macros
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 animate-in slide-in-from-left fade-in duration-500 delay-1000">
                      <Check size={16} className="text-green-500" /> Filtering allergies
                   </div>
                   <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 animate-in slide-in-from-left fade-in duration-500 delay-2000">
                      <Check size={16} className="text-green-500" /> Reviewing mobility safety
                   </div>
                </div>
             </div>
          </div>
        );

      case 12: // Completion
        return (
          <div className="flex flex-col items-center justify-center gap-8 h-full w-full relative">
             {/* Confetti Particles */}
             {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-3 h-3 rounded-full animate-[fall_3s_ease-in-out_infinite]"
                  style={{
                     backgroundColor: ['#FCA5A5', '#FCD34D', '#6EE7B7', '#93C5FD'][i % 4],
                     left: `${Math.random() * 100}%`,
                     top: `-${Math.random() * 20}%`,
                     animationDelay: `${Math.random() * 2}s`
                  }}
                />
             ))}

             <div className="animate-[spin_3s_ease-in-out_1]">
               <CassieMascot expression="happy" size={160} />
             </div>
             
             <div className={`${bubbleClass} border-yellow-100 z-10`}>
                <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Plan Ready!</h2>
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                  Your plan is ready. Here is the first step.
                </p>
             </div>

             <Button 
               onClick={() => onComplete(data)} 
               className="w-full z-10 bg-gradient-to-r from-sky-400 to-blue-500 shadow-lg shadow-sky-200 py-4 text-lg"
             >
               Begin your day
             </Button>

             <style>{`
               @keyframes fall {
                 0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
                 100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
               }
             `}</style>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#FDFBF7] dark:bg-slate-950 font-sans selection:bg-sky-200 selection:text-sky-900 transition-colors duration-500">
      
      {/* --- Dynamic Background Elements (Copied from AuthPage) --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top Right Orb */}
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-sky-400/30 to-purple-400/30 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        
        {/* Bottom Left Orb */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-400/20 to-orange-300/20 blur-3xl animate-[float_15s_ease-in-out_infinite_reverse]" />
        
        {/* Center Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 dark:border-white/5 animate-[spin_60s_linear_infinite]" />
      </div>

      {/* --- Main Glass Card Container --- */}
      <div className="relative z-10 w-full max-w-md px-6 animate-in slide-in-from-bottom-8 duration-700">
         <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[3rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none flex flex-col min-h-[620px] relative overflow-hidden transition-all duration-300">
            
            {/* Shimmer Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200/50 dark:bg-slate-700/50 rounded-full mb-8 overflow-hidden relative z-20">
               <div 
                 className="h-full bg-gradient-to-r from-sky-400 to-rose-400 transition-all duration-500 ease-out"
                 style={{ width: `${progress}%` }}
               />
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center w-full relative z-20">
               {renderContent()}
            </div>
         </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
      `}</style>
    </div>
  );
};
