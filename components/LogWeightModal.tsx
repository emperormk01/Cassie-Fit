import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from './Button';

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({ isOpen, onClose }) => {
  const [weight, setWeight] = useState('135.0');

  if (!isOpen) return null;

  return (
    <>
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50">
             <X size={24} />
          </button>
          <span className="font-bold text-slate-800">Log Weight</span>
          <button onClick={onClose} className="p-2 -mr-2 text-sky-500 font-bold hover:text-sky-600">
             Save
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
           <h3 className="text-slate-400 font-semibold mb-2">Today, Jan 19</h3>
           
           <div className="flex items-baseline gap-2 mb-10">
              <input 
                 type="number"
                 value={weight}
                 onChange={(e) => setWeight(e.target.value)}
                 className="text-6xl font-black text-slate-800 text-center w-48 bg-transparent focus:outline-none placeholder:text-slate-200"
                 autoFocus
              />
              <span className="text-2xl font-bold text-slate-400">lbs</span>
           </div>

           {/* Visual Scale Ruler */}
           <div className="w-full h-16 relative overflow-hidden mb-10 mask-linear-fade">
              <div className="absolute inset-0 flex items-end justify-center gap-4 opacity-50">
                 {[...Array(21)].map((_, i) => {
                    const isCenter = i === 10;
                    return (
                    <div key={i} className={`w-0.5 rounded-full ${isCenter ? 'h-10 bg-sky-500' : 'h-6 bg-slate-300'}`} />
                 )})}
              </div>
           </div>

           <Button variant="primary" fullWidth onClick={onClose}>
              <Check size={20} className="mr-2" />
              Update Entry
           </Button>
        </div>
      </div>
    </>
  );
};