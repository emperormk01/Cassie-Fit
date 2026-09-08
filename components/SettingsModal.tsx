
import React, { useState } from 'react';
import { X, Moon, Bell, Trash2, Smartphone, Shield, Info, Check, ChevronRight, ChevronLeft, Database, Cloud, Eye, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onFactoryReset: () => void;
  onCleanDuplicates?: () => void;
}

const PrivacySection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children?: React.ReactNode }) => (
  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-50 dark:border-slate-700">
      <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 text-sm">
          {icon} {title}
      </h3>
      <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 pl-6">
          {children}
      </div>
  </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  isDarkMode,
  onToggleDarkMode,
  notificationsEnabled,
  onToggleNotifications,
  onFactoryReset,
  onCleanDuplicates
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (!isOpen) return null;

  const handleResetClick = () => {
    if (showResetConfirm) {
      onFactoryReset();
    } else {
      setShowResetConfirm(true);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] animate-in fade-in" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[400px] bg-[#FDFBF7] dark:bg-slate-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 z-[80] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
         
         {!showPrivacy ? (
             <>
                 {/* Main Settings Header */}
                 <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#FDFBF7] dark:bg-slate-900 z-10 py-2 -mt-2">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">App Settings</h2>
                    <button 
                      onClick={onClose} 
                      className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    
                    {/* Appearance Section */}
                    <section>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Appearance</h3>
                       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-700 overflow-hidden">
                          <button 
                            onClick={onToggleDarkMode}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                             <div className="flex items-center gap-3">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-500">
                                   <Moon size={20} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200">Dark Mode</span>
                             </div>
                             <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                             </div>
                          </button>
                       </div>
                    </section>

                    {/* Notifications Section */}
                    <section>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Preferences</h3>
                       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                          <button 
                            onClick={onToggleNotifications}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                             <div className="flex items-center gap-3">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-500">
                                   <Bell size={20} />
                                </div>
                                <div className="text-left">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 block">Daily Reminders</span>
                                   <span className="text-xs text-slate-400 font-medium">Meal & Water alerts</span>
                                </div>
                             </div>
                             <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notificationsEnabled ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                             </div>
                          </button>

                          <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                             <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-500">
                                   <Smartphone size={20} />
                                </div>
                                 <div className="text-left">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 block">Haptics</span>
                                   <span className="text-xs text-slate-400 font-medium">Vibration feedback</span>
                                </div>
                             </div>
                             <div className="w-12 h-6 rounded-full p-1 bg-sky-500">
                                 <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-6" />
                             </div>
                          </button>
                       </div>
                    </section>

                     {/* Danger Zone */}
                    <section>
                       <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Data & Privacy</h3>
                       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-700 overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                          {onCleanDuplicates && (
                             <button 
                                onClick={onCleanDuplicates}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                             >
                                <div className="flex items-center gap-3">
                                   <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-xl text-yellow-600 dark:text-yellow-500">
                                      <RefreshCw size={20} />
                                   </div>
                                   <span className="font-bold text-slate-700 dark:text-slate-200">Clean Duplicate Logs</span>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
                             </button>
                          )}

                          <button 
                             onClick={() => setShowPrivacy(true)}
                             className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                             <div className="flex items-center gap-3">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-500">
                                   <Shield size={20} />
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-200">Privacy Policy</span>
                             </div>
                             <ChevronRight size={18} className="text-slate-300" />
                          </button>

                           <button 
                             onClick={handleResetClick}
                             className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                           >
                             <div className="flex items-center gap-3">
                                <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-xl text-red-500 group-hover:bg-red-200 dark:group-hover:bg-red-800 transition-colors">
                                   <Trash2 size={20} />
                                </div>
                                 <div className="text-left">
                                   <span className="font-bold text-slate-700 dark:text-slate-200 block group-hover:text-red-500 transition-colors">
                                      {showResetConfirm ? "Are you sure?" : "Reset App Data"}
                                   </span>
                                   <span className="text-xs text-slate-400 font-medium group-hover:text-red-400">
                                      {showResetConfirm ? "Tap again to confirm wipe" : "Clears all logs & profile"}
                                   </span>
                                </div>
                             </div>
                             {showResetConfirm && <Check size={18} className="text-red-500" />}
                          </button>
                       </div>
                    </section>
                 </div>
                 
                 {/* Footer Info */}
                 <div className="mt-8 text-center flex flex-col items-center gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full text-slate-400">
                       <Info size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-400">Cassie Health v1.2.0</p>
                    <p className="text-[10px] text-slate-300 font-medium">Made with 💙 by AI</p>
                 </div>
             </>
         ) : (
             <div className="animate-in slide-in-from-right duration-300 h-full flex flex-col">
                {/* Privacy Header */}
                <div className="flex items-center gap-3 mb-6 sticky top-0 bg-[#FDFBF7] dark:bg-slate-900 z-10 py-2 -mt-2 border-b border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setShowPrivacy(false)}
                      className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">Privacy Policy</h2>
                </div>

                {/* Privacy Content */}
                <div className="space-y-4 pb-4 overflow-y-auto">
                    {/* Summary Card */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm mb-2">
                        <div className="flex items-start gap-3">
                            <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                            <p className="font-medium text-blue-800 dark:text-blue-200 leading-relaxed text-xs">
                                Your health data is yours. We prioritize local storage and transparent AI processing.
                            </p>
                        </div>
                    </div>

                    <PrivacySection title="Data Storage" icon={<Database size={16} className="text-purple-500"/>}>
                       We store your profile, daily logs, and chat history locally on your device using browser storage. We do not maintain a central database of your personal health records.
                    </PrivacySection>

                    <PrivacySection title="AI Processing" icon={<Cloud size={16} className="text-sky-500"/>}>
                       When you chat with Cassie, your message text and relevant profile context are processed by Google's Gemini API to generate responses. This data is not used to train public models.
                    </PrivacySection>

                    <PrivacySection title="Permissions" icon={<Smartphone size={16} className="text-emerald-500"/>}>
                       <ul className="list-disc pl-4 space-y-1 mt-1 opacity-90">
                           <li><b>Camera:</b> Used only for scanning barcodes or food. Images are processed temporarily and not saved to a cloud server.</li>
                           <li><b>Location:</b> Used only when you ask for nearby recommendations (e.g., restaurants).</li>
                       </ul>
                    </PrivacySection>

                    <PrivacySection title="Your Rights" icon={<Eye size={16} className="text-orange-500"/>}>
                       You can export your data (coming soon) or delete all stored data instantly using the "Reset App Data" button in the main settings menu.
                    </PrivacySection>

                    <div className="pt-6 pb-2 border-t border-slate-100 dark:border-slate-800 text-center">
                       <p className="text-xs text-slate-400 font-bold">Effective Date: October 2025</p>
                       <p className="text-[10px] text-slate-300 mt-1">Contact: privacy@cassie.health</p>
                    </div>
                </div>
             </div>
         )}
      </div>
    </>
  );
};
