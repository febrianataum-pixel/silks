
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, Loader2, Minimize2, Maximize2, Paperclip, ImageIcon, Trash2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
  attachment?: string; // Base64 image
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya Asisten SI-LKS Blora. Ada yang bisa saya bantu? Anda juga bisa mengirim gambar dokumen LKS untuk saya analisis.' }
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
    if (!isMinimized) scrollToBottom();
  }, [messages, isLoading, isMinimized]);

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
      // Create new instance strictly following guidelines
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

      // Format history including image context if any
      const history = messages.slice(-6).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: contentsParts }],
        config: {
          systemInstruction: `Anda adalah "SI-LKS Smart Assistant" Kabupaten Blora.
          Tugas: Membantu administrasi LKS, pendataan PM BNBA, dan analisis dokumen LKS.
          Instruksi: Jawab dalam Bahasa Indonesia yang ramah. Jika user mengirim gambar dokumen, jelaskan poin penting dari dokumen tersebut.
          Konteks: LKS Blora butuh 4 dokumen utama: KTP, SK Menkumham, Tanda Daftar, Akreditasi.`,
          temperature: 1,
        },
      });

      const aiResponse = response.text || "Maaf, saya tidak bisa memproses permintaan ini.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error: any) {
      console.error("AI Error Detail:", error);
      let errorMsg = "Maaf, terjadi kendala teknis.";
      if (error.message?.includes("API_KEY")) errorMsg = "Kunci API tidak valid atau belum terpasang.";
      else if (error.message?.includes("fetch")) errorMsg = "Gagal menghubungi otak AI. Periksa kuota API atau koneksi.";
      
      setMessages(prev => [...prev, { role: 'model', text: `${errorMsg} (Error: ${error.message?.slice(0, 50)}...)` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] no-print">
      {isOpen ? (
        <div className={`bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col transition-all duration-300 ease-in-out ${isMinimized ? 'h-20 w-72' : 'h-[600px] w-[400px] max-w-[90vw] max-h-[80vh]'}`}>
          {/* Header */}
          <div className="p-5 border-b flex items-center justify-between bg-slate-900 text-white rounded-t-[2.5rem]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Bot size={22} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest">SI-LKS AI</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Multimodal Aktif</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500 rounded-lg text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-slate-50/50">
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

              {/* Input Area */}
              <div className="p-4 bg-white border-t rounded-b-[2.5rem] space-y-3">
                {attachment && (
                  <div className="relative inline-block">
                    <img src={attachment} className="h-20 w-20 object-cover rounded-xl border-2 border-blue-500 shadow-lg" alt="Preview" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"><X size={12} /></button>
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                    <Paperclip size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tanya SI-LKS..." 
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || (!input.trim() && !attachment)}
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
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full animate-pulse"></span>
        </button>
      )}
    </div>
  );
};

export default AIChat;
