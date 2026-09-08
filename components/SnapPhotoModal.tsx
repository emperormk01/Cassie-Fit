
import React, { useEffect, useRef, useState } from 'react';
import { X, Zap, ZapOff, Check, HelpCircle, Image as ImageIcon, Utensils, ScanLine, Tag, Lightbulb, Sun, Focus, Globe, Calculator, Users, Minus, Plus, ChefHat } from 'lucide-react';
import { Button } from './Button';
import { CassieMascot } from './CassieMascot';
import { runGroqChat, GroqMessage } from '../lib/groq';
import { searchDDG } from '../lib/duckduckgo';

interface SnapPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string, calories: number, protein: number, carbs: number, fat: number, image?: string | null }) => void;
}

interface FoodAnalysis {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

type ScanMode = 'food' | 'barcode' | 'label';
type AnalysisStep = 'idle' | 'identifying' | 'searching' | 'calculating' | 'done';

export const SnapPhotoModal: React.FC<SnapPhotoModalProps> = ({ isOpen, onClose, onSave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [supportsFlash, setSupportsFlash] = useState(false);
  
  // Analysis State
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [totalServings, setTotalServings] = useState(1);
  
  // UI States
  const [scanMode, setScanMode] = useState<ScanMode>('food');
  const [showHelp, setShowHelp] = useState(false);

  // Start Camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, capturedImage]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      
      const track = mediaStream.getVideoTracks()[0];
      videoTrackRef.current = track;

      // Check for flashlight capability
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        setSupportsFlash(true);
      } else {
        setSupportsFlash(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      if (isFlashOn && videoTrackRef.current) {
        const track = videoTrackRef.current as any;
        track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
      }

      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      videoTrackRef.current = null;
      setIsFlashOn(false);
    }
  };

  const toggleFlash = async () => {
    if (!videoTrackRef.current || !supportsFlash) return;

    try {
      const track = videoTrackRef.current;
      const newFlashState = !isFlashOn;
      await track.applyConstraints({
        advanced: [{ torch: newFlashState }]
      } as any);
      setIsFlashOn(newFlashState);
    } catch (err) {
      console.error("Error toggling flash:", err);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Resize to moderate dimensions for speed (Max 800px is sweet spot for Llama Vision)
      const MAX_SIZE = 800;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, width, height);
        // Use 0.7 quality to keep payload light for API
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setCapturedImage(imageDataUrl);
        stopCamera();
        // DIRECTLY ANALYZE - No Preview Step
        analyzeFood(imageDataUrl);
      }
    }
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
            if (canvasRef.current) {
                const MAX_SIZE = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }
                
                canvasRef.current.width = width;
                canvasRef.current.height = height;
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const resizedData = canvasRef.current.toDataURL('image/jpeg', 0.7);
                    setCapturedImage(resizedData);
                    stopCamera();
                    // DIRECTLY ANALYZE
                    analyzeFood(resizedData);
                }
            }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
    setScanMode('food');
    setAnalysisStep('idle');
    setTotalServings(1);
    setIsBatchMode(false);
    startCamera();
  };

  const analyzeFood = async (base64Image: string) => {
    setAnalysisStep('identifying');
    setError(null);
    setTotalServings(1);
    setIsBatchMode(false);

    try {
      // --- STEP 1: SMART IDENTIFICATION (Agentic Vision) ---
      // We explicitly instruct Llama to act as a "Search Query Generator" first.
      const identificationPrompt = `
        Analyze this food image for a nutrition tracking app.
        
        GOAL: Identify the food specifically to find official nutrition data.
        
        1. SCAN FOR TEXT: Look for brand names, labels, or menu text in the image.
        2. IDENTIFY: Name the dish, product, or ingredients.
        3. QUERY: Generate a precise search query.
        
        - If Branded/Packaged: Use "Brand Name + Product Name + nutrition" (e.g. "Trader Joe's Butter Chicken nutrition")
        - If Restaurant: Use "Restaurant Name + Dish Name + calories" (e.g. "Chipotle Chicken Bowl calories")
        - If Homemade/Generic: Use "Dish Name + ingredients + nutrition" (e.g. "Homemade Lasagna beef nutrition")
        
        Respond with ONLY the search query text. Do not add quotes.
      `;

      const idMessages: GroqMessage[] = [
        {
          role: 'user',
          content: [
            { type: 'text', text: identificationPrompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ];

      const searchQuery = await runGroqChat(idMessages, false); // False = text mode
      
      if (!searchQuery) throw new Error("Could not identify food.");
      console.log("Visual ID Query:", searchQuery);

      // --- STEP 2: SEARCH GROUNDING ---
      setAnalysisStep('searching');
      // We trim and ensure the query is clean
      const cleanQuery = searchQuery.trim().replace(/^"|"$/g, '');
      const searchResults = await searchDDG(cleanQuery);
      console.log("Search Results:", searchResults ? "Found data" : "No specific data");

      // --- STEP 3: FINAL SYNTHESIS & PORTION SCALING ---
      setAnalysisStep('calculating');
      
      const finalPrompt = `
        You are an expert nutritionist.
        
        DATA SOURCES:
        1. IMAGE: Use this to determine TOTAL VOLUME/QUANTITY shown in the image.
        2. SEARCH CONTEXT: "${cleanQuery}"
        3. NUTRITION DATA: 
        ${searchResults || "No specific data found. Use standard nutritional estimates."}
        
        TASK:
        Calculate the nutrition for the **ENTIRE visible quantity** of food in the image.
        If the image shows a large pot or tray (batch cooking), calculate for the WHOLE container.
        
        LOGIC:
        - Use the SEARCH DATA for nutrient density (Calories per 100g/serving).
        - Scale it to the full amount shown in the image.
        
        Respond ONLY with valid JSON.
        Schema: { "foodName": string, "calories": number, "protein": number, "carbs": number, "fat": number, "servingSize": string }
      `;

      const finalMessages: GroqMessage[] = [
         {
            role: 'user',
            content: [
               { type: 'text', text: finalPrompt },
               // We send the image again so the model can judge portion size relative to the search data
               { type: 'image_url', image_url: { url: base64Image } }
            ]
         }
      ];

      const responseText = await runGroqChat(finalMessages, true);

      if (responseText) {
        // Robust parsing
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
        
        try {
            const data = JSON.parse(cleanJson) as FoodAnalysis;
            setAnalysisResult(data);
            setAnalysisStep('done');
        } catch (parseError) {
            console.error("JSON Parse Error", parseError);
            throw new Error("Could not understand the AI response.");
        }
      } else {
        throw new Error("No data returned");
      }

    } catch (err: any) {
      console.error("AI Error:", err);
      setError(`Analysis failed: ${err.message}. Please try again.`);
      setAnalysisStep('idle');
    }
  };

  const handleAddToLog = () => {
    if (analysisResult) {
      // Apply batch division logic
      const divisor = Math.max(1, totalServings);
      onSave({
        name: analysisResult.foodName,
        calories: Math.round(analysisResult.calories / divisor),
        protein: Math.round(analysisResult.protein / divisor),
        carbs: Math.round(analysisResult.carbs / divisor),
        fat: Math.round(analysisResult.fat / divisor),
        image: capturedImage || null
      });
    }
  };

  // Helper to get displayed values based on batch mode
  const getDisplayValues = () => {
    if (!analysisResult) return { cal: 0, p: 0, c: 0, f: 0 };
    const div = Math.max(1, totalServings);
    return {
      cal: Math.round(analysisResult.calories / div),
      p: Math.round(analysisResult.protein / div),
      c: Math.round(analysisResult.carbs / div),
      f: Math.round(analysisResult.fat / div)
    };
  };

  if (!isOpen) return null;

  const displayed = getDisplayValues();

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300 font-sans">
       
       {/* Hidden File Input for Gallery */}
       <input 
         type="file" 
         ref={fileInputRef} 
         onChange={handleGalleryUpload} 
         accept="image/*" 
         className="hidden" 
       />

       {/* Main Viewport */}
       <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
          
          {/* Video Feed */}
          {!capturedImage && (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Scanning Guides - Soft & Subtle (Fixed Size) */}
          {!capturedImage && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 opacity-40">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl shadow-sm" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl shadow-sm" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl shadow-sm" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl shadow-sm" />
              </div>
            </div>
          )}

          {/* Captured Image Display */}
          {capturedImage && (
            <img 
              src={capturedImage} 
              alt="Captured food" 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${analysisResult ? 'opacity-20 blur-xl' : 'opacity-100'}`}
            />
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          {/* Top Controls */}
          <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center z-40">
             <button 
               onClick={onClose} 
               className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-black/40 transition-colors shadow-sm border border-white/10"
             >
                <X size={20} className="text-white" />
             </button>
             
             <div className="flex gap-4">
                {supportsFlash && !capturedImage && (
                  <button 
                    onClick={toggleFlash}
                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors border border-white/10 ${isFlashOn ? 'bg-yellow-400/90 text-black' : 'bg-black/20 text-white hover:bg-black/40'}`}
                  >
                      {isFlashOn ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
                  </button>
                )}
             </div>
          </div>

          {/* Analysis Loading Overlay */}
          {analysisStep !== 'idle' && analysisStep !== 'done' && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-white">
               <div className="relative">
                 <div className="absolute inset-0 bg-sky-500 blur-2xl opacity-30 animate-pulse" />
                 <CassieMascot expression="curious" size={100} className="animate-bounce relative z-10" />
               </div>
               
               <p className="mt-6 text-xl font-bold tracking-tight">
                 {analysisStep === 'identifying' && 'Identifying Food...'}
                 {analysisStep === 'searching' && 'Checking Nutrition Databases...'}
                 {analysisStep === 'calculating' && 'Calculating Macros...'}
               </p>
               
               {/* Step Indicators */}
               <div className="mt-4 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${analysisStep === 'identifying' ? 'bg-sky-400 animate-pulse' : analysisStep === 'searching' || analysisStep === 'calculating' ? 'bg-sky-500' : 'bg-white/20'}`} />
                  <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${analysisStep === 'searching' ? 'bg-sky-400 animate-pulse' : analysisStep === 'calculating' ? 'bg-sky-500' : 'bg-white/20'}`} />
                  <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${analysisStep === 'calculating' ? 'bg-sky-400 animate-pulse' : 'bg-white/20'}`} />
               </div>
               
               <div className="mt-2 text-xs text-white/60 font-medium">
                  {analysisStep === 'identifying' && <span className="flex items-center gap-1"><ScanLine size={12} /> Visual Scan</span>}
                  {analysisStep === 'searching' && <span className="flex items-center gap-1"><Globe size={12} /> Searching Web</span>}
                  {analysisStep === 'calculating' && <span className="flex items-center gap-1"><Calculator size={12} /> Synthesizing Data</span>}
               </div>
            </div>
          )}

          {/* Error Message */}
          {error && analysisStep === 'idle' && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8">
               <div className="bg-red-500/10 p-4 rounded-full mb-4">
                  <X size={32} className="text-red-500" />
               </div>
               <p className="text-white font-bold text-center mb-6">{error}</p>
               <Button onClick={handleRetake} variant="secondary">Try Again</Button>
            </div>
          )}

          {/* Results Card */}
          {analysisResult && (
             <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 z-50 animate-in slide-in-from-bottom duration-500 shadow-2xl">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />
                
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white">{analysisResult.foodName}</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                          {isBatchMode ? `Total Batch: ${analysisResult.servingSize}` : analysisResult.servingSize}
                      </p>
                   </div>
                   <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-1.5">
                      <Utensils size={14} />
                      {displayed.cal} kcal
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                   <div className="bg-sky-50 dark:bg-sky-900/20 p-4 rounded-2xl text-center border border-sky-100 dark:border-sky-800">
                      <div className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase mb-1">Protein</div>
                      <div className="text-xl font-black text-slate-700 dark:text-slate-200">{displayed.p}g</div>
                   </div>
                   <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl text-center border border-red-100 dark:border-red-800">
                      <div className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-1">Carbs</div>
                      <div className="text-xl font-black text-slate-700 dark:text-slate-200">{displayed.c}g</div>
                   </div>
                   <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl text-center border border-purple-100 dark:border-purple-800">
                      <div className="text-xs font-bold text-purple-500 dark:text-purple-400 uppercase mb-1">Fat</div>
                      <div className="text-xl font-black text-slate-700 dark:text-slate-200">{displayed.f}g</div>
                   </div>
                </div>
                
                {/* Batch / Recipe Mode Toggle */}
                <div className="mb-8">
                   {!isBatchMode ? (
                      <button 
                         onClick={() => { setIsBatchMode(true); setTotalServings(2); }}
                         className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                         <ChefHat size={16} /> Is this a large batch or pot?
                      </button>
                   ) : (
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2">
                         <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <Users size={18} className="text-sky-500" />
                                <span className="font-bold text-sm">Total Servings in Image</span>
                             </div>
                             <button 
                               onClick={() => { setIsBatchMode(false); setTotalServings(1); }}
                               className="text-xs text-slate-400 hover:text-slate-600 font-bold underline"
                             >
                                Cancel
                             </button>
                         </div>
                         
                         <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-2 border border-slate-200 dark:border-slate-700">
                            <button 
                              onClick={() => setTotalServings(Math.max(1, totalServings - 1))}
                              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                               <Minus size={18} />
                            </button>
                            
                            <span className="text-xl font-black text-slate-800 dark:text-white">
                               {totalServings}
                            </span>
                            
                            <button 
                              onClick={() => setTotalServings(Math.min(20, totalServings + 1))}
                              className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            >
                               <Plus size={18} />
                            </button>
                         </div>
                         <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                            Logging 1 serving ({displayed.cal} kcal)
                         </p>
                      </div>
                   )}
                </div>

                <div className="flex gap-4">
                   <Button variant="secondary" onClick={handleRetake} fullWidth>
                      Retake
                   </Button>
                   <Button onClick={handleAddToLog} fullWidth>
                      <Check size={20} className="mr-2" />
                      Add to Log
                   </Button>
                </div>
             </div>
          )}

          {/* Bottom Controls - Transparent Gradient & Scan Modes */}
          {!capturedImage && analysisStep === 'idle' && (
            <div className="absolute bottom-0 left-0 right-0 z-40">
               {/* Scan Mode Tabs */}
               <div className="flex justify-center gap-4 mb-6">
                  {(['food', 'barcode', 'label'] as const).map(mode => (
                     <button
                       key={mode}
                       onClick={() => setScanMode(mode)}
                       className={`px-5 py-2.5 rounded-full backdrop-blur-md text-sm font-bold flex items-center gap-2 transition-all ${
                         scanMode === mode 
                           ? 'bg-white text-slate-900 shadow-lg scale-105' 
                           : 'bg-black/30 text-white hover:bg-black/50 border border-white/10'
                       }`}
                     >
                       {mode === 'food' && <Utensils size={14} />}
                       {mode === 'barcode' && <ScanLine size={14} />}
                       {mode === 'label' && <Tag size={14} />}
                       <span className="capitalize">{mode}</span>
                     </button>
                  ))}
               </div>
               
               {/* Controls Bar */}
               <div className="px-8 pb-12 pt-12 flex justify-between items-center bg-gradient-to-t from-black/60 to-transparent">
                  <button 
                    onClick={triggerFileInput}
                    className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors group"
                  >
                     <div className="w-12 h-12 rounded-xl border-2 border-white/30 overflow-hidden bg-black/20 flex items-center justify-center group-hover:border-white transition-colors">
                        <ImageIcon size={24} />
                     </div>
                     <span className="text-[10px] font-bold tracking-wide uppercase">Gallery</span>
                  </button>

                  <button 
                    onClick={handleCapture}
                    className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/10 transition-colors shadow-lg shadow-black/20"
                  >
                     <div className="w-16 h-16 bg-white rounded-full transition-transform active:scale-90" />
                  </button>
                  
                  {/* Help Button - Spacer for balance */}
                  <button 
                    onClick={() => setShowHelp(true)}
                    className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors group"
                  >
                      <div className="w-12 h-12 rounded-xl border-2 border-white/30 overflow-hidden bg-black/20 flex items-center justify-center group-hover:border-white transition-colors">
                        <HelpCircle size={24} />
                     </div>
                     <span className="text-[10px] font-bold tracking-wide uppercase">Tips</span>
                  </button>
               </div>
            </div>
          )}
          
          {/* Help Popup */}
          {showHelp && (
            <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
               <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/20 relative animate-in zoom-in-95 duration-300">
                  <button 
                    onClick={() => setShowHelp(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                     <X size={20} />
                  </button>
                  
                  <div className="flex flex-col items-center text-center">
                     <div className="w-14 h-14 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center text-sky-500 mb-4 shadow-sm">
                        <Lightbulb size={28} fill="currentColor" className="opacity-80" />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Snap Tips</h3>
                     <p className="text-slate-500 dark:text-slate-300 text-sm mb-6">Get the most accurate calorie counts with these tips.</p>
                     
                     <div className="space-y-4 w-full text-left">
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                           <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-xl text-orange-500"><Sun size={18} /></div>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Use bright, natural light</span>
                        </div>
                         <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                           <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-500"><Focus size={18} /></div>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Keep camera steady</span>
                        </div>
                         <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                           <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-xl text-purple-500"><Utensils size={18} /></div>
                           <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Scan one plate at a time</span>
                        </div>
                     </div>

                     <Button onClick={() => setShowHelp(false)} fullWidth className="mt-8">Got it!</Button>
                  </div>
               </div>
            </div>
          )}

       </div>
    </div>
  );
};
