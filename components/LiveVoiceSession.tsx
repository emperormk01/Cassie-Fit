
import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, PhoneOff, Volume2, AlertCircle } from 'lucide-react';
import { LiveServerMessage, Modality } from "@google/genai";
import { CassieMascot } from './CassieMascot';
import { UserProfileData, UserMemory } from '../types';
import { getGeminiClient } from '../lib/gemini';

interface LiveVoiceSessionProps {
  onClose: () => void;
  userProfile?: UserProfileData | null;
  userMemory?: UserMemory;
}

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ onClose, userProfile, userMemory }) => {
  const [status, setStatus] = useState<'initial' | 'requesting_permission' | 'connecting' | 'connected' | 'error'>('initial');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Playback Refs
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null);

  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mascotContainerRef = useRef<HTMLDivElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const currentVolRef = useRef(0); // For LERP smoothing

  useEffect(() => {
    let mounted = true;

    const initializeSession = async () => {
      try {
        setStatus('requesting_permission');

        // 1. Mic Permission
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    autoGainControl: true,
                    noiseSuppression: true,
                    latency: 0
                } as any
            });
            streamRef.current = stream;
        } catch (err: any) {
            console.error("Mic Error:", err);
            if (mounted) {
                setStatus('error');
                setErrorMessage("Microphone access denied. Please check settings.");
            }
            return;
        }

        if (!mounted) return;
        setStatus('connecting');

        // 2. Audio Contexts
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000, latencyHint: 'interactive' });
        outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000, latencyHint: 'interactive' });

        // Analyzer for visuals
        analyserRef.current = outputAudioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 32;
        analyserRef.current.smoothingTimeConstant = 0.4; // Slightly more responsive

        // 3. Connect API using our utility
        const ai = getGeminiClient();
        
        // Revised System Instruction: Clarifying Human Nutrition Context + Language Constraint + Cultural Knowledge
        const systemInstruction = `You are Cassie, a smart, playful AI nutritionist for HUMANS. 
        You are a cat character, but your expertise is Human Nutrition. Do NOT give advice for cats.
        
        User Name: ${userProfile?.name || 'Friend'}. 
        User Goal: ${userProfile?.goal || 'General Wellness'}.

        KNOWLEDGE BASE:
        - Expert in Mediterranean, Asian, African, Latin American, and Middle Eastern cuisines.
        - Focus on whole foods, veggies (>400g/day), and healthy fats.
        - Advise on portion control (Palm=Protein, Fist=Grains).
        
        IMPORTANT: Speak ONLY in English, regardless of the user's input language.
        
        Keep responses concise (1-2 sentences), warm, and conversational.`;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: systemInstruction,
          },
          callbacks: {
            onopen: () => {
              if (!mounted) return;
              console.log("Connected");
              setStatus('connected');

              // 4. Input Processing
              if (inputAudioContextRef.current && streamRef.current) {
                inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                // 512 buffer size = ~32ms latency
                processorRef.current = inputAudioContextRef.current.createScriptProcessor(512, 1, 1);
                
                processorRef.current.onaudioprocess = (e) => {
                  if (isMuted) return;
                  const inputData = e.inputBuffer.getChannelData(0);
                  
                  // PCM Conversion
                  const l = inputData.length;
                  const pcmData = new Int16Array(l);
                  let binary = '';
                  for (let i = 0; i < l; i++) {
                      const s = Math.max(-1, Math.min(1, inputData[i]));
                      const val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                      pcmData[i] = val;
                      binary += String.fromCharCode(val & 0xFF, (val >> 8) & 0xFF);
                  }
                  const base64 = btoa(binary);
                  
                  sessionPromise.then(session => {
                    session.sendRealtimeInput({ 
                        media: { mimeType: 'audio/pcm;rate=16000', data: base64 }
                    });
                  });
                };

                inputSourceRef.current.connect(processorRef.current);
                processorRef.current.connect(inputAudioContextRef.current.destination);
              }
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!mounted) return;
              
              // Audio Output
              const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio && outputAudioContextRef.current) {
                try {
                    const ctx = outputAudioContextRef.current;
                    const binaryString = atob(base64Audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    const int16 = new Int16Array(bytes.buffer);
                    
                    const buffer = ctx.createBuffer(1, int16.length, 24000);
                    const channelData = buffer.getChannelData(0);
                    for (let i = 0; i < int16.length; i++) channelData[i] = int16[i] / 32768.0;

                    const now = ctx.currentTime;
                    // Tight scheduling: if queue empty, play immediately
                    if (nextStartTimeRef.current < now) nextStartTimeRef.current = now;
                    
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(analyserRef.current!); // Connect to visualizer
                    analyserRef.current!.connect(ctx.destination);
                    
                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    
                    audioSourcesRef.current.add(source);
                    source.onended = () => audioSourcesRef.current.delete(source);
                } catch (e) { console.error(e); }
              }

              // Interrupt Handling
              if (message.serverContent?.interrupted) {
                audioSourcesRef.current.forEach(src => {
                  try { src.stop(); } catch (e) {}
                });
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onclose: () => console.log("Closed"),
            onerror: (err) => {
              console.error(err);
              if (mounted) { setStatus('error'); setErrorMessage("Connection lost. Please try again."); }
            }
          }
        });
        sessionRef.current = sessionPromise;

      } catch (err) {
        if (mounted) { setStatus('error'); setErrorMessage("Failed to start."); }
      }
    };

    initializeSession();

    // --- SMOOTH VISUALIZER LOOP ---
    let animationFrame: number;
    const renderVisuals = () => {
        if (!analyserRef.current || !canvasRef.current) {
            animationFrame = requestAnimationFrame(renderVisuals);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Handle Canvas Size
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Resize canvas if needed (handles window resize or initial load)
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
        
        // 1. Get Data
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // 2. Calculate Volume
        let sum = 0;
        for(let i=0; i < dataArray.length; i++) sum += dataArray[i];
        
        // Better normalization: 
        // Average is 0-255. Divide by 80 to get a nice 0-3ish range, but clamp it reasonable
        const rawAvg = sum / dataArray.length;
        const targetVol = rawAvg / 60; 

        // 3. Interpolate (LERP) for Smoothness
        currentVolRef.current += (targetVol - currentVolRef.current) * 0.15;
        const vol = currentVolRef.current;

        // 4. Update DOM Elements
        if (mascotContainerRef.current) {
             const scale = 1 + Math.min(0.3, vol * 0.1); 
             mascotContainerRef.current.style.transform = `scale(${scale})`;
        }
        if (statusTextRef.current) {
             const isTalking = vol > 0.05;
             statusTextRef.current.innerText = isTalking ? "Cassie is talking..." : "Listening...";
             statusTextRef.current.style.color = isTalking ? "#38BDF8" : "#94A3B8";
             statusTextRef.current.style.opacity = isTalking ? "1" : "0.7";
        }

        // 5. Draw Canvas Background
        // Clear logic using logical coordinates
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Optimization: If practically silent, don't draw gradient to avoid artifacts
        if (vol < 0.01) {
            animationFrame = requestAnimationFrame(renderVisuals);
            return;
        }

        const cx = rect.width / 2;
        const cy = rect.height / 2;
        
        // Base dimensions relative to the mascot size (which is around 160px with padding)
        const baseRadius = 100; // Just outside the mascot container
        
        // Fade out opacity as volume drops to avoid hard edges
        const alpha = Math.min(1, vol * 1.5); 

        // Draw Soft Aura - Layer 1 (Core)
        // Add small buffers (+10) to ensure start radius < end radius
        const r1_start = baseRadius * 0.8;
        const r1_end = baseRadius + (vol * 60) + 10;
        
        if (alpha > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r1_end, 0, 2 * Math.PI);
            const g1 = ctx.createRadialGradient(cx, cy, r1_start, cx, cy, r1_end);
            g1.addColorStop(0, `rgba(56, 189, 248, ${0.4 * alpha})`); // Sky Blue
            g1.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.fillStyle = g1;
            ctx.fill();

            // Layer 2 (Outer Echo - Purple)
            const r2_start = baseRadius;
            const r2_end = baseRadius + (vol * 120) + 20;
            
            ctx.beginPath();
            ctx.arc(cx, cy, r2_end, 0, 2 * Math.PI);
            const g2 = ctx.createRadialGradient(cx, cy, r2_start, cx, cy, r2_end);
            g2.addColorStop(0, `rgba(168, 85, 247, ${0.2 * alpha})`); // Purple
            g2.addColorStop(1, "rgba(168, 85, 247, 0)");
            ctx.fillStyle = g2;
            ctx.fill();

            // Layer 3 (Large Subtle Pulse - Teal)
            const r3_start = baseRadius;
            const r3_end = baseRadius + (vol * 180) + 30;
            
            ctx.beginPath();
            ctx.arc(cx, cy, r3_end, 0, 2 * Math.PI);
            const g3 = ctx.createRadialGradient(cx, cy, r3_start, cx, cy, r3_end);
            g3.addColorStop(0, `rgba(45, 212, 191, ${0.1 * alpha})`); // Teal
            g3.addColorStop(1, "rgba(45, 212, 191, 0)");
            ctx.fillStyle = g3;
            ctx.fill();
        }

        animationFrame = requestAnimationFrame(renderVisuals);
    };
    renderVisuals();

    return () => {
      mounted = false;
      cancelAnimationFrame(animationFrame);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
      sessionRef.current?.then((s: any) => s.close());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[100] bg-[#FDFBF7]/95 dark:bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-between py-12 px-6 animate-in fade-in duration-500 overflow-hidden">
        
        {/* Header */}
        <div className="w-full flex justify-between items-start z-10">
            <button onClick={onClose} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-full backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-colors">
                <X size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Live Voice</span>
                <div className="flex items-center gap-2">
                    {status === 'connected' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                    <span className="text-xs font-bold text-slate-400">
                        {status === 'connected' ? 'Session Active' : 'Connecting...'}
                    </span>
                </div>
            </div>
            <div className="w-12" />
        </div>

        {/* Center Visual */}
        <div className="relative flex flex-col items-center justify-center flex-1 w-full max-w-sm mx-auto">
            {status === 'error' ? (
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-[2rem] border border-red-100 dark:border-red-800/30 relative z-20">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-slate-800 dark:text-white font-bold mb-2">Oops!</p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">{errorMessage}</p>
                    <button onClick={onClose} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold">Close</button>
                </div>
            ) : (
                <>
                    {/* Visualizer Container - Oversized to prevent clipping */}
                    <div className="relative flex items-center justify-center mb-8">
                        {/* Canvas Layer - Absolute Center & Large */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
                            <canvas 
                                ref={canvasRef} 
                                className="w-full h-full"
                            />
                        </div>
                        
                        {/* Mascot Layer */}
                        <div ref={mascotContainerRef} className="relative z-10 p-6 bg-white dark:bg-slate-800 rounded-full shadow-2xl shadow-sky-200/50 dark:shadow-sky-900/20 transition-transform duration-75 ease-out will-change-transform">
                            <CassieMascot expression="happy" size={140} />
                        </div>
                    </div>
                    
                    <span 
                        ref={statusTextRef}
                        className="font-medium text-lg text-center h-8 transition-colors duration-200 relative z-10"
                    >
                        ...
                    </span>
                </>
            )}
        </div>

        {/* Controls */}
        <div className={`flex items-center gap-6 transition-opacity duration-500 relative z-10 ${status === 'error' ? 'opacity-0' : 'opacity-100'}`}>
            <button 
               onClick={() => setIsMuted(!isMuted)}
               className={`p-6 rounded-full transition-all shadow-lg ${isMuted ? 'bg-slate-200 text-slate-500' : 'bg-white text-slate-800 hover:scale-105'}`}
            >
               {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <button onClick={onClose} className="p-8 rounded-full bg-rose-500 text-white shadow-xl hover:scale-105 transition-transform">
               <PhoneOff size={40} fill="currentColor" />
            </button>
             <button className="p-6 rounded-full bg-white/50 text-slate-400 cursor-default">
               <Volume2 size={32} />
            </button>
        </div>
    </div>
  );
};
