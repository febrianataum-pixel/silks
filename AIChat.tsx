
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, Loader2, Minimize2, Maximize2, Paperclip, ImageIcon, Trash2, Key, AlertCircle, ExternalLink, Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: string;
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya Asisten Pintar SI-LKS Blora. Sekarang saya mendukung percakapan suara (Live Mode). Klik ikon mikrofon untuk mencoba!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Audio Refs for Live API
  const audioContextInputRef = useRef<AudioContext | null>(null);
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, [isOpen]);

  useEffect(() => {
    if (!isMinimized) scrollToBottom();
  }, [messages, isLoading, isMinimized]);

  // --- AUDIO HELPERS ---
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const createPcmBlob = (data: Float32Array): { data: string; mimeType: string } => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return {
      data: encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  // --- LIVE API LOGIC ---
  const startLiveMode = async () => {
    if (isLiveMode) {
      stopLiveMode();
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextInputRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutputRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioContextInputRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextInputRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInputRef.current!.destination);
            setIsLiveMode(true);
            setIsLoading(false);
            setMessages(prev => [...prev, { role: 'model', text: 'Mendengarkan... Silakan bicara.' }]);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextOutputRef.current) {
              const ctx = audioContextOutputRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              activeSourcesRef.current.add(source);
              source.onended = () => activeSourcesRef.current.delete(source);
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'model') {
                  return [...prev.slice(0, -1), { ...last, text: last.text + text }];
                }
                return [...prev, { role: 'model', text }];
              });
            }

            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => stopLiveMode(),
          onerror: (err: any) => {
             console.error(err);
             if (err?.message?.includes("entity was not found") || err?.toString().includes("404")) {
                setHasKey(false);
                handleOpenKeySelection();
             }
             stopLiveMode();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'Anda adalah SI-LKS Voice Assistant. Bicara singkat, padat, dan solutif tentang data sosial Blora.'
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      if (err?.message?.includes("entity was not found")) {
        setHasKey(false);
        handleOpenKeySelection();
      } else {
        alert("Gagal mengakses mikrofon atau menyambung ke Live API.");
      }
    }
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    sessionRef.current?.close();
    audioContextInputRef.current?.close();
    audioContextOutputRef.current?.close();
    activeSourcesRef.current.forEach(s => s.stop());
    activeSourcesRef.current.clear();
  };

  const handleOpenKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasKey(true);
      setShowSettings(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setAttachment(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    const userText = input.trim() || (attachment ? "Apa isi gambar ini?" : "");
    const currentAttachment = attachment;
    
    setInput('');
    setAttachment(null);
    setMessages(prev => [...prev, { role: 'user', text: userText, attachment: currentAttachment || undefined }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contentsParts: any[] = [{ text: userText }];
      
      if (currentAttachment) {
        contentsParts.push({
          inlineData: {
            data: currentAttachment.split(',')[1],
            mimeType: currentAttachment.split(',')[0].split(':')[1].split(';')[0]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.slice(-4).map(m => ({ role: m.role, parts: [{ text: m.text }] })).concat([{ role: 'user', parts: contentsParts }]),
        config: {
          systemInstruction: `Anda adalah "SI-LKS Smart Assistant" Blora. Membantu manajemen data LKS dan PM.`,
          temperature: 0.7,
        },
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "Terjadi kesalahan." }]);
    } catch (error: any) {
      if (error?.message?.includes("entity was not found")) {
        setHasKey(false);
        handleOpenKeySelection();
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Gagal terhubung ke AI. Pastikan API Key valid." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] no-print">
      {isOpen ? (
        <div className={`bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col transition-all duration-300 ease-in-out ${isMinimized ? 'h-20 w-72' : 'h-[600px] w-[400px] max-w-[90vw] max-h-[80vh]'}`}>
          <div className="p-5 border-b flex items-center justify-between bg-slate-900 text-white rounded-t-[2.5rem]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${isLiveMode ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'}`}>
                {isLiveMode ? <Mic size={22} /> : <Bot size={22} />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest">{isLiveMode ? 'Live Mode' : 'Chat Mode'}</h4>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{hasKey ? 'Online' : 'No Key'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg text-slate-400 hover:text-white transition-all ${showSettings ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                <Settings size={16} />
              </button>
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500 rounded-lg text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {showSettings && !isMinimized && (
            <div className="p-6 bg-slate-100 border-b animate-in fade-in slide-in-from-top-2 duration-300">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Pengaturan Asisten</p>
              <button 
                onClick={handleOpenKeySelection}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Key size={14} /> Konfigurasi API Key
              </button>
              <p className="mt-3 text-[8px] text-slate-400 leading-relaxed italic">Gunakan tombol di atas untuk mengganti atau memasukkan API Key Anda secara manual melalui jendela aman AI Studio.</p>
            </div>
          )}

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
                {!hasKey && (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-center space-y-4">
                    <Key size={24} className="mx-auto text-amber-600" />
                    <p className="text-[10px] text-amber-700 font-bold uppercase">Kunci API Dibutuhkan</p>
                    <button onClick={handleOpenKeySelection} className="w-full py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase">Pilih Kunci API</button>
                  </div>
                )}
                
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                      {m.attachment && <img src={m.attachment} alt="Attachment" className="mb-2 rounded-lg max-w-full" />}
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && <div className="flex justify-start"><Loader2 className="animate-spin text-blue-600" size={24} /></div>}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t rounded-b-[2.5rem] space-y-3">
                {attachment && (
                  <div className="relative inline-block">
                    <img src={attachment} className="h-16 w-16 object-cover rounded-xl border" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><X size={10} /></button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={startLiveMode} 
                    className={`p-3.5 rounded-2xl transition-all shadow-lg active:scale-90 ${isLiveMode ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    title={isLiveMode ? "Matikan Suara" : "Mulai Percakapan Suara"}
                  >
                    {isLiveMode ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  
                  {!isLiveMode && (
                    <>
                      <button onClick={() => fileInputRef.current?.click()} className="p-3.5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200">
                        <Paperclip size={20} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                      <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Tulis pesan..." 
                        className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-xs font-bold outline-none"
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={isLoading || (!input.trim() && !attachment)}
                        className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 disabled:opacity-50"
                      >
                        <Send size={18} />
                      </button>
                    </>
                  )}
                  {isLiveMode && <div className="flex-1 text-center py-3.5 px-4 bg-rose-50 rounded-2xl text-[10px] font-black text-rose-600 uppercase animate-pulse">Mode Suara Aktif...</div>}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
          <MessageSquare size={28} />
          {hasKey && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full animate-pulse"></span>}
        </button>
      )}
    </div>
  );
};

export default AIChat;
