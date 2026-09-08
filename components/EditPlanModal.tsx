
import React, { useState, useEffect } from 'react';
import { X, Check, Flame, Fish, Apple, Droplet, RotateCcw, Clock, Calendar, AlertCircle, ExternalLink, Download } from 'lucide-react';
import { Button } from './Button';
import { UserTargets, ScheduleItem } from '../types';
import { supabase } from '../lib/supabase';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: UserTargets;
  currentSchedule: ScheduleItem[];
  onSave: (targets: UserTargets, schedule: ScheduleItem[]) => void;
  onReset: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({ 
  isOpen, 
  onClose, 
  currentTargets, 
  currentSchedule,
  onSave,
  onReset
}) => {
  const [targets, setTargets] = useState<UserTargets>(currentTargets);
  const [schedule, setSchedule] = useState<ScheduleItem[]>(currentSchedule);
  
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    setTargets(currentTargets);
    setSchedule(currentSchedule);
    setSyncStatus('idle');
    setSyncMessage('');
  }, [currentTargets, currentSchedule, isOpen]);

  const handleTargetChange = (key: keyof UserTargets, value: string) => {
    setTargets(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleScheduleChange = (index: number, key: keyof ScheduleItem, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [key]: value };
    setSchedule(newSchedule);
  };

  // Helper: Parse "8:00 AM" to ISO String for Today
  const getEventTime = (timeStr: string) => {
    const today = new Date();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    today.setHours(hours, minutes, 0, 0);
    
    // Create End Time (30 mins later)
    const end = new Date(today);
    end.setMinutes(end.getMinutes() + 30);

    return { start: today.toISOString(), end: end.toISOString(), dateObj: today };
  };

  const handleDownloadICS = () => {
    let icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cassie Fit//Daily Plan//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    const now = new Date();
    // Format timestamp for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    schedule.forEach(item => {
        const { dateObj: start } = getEventTime(item.time);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);

        icsContent += 
`BEGIN:VEVENT
SUMMARY:Cassie Fit: ${item.label}
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
DTSTAMP:${formatICSDate(now)}
UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@cassie.fit
DESCRIPTION:Time for your ${item.label}! Track it in Cassie Fit.
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Meal Prep Reminder
ACTION:DISPLAY
END:VALARM
END:VEVENT
`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cassie-fit-plan.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSyncStatus('success');
    setSyncMessage("Schedule file downloaded! Open it to add alarms to your system Clock/Calendar.");
  };

  const handleSyncToCalendar = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setSyncMessage('');

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session || !session.provider_token) {
            throw new Error("Missing permissions. Please try the 'System Calendar' button instead.");
        }

        const token = session.provider_token;
        let successCount = 0;

        // Loop through schedule and add events
        for (const item of schedule) {
            const { start, end } = getEventTime(item.time);
            
            const event = {
                summary: `Cassie Fit: ${item.label}`,
                description: "Part of your daily healthy routine from Cassie Fit.",
                start: { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                end: { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
                reminders: {
                    useDefault: false,
                    overrides: [{ method: 'popup', minutes: 15 }]
                },
                colorId: '5' // Yellow (Breakfast-y)
            };

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (response.ok) successCount++;
            else {
                const err = await response.json();
                console.error("Calendar API Error:", err);
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Google blocked this action. Use 'System Calendar' export instead.");
                }
            }
        }

        if (successCount > 0) {
            setSyncStatus('success');
            setSyncMessage(`Successfully added ${successCount} meals to your Google Calendar!`);
        } else {
            throw new Error("Failed to add events. Check your connection.");
        }

    } catch (error: any) {
        console.error("Sync Error:", error);
        setSyncStatus('error');
        setSyncMessage(error.message || "Failed to sync.");
    } finally {
        setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex justify-center items-end sm:items-center animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-50 dark:border-slate-800 pb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Edit Your Plan</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Targets Section */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Targets</h3>
              <button onClick={onReset} className="text-xs font-bold text-sky-500 flex items-center gap-1 hover:text-sky-600">
                 <RotateCcw size={12} /> Reset to Default
              </button>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                 <div className="flex items-center gap-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-500">
                       <Flame size={20} />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Calories</span>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <input 
                       type="number" 
                       value={targets.calories}
                       onChange={(e) => handleTargetChange('calories', e.target.value)}
                       className="w-20 text-right bg-transparent font-black text-xl outline-none text-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-400">kcal</span>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-sky-300 transition-all">
                 <div className="flex items-center gap-2 mb-2">
                    <Fish size={14} className="text-sky-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Protein</span>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <input 
                       type="number" 
                       value={targets.protein}
                       onChange={(e) => handleTargetChange('protein', e.target.value)}
                       className="w-full bg-transparent font-bold text-lg outline-none text-slate-800 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">g</span>
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-red-300 transition-all">
                 <div className="flex items-center gap-2 mb-2">
                    <Apple size={14} className="text-red-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Carbs</span>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <input 
                       type="number" 
                       value={targets.carbs}
                       onChange={(e) => handleTargetChange('carbs', e.target.value)}
                       className="w-full bg-transparent font-bold text-lg outline-none text-slate-800 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">g</span>
                 </div>
              </div>

               <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 focus-within:border-green-300 transition-all">
                 <div className="flex items-center gap-2 mb-2">
                    <Droplet size={14} className="text-green-500" fill="currentColor" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Fat</span>
                 </div>
                 <div className="flex items-baseline gap-1">
                    <input 
                       type="number" 
                       value={targets.fat}
                       onChange={(e) => handleTargetChange('fat', e.target.value)}
                       className="w-full bg-transparent font-bold text-lg outline-none text-slate-800 dark:text-white"
                    />
                    <span className="text-xs text-slate-400">g</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Schedule Section */}
        <div className="mb-8">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Meal Schedule</h3>
           <div className="space-y-3">
              {schedule.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl shadow-sm">
                    <div className="bg-sky-50 dark:bg-sky-900/30 p-2 rounded-xl text-sky-500">
                       <Clock size={16} />
                    </div>
                    <input 
                       type="text"
                       value={item.label}
                       onChange={(e) => handleScheduleChange(idx, 'label', e.target.value)}
                       className="flex-1 font-bold text-slate-700 dark:text-white bg-transparent outline-none"
                    />
                    <input 
                       type="text"
                       value={item.time}
                       onChange={(e) => handleScheduleChange(idx, 'time', e.target.value)}
                       className="w-20 text-right text-sm font-semibold text-slate-500 bg-transparent outline-none border-b border-transparent focus:border-sky-300 focus:text-sky-600"
                    />
                 </div>
              ))}
           </div>
        </div>

        {/* Google Calendar Sync Feedback */}
        {syncMessage && (
            <div className={`mb-4 p-4 rounded-2xl border flex items-start gap-3 ${
                syncStatus === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50 text-green-700 dark:text-green-200' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-200'
            }`}>
                {syncStatus === 'success' ? <Check size={18} className="mt-0.5" /> : <AlertCircle size={18} className="mt-0.5" />}
                <div className="flex-1">
                    <p className="text-sm font-bold">{syncMessage}</p>
                    {syncStatus === 'success' && (
                        <a 
                            href="https://calendar.google.com" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs font-bold underline mt-1 inline-flex items-center gap-1 opacity-80 hover:opacity-100"
                        >
                            Open Google Calendar <ExternalLink size={10} />
                        </a>
                    )}
                </div>
            </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={handleDownloadICS}
                    className="col-span-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3.5 rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group text-xs sm:text-sm shadow-md shadow-sky-200 dark:shadow-none"
                >
                    <Download size={18} className="text-white group-hover:scale-110 transition-transform mb-1" />
                    Add to System Calendar
                </button>

                <button 
                    onClick={handleSyncToCalendar}
                    disabled={isSyncing}
                    className="col-span-1 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-500 dark:text-slate-400 font-bold py-3.5 rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group text-xs sm:text-sm"
                >
                    {isSyncing ? (
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin mb-1" />
                    ) : (
                        <Calendar size={18} className="text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-transform mb-1" />
                    )}
                    {isSyncing ? 'Syncing...' : 'Google Calendar'}
                </button>
            </div>

            <Button onClick={() => onSave(targets, schedule)} fullWidth>
                <Check size={20} className="mr-2" />
                Save Changes
            </Button>
        </div>

      </div>
    </div>
  );
};
