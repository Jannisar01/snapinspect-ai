import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, Type, FunctionDeclaration, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, encode, generateFindingFromImage } from '../services/geminiService';
import { useInspection } from '../context/InspectionContext';
import { Button } from './ui';
// Added Loader2 to the lucide-react imports
import { X, Terminal, Activity, Camera, Shield, Cpu, Zap, Radio, Bot, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { ConfidenceLevel } from '../types';

interface LiveInspectorProps {
  onClose: () => void;
}

interface TranscriptEntry {
  text: string;
  type: 'user' | 'bot';
}

export const LiveInspector: React.FC<LiveInspectorProps> = ({ onClose }) => {
  const { addBase64ImageToInspection, saveFinding } = useInspection();
  const [isActive, setIsActive] = useState(false);
  
  const [history, setHistory] = useState<TranscriptEntry[]>([]);
  const [transcribingInput, setTranscribingInput] = useState('');
  const [transcribingOutput, setTranscribingOutput] = useState('');
  
  const inputTranscriptionRef = useRef('');
  const outputTranscriptionRef = useRef('');

  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [lastLogStatus, setLastLogStatus] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'IDLE' | 'PERMISSIONS' | 'HANDSHAKE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const audioContextInput = useRef<AudioContext | null>(null);
  const audioContextOutput = useRef<AudioContext | null>(null);
  const nextStartTime = useRef(0);
  const sources = useRef(new Set<AudioBufferSourceNode>());

  const stopSession = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => { try { session.close(); } catch (e) {} });
      sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextInput.current) { audioContextInput.current.close().catch(() => {}); audioContextInput.current = null; }
    if (audioContextOutput.current) { audioContextOutput.current.close().catch(() => {}); audioContextOutput.current = null; }
    for (const source of sources.current) { try { source.stop(); } catch (e) {} }
    sources.current.clear();
    nextStartTime.current = 0;
    setIsActive(false);
    setSessionStatus('IDLE');
  };

  useEffect(() => { return () => stopSession(); }, []);

  const handleAIScanCapture = async (base64: string, notes: string) => {
    setIsProcessingAI(true);
    setLastLogStatus("ANALYZING VISUALS...");
    try {
      const analysis = await generateFindingFromImage(base64, notes);
      saveFinding({
        imageId: `AI_VOICE_${Date.now()}`,
        imageUrl: base64,
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        severity: analysis.severity,
        recommendedAction: analysis.recommendedAction,
        regulatoryReference: analysis.regulatoryReference,
        linkedStandards: analysis.linkedStandards,
        confidence: analysis.confidence as ConfidenceLevel
      });
      setLastLogStatus(`LOGGED: ${analysis.title}`);
      setTimeout(() => setLastLogStatus(null), 4000);
    } catch (error) {
      setLastLogStatus("AI FAILED");
      setTimeout(() => setLastLogStatus(null), 4000);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const getSnapshot = (quality = 0.9, width?: number, height?: number) => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = width || video.videoWidth;
      canvas.height = height || video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
    }
    return null;
  };

  const captureFindingDeclaration: FunctionDeclaration = {
    name: 'capture_finding',
    parameters: {
      type: Type.OBJECT,
      description: 'Document a hazard mentioned by the user.',
      properties: {
        hazard_description: { type: Type.STRING, description: 'The safety finding description.' },
        urgency: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }
      },
      required: ['hazard_description', 'urgency']
    }
  };

  const startSession = async () => {
    setSessionStatus('PERMISSIONS');
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setSessionStatus('HANDSHAKE');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      audioContextInput.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutput.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setSessionStatus('CONNECTED');
            setIsActive(true);
            const source = audioContextInput.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInput.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) { int16[i] = inputData[i] * 32768; }
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then((session) => { session.sendRealtimeInput({ media: pcmBlob }); }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInput.current!.destination);
            frameIntervalRef.current = window.setInterval(() => {
              const base64Full = getSnapshot(0.5, 320, 240);
              if (base64Full) {
                const data = base64Full.split(',')[1];
                sessionPromise.then((session) => { session.sendRealtimeInput({ media: { data, mimeType: 'image/jpeg' } }); }).catch(() => {});
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutput.current) {
              const ctx = audioContextOutput.current;
              if (ctx.state === 'suspended') await ctx.resume();
              nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.onended = () => sources.current.delete(source);
              source.start(nextStartTime.current);
              nextStartTime.current += audioBuffer.duration;
              sources.current.add(source);
            }
            if (message.serverContent?.inputTranscription) { inputTranscriptionRef.current += message.serverContent.inputTranscription.text; setTranscribingInput(inputTranscriptionRef.current); }
            if (message.serverContent?.outputTranscription) { outputTranscriptionRef.current += message.serverContent.outputTranscription.text; setTranscribingOutput(outputTranscriptionRef.current); }
            if (message.serverContent?.turnComplete) {
              setHistory(prev => [...prev, { type: 'user' as const, text: inputTranscriptionRef.current }, { type: 'bot' as const, text: outputTranscriptionRef.current }].slice(-20));
              inputTranscriptionRef.current = ''; outputTranscriptionRef.current = ''; setTranscribingInput(''); setTranscribingOutput('');
            }
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'capture_finding') {
                  const fullBase64 = getSnapshot(0.9);
                  if (fullBase64) { addBase64ImageToInspection(fullBase64, `AI_CAPTURE_${Date.now()}`); handleAIScanCapture(fullBase64, (fc.args as any).hazard_description); }
                  sessionPromise.then((s) => { s.sendToolResponse({ functionResponses: { id: fc.id, name: fc.name, response: { result: "Captured." } } }); });
                }
              }
            }
          },
          onerror: (e) => { setErrorMessage((e as any).message || "Connection failed"); setSessionStatus('ERROR'); setIsActive(false); },
          onclose: () => { setIsActive(false); setSessionStatus('IDLE'); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "Safety Co-Pilot. brief, objective. log findings.",
          tools: [{ functionDeclarations: [captureFindingDeclaration] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (err: any) { setErrorMessage(err.message || "Permissions denied."); setSessionStatus('ERROR'); }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#111827] flex items-center justify-center p-4 md:p-10">
      <div className="bg-[#1F2937] border border-white/10 w-full max-w-6xl h-full flex flex-col shadow-2xl relative overflow-hidden rounded-2xl">
        <div className="h-16 bg-[#1F2937] border-b border-white/10 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${isActive ? 'bg-[#DC2626] animate-pulse' : 'bg-[#374151]'}`}>
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-oswald font-bold uppercase tracking-widest text-lg italic">AI LIVE CO-PILOT</h2>
              <span className={`text-[10px] font-bold uppercase ${sessionStatus === 'ERROR' ? 'text-[#DC2626]' : 'text-[#9CA3AF]'}`}>{sessionStatus}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors"><X className="w-8 h-8" /></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
             <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-1000 ${isActive ? 'opacity-70' : 'opacity-30'}`} />
             <canvas ref={canvasRef} className="hidden" />
             
             <div className="absolute top-6 left-6 space-y-2">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                   <Activity className={`w-3 h-3 ${isActive ? 'text-[#059669]' : 'text-[#4B5563]'}`} />
                   <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">Linked_Status: {isActive ? 'Live' : 'Standby'}</span>
                </div>
                {lastLogStatus && (
                  <div className="bg-[#2563EB] px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 animate-in slide-in-from-left shadow-xl">
                     <Zap className="w-3 h-3 text-white fill-white" />
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest">{lastLogStatus}</span>
                  </div>
                )}
             </div>

             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                {!isActive && sessionStatus !== 'ERROR' && (
                  <Button onClick={startSession} isLoading={sessionStatus === 'PERMISSIONS' || sessionStatus === 'HANDSHAKE'} className="bg-[#2563EB] hover:bg-[#1D4ED8] px-12 py-7 text-xl font-oswald italic tracking-widest shadow-2xl">
                     <Zap className="w-6 h-6 mr-3" /> ESTABLISH HANDSHAKE
                  </Button>
                )}
             </div>

             {isProcessingAI && (
               <div className="absolute inset-0 bg-[#111827]/80 flex flex-col items-center justify-center backdrop-blur-sm z-50">
                  {/* Fixed Cannot find name 'Loader2' error by adding it to imports */}
                  <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mb-4" />
                  <p className="text-white font-oswald font-bold tracking-widest uppercase italic">Processing Localized Visuals</p>
               </div>
             )}

             {sessionStatus === 'ERROR' && (
               <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#111827]/95 p-6">
                 <div className="w-full max-sm bg-[#1F2937] border border-[#DC2626] p-8 text-center rounded-2xl">
                    <h3 className="text-2xl font-oswald font-bold text-white uppercase mb-4 italic">Interface Failed</h3>
                    <p className="text-[#9CA3AF] text-xs mb-8 uppercase font-bold tracking-tighter">{errorMessage}</p>
                    <Button onClick={startSession} className="w-full bg-[#DC2626] hover:bg-[#B91C1C]">RETRY LINK</Button>
                 </div>
               </div>
             )}
          </div>

          <div className="w-full md:w-80 bg-[#1F2937] flex flex-col shrink-0">
             <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest">Comms_Feed</span>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
                {history.map((entry, i) => (
                  <div key={i} className={`flex flex-col ${entry.type === 'user' ? 'items-end' : 'items-start'}`}>
                     <span className="text-[8px] font-bold uppercase text-[#9CA3AF] mb-1">{entry.type.toUpperCase()}</span>
                     <div className={`max-w-[90%] px-3 py-2 rounded-xl text-[11px] font-medium ${entry.type === 'user' ? 'bg-[#374151] text-white' : 'bg-[#2563EB]/20 text-[#93C5FD] border border-[#2563EB]/30'}`}>
                        {entry.text}
                     </div>
                  </div>
                ))}
             </div>

             <div className="p-4 bg-black/20 space-y-2 border-t border-white/5">
                <Button disabled={!isActive} onClick={() => { const b = getSnapshot(); if(b){ addBase64ImageToInspection(b, "MANUAL"); } }} variant="secondary" className="w-full text-[10px] h-10">Manual Capture</Button>
                <Button disabled={!isActive} onClick={stopSession} variant="danger" className="w-full text-[10px] h-10">Disconnect</Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};