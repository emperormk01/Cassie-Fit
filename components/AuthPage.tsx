
import React, { useState } from 'react';
import { ArrowRight, Sparkles, Star, User, AlertCircle, X, Shield, Lock, Eye, Server, FileText } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  onLogin: (userData?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirect back to the current URL after login
          redirectTo: window.location.origin,
          // Removed sensitive calendar scope to prevent 403 errors during testing
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Supabase Auth Error:", error);
      setIsLoading(false);
      
      // Handle specific Supabase configuration errors
      const msg = error.message || JSON.stringify(error);

      if (msg.includes('provider is not enabled')) {
        setErrorMsg("Google Login is disabled. Enable it in Supabase > Authentication > Providers.");
      } else if (msg.includes('missing OAuth secret')) {
        setErrorMsg("Config Error: Missing Google Client Secret. Please add it in Supabase > Authentication > Providers > Google.");
      } else if (msg.includes('validation_failed')) {
         setErrorMsg("Validation Failed: Check your Supabase Provider settings (Client ID/Secret).");
      } else {
        setErrorMsg(msg || "An error occurred during login.");
      }
    }
  };

  const handleGuestLogin = () => {
    // Proceed without Google Data
    onLogin({ isGuest: true });
  };

  const PrivacyItem = ({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) => (
    <div className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-purple-50 dark:border-slate-700 shadow-sm">
      <div className="shrink-0 w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {text}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#FDFBF7] dark:bg-slate-950 font-sans selection:bg-sky-200 selection:text-sky-900">
      
      {/* --- Animated Background Elements --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top Right Orb */}
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-sky-400/30 to-purple-400/30 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
        
        {/* Bottom Left Orb */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-rose-400/20 to-orange-300/20 blur-3xl animate-[float_15s_ease-in-out_infinite_reverse]" />
        
        {/* Center Accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-white/5 dark:border-white/5 animate-[spin_60s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-sky-500/5 dark:border-sky-500/10 animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      {/* --- Main Glass Card --- */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 rounded-[3rem] p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-none animate-in slide-in-from-bottom-8 fade-in duration-1000 relative overflow-hidden group">
          
          {/* Shimmer Effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />

          {/* Header Content */}
          <div className="flex flex-col items-center text-center space-y-6 relative">
            
            {/* Mascot Container */}
            <div className="relative">
              <div className="absolute inset-0 bg-sky-200/50 dark:bg-sky-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
              <div className="relative z-10 transform transition-transform duration-500 hover:scale-110 hover:-rotate-3">
                <CassieMascot expression="happy" size={140} />
                
                {/* Floating Elements around mascot */}
                <div className="absolute -top-2 -right-4 animate-bounce delay-700">
                   <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-yellow-500">
                      <Sparkles size={20} fill="currentColor" />
                   </div>
                </div>
                <div className="absolute bottom-2 -left-4 animate-bounce delay-1000">
                   <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-rose-500">
                      <Star size={16} fill="currentColor" />
                   </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                Hey, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Cassie</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-lg leading-relaxed">
                Your personal AI nutritionist.<br/>
                Let's make healthy eating fun.
              </p>
            </div>

            {/* Error Message Widget */}
            {errorMsg && (
              <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-3 rounded-xl flex items-start gap-2 text-left animate-in slide-in-from-top-2">
                 <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                 <p className="text-xs text-red-600 dark:text-red-300 font-semibold">{errorMsg}</p>
              </div>
            )}

            {/* Divider */}
            <div className="w-full flex items-center gap-4 opacity-50">
               <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Get Started</span>
               <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
            </div>

            {/* Google Button */}
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full relative group bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 animate-pulse">
                   <div className="w-5 h-5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                   <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <div className="w-6 h-6 shrink-0">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="text-lg">Continue with Google</span>
                  <div className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight size={20} className="text-sky-500" />
                  </div>
                </>
              )}
            </button>

            {/* Guest Login Fallback */}
            <button
              onClick={handleGuestLogin}
              className="text-sm font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2 px-4 py-2"
            >
               <User size={14} />
               Continue as Guest
            </button>

            {/* Footer Text */}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[250px] leading-tight">
               By continuing, you agree to our 
               <button 
                onClick={() => setShowPrivacy(true)} 
                className="underline hover:text-purple-500 mx-1 font-bold transition-colors"
               >
                 Terms of Service
               </button> 
               and 
               <button 
                onClick={() => setShowPrivacy(true)} 
                className="underline hover:text-purple-500 mx-1 font-bold transition-colors"
               >
                 Privacy Policy
               </button>.
            </p>

          </div>
        </div>
        
        {/* Version Badge */}
        <div className="text-center mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-white/20 text-[10px] font-bold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              v1.2 Beta
           </span>
        </div>
      </div>

      {/* --- Privacy Policy Modal --- */}
      {showPrivacy && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] animate-in fade-in duration-300"
            onClick={() => setShowPrivacy(false)}
          />
          <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[450px] bg-[#FDFBF7] dark:bg-slate-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden z-[110] animate-in slide-in-from-bottom duration-500 shadow-2xl">
            
            {/* Modal Header */}
            <div className="relative bg-white dark:bg-slate-900 px-6 py-5 border-b border-purple-50 dark:border-slate-800 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                 <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-500">
                    <Shield size={20} fill="currentColor" className="opacity-50" />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">Privacy & Terms</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Last Updated: Oct 2025</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowPrivacy(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 text-sm mb-2">
                <p className="font-medium text-blue-800 dark:text-blue-200 leading-relaxed text-xs">
                  <strong>TL;DR:</strong> Your health data lives on your device. We don't sell it. AI processing happens securely and is discarded after generating your response.
                </p>
              </div>

              <PrivacyItem 
                icon={<Server size={18} />}
                title="Local-First Data"
                text="Your daily logs, weight history, and profile details are stored locally in your browser. We do not maintain a central database of your personal health records."
              />

              <PrivacyItem 
                icon={<Sparkles size={18} />}
                title="AI & Cloud Processing"
                text="When you chat with Cassie, the text and necessary context are sent to Google's Gemini API to generate the response. This data is not used to train public AI models."
              />

              <PrivacyItem 
                icon={<Eye size={18} />}
                title="Zero Ad Tracking"
                text="We do not sell your data to advertisers. There are no hidden trackers sharing your eating habits with third-party marketing networks."
              />

              <PrivacyItem 
                icon={<Lock size={18} />}
                title="Secure Authentication"
                text="We use Supabase (Google OAuth) for secure login. We only store your email to identify your premium status. We never see your password."
              />

               <PrivacyItem 
                icon={<FileText size={18} />}
                title="Terms of Service"
                text="By using Cassie, you agree that this is a wellness tool, not a medical device. Always consult a doctor for medical advice. We are not liable for health decisions made based on AI suggestions."
              />

              <button 
                onClick={() => setShowPrivacy(false)}
                className="w-full mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-bold text-sm shadow-lg shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                I Understand
              </button>
            </div>
            
            {/* Gradient Fade at bottom of scroll area */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FDFBF7] dark:from-slate-900 to-transparent pointer-events-none" />

          </div>
        </>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
