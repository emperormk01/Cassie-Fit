
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Sparkles, MapPin, Settings, X, ChevronRight, Utensils, BookOpen, PenTool, HelpCircle, ExternalLink, Globe, Activity, Copy, Check, Mic, Search as SearchIcon, ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { ChatMessage, UserProfileData, RecommendationItem, UserMemory, MemoryUpdate, PlaceItem, UserTargets, ScheduleItem, DailyLogItem, SubstitutionItem } from '../types';
import { ChatNutritionCard } from './ChatNutritionCard';
import { ChatRecommendationList } from './ChatRecommendationList';
import { ChatPlaceCard } from './ChatPlaceCard';
import { ChatSubstitutionCard } from './ChatSubstitutionCard';
import { LiveVoiceSession } from './LiveVoiceSession';
import { runGroqChat, GroqMessage } from '../lib/groq';
import { searchDDG } from '../lib/duckduckgo';

interface ChatHomeProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  userProfile?: UserProfileData | null;
  userMemory?: UserMemory;
  onUpdateMemory?: (update: MemoryUpdate) => void;
  initialMessage?: string | null;
  onClearInitialMessage?: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isNavbarVisible?: boolean;
  onLogMeal?: (item: RecommendationItem) => void;
  onInputFocusChange?: (isFocused: boolean) => void;
  onAiTypingChange?: (isTyping: boolean) => void;
  // Session Context Props
  activeTab?: string;
  lastScannedFood?: string | null;
  favorites?: string[];
  onToggleFavorite?: (foodName: string) => void;
  // Dynamic App State
  dailyLog?: DailyLogItem[];
  targets?: UserTargets;
  schedule?: ScheduleItem[];
}

// Helper: Get Location Promisified with Timeout & Reverse Geocoding
const getLocation = (): Promise<{lat: number, lng: number, label: string} | null> => {
  return new Promise((resolve) => {
     if (!("geolocation" in navigator)) { resolve(null); return; }
     
     navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
           // Use a timeout for the fetch to avoid hanging
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 3000);
           
           const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
              signal: controller.signal
           });
           clearTimeout(timeoutId);
           
           const data = await response.json();
           const address = data.address || {};
           const city = address.city || address.town || address.village || address.suburb || address.county;
           const state = address.state;
           
           const parts = [city, state].filter(Boolean);
           const label = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
           
           resolve({ lat: latitude, lng: longitude, label });
        } catch (e) {
           // Fallback if reverse geocoding fails
           resolve({ lat: latitude, lng: longitude, label: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` });
        }
     }, (err) => {
        console.warn("Location error:", err);
        resolve(null);
     }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
  });
};

// Helper: Parse Markdown Bolding (**text**)
// Improved regex to handle multiline or nested chars better
const parseBoldText = (text: string) => {
  if (!text) return null;
  // Use a more inclusive regex for content between stars
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  return parts.map((part, index) => {
    // Odd indices are the captured bold text
    if (index % 2 === 1) {
      return <strong key={index} className="font-black text-slate-900 dark:text-white">{part}</strong>;
    }
    // Even indices are regular text
    return <span key={index}>{part}</span>;
  });
};

// Helper: Force clean text of unsupported characters
const cleanAiText = (text: string) => {
  if (!text) return "";
  return text
    .replace(/—/g, ' - ') // Em dash to spaced hyphen
    .replace(/–/g, '-')   // En dash to hyphen
    .replace(/‑/g, '-')   // Non-breaking hyphen to normal
    .trim();
};

// Helper component for Typewriter effect
const Typewriter = ({ 
  text, 
  onComplete, 
  onTypingActive 
}: { 
  text: string, 
  onComplete?: () => void,
  onTypingActive?: (active: boolean) => void
}) => {
  const [display, setDisplay] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Notify start of typing
    onTypingActive?.(true);

    let i = 0;
    const speed = 15; // Faster speed for longer text
    
    // Reset display when text changes significantly
    setDisplay('');
    setIsComplete(false);

    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplay(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        // Notify end of typing
        onTypingActive?.(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      clearInterval(timer);
      // Safety cleanup in case of unmount mid-typing
      onTypingActive?.(false);
    };
  }, [text, onComplete]); // Re-run if text changes

  return (
    <span>
      {parseBoldText(display)}
      {!isComplete && display.length < text.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-sky-400 animate-pulse rounded-full" />
      )}
    </span>
  );
};

// Helper to determine if we should animate a message (if it's recent enough)
const shouldAnimate = (timestamp: number, textLength: number) => {
  const now = Date.now();
  // Estimate typing duration: 15ms per char. 
  // Allow animation if the message was created within (duration + 2 seconds buffer)
  const typingDuration = textLength * 15; 
  return (now - timestamp) < (typingDuration + 2000);
};

// Expanded Suggestion Categories
const SUGGESTION_CATEGORIES = {
  'Meals': {
    icon: <Utensils size={14} />,
    items: [
      "Healthy breakfast ideas",
      "Suggest a low-carb lunch",
      "Quick dinner under 20 mins",
      "High protein snacks",
      "Vegan meal prep ideas",
      "Healthy options at Chipotle?"
    ]
  },
  'Swaps': {
    icon: <RefreshCw size={14} />,
    items: [
      "Substitute for potatoes?",
      "Low carb alternative to rice",
      "Healthy swap for oil in baking",
      "Replace pasta with veggies",
      "Dairy-free milk options",
      "Sugar substitute for coffee"
    ]
  },
  'Culture': {
    icon: <Globe size={14} />,
    items: [
      "Calories in Jollof Rice?",
      "Healthy Arepa fillings?",
      "Is Pho healthy?",
      "Lighter Chicken Curry recipe",
      "Fufu portion advice",
      "Healthy Middle Eastern mezze"
    ]
  },
  'Symptoms': {
    icon: <Activity size={14} />,
    items: [
      "I feel bloated",
      "Low energy today",
      "My skin is breaking out",
      "Feeling gassy",
      "My stomach hurts"
    ]
  },
  'Logging': {
    icon: <PenTool size={14} />,
    items: [
      "I just ate a slice of pizza",
      "Log a bowl of oatmeal",
      "Add a banana to my log",
      "I had a protein shake",
      "Log 2 eggs and toast"
    ]
  },
  'Learn': {
    icon: <BookOpen size={14} />,
    items: [
      "Why is protein important?",
      "Benefits of drinking water",
      "What are good fats?",
      "How much sugar is too much?",
      "Tips for better sleep"
    ]
  }
};

type CategoryKey = keyof typeof SUGGESTION_CATEGORIES;

// --- Helper to Generate Short-Term Context ---
const getSessionContext = (activeTab?: string, lastScannedFood?: string | null, locationName?: string | null) => {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth();
  const day = now.getDay();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  let timeOfDay = 'Morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
  else if (hour >= 21 || hour < 5) timeOfDay = 'Late Night';

  // Simulated Weather/Season Inference
  let simulatedWeather = "Mild and Clear";
  if ([11, 0, 1].includes(month)) simulatedWeather = "Cold / Winter Chill";
  else if ([5, 6, 7].includes(month)) simulatedWeather = "Hot / Summer Heat";
  if ([2, 3].includes(month)) simulatedWeather = "Cool and Breezy";

  const deviceType = /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop";

  return `
  CURRENT SESSION CONTEXT:
  - Exact Time: ${now.toLocaleTimeString()} 
  - Time of Day: ${timeOfDay}
  - Day: ${days[day]}
  - Weather: ${simulatedWeather}
  - Location: ${locationName || "Unknown"}
  `;
};

// --- Comprehensive Nutrition Knowledge Base (Expanded from Research) ---
const NUTRITION_KNOWLEDGE_BASE = `
[ADVANCED NUTRITIONAL INTELLIGENCE & DATASETS]

1. **BIOCHEMICAL TRUTH (FooDB/USDA/Foundation Foods):**
   - **Foundational Nutrition:** Focus on "Phytochemicals" (Flavonoids, Carotenoids) for cellular health/longevity, not just simple macros.
   - **Explanation Style:** Explain *why* a food is good. E.g., "Tomatoes provide Lycopene for vascular health and heart protection," not just "Tomatoes are healthy."
   - **UPF (Ultra-Processed Foods):** Acknowledge that users often feel better eliminating UPF than just counting calories. Prioritize whole, minimally processed ingredients.
   - **Nutrient Synergy:** Explain how combining Vitamin C (citrus) with Iron (spinach) boosts absorption.

2. **COMPUTATIONAL BIOLOGY & EXERCISE (MoTrPAC-Inspired):**
   - **Molecular Transducers:** Understand how physical activity affects the body at a molecular level (metabolomics/proteomics).
   - **Mechanism Explanations:**
     - **Glucose:** "Walking activates GLUT4 translocation in your muscles, pulling sugar from your blood without needing as much insulin."
     - **Mitochondria:** "Endurance training triggers PGC-1α, helping you grow more mitochondria (your energy factories)."
     - **Inflammation:** "Regular moderate activity lowers systemic cytokines like IL-6 over time."
   - **Predictive Language:** Use "If/Then" logic based on biological probabilities. "If you add 2000 steps, your glucose variability will likely decrease by X%."

3. **CLINICAL SAFETY & FOOD-DRUG INTERACTIONS (FDI - CRITICAL):**
   - **Statins:** WARNING: Avoid Grapefruit/Grapefruit juice (risk of toxicity/rhabdomyolysis).
   - **Warfarin (Blood Thinners):** WARNING: Maintain consistent Vitamin K intake (Leafy greens). Avoid sudden binges.
   - **Antibiotics:** WARNING: Dairy calcium can bind to the drug and reduce efficacy.
   - **MAOIs (Antidepressants):** WARNING: Avoid Tyramine-rich aged foods (aged cheese, cured meats, fermented soy).

4. **SMART SUBSTITUTION LOGIC (DIISH Heuristic):**
   - **Goal:** Improve diet quality without sacrificing culinary soul.
   - **Delta Calculation:** You MUST calculate the specific nutritional difference. E.g., "Cauliflower (5g carbs) vs Potato (17g carbs) = -12g Carbs per 100g".
   - **Functionality:** Match texture and cooking method (e.g., mashing, roasting).
   - **Examples:**
     - Lower Carb: Potato -> Turnip/Cauliflower mash.
     - Lower Fat: Oil -> Unsweetened Applesauce (baking).
     - Lower Sodium: Soy Sauce -> Coconut Aminos.

5. **INJURY PREVENTION & AGE AWARENESS (Safe-Movement Protocol):**
   - **Joint Safety First:** If User Age > 50 OR Mobility = "Joint Sensitivity" OR "Injury", NEVER suggest high-impact moves (Jumping Jacks, Burpees).
   - **Seated Options:** Always offer a "Seated" or "Low Impact" alternative if the user mentions pain, fatigue, or being sedentary.
   - **"Feel-Good" Validation:** If user says "I'm tired" or "I hurt", DO NOT push them. Validate their rest. Suggest maintenance calories instead of deficits.
   - **Key Substitutes:** 
     - Running -> Gentle Walking / Swimming
     - Squats -> Sit-to-Stands (Chair)
     - Weights -> Resistance Bands / Water Bottles

6. **PREVENTATIVE METRICS (AHA Life's Essential 8):**
   - **Metrics:** BMI < 25, Non-HDL Cholesterol focus, Blood Sugar (A1c) stability.
   - **Lifestyle Vital Signs:** Sleep consistency (7-9h) and Stress management are as nutritional as food.
`;

export const ChatHome: React.FC<ChatHomeProps> = ({ 
  messages, 
  setMessages, 
  userProfile, 
  userMemory,
  onUpdateMemory,
  initialMessage, 
  onClearInitialMessage,
  onScroll,
  isNavbarVisible = true,
  onLogMeal,
  onInputFocusChange,
  onAiTypingChange,
  activeTab,
  lastScannedFood,
  favorites = [],
  onToggleFavorite,
  dailyLog = [],
  targets,
  schedule
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking...');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('Meals');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number, label: string} | null>(null);
  
  const [isTypewriterActive, setIsTypewriterActive] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync AI activity state (Waiting for API OR Typing Text)
  useEffect(() => {
     const isActive = isLoading || isTypewriterActive || isVoiceActive;
     onAiTypingChange?.(isActive);
  }, [isLoading, isTypewriterActive, isVoiceActive]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isSuggestionsOpen, isTypewriterActive]);

  // Request Location on Mount (Initial Check)
  useEffect(() => {
    getLocation().then(loc => {
      if (loc) setUserLocation(loc);
    });
  }, []);

  // Handle Initial Message (Forwarded from other parts of app)
  useEffect(() => {
    if (initialMessage && !isLoading) {
       handleSendMessage(initialMessage);
       if (onClearInitialMessage) onClearInitialMessage();
    }
  }, [initialMessage]);

  // Determine the ID of the latest AI text message to show feedback controls only on that one
  const lastAiTextMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai' && messages[i].type === 'text') {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
      setActiveMessageId(null);
    }, 2000);
  };

  const handleRateMessage = (id: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, rating } : msg
    ));
    // In a real app, this is where you'd send the rating to your backend
    console.log(`User rated message ${id}: ${rating}`);
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim()) return;

    setIsSuggestionsOpen(false);
    setActiveMessageId(null);

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      type: 'text',
      text: textToSend.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    setLoadingText('Searching...'); // Initial state

    try {
      // 1. INTENT & LOCATION CHECK
      const lowerText = textToSend.toLowerCase();
      const locationTriggers = ['near', 'nearby', 'restaurant', 'food', 'store', 'shop', 'find', 'where', 'place', 'get'];
      const isLocationIntent = locationTriggers.some(t => lowerText.includes(t));
      
      // If we need location but don't have it, try fetching it NOW (User interaction context usually allows this)
      let currentLoc = userLocation;
      if (isLocationIntent && !currentLoc) {
         setLoadingText('Locating...');
         const freshLoc = await getLocation();
         if (freshLoc) {
            setUserLocation(freshLoc);
            currentLoc = freshLoc;
         }
      }

      // 2. Perform Search Grounding
      let searchContext = "";
      // Only search for queries longer than 3 chars to avoid spamming on simple "Hi"
      if (textToSend.length > 3) {
        try {
           // Enhanced Search Query with Location & Context Substitution
           let searchQuery = textToSend;
           
           // Replace 'this', 'it', 'that' with the last scanned food if available
           if (lastScannedFood && (lowerText.includes('this') || lowerText.includes('it') || lowerText.includes('that'))) {
               searchQuery = searchQuery.replace(/\b(this|it|that)\b/gi, lastScannedFood);
           }
           
           // Append Location if intent matches
           if (currentLoc && isLocationIntent) {
              if (!lowerText.includes(currentLoc.label.toLowerCase())) {
                 searchQuery = `${searchQuery} near ${currentLoc.label}`;
              }
           }

           // --- NEW: Add Profile Context to Search ---
           // Inject dietary preferences directly into search for better grounding results
           if (userProfile) {
              const diet = userProfile.eatingStyle;
              const allergies = userProfile.allergies?.filter(a => a !== 'None').join(' ');
              const conditions = userProfile.conditions?.filter(c => c !== 'None').join(' ');
              
              // Only append if likely relevant (food/restaurant search)
              const lowerQ = searchQuery.toLowerCase();
              if (
                  lowerQ.includes('recipe') || 
                  lowerQ.includes('eat') || 
                  lowerQ.includes('food') || 
                  lowerQ.includes('restaurant') || 
                  lowerQ.includes('place') ||
                  lowerQ.includes('order') ||
                  lowerQ.includes('make') ||
                  lowerQ.includes('cook')
              ) {
                  let contextTerms = "";
                  if (diet && !lowerQ.includes(diet.toLowerCase())) contextTerms += ` ${diet}`;
                  if (allergies) contextTerms += ` ${allergies} free`;
                  
                  if (contextTerms) {
                      searchQuery += contextTerms;
                      console.log("Enhanced Search Query:", searchQuery);
                  }
              }
           }
           // ------------------------------------------
           
           searchContext = await searchDDG(searchQuery);
        } catch (e) {
           console.warn("Search failed, continuing without grounding.");
        }
      }
      
      setLoadingText('Thinking...');

      // 3. Build Prompt Contexts

      // A. Profile Context (Fully Detailed)
      const userContext = userProfile ? `
      USER PROFILE (FROM ONBOARDING):
      - Name: ${userProfile.name}
      - Age: ${userProfile.age} | Gender: ${userProfile.gender}
      - Physical: ${userProfile.height}, ${userProfile.weight}
      - Activity Level: ${userProfile.activityLevel}
      - Dietary Preferences: ${userProfile.eatingStyle}
      - Goal: ${userProfile.goal}
      - Meal Frequency: ${userProfile.mealsPerDay}
      - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
      - Health Conditions: ${userProfile.conditions?.join(', ') || 'None'}
      - Mobility Needs: ${userProfile.mobilityNeeds?.join(', ') || 'Fully Mobile'} (CRITICAL: Respect joint/injury constraints)
      ` : "User Profile: Guest (No explicit data). Assume general healthy adult.";

      // B. Memory Context
      let memoryContext = "No prior long-term memory.";
      if (userMemory) {
        memoryContext = `LONG-TERM MEMORY: Favorites: ${userMemory.favorites?.join(', ') || 'None'}. Dislikes: ${userMemory.dislikes?.join(', ') || 'None'}.`;
      }

      // C. Daily Log & Targets Context (Dynamic)
      const currentCalories = dailyLog.reduce((sum, item) => sum + item.calories, 0);
      const currentProtein = dailyLog.reduce((sum, item) => sum + item.protein, 0);
      const currentCarbs = dailyLog.reduce((sum, item) => sum + item.carbs, 0);
      const currentFat = dailyLog.reduce((sum, item) => sum + item.fat, 0);

      const logContext = `
      CURRENT DAILY STATUS (TODAY):
      - Consumed: ${currentCalories} kcal (Target: ${targets?.calories || 2000})
      - Macros: P: ${currentProtein}g/${targets?.protein}g, C: ${currentCarbs}g/${targets?.carbs}g, F: ${currentFat}g/${targets?.fat}g
      - Remaining: ${Math.max(0, (targets?.calories || 2000) - currentCalories)} kcal
      - Plan Intensity Mode: ${targets?.planMode || 'standard'} (If 'gentle', suggest easy/comfort options)

      MEALS LOGGED TODAY:
      ${dailyLog.length > 0 ? dailyLog.map(l => `- [${new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}] ${l.mealType}: ${l.name} (${l.calories}kcal)`).join('\n') : "No meals logged yet today."}
      `;

      const scheduleContext = schedule ? `
      SUGGESTED SCHEDULE:
      ${schedule.map(s => `- ${s.time}: ${s.label}`).join('\n')}
      ` : "";

      const sessionContext = getSessionContext(activeTab, lastScannedFood, currentLoc?.label);
      
      // Location Context
      const locationContext = currentLoc 
         ? `USER EXACT LOCATION: ${currentLoc.label} (Lat: ${currentLoc.lat}, Lng: ${currentLoc.lng}). Use this to give specific, local recommendations.` 
         : "USER LOCATION: Unknown. If the user asks for local recommendations (restaurants, etc), politely ask for their city.";

      const systemInstruction = `You are Cassie, the most supportive, empathetic, and playful AI nutritionist cat in the world! 🐱
      Your goal is to make healthy living feel like a warm hug, not a chore. You are armed with advanced nutritional data and the user's full context.
      
      === PERSONALITY & TONE ===
      1. **Unconditionally Supportive:** If the user struggles, NEVER lecture. Validate them first. Be their biggest cheerleader.
      2. **Playful & Cat-Like:** Use puns naturally but don't overdo it. Be energetic!
      3. **Casual & Warm:** Talk like a knowledgeable best friend. Use "We" instead of "You".
      4. **Emoji:** Use ONLY 🐾 to sign off or pause. No other emojis.
      5. **STRICT FORMATTING:** Do NOT use em dashes (—). Use standard hyphens (-) or commas. Use **bold** for emphasis.
      
      === TIME AWARENESS (CRITICAL) ===
      ${sessionContext}
      - READ THE TIME ABOVE CAREFULLY.
      - If Morning (5AM - 11AM): Say "Good morning". Focus on breakfast and the day ahead. Do NOT say "wrap up the day" or talk about dinner unless asked.
      - If Afternoon (11AM - 5PM): Say "Good afternoon". Focus on lunch/snacks.
      - If Evening (5PM+): Say "Good evening". Focus on dinner or reflection.
      
      === CRITICAL RULES ===
      1. **NO REPEATED MEALS:** Scan chat history. Do not suggest same meals twice.
      2. **IMMEDIATE FOLLOW-THROUGH:** If agreed to suggest ideas, output them immediately in JSON.
      3. **CONTEXT IS KING:** Use daily status and profile to tailor advice.
      4. **ENGAGING & EDUCATIONAL:** Explain the *why*. Tell mini-stories about food.
      5. **USE YOUR KNOWLEDGE:** Use the Nutritional Intelligence data below.
      
      ${userContext}
      ${logContext}
      ${scheduleContext}
      ${memoryContext}
      ${locationContext}
      ${NUTRITION_KNOWLEDGE_BASE}
      
      ${searchContext ? `\n*** SEARCH ENGINE RESULTS ***\nUse this data to ensure your answer is FACTUALLY ACCURATE and LOCALIZED:\n${searchContext}\n******************************\n` : ''}
      
      CRITICAL INSTRUCTION: Output MUST be valid JSON only. 
      Do NOT include any conversational text outside the JSON object.
      
      Schema:
      {
        "message": "Your engaging, detailed, and warm response. Use paragraphs. Tell a mini-story about the food or health tip. Use **bold** for emphasis.",
        "hasNutritionData": boolean,
        "nutrition": { "foodName": string, "calories": number, "macros": { "protein": number, "carbs": number, "fat": number }, "recommendation": string, "combinations": string[] } (optional),
        "recommendations": [{ "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "reason": string }] (optional),
        "places": [{ "name": string, "type": string, "location": string, "rating": number, "price": "$|$$|$$$", "reason": string }] (optional),
        "substitutions": [{ "original": string, "substitute": string, "delta": string, "impact": "positive"|"neutral"|"negative", "reason": string }] (optional, use if user asks for substitutes or swaps),
        "memoryUpdate": { "category": "favorite"|"dislike"|"culture"|"skill"|"budget"|"pattern_sleep"|"pattern_stress"|"pattern_hydration", "value": string } (optional)
      }
      `;

      // Build Message History for Groq
      const history: GroqMessage[] = messages
        .filter(m => m.type === 'text') // Only send text messages to keep context clean
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text || ""
        }));
      
      // Add current message
      const currentHistory = [
        ...history, 
        { role: 'user' as const, content: textToSend }
      ];

      // Add System Prompt at start
      const fullMessages: GroqMessage[] = [
        { role: 'system', content: systemInstruction },
        ...currentHistory
      ];

      // Call Groq
      const responseText = await runGroqChat(fullMessages, true); // true = json mode

      if (responseText) {
          let data;
          try {
             // Robust JSON Parsing Strategy
             let cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
             const messageKeyIndex = cleanText.search(/"message"\s*:/);
             
             if (messageKeyIndex !== -1) {
                const startIdx = cleanText.lastIndexOf('{', messageKeyIndex);
                const endIdx = cleanText.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1) {
                    cleanText = cleanText.substring(startIdx, endIdx + 1);
                }
             } else {
                 const firstOpen = cleanText.indexOf('{');
                 const lastClose = cleanText.lastIndexOf('}');
                 if (firstOpen !== -1 && lastClose !== -1) {
                     cleanText = cleanText.substring(firstOpen, lastClose + 1);
                 }
             }

             data = JSON.parse(cleanText);
             
          } catch (e) {
             console.warn("JSON Parse failed, treating as raw text", e);
             data = { message: responseText.replace(/```json/g, '').replace(/```/g, '').trim() };
          }
          
          if (data.memoryUpdate && onUpdateMemory) {
             onUpdateMemory(data.memoryUpdate);
          }

          const aiResponse: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            type: 'text',
            // Force clean the text to remove em dashes before rendering
            text: cleanAiText(data.message || "I'm having trouble formatting my response, but I heard you!"),
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, aiResponse]);

          // UI Logic: Prevent duplicate card if the item is also in recommendations list
          // This avoids the "bug from the first additional information card"
          let showNutritionCard = data.hasNutritionData && data.nutrition;
          
          if (showNutritionCard && data.recommendations && data.recommendations.length > 0) {
             const mainItemName = data.nutrition.foodName.toLowerCase();
             const isDuplicate = data.recommendations.some((r: any) => r.name.toLowerCase() === mainItemName);
             if (isDuplicate) {
                console.log("Suppressed duplicate nutrition card for:", mainItemName);
                showNutritionCard = false;
             }
          }

          if (showNutritionCard) {
            const nutritionMsg: ChatMessage = {
               id: (Date.now() + 2).toString(),
               sender: 'ai',
               type: 'nutrition',
               data: data.nutrition,
               timestamp: Date.now()
            };
            setMessages(prev => [...prev, nutritionMsg]);
          }

          if (data.recommendations && data.recommendations.length > 0) {
             const recMsg: ChatMessage = {
                id: (Date.now() + 3).toString(),
                sender: 'ai',
                type: 'recommendations',
                recommendations: data.recommendations,
                timestamp: Date.now()
             };
             setMessages(prev => [...prev, recMsg]);
          }

          // Handle Places (Restaurants/Stores)
          if (data.places && data.places.length > 0) {
             const placeMsg: ChatMessage = {
                id: (Date.now() + 4).toString(),
                sender: 'ai',
                type: 'places',
                places: data.places,
                timestamp: Date.now()
             };
             setMessages(prev => [...prev, placeMsg]);
          }

          // Handle Substitutions
          if (data.substitutions && data.substitutions.length > 0) {
             const subMsg: ChatMessage = {
                id: (Date.now() + 5).toString(),
                sender: 'ai',
                type: 'substitutions',
                substitutions: data.substitutions,
                timestamp: Date.now()
             };
             setMessages(prev => [...prev, subMsg]);
          }
      }

    } catch (error: any) {
      console.error("Chat Error:", error);
      const errorText = error.message || "Unknown error";
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'ai',
        type: 'text',
        text: `I'm having trouble connecting (Error: ${errorText}). Please check your API key or connection.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7] dark:bg-slate-950 relative font-sans transition-colors">
      
      {/* Voice Session Overlay */}
      {isVoiceActive && (
        <LiveVoiceSession 
          onClose={() => setIsVoiceActive(false)} 
          userProfile={userProfile} 
          userMemory={userMemory}
        />
      )}

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-48 no-scrollbar"
        onScroll={onScroll}
      >
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
               <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'flex-row items-end gap-3'}`}>
                  
                  {msg.sender === 'ai' && (
                    <div className="flex-shrink-0 mb-1">
                      <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700 animate-in zoom-in-50 duration-500 hover:scale-110 transition-transform cursor-pointer">
                        <CassieMascot size={20} expression="happy" />
                      </div>
                    </div>
                  )}

                  {msg.type === 'text' && (
                     <div className="flex flex-col">
                       <div 
                         onClick={() => msg.sender === 'ai' && setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                         className={`px-6 py-3.5 text-[15px] leading-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] animate-in slide-in-from-bottom-2 fade-in duration-500 relative group transition-all ${
                           msg.sender === 'user' 
                             ? 'bg-[#FFE8D6] text-slate-800 border border-[#FFDBC2] rounded-[1.5rem] rounded-br-sm' 
                             : `bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-[1.5rem] rounded-bl-sm border border-stone-50 dark:border-slate-700 cursor-pointer ${activeMessageId === msg.id ? 'ring-2 ring-sky-100 dark:ring-sky-900' : ''}`
                         }`}
                       >
                         {msg.sender === 'ai' && shouldAnimate(msg.timestamp, msg.text?.length || 0) ? (
                            <Typewriter 
                               text={msg.text || ''} 
                               onTypingActive={setIsTypewriterActive}
                            />
                         ) : (
                            parseBoldText(msg.text || '')
                         )}

                         {msg.sender === 'ai' && activeMessageId === msg.id && (
                            <div className="absolute -bottom-4 left-0 right-0 flex justify-center translate-y-full z-20">
                               <button
                                 onClick={(e) => handleCopy(msg.text || '', msg.id, e)}
                                 className="bg-slate-800 text-white dark:bg-white dark:text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-top-2 fade-in duration-200"
                               >
                                  {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                                  {copiedId === msg.id ? 'Copied!' : 'Copy'}
                               </button>
                            </div>
                         )}
                       </div>
                       
                       {/* Feedback Buttons: Only show for the most recent AI text message */}
                       {msg.sender === 'ai' && msg.id === lastAiTextMessageId && (
                          <div className="flex items-center gap-2 mt-1.5 ml-2 animate-in fade-in duration-300">
                             <button 
                               onClick={() => handleRateMessage(msg.id, 'up')}
                               className={`p-1 rounded-full transition-colors ${msg.rating === 'up' ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-300 hover:text-green-500'}`}
                             >
                                <ThumbsUp size={12} fill={msg.rating === 'up' ? "currentColor" : "none"} />
                             </button>
                             <button 
                               onClick={() => handleRateMessage(msg.id, 'down')}
                               className={`p-1 rounded-full transition-colors ${msg.rating === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-slate-300 hover:text-red-500'}`}
                             >
                                <ThumbsDown size={12} fill={msg.rating === 'down' ? "currentColor" : "none"} />
                             </button>
                          </div>
                       )}
                     </div>
                  )}
                  
                  {msg.type === 'nutrition' && msg.data && (
                    <ChatNutritionCard 
                       data={msg.data}
                       isFavorite={favorites.includes(msg.data.foodName)}
                       onToggleFavorite={() => onToggleFavorite?.(msg.data?.foodName || '')}
                       onLog={() => onLogMeal?.({
                          name: msg.data?.foodName || '',
                          calories: msg.data?.calories || 0,
                          protein: msg.data?.macros.protein || 0,
                          carbs: msg.data?.macros.carbs || 0,
                          fat: msg.data?.macros.fat || 0,
                          reason: 'Logged from Chat'
                       })}
                    />
                  )}

                  {msg.type === 'recommendations' && msg.recommendations && onLogMeal && (
                     <ChatRecommendationList 
                       items={msg.recommendations} 
                       onLog={onLogMeal} 
                       favorites={favorites}
                       onToggleFavorite={onToggleFavorite}
                     />
                  )}

                  {msg.type === 'places' && msg.places && (
                     <div className="flex flex-col gap-2 w-full max-w-sm">
                        {msg.places.map((place, idx) => (
                           <ChatPlaceCard key={idx} place={place} />
                        ))}
                     </div>
                  )}

                  {msg.type === 'substitutions' && msg.substitutions && (
                     <ChatSubstitutionCard items={msg.substitutions} />
                  )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start w-full pl-11 animate-in fade-in duration-300">
             <div className="flex items-center gap-2.5 bg-white/50 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
                {loadingText.includes('Locating') ? (
                   <MapPin className="animate-bounce text-red-400" size={16} />
                ) : loadingText.includes('Searching') ? (
                   <SearchIcon className="animate-pulse text-sky-400" size={16} />
                ) : (
                   <Settings className="animate-spin text-slate-400" size={16} />
                )}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{loadingText}</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`absolute left-0 right-0 p-4 z-20 pointer-events-none transition-all duration-500 ease-in-out ${isNavbarVisible ? 'bottom-[116px]' : 'bottom-4'}`}>
        
        {isSuggestionsOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-slate-700 p-4 rounded-[2rem] shadow-xl pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 flex flex-col gap-4 max-h-[360px] overflow-hidden">
            <div className="flex justify-between items-center px-1">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Sparkles size={14} /> Suggestions
               </span>
               <button onClick={() => setIsSuggestionsOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X size={16} />
               </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {(Object.keys(SUGGESTION_CATEGORIES) as CategoryKey[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeCategory === cat 
                      ? 'bg-orange-400 text-white shadow-md shadow-orange-200' 
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {SUGGESTION_CATEGORIES[cat].icon}
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
               {SUGGESTION_CATEGORIES[activeCategory].items.map((text, idx) => (
                 <button 
                   key={idx}
                   onClick={() => handleSendMessage(text)}
                   className="text-left px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-slate-700 hover:text-orange-600 dark:hover:text-orange-400 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors w-full flex justify-between items-center group"
                 >
                    <span>{text}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-400" />
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-slate-800 flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}
            className={`pl-4 pr-2 transition-transform active:scale-95 ${isSuggestionsOpen ? 'rotate-12 scale-110' : ''}`}
            aria-label="Toggle suggestions"
          >
             <Sparkles className="text-orange-300 hover:text-orange-400 transition-colors" size={20} />
          </button>
          
          {userLocation && (
             <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700 whitespace-nowrap">
                <MapPin size={10} /> {userLocation.label}
             </div>
          )}
          
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a meal or ask for restaurants..."
            className="flex-1 bg-transparent py-3 px-2 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            onFocus={() => onInputFocusChange?.(true)}
            onBlur={() => onInputFocusChange?.(false)}
          />

          {inputValue.trim() ? (
            <button 
              onClick={() => handleSendMessage()}
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white p-3 rounded-full transition-colors shadow-md shadow-slate-200 dark:shadow-none"
            >
              <Send size={20} className={isLoading ? 'opacity-0' : 'opacity-100'} />
              {isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 </div>
              )}
            </button>
          ) : (
            <button 
              onClick={() => setIsVoiceActive(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full transition-colors shadow-md shadow-slate-200 dark:shadow-none animate-in zoom-in duration-300"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
