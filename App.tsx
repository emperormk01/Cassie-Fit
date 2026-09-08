
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  Sun,
  Moon,
  Loader2,
  CheckCircle2
} from 'lucide-react';

import { CassieMascot } from './components/CassieMascot';
import { Button } from './components/Button';
import { NutritionGoalsModal } from './components/NutritionGoalsModal';
import { EditPlanModal } from './components/EditPlanModal';
import { LogActionSheet } from './components/LogActionSheet';
import { ScanBarcodeModal } from './components/ScanBarcodeModal';
import { SearchFoodModal } from './components/SearchFoodModal';
import { LogWeightModal } from './components/LogWeightModal';
import { SnapPhotoModal } from './components/SnapPhotoModal';
import { SideMenu } from './components/SideMenu';
import { UserProfile } from './components/UserProfile';
import { OnboardingFlow } from './components/OnboardingFlow';
import { NavBar } from './components/NavBar';
import { SettingsModal } from './components/SettingsModal';
import { AuthPage } from './components/AuthPage';
import { PremiumModal } from './components/PremiumModal';

import { ChatHome } from './components/ChatHome';
import { DashboardView } from './components/DashboardView';
import { ChatMessage, ChatSession, UserProfileData, DailyLogItem, UserTargets, ScheduleItem, RecommendationItem, UserMemory, MemoryUpdate } from './types';
import { runGroqChat } from "./lib/groq";
import { supabase } from './lib/supabase';

type LogMode = 'none' | 'scan' | 'search' | 'weight' | 'photo';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  
  // Onboarding & User State
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  
  // Premium State
  const [isPremium, setIsPremium] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isSyncingPayment, setIsSyncingPayment] = useState(false);

  // Temp Data passed to onboarding (if new user)
  const [googleUserData, setGoogleUserData] = useState<any>(null);

  // Default tab is Home (Chat)
  const [activeTab, setActiveTab] = useState('home');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Session Context (Short-term data)
  const [lastScannedFood, setLastScannedFood] = useState<string | null>(null);
  
  // Adaptive Navbar State
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  const isChatInputFocused = useRef(false);
  
  // AI Interaction State (Thinking or Typing)
  const [isAiTyping, setIsAiTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Menu Animation State
  const [isMenuAnimating, setIsMenuAnimating] = useState(false);
  
  // Custom Plan State
  const [customTargets, setCustomTargets] = useState<UserTargets | null>(null);
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[] | null>(null);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);

  // Chat Intent State
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  // Long-Term Memory State
  const [userMemory, setUserMemory] = useState<UserMemory>(() => {
    try {
      const saved = localStorage.getItem('cassie_user_memory');
      if (saved) return JSON.parse(saved);
      return {
        favorites: [],
        dislikes: [],
        culturalBackground: [],
        cookingSkill: 'Unknown',
        budget: 'Unknown',
        patterns: { sleep: null, stress: null, hydration: null },
        recentSummaries: [],
        lastUpdated: Date.now()
      };
    } catch {
      return {
        favorites: [],
        dislikes: [],
        culturalBackground: [],
        cookingSkill: 'Unknown',
        budget: 'Unknown',
        patterns: { sleep: null, stress: null, hydration: null },
        recentSummaries: [],
        lastUpdated: Date.now()
      };
    }
  });

  // Daily Log State
  const [dailyLog, setDailyLog] = useState<DailyLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('cassie_daily_log');
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Chat Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('cassie_sessions');
      if (saved) return JSON.parse(saved);
      return [];
    } catch { return []; }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  // --- SUPABASE DATA SYNC HELPERS ---

  const loadSupabaseData = async (userId: string) => {
    try {
      // 1. Logs
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('data')
        .order('created_at', { ascending: false })
        .limit(100); 

      if (logs && logs.length > 0) {
        const loadedLogs = logs.map(l => l.data);
        const uniqueLogs = Array.from(new Map(loadedLogs.map(item => [item.id, item])).values());
        setDailyLog(uniqueLogs);
      }

      // 2. Sessions
      const { data: sess } = await supabase
        .from('chat_sessions')
        .select('data')
        .order('updated_at', { ascending: false })
        .limit(20); 

      if (sess && sess.length > 0) {
        setSessions(sess.map(s => s.data));
        if (!currentSessionId && sess[0].data.id) {
           setCurrentSessionId(sess[0].data.id);
        }
      }

      // 3. Memory
      const { data: mem } = await supabase
        .from('user_memory')
        .select('data')
        .eq('user_id', userId)
        .single();
      
      if (mem && mem.data) {
        setUserMemory(mem.data);
      }
    } catch (e) {
      console.error("Failed to sync data", e);
    }
  };

  // --- FLUTTERWAVE PAYMENT HANDLER (Polling & Query Params) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const txRef = params.get('tx_ref');

    if (status === 'successful' && txRef && supabaseUser) {
        setIsSyncingPayment(true);
        // Start Polling
        const pollInterval = setInterval(async () => {
            console.log("Polling for payment status update...");
            
            const { data, error } = await supabase
                .from('profiles')
                .select('data, plan_type')
                .eq('id', supabaseUser.id)
                .single();

            if (data && (data.plan_type === 'pro' || data.plan_type === 'agency')) {
                // Success!
                clearInterval(pollInterval);
                setIsSyncingPayment(false);
                handleUpgrade(false); // Update local state
                
                // Clear URL params without refresh
                window.history.replaceState({}, document.title, window.location.pathname);
                alert("Payment Synced! You are now a Pro member.");
            }
        }, 1500); // 1.5s interval as requested

        // Safety timeout after 30 seconds
        setTimeout(() => {
            if (isSyncingPayment) {
                clearInterval(pollInterval);
                setIsSyncingPayment(false);
                console.warn("Payment poll timeout.");
            }
        }, 30000);

        return () => clearInterval(pollInterval);
    }
  }, [supabaseUser]);

  // --- PERSISTENCE EFFECTS ---

  useEffect(() => {
    const savedPremium = localStorage.getItem('cassie_is_premium');
    if (savedPremium === 'true') setIsPremium(true);
  }, []);

  const handleUpgrade = (shouldSaveToDb = true) => {
    setIsPremium(true);
    localStorage.setItem('cassie_is_premium', 'true');
    
    if (userProfile) {
       setUserProfile({ ...userProfile, isPremium: true });
    }

    if (shouldSaveToDb && supabaseUser && userProfile) {
        // Optimistic update
        supabase.from('profiles').update({
             data: { ...userProfile, isPremium: true },
             updated_at: new Date()
        }).eq('id', supabaseUser.id);
    }
  };

  // Persist Memory
  useEffect(() => {
    localStorage.setItem('cassie_user_memory', JSON.stringify(userMemory));
    if (supabaseUser) {
      const timer = setTimeout(() => {
        supabase.from('user_memory').upsert({
          user_id: supabaseUser.id,
          data: userMemory,
          updated_at: new Date()
        }).then(({ error }) => {
          if (error) console.error("Memory sync error", error);
        });
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [userMemory, supabaseUser]);

  // Persist Sessions
  useEffect(() => {
    if (sessions.length > 0) {
       localStorage.setItem('cassie_sessions', JSON.stringify(sessions));
       if (supabaseUser) {
         const timer = setTimeout(() => {
            const current = sessions.find(s => s.id === currentSessionId);
            if (current) {
                supabase.from('chat_sessions').upsert({
                   id: current.id,
                   user_id: supabaseUser.id,
                   data: current,
                   updated_at: new Date()
                }).then(({error}) => {
                   if (error) console.error("Session sync error", error);
                });
            }
         }, 3000);
         return () => clearTimeout(timer);
       }
    }
  }, [sessions, currentSessionId, supabaseUser]);

  // Persist Log
  useEffect(() => {
    localStorage.setItem('cassie_daily_log', JSON.stringify(dailyLog));
  }, [dailyLog]);

  // Check Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // --- SESSION MANAGEMENT ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    setIsLoadingSession(true);
    if (session) {
      setSupabaseUser(session.user);
      setIsAuthenticated(true);
      await loadSupabaseData(session.user.id);

      try {
        // Fetch raw profile row to check new plan_type column as well as JSON data
        const { data, error } = await supabase
          .from('profiles')
          .select('*') // Select all including plan_type
          .eq('id', session.user.id)
          .single();
        
        if (data && data.data) {
          const profile = data.data as UserProfileData;
          
          // Merge SQL column data into TS object if needed, or rely on JSON
          // Ideally, we sync them. If plan_type is 'pro', ensure isPremium is true.
          if (data.plan_type === 'pro' || data.plan_type === 'agency') {
             profile.isPremium = true;
             localStorage.setItem('cassie_is_premium', 'true');
             setIsPremium(true);
          }

          setUserProfile(profile);
          setHasCompletedOnboarding(true);
        } else {
          setHasCompletedOnboarding(false);
          const meta = session.user.user_metadata;
          if (meta) {
             setGoogleUserData({
               name: meta.full_name || meta.name,
               picture: meta.avatar_url || meta.picture
             });
          }
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      }
    } else {
      const localProfile = localStorage.getItem('cassie_user_profile');
      const localOnboarding = localStorage.getItem('cassie_onboarding_complete');

      if (localProfile && localOnboarding === 'true') {
         try {
           setUserProfile(JSON.parse(localProfile));
           setHasCompletedOnboarding(true);
           setIsAuthenticated(true);
         } catch(e) {
           setIsAuthenticated(false);
         }
      } else {
         setIsAuthenticated(false);
         setSupabaseUser(null);
         setUserProfile(null);
      }
    }
    setIsLoadingSession(false);
  };

  // Reset navbar when changing tabs
  useEffect(() => {
    setShowNavbar(true);
    lastScrollY.current = 0;
  }, [activeTab]);

  // Handle Scroll
  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (isChatInputFocused.current || isAiTyping) return;
    const currentScrollY = e.currentTarget.scrollTop;
    const diff = currentScrollY - lastScrollY.current;
    if (Math.abs(diff) < 10) return;
    if (diff > 0 && currentScrollY > 50) {
      setShowNavbar(false);
    } else if (diff < 0) {
      setShowNavbar(true);
    }
    lastScrollY.current = currentScrollY;
  };

  const handleChatFocus = (isFocused: boolean) => {
    isChatInputFocused.current = isFocused;
    setShowNavbar(!isFocused);
  };

  const handleAiTypingChange = (typing: boolean) => {
    if (typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsAiTyping(true);
      setShowNavbar(false);
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsAiTyping(false);
        if (!isChatInputFocused.current) setShowNavbar(true);
      }, 150);
    }
  };

  const handleGuestLogin = () => {
     setIsAuthenticated(true);
     setHasCompletedOnboarding(false);
  };

  const handleSavePlan = (targets: UserTargets, schedule: ScheduleItem[]) => {
     setCustomTargets(targets);
     setCustomSchedule(schedule);
     localStorage.setItem('cassie_user_targets', JSON.stringify(targets));
     localStorage.setItem('cassie_user_schedule', JSON.stringify(schedule));
     setIsEditPlanOpen(false);
  };

  const handleResetPlan = () => {
     setCustomTargets(null);
     setCustomSchedule(null);
     localStorage.removeItem('cassie_user_targets');
     localStorage.removeItem('cassie_user_schedule');
     setIsEditPlanOpen(false);
  };

  const handleFactoryReset = () => {
    localStorage.clear();
    supabase.auth.signOut();
    window.location.reload();
  };

  const handleCleanDuplicates = async () => {
    if (dailyLog.length === 0) return;
    const uniqueMap = new Map<string, DailyLogItem>();
    const idsToDelete: string[] = [];
    const sortedLogs = [...dailyLog].sort((a, b) => b.timestamp - a.timestamp);

    sortedLogs.forEach(item => {
        const dateStr = new Date(item.timestamp).toDateString();
        const signature = `${item.name}-${item.mealType}-${item.calories}-${dateStr}`;
        if (uniqueMap.has(signature)) idsToDelete.push(item.id);
        else uniqueMap.set(signature, item);
    });

    const uniqueLogs = Array.from(uniqueMap.values());
    setDailyLog(uniqueLogs);
    localStorage.setItem('cassie_daily_log', JSON.stringify(uniqueLogs));

    if (supabaseUser && idsToDelete.length > 0) {
        try {
            await supabase.from('daily_logs').delete().in('id', idsToDelete);
        } catch (e) {
            console.error("Failed to clean DB duplicates:", e);
        }
    }
    alert(`Cleaned ${idsToDelete.length} duplicate entries.`);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if (!('Notification' in window)) {
        alert("This browser does not support notifications.");
        return;
      }
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          new Notification("Notifications Active! 🐾", { 
             body: "I'll remind you when it's time to eat!",
             icon: '/pwa-192x192.png'
          });
        } else {
          alert("Notification permission denied. Please enable it in your browser settings.");
        }
      } catch (e) {
        console.error("Notification Error:", e);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleUpdateMemory = (update: MemoryUpdate) => {
    setUserMemory(prev => {
      const newMemory = { ...prev, lastUpdated: Date.now() };
      switch (update.category) {
        case 'favorite':
          if (!newMemory.favorites.includes(update.value)) newMemory.favorites = [...newMemory.favorites, update.value].slice(0, 20);
          break;
        case 'dislike':
          if (!newMemory.dislikes.includes(update.value)) newMemory.dislikes = [...newMemory.dislikes, update.value].slice(0, 20);
          break;
        case 'culture':
          if (!newMemory.culturalBackground.includes(update.value)) newMemory.culturalBackground = [...newMemory.culturalBackground, update.value];
          break;
        case 'skill': newMemory.cookingSkill = update.value as any; break;
        case 'budget': newMemory.budget = update.value as any; break;
        case 'pattern_sleep': newMemory.patterns.sleep = update.value; break;
        case 'pattern_stress': newMemory.patterns.stress = update.value; break;
        case 'pattern_hydration': newMemory.patterns.hydration = update.value; break;
        case 'recent_summary': newMemory.recentSummaries = [update.value, ...(newMemory.recentSummaries || [])].slice(0, 5); break;
      }
      return newMemory;
    });
  };

  const handleToggleFavorite = (foodName: string) => {
    setUserMemory(prev => {
      const exists = prev.favorites.includes(foodName);
      let newFavorites;
      if (exists) {
        newFavorites = prev.favorites.filter(f => f !== foodName);
      } else {
        newFavorites = [foodName, ...prev.favorites].slice(0, 50);
      }
      return { ...prev, favorites: newFavorites, lastUpdated: Date.now() };
    });
  };

  const summarizeSession = async (sessionMessages: ChatMessage[]) => {
     if (sessionMessages.length < 3) return; 
     const transcript = sessionMessages
        .filter(m => m.type === 'text')
        .map(m => `${m.sender}: ${m.text}`)
        .join('\n');
     try {
        const prompt = `Analyze this chat transcript and extract key nutritional habits or preferences. Transcript: ${transcript} Output format: Plain text bullet points.`;
        const summary = await runGroqChat([{ role: 'user', content: prompt }]);
        if (summary) handleUpdateMemory({ category: 'recent_summary', value: summary });
     } catch (e) {
        console.error("Summarization failed", e);
     }
  };

  useEffect(() => {
    if (isAuthenticated && hasCompletedOnboarding && sessions.length === 0) {
       const defaultSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        timestamp: Date.now(),
        messages: [{
          id: 'welcome',
          sender: 'ai',
          type: 'text',
          text: userProfile 
            ? `Welcome back, ${userProfile.name}! How can I help you today?` 
            : "Hi there! I'm Cassie. Tell me what you ate or ask me for a healthy meal idea!",
          timestamp: Date.now()
        }]
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
    } else if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [isAuthenticated, hasCompletedOnboarding, sessions.length]); 

  const activeSessionIndex = sessions.findIndex(s => s.id === currentSessionId);
  const currentMessages = activeSessionIndex >= 0 ? sessions[activeSessionIndex].messages : [];

  const handleSetMessages = (action: React.SetStateAction<ChatMessage[]>) => {
    setSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.id === currentSessionId) {
          const newMessages = typeof action === 'function' ? action(session.messages) : action;
          let newTitle = session.title;
          if (session.title === 'New Chat' && newMessages.length > 0) {
            const firstUserMsg = newMessages.find(m => m.sender === 'user');
            if (firstUserMsg && firstUserMsg.text) {
              newTitle = firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? '...' : '');
            }
          }
          return { ...session, messages: newMessages, title: newTitle, timestamp: Date.now() };
        }
        return session;
      });
    });
  };

  const handleNewChat = () => {
    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (currentSession && currentSession.messages.length > 2) {
       summarizeSession(currentSession.messages);
    }
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      timestamp: Date.now(),
      messages: [{
        id: 'welcome_' + Date.now(),
        sender: 'ai',
        type: 'text',
        text: `Hi ${userProfile ? userProfile.name : 'there'}! Ready for a new start?`,
        timestamp: Date.now()
      }]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTab('home');
  };

  const handleMenuClick = () => {
    setIsMenuAnimating(true);
    setTimeout(() => {
      setIsSideMenuOpen(true);
      setTimeout(() => setIsMenuAnimating(false), 200);
    }, 300);
  };

  const handleOnboardingComplete = async (data: UserProfileData) => {
    setUserProfile(data);
    setHasCompletedOnboarding(true);

    if (supabaseUser) {
        const { error } = await supabase
           .from('profiles')
           .upsert({ 
               id: supabaseUser.id, 
               data: data,
               updated_at: new Date()
           });
        if (error) console.error("Failed to save profile:", error);
    } else {
        localStorage.setItem('cassie_user_profile', JSON.stringify(data));
        localStorage.setItem('cassie_onboarding_complete', 'true');
    }
    
    const personalizedWelcome: ChatMessage = {
      id: 'onboarding_welcome',
      sender: 'ai',
      type: 'text',
      text: `Hi ${data.name}! I've set up your ${data.goal} plan. Ready to start your first day?`,
      timestamp: Date.now()
    };

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'My First Plan',
      timestamp: Date.now(),
      messages: [personalizedWelcome]
    };

    setSessions([newSession]);
    setCurrentSessionId(newSession.id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setIsAuthenticated(false);
    setUserProfile(null);
    setSessions([]);
    setDailyLog([]);
    setCustomTargets(null);
    setCustomSchedule(null);
    setGoogleUserData(null);
    setSupabaseUser(null);
    setIsPremium(false);
    setUserMemory({
       favorites: [],
       dislikes: [],
       culturalBackground: [],
       cookingSkill: 'Unknown',
       budget: 'Unknown',
       patterns: { sleep: null, stress: null, hydration: null },
       recentSummaries: [],
       lastUpdated: Date.now()
    });
    setCurrentSessionId('');
    setHasCompletedOnboarding(false);
    setActiveTab('home');
  };

  const handleUpdateProfile = async (data: UserProfileData) => {
    setUserProfile(data);
    if (supabaseUser) {
        const { error } = await supabase
           .from('profiles')
           .update({ data: data, updated_at: new Date() })
           .eq('id', supabaseUser.id);
        if (error) console.error("Failed to update profile:", error);
    } else {
        localStorage.setItem('cassie_user_profile', JSON.stringify(data));
    }
  };

  const handleLogAction = (mode: LogMode) => {
    setIsLogSheetOpen(false);
    setTimeout(() => { setActiveLogMode(mode); }, 200);
  };
  const [activeLogMode, setActiveLogMode] = useState<LogMode>('none');
  const closeLogModal = () => setActiveLogMode('none');

  const addLogItem = (data: { name: string, calories: number, protein: number, carbs: number, fat: number, image?: string | null }) => {
    const now = Date.now();
    const hour = new Date(now).getHours();
    let mealType = 'Snack';
    if (hour >= 5 && hour < 11) mealType = 'Breakfast';
    else if (hour >= 11 && hour < 15) mealType = 'Lunch';
    else if (hour >= 15 && hour < 22) mealType = 'Dinner';

    const isDuplicate = dailyLog.some(l => l.name === data.name && (now - l.timestamp) < 60000);
    if (isDuplicate) return;

    const newItem: DailyLogItem = {
      id: now.toString(), 
      timestamp: now,
      mealType,
      image: data.image || null,
      name: data.name,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fat: data.fat
    };
    setLastScannedFood(data.name);
    setDailyLog(prev => [newItem, ...prev]);

    if (supabaseUser) {
        supabase.from('daily_logs').insert({
            id: newItem.id,
            user_id: supabaseUser.id,
            data: newItem,
            created_at: new Date(now)
        }).then(({ error }) => {
            if (error) console.error("Failed to sync log:", error);
        });
    }
  };

  const handleAddLogEntry = (data: { name: string, calories: number, protein: number, carbs: number, fat: number, image?: string | null }) => {
    addLogItem(data);
    setActiveLogMode('none');
    setActiveTab('stats');
  };
  
  const handleAddSimpleFood = (name: string) => {
     addLogItem({ name, calories: 0, protein: 0, carbs: 0, fat: 0 });
     closeLogModal();
     setActiveTab('stats');
  };

  const handleLogFromChat = (item: RecommendationItem) => {
    addLogItem({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    });
  };

  const handleAskCassie = (item: DailyLogItem) => {
     setActiveTab('home');
     const prompt = `Can you break down the nutritional value of ${item.name} (${item.calories} kcal) that I just ate? Is it good for my ${userProfile?.goal || 'goals'}?`;
     setPendingMessage(prompt);
  };

  const handleStartCheckIn = () => {
     setActiveTab('home');
     setPendingMessage("Start my morning check-in and give me a daily plan.");
  };

  const calculateTargets = (profile: UserProfileData | null): UserTargets => {
     if (!profile) return { calories: 2000, protein: 150, carbs: 200, fat: 65, planMode: 'standard' };
     const calTarget = profile.activityLevel === 'High' ? 2400 : profile.activityLevel === 'Moderate' ? 2100 : 1850;
     const isHighProtein = profile.eatingStyle?.includes('Protein') || profile.goal?.includes('Fitness');
     const proteinTarget = isHighProtein ? 180 : 140;
     const carbsTarget = profile.eatingStyle?.includes('Low Carb') ? 80 : 180;
     const fatTarget = 55;
     return { calories: calTarget, protein: proteinTarget, carbs: carbsTarget, fat: fatTarget, planMode: 'standard' };
  };

  const calculateSchedule = (): ScheduleItem[] => {
     return [
        { time: '8:00 AM', label: 'Breakfast' },
        { time: '1:00 PM', label: 'Lunch' },
        { time: '4:00 PM', label: 'Snack' },
        { time: '7:30 PM', label: 'Dinner' },
     ];
  };

  const effectiveTargets = customTargets || calculateTargets(userProfile);
  const effectiveSchedule = customSchedule || calculateSchedule();

  if (isLoadingSession) {
      return (
          <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
             <div className="relative">
                 <div className="absolute inset-0 bg-primary-200/50 dark:bg-primary-500/20 blur-3xl rounded-full animate-pulse" />
                 <CassieMascot expression="happy" size={120} className="relative z-10 animate-bounce" />
             </div>
             <div className="mt-8 flex items-center gap-2 text-slate-400 font-bold">
                 <Loader2 className="animate-spin" size={20} />
                 <span>Waking up Cassie...</span>
             </div>
          </div>
      );
  }

  if (!isAuthenticated) {
     return <AuthPage onLogin={handleGuestLogin} />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} initialData={googleUserData} />;
  }

  if (isSyncingPayment) {
      return (
          <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-950 flex flex-col items-center justify-center animate-in fade-in">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-6 max-w-xs text-center border border-slate-100 dark:border-slate-800">
                 <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500 animate-pulse">
                    <CheckCircle2 size={32} />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">Syncing Payment</h2>
                    <p className="text-slate-500 text-sm">Please wait while we confirm your transaction with Flutterwave...</p>
                 </div>
                 <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 animate-[loading_1.5s_infinite]" style={{width: '50%'}} />
                 </div>
             </div>
             <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
             `}</style>
          </div>
      );
  }

  return (
    <div className={`min-h-screen flex justify-center bg-[#FAF9F6] dark:bg-slate-900 font-sans transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
      <div className="w-full max-w-[480px] bg-[#FAF9F6] dark:bg-slate-900 min-h-screen relative shadow-2xl overflow-hidden flex flex-col transition-colors duration-200">
        
        <SideMenu 
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={setCurrentSessionId}
          onNewChat={handleNewChat}
          onOpenGoals={() => setActiveTab('plan')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isPremium={isPremium}
          onOpenPremium={() => setIsPremiumModalOpen(true)}
        />

        <LogActionSheet 
          isOpen={isLogSheetOpen}
          onClose={() => setIsLogSheetOpen(false)}
          onScan={() => handleLogAction('scan')}
          onSearch={() => handleLogAction('search')}
          onWeight={() => handleLogAction('weight')}
          onPhoto={() => handleLogAction('photo')}
        />

        <PremiumModal 
          isOpen={isPremiumModalOpen} 
          onClose={() => setIsPremiumModalOpen(false)} 
          onUpgrade={() => handleUpgrade(true)}
          userId={supabaseUser?.id}
          userEmail={supabaseUser?.email}
        />

        <ScanBarcodeModal isOpen={activeLogMode === 'scan'} onClose={closeLogModal} />
        <SearchFoodModal 
           isOpen={activeLogMode === 'search'} 
           onClose={closeLogModal} 
           favorites={userMemory.favorites}
           onAdd={handleAddSimpleFood}
        />
        <LogWeightModal isOpen={activeLogMode === 'weight'} onClose={closeLogModal} />
        
        <SnapPhotoModal 
          isOpen={activeLogMode === 'photo'} 
          onClose={closeLogModal}
          onSave={handleAddLogEntry}
        />
        
        <EditPlanModal 
           isOpen={isEditPlanOpen}
           onClose={() => setIsEditPlanOpen(false)}
           currentTargets={effectiveTargets}
           currentSchedule={effectiveSchedule}
           onSave={handleSavePlan}
           onReset={handleResetPlan}
        />

        <SettingsModal 
           isOpen={isSettingsOpen}
           onClose={() => setIsSettingsOpen(false)}
           isDarkMode={isDarkMode}
           onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
           notificationsEnabled={notificationsEnabled}
           onToggleNotifications={handleToggleNotifications}
           onFactoryReset={handleFactoryReset}
           onCleanDuplicates={handleCleanDuplicates}
        />

        {activeTab === 'profile' ? (
          <UserProfile 
            onBack={() => setActiveTab('home')} 
            initialData={userProfile}
            onSave={handleUpdateProfile}
            onSignOut={handleSignOut}
            onScroll={handleScroll}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        ) : (
          <>
            <header className={`pt-10 pb-2 px-6 bg-[#FAF9F6]/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-col items-center sticky top-0 z-10 border-b border-transparent dark:border-slate-800 transition-all duration-300 ${!showNavbar ? '-translate-y-full opacity-0 pointer-events-none absolute' : ''}`}>
              <div className="w-full flex justify-start items-start absolute top-10 left-0 px-6 z-20">
                 <Button 
                    variant="icon" 
                    aria-label="Menu" 
                    onClick={handleMenuClick}
                    className={`bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-slate-900 dark:text-slate-100 ${
                      isMenuAnimating 
                        ? 'scale-110 -rotate-12 translate-y-1 bg-primary-50 border-primary-200 text-primary-500 shadow-lg' 
                        : ''
                    }`}
                 >
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={`transition-transform duration-300 ${isMenuAnimating ? 'rotate-90' : ''}`}
                    >
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="14" y2="15" />
                    </svg>
                 </Button>
              </div>

              <div className="mt-2 mb-2">
                <CassieMascot 
                  expression={activeTab === 'home' ? 'happy' : 'neutral'} 
                  size={80} 
                  className={`transition-all duration-500 ${activeTab === 'home' ? 'scale-105 drop-shadow-sm' : 'scale-100 opacity-80'}`}
                />
              </div>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-white text-center transition-colors">
                {activeTab === 'home' ? 'ask cassie anything' : activeTab === 'plan' ? 'your plan' : 'your daily stats'}
              </h1>
            </header>

            <main className="flex-1 overflow-hidden relative">
              {activeTab === 'home' && (
                <ChatHome 
                  messages={currentMessages} 
                  setMessages={handleSetMessages}
                  userProfile={userProfile}
                  userMemory={userMemory}
                  onUpdateMemory={handleUpdateMemory}
                  initialMessage={pendingMessage}
                  onClearInitialMessage={() => setPendingMessage(null)}
                  onScroll={handleScroll}
                  isNavbarVisible={showNavbar}
                  onLogMeal={handleLogFromChat}
                  onInputFocusChange={handleChatFocus}
                  onAiTypingChange={handleAiTypingChange}
                  activeTab={activeTab}
                  lastScannedFood={lastScannedFood}
                  favorites={userMemory.favorites}
                  onToggleFavorite={handleToggleFavorite}
                  dailyLog={dailyLog}
                  targets={effectiveTargets}
                  schedule={effectiveSchedule}
                />
              )}
              {activeTab === 'stats' && (
                 <div 
                   className="h-full overflow-y-auto no-scrollbar"
                   onScroll={handleScroll}
                 >
                    <DashboardView 
                       userProfile={userProfile} 
                       dailyLog={dailyLog}
                       targets={effectiveTargets} 
                       onAskCassie={handleAskCassie}
                       onAddLog={() => setIsLogSheetOpen(true)}
                       onStartCheckIn={handleStartCheckIn}
                       favorites={userMemory.favorites}
                       onToggleFavorite={handleToggleFavorite}
                    />
                 </div>
              )}
              {activeTab === 'plan' && (
                 <NutritionGoalsModal 
                   userProfile={userProfile} 
                   targets={effectiveTargets}
                   schedule={effectiveSchedule}
                   onEdit={() => setIsEditPlanOpen(true)}
                   onScroll={handleScroll}
                 />
              )}
            </main>
          </>
        )}

        {/* New Navigation Bar */}
        <NavBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isVisible={showNavbar} 
        />

      </div>
    </div>
  );
}
