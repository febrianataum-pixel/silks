
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, Loader2, Minimize2, Maximize2, Paperclip, ImageIcon, Trash2, Key, AlertCircle, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Removed global aistudio and AIStudio declarations as they conflict with environment-provided types.
// Accessing aistudio via (window as any).aistudio in the component logic instead.

interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: string; // Base64 image data
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya Asisten Pintar SI-LKS Blora. Ada yang bisa saya bantu? Anda sekarang bisa melampirkan foto dokumen untuk saya analisis.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkKey = async () => {
      // Accessing aistudio via window casting to avoid potential TypeScript conflicts with environment-provided types
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

  const handleOpenKeySelection = async () => {
    // Accessing aistudio via window casting to avoid potential TypeScript conflicts with environment-provided types
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      // Race condition mitigation: assume selection was successful and proceed
      setHasKey(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachment(event.target?.result as string);
      };
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
      // Create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contentsParts: any[] = [{ text: userText }];
      
      if (currentAttachment) {
        const base64Data = currentAttachment.split(',')[1];
        const mimeType = currentAttachment.split(',')[0].split(':')[1].split(';')[0];
        contentsParts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const history = messages.slice(-6).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Using gemini-3-flash-preview for general assistant tasks as per guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: contentsParts }],
        config: {
          systemInstruction: `Anda adalah "SI-LKS Smart Assistant" Kabupaten Blora.
          Tugas utama: Membantu operasional Dinas Sosial dalam manajemen LKS dan Penerima Manfaat.
          Gaya bicara: Profesional, ramah, dan solutif dalam Bahasa Indonesia.
          Konteks teknis: LKS Blora wajib memiliki KTP Ketua, SK Kemenkumham, Tanda Daftar, dan Akreditasi.`,
          temperature: 0.7,
        },
      });

      const aiResponse = response.text || "Maaf, saya tidak dapat menghasilkan respon saat ini.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error: any) {
      console.error("AI connection error:", error);
      
      // If requested entity not found, reset key selection
      if (error.message?.includes("Requested entity was not found") || error.message?.includes("API Key")) {
        setHasKey(false);
      }

      let errorMessage = "Maaf, terjadi kendala koneksi ke otak AI.";
      if (!hasKey) errorMessage = "Kunci API belum diaktifkan atau tidak valid.";
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `${errorMessage} Pastikan Anda sudah memilih Kunci API yang valid dari project berbayar.` 
      }]);
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
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Bot size={22} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest">SI-LKS AI</h4>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping ${hasKey ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">{hasKey ? 'Online' : 'Offline - No Key'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500 rounded-lg text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
                {!hasKey && (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                      <Key size={24} />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-amber-900 uppercase">Kunci API Dibutuhkan</h5>
                      <p className="text-[10px] text-amber-700 font-medium mt-1">Untuk menggunakan fitur AI, Anda harus memilih Kunci API dari project Google Cloud berbayar.</p>
                    </div>
                    <button 
                      onClick={handleOpenKeySelection}
                      className="w-full py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
                    >
                      PILIH KUNCI API
                    </button>
                    <a 
                      href="https://ai.google.dev/gemini-api/docs/billing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] text-amber-500 font-bold uppercase hover:underline flex items-center justify-center gap-1"
                    >
                      Pelajari Billing <ExternalLink size={10} />
                    </a>
                  </div>
                )}
                
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                      {m.attachment && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                          <img src={m.attachment} alt="Attachment" className="max-w-full h-auto" />
                        </div>
                      )}
                      {m.role === 'model' && <Sparkles size={12} className="mb-2 text-blue-500" />}
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-white border-t rounded-b-[2.5rem] space-y-3">
                {attachment && (
                  <div className="relative inline-block">
                    <img src={attachment} className="h-16 w-16 object-cover rounded-xl border-2 border-blue-500 shadow-lg" alt="Preview" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"><X size={10} /></button>
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <Paperclip size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                  <input 
                    type="text" 
                    disabled={!hasKey}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={hasKey ? "Tanya AI / Kirim Gambar..." : "Aktifkan kunci API dahulu..."} 
                    className={`flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none ${!hasKey && 'opacity-50 cursor-not-allowed'}`}
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || (!input.trim() && !attachment) || !hasKey}
                    className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <MessageSquare size={28} />
          {!hasKey && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-black">!</span>}
          {hasKey && <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full animate-pulse"></span>}
        </button>
      )}
    </div>
  );
};

export default AIChat;
