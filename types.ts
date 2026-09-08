
import React from 'react';

export interface NutritionData {
  label: string;
  value: number;
  total: number;
  unit: string;
  color: 'sky' | 'tangerine' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  icon: React.ReactNode;
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

export interface DailyGoalProps {
  percentage: number;
  calories: number;
  target: number;
}

// Google Maps / Search Grounding Types
export interface GroundingMetadata {
  groundingChunks: {
    web?: { uri: string; title: string };
    maps?: {
        sourceConfig: {
            placeId: string;
        };
        placeAnswerSources?: {
            reviewSnippets?: {
                content: string;
                source: { uri: string; title: string };
            }[];
        };
        title: string;
        uri: string;
    };
  }[];
}

export interface RecommendationItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  reason: string;
}

export interface SubstitutionItem {
  original: string;
  substitute: string;
  delta: string;
  impact: 'positive' | 'neutral' | 'negative';
  reason: string;
}

export interface PlaceItem {
  name: string;
  type: string; // e.g. "Ethiopian Restaurant"
  location: string; // e.g. "Downtown" or address
  rating?: number; // 1-5
  price?: string; // $ - $$$$
  reason: string; // Why Cassie picked it
}

export interface BioHealthScore {
  totalScore: number;       // 0-100
  biologicalLoad: number;   // 0-100 (Age, Conditions - Non-controllable)
  habitVelocity: number;    // 0-100 (Consistency, Diet, Sleep - Controllable)
  resilienceIndex: string;  // "High", "Moderate", "Developing"
  insight: string;
}

export interface MetabolicPathway {
  id: string;
  name: string;
  description: string; // e.g., "Mitochondrial Biogenesis"
  activationLevel: number; // 0-100
  relevance: 'High' | 'Medium' | 'Low';
}

export interface UserMemory {
  favorites: string[];
  dislikes: string[];
  culturalBackground: string[];
  cookingSkill: 'Beginner' | 'Intermediate' | 'Advanced' | 'Unknown';
  budget: 'Low' | 'Medium' | 'High' | 'Unknown';
  patterns: {
    sleep: string | null;
    stress: string | null;
    hydration: string | null;
  };
  recentSummaries: string[]; // New field for compressed history
  lastUpdated: number;
}

export interface MemoryUpdate {
  category: 'favorite' | 'dislike' | 'culture' | 'skill' | 'budget' | 'pattern_sleep' | 'pattern_stress' | 'pattern_hydration' | 'recent_summary';
  value: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  type: 'text' | 'nutrition' | 'plan' | 'recommendations' | 'places' | 'substitutions'; 
  text?: string;
  data?: NutritionResponse;
  recommendations?: RecommendationItem[];
  substitutions?: SubstitutionItem[];
  places?: PlaceItem[]; // New field for Restaurant/Store cards
  planData?: DailyPlanData;
  groundingData?: GroundingMetadata; 
  rating?: 'up' | 'down'; 
  timestamp: number;
}

export interface DailyPlanData {
  title: string;
  focus: string;
  schedule: { time: string; activity: string; icon: string }[];
  reminders: string[];
}

export interface NutritionResponse {
  foodName: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  recommendation: string;
  combinations: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

export interface UserProfileData {
  name: string;
  goal: string;
  age: string;
  gender: string;
  activityLevel: string;
  eatingStyle: string;
  height: string;
  weight: string;
  mealsPerDay: string;
  allergies: string[];
  conditions: string[];
  mobilityNeeds: string[]; // New field for Joint/Injury awareness
  avatarUrl?: string; 
  isPremium?: boolean;
  // Payment Fields
  planType?: 'starter' | 'pro' | 'agency';
  subscriptionStatus?: 'active' | 'inactive';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  progress: number; // 0 to 100
  color: string;
  bg: string;
}

export interface DailyLogItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string | null;
  timestamp: number;
  mealType: string;
}

export interface UserTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  planMode: 'standard' | 'gentle'; // New field for "Feel Good" mode
}

export interface ScheduleItem {
  time: string;
  label: string;
}

declare global {
  interface Window {
    LemonSqueezy: {
      Setup: (options: { eventHandler: (event: any) => void }) => void;
      Url: {
        Open: (url: string) => void;
      };
    };
    createLemonSqueezy: () => void;
  }
}
