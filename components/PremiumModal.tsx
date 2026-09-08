
import React, { useState } from 'react';
import { X, Check, Star, Zap, Image as ImageIcon, Mic, Crown, Loader2, ArrowRight } from 'lucide-react';
import { CassieMascot } from './CassieMascot';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  userEmail?: string;
  userId?: string;
}

// Sandbox Link provided in requirements
const FLUTTERWAVE_LINK = "https://sandbox.flutterwave.com/pay/eyizxx9tcxjg";

export const PremiumModal: React.FC<PremiumModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpgrade,
  userEmail
}) => {
  const [loadingPay, setLoadingPay] = useState(false);

  const handleCheckout = () => {
    setLoadingPay(true);

    if (!userEmail) {
        alert("Please sign in to upgrade.");
        setLoadingPay(false);
        return;
    }

    // 1. Generate Transaction Reference
    const tx_ref = `sl_pro_${Date.now()}`;

    // 2. Construct URL with Metadata for the Webhook to track
    // We pass meta[plan_type] so our webhook knows what column to update
    const params = new URLSearchParams({
        customer_email: userEmail,
        tx_ref: tx_ref,
        'meta[plan_type]': 'pro', 
        'meta[user_id]': '', // Optional: if you needed user ID in meta, but email usually suffices for profile lookup
    });

    const checkoutUrl = `${FLUTTERWAVE_LINK}?${params.toString()}`;

    // 3. Redirect User
    window.location.href = checkoutUrl;
  };

  if (!isOpen) return null;

  const features = [
    { icon: <ImageIcon size={18} />, text: "Unlimited Photo Food Scanning" },
    { icon: <Mic size={18} />, text: "Live Voice Chat with Cassie" },
    { icon: <Zap size={18} />, text: "Smarter AI Model (Gemini Pro)" },
    { icon: <Star size={18} />, text: "Extended Long-Term Memory" },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[420px] bg-[#FDFBF7] dark:bg-slate-900 sm:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden z-[110] animate-in slide-in-from-bottom duration-500 shadow-2xl border border-white/20">
        
        {/* Lavender Gradient Hero */}
        <div className="relative h-56 bg-gradient-to-br from-purple-400 via-violet-400 to-indigo-400 p-6 flex flex-col items-center justify-center text-white overflow-hidden">
           {/* Soft Abstract Shapes */}
           <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-white/10 rounded-full blur-3xl" />
           <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-indigo-900/10 rounded-full blur-3xl" />
           
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2.5 bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-md transition-colors text-white/90 hover:text-white"
           >
             <X size={20} />
           </button>

           <div className="relative z-10 flex flex-col items-center">
             <div className="relative mb-4">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse" />
                <div className="relative animate-[bounce_3s_infinite]">
                  <CassieMascot expression="happy" size={90} />
                  <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-300 to-yellow-500 text-slate-900 p-2 rounded-full shadow-lg border-2 border-white/80">
                      <Crown size={18} fill="currentColor" />
                  </div>
                </div>
             </div>
             
             <h2 className="text-3xl font-black tracking-tight text-center drop-shadow-sm">Cassie Plus</h2>
             <p className="text-purple-100 font-medium text-sm mt-1">Unlock the full experience</p>
           </div>
        </div>

        {/* Content */}
        <div className="p-8">
           <div className="space-y-4 mb-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4 group">
                   <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-300">
                      {f.icon}
                   </div>
                   <span className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-purple-600 transition-colors">
                      {f.text}
                   </span>
                </div>
              ))}
           </div>

           <div className="space-y-3">
              <button 
                onClick={handleCheckout}
                disabled={loadingPay}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-[2rem] font-bold text-lg shadow-xl shadow-slate-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden"
              >
                {loadingPay ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Upgrade Now - $4.99</span>
                    <ArrowRight size={18} className="relative z-10 opacity-80" />
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-1">
                 <div className="w-2 h-2 rounded-full bg-orange-500" />
                 <p className="text-center text-[11px] text-slate-400 font-medium">
                    Secured by Flutterwave
                 </p>
              </div>
           </div>
        </div>
      </div>
    </>
  );
};
