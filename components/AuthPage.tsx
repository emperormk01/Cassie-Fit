
import React, { useState } from 'react';
import { ArrowRight, Sparkles, Star, User, AlertCircle, X, Shield, Lock, Eye, Server, FileText } from 'lucide-react';
import { CassieMascot } from './CassieMascot';
import { signup, login } from '../lib/api';

interface AuthPageProps {
  onLogin: (userData?: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = mode === 'signup'
        ? await signup(email, password, name || undefined)
        : await login(email, password);
      onLogin({ id: data.user.id, email: data.user.email, name: data.user.name });
    } catch (error: any) {
      console.error("Auth Error:", error);
      setErrorMsg(error.message || "An error occurred during login.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    // Proceed without an account
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

            {/* Account Tabs */}
            <div className="w-full flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {(['signup', 'signin'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setErrorMsg(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {m === 'signup' ? 'Create account' : 'Sign in'}
                </button>
              ))}
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={120}
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-300 outline-none focus:border-sky-400 transition-colors font-medium"
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-300 outline-none focus:border-sky-400 transition-colors font-medium"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Password (10+ characters)' : 'Password'}
                required
                minLength={mode === 'signup' ? 10 : 1}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder:text-slate-300 outline-none focus:border-sky-400 transition-colors font-medium"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 animate-pulse">
                     <div className="w-5 h-5 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />
                     <span>Please wait...</span>
                  </div>
                ) : (
                  <>
                    <span className="text-lg">{mode === 'signup' ? 'Create account' : 'Sign in'}</span>
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight size={20} className="text-sky-500" />
                    </div>
                  </>
                )}
              </button>
            </form>

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
                 text="Your password is stored as a salted PBKDF2 hash — we never see it. Sessions expire automatically after 30 days."
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
