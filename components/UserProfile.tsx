
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, User as UserIcon, LogOut, Camera, Settings } from 'lucide-react';
import { UserProfileData } from '../types';

interface UserProfileProps {
  onBack?: () => void;
  initialData?: UserProfileData | null;
  onSave?: (data: UserProfileData) => void;
  onSignOut: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  onOpenSettings?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onBack, initialData, onSave, onSignOut, onScroll, onOpenSettings }) => {
  const [name, setName] = useState('User');
  const [pronoun, setPronoun] = useState('He/Him');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from props
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || 'User');
      setAvatarUrl(initialData.avatarUrl);
      // Infer pronoun from gender if available, otherwise default
      if (initialData.gender === 'Female') setPronoun('She/Her');
      else if (initialData.gender === 'Male') setPronoun('He/Him');
      else if (initialData.gender === 'Other') setPronoun('Other');
    }
  }, [initialData]);

  // Auto-Save Effect (Debounced)
  useEffect(() => {
    // Don't save if we don't have base data yet
    if (!initialData) return;

    const currentGender = pronoun === 'She/Her' ? 'Female' : pronoun === 'He/Him' ? 'Male' : 'Other';

    // Check if anything actually changed to avoid unnecessary writes
    const hasChanged = 
        name !== initialData.name || 
        avatarUrl !== initialData.avatarUrl || 
        currentGender !== initialData.gender;

    if (hasChanged) {
        const timer = setTimeout(() => {
            const updatedProfile = {
                ...initialData,
                name,
                avatarUrl,
                gender: currentGender
            } as UserProfileData;
            
            if (onSave) onSave(updatedProfile);
        }, 1000); // Wait 1 second after typing stops

        return () => clearTimeout(timer);
    }
  }, [name, pronoun, avatarUrl, initialData, onSave]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7] dark:bg-slate-950 font-sans transition-colors relative overflow-hidden">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header */}
      <header className="px-6 py-4 pt-6 flex items-center justify-between sticky top-0 z-10 bg-[#FDFBF7]/80 dark:bg-slate-950/80 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-slate-800 dark:text-white">Profile</span>
        <button 
           onClick={onOpenSettings}
           className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
        >
           <Settings size={20} />
        </button>
      </header>

      {/* Scrollable Content */}
      <div 
        className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar"
        onScroll={onScroll}
      >
        
        {/* User Identity Section */}
        <div className="flex flex-col items-center mb-8 animate-in zoom-in-50 duration-500">
          <div className="relative mb-4 group">
            {/* Custom Avatar: Uploaded Image or Cartoon Figure */}
            <div className="w-28 h-28 rounded-full bg-[#FFEDD5] border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative cursor-pointer" onClick={triggerFileInput}>
               {avatarUrl ? (
                 <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Skin */}
                    <rect x="20" y="30" width="60" height="60" rx="30" fill="#FDBA74" />
                    {/* Hair */}
                    <path d="M20 40 C20 15 80 15 80 40 L80 50 L20 50 Z" fill="#475569" />
                    <path d="M20 40 C15 45 15 55 20 60" fill="#475569" /> {/* Sideburn L */}
                    <path d="M80 40 C85 45 85 55 80 60" fill="#475569" /> {/* Sideburn R */}
                    {/* Goggles Strap */}
                    <rect x="15" y="42" width="70" height="6" fill="#1E293B" />
                    {/* Goggles L */}
                    <circle cx="38" cy="45" r="12" fill="#38BDF8" stroke="#E2E8F0" strokeWidth="3" />
                    <circle cx="38" cy="45" r="4" fill="white" opacity="0.5" />
                    {/* Goggles R */}
                    <circle cx="62" cy="45" r="12" fill="#38BDF8" stroke="#E2E8F0" strokeWidth="3" />
                    <circle cx="62" cy="45" r="4" fill="white" opacity="0.5" />
                    {/* Nose */}
                    <path d="M50 65 Q53 68 50 71" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.5" />
                    {/* Smile */}
                    <path d="M40 78 Q50 85 60 78" stroke="#FFF" strokeWidth="3" strokeLinecap="round" fill="none" />
                 </svg>
               )}
               {/* Overlay for hover effect */}
               <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={24} />
               </div>
            </div>
            <button 
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 bg-rose-400 text-white p-2 rounded-full shadow-md hover:bg-rose-500 transition-colors border-2 border-white"
            >
               <UserIcon size={14} />
            </button>
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{name}</h2>
          <p className="text-slate-400 font-medium text-sm">{initialData?.goal || 'Health Enthusiast'}</p>
        </div>

        {/* Top Card: Display Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6 animate-in slide-in-from-bottom duration-500 delay-100">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Display Settings</h3>
           
           <div className="space-y-6">
              {/* Display Name Input */}
              <div className="group">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                 <div className="relative">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FDFBF7] dark:bg-slate-800 border-2 border-transparent focus:border-rose-200 focus:bg-white dark:focus:bg-slate-800 rounded-2xl py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold transition-all outline-none"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300 opacity-0 group-focus-within:opacity-100 transition-opacity">
                       <UserIcon size={18} />
                    </div>
                 </div>
              </div>

              {/* Pronouns Section */}
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Pronouns</label>
                 
                 {/* Chips */}
                 <div className="flex gap-3 mb-4">
                    {['She/Her', 'He/Him', 'Other'].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPronoun(p)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 ${
                          pronoun === p 
                            ? 'bg-rose-400 text-white shadow-lg shadow-rose-200' 
                            : 'bg-[#FDFBF7] dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                 </div>

                 {/* Input Display (Read-onlyish representation) */}
                 <div className="relative opacity-50 pointer-events-none">
                    <input 
                      type="text" 
                      value={pronoun}
                      readOnly
                      className="w-full bg-[#FDFBF7] dark:bg-slate-800 rounded-2xl py-3.5 px-4 text-slate-500 font-medium"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Sign Out Button */}
        <button 
           onClick={onSignOut}
           className="w-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-4 rounded-[2rem] flex items-center justify-center gap-2 mb-8 transition-colors"
         >
            <LogOut size={20} />
            Sign Out
         </button>

      </div>
    </div>
  );
};
