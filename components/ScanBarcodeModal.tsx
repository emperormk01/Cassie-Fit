import React, { useEffect, useState } from 'react';
import { X, Zap, Image as ImageIcon } from 'lucide-react';

interface ScanBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScanBarcodeModal: React.FC<ScanBarcodeModalProps> = ({ isOpen, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="px-6 py-6 flex justify-between items-center z-10">
        <button 
          onClick={onClose}
          className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full">
            <span className="text-white font-semibold text-sm">Scan Barcode</span>
        </div>
        <button className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/60 transition-colors">
          <Zap size={24} />
        </button>
      </div>

      {/* Camera Viewport Simulation */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* Background visual (Simulated Camera Feed) */}
        <div className="absolute inset-0 bg-slate-800 opacity-50" />
        
        {/* Scanning Frame */}
        <div className="relative w-72 h-48 border-2 border-white/80 rounded-3xl overflow-hidden z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
           {/* Corner Markers */}
           <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-xl" />
           <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-xl" />
           <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-xl" />
           <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-xl" />

           {/* Animated Scanning Line */}
           <div className={`absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] ${isScanning ? 'animate-[scan_2s_ease-in-out_infinite]' : ''}`} />
        </div>

        <p className="mt-8 text-white/80 font-medium text-sm text-center px-10 z-10">
          Position the barcode within the frame to scan automatically.
        </p>
      </div>

      {/* Bottom Actions */}
      <div className="p-8 pb-12 flex justify-center items-center gap-8 bg-black">
         <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ImageIcon size={24} />
            <span className="text-xs">Gallery</span>
         </button>
         
         {/* Simulated Shutter/Manual Scan */}
         <button className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-white rounded-full" />
         </button>

         <div className="w-10" /> {/* Spacer for balance */}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};