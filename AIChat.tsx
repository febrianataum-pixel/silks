
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Saya Asisten SI-LKS Blora. Ada yang bisa saya bantu terkait pengelolaan data LKS, administrasi, atau pendataan PM?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.concat({ role: 'user', text: userMessage }).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: `Anda adalah "SI-LKS Smart Assistant", pakar sistem informasi Lembaga Kesejahteraan Sosial Kabupaten Blora.
          
          Tugas Anda:
          1. Membantu admin/user memahami fitur aplikasi SILKS (Dashboard, Data LKS, Administrasi, PM, Pencarian, Rekomendasi).
          2. Menjelaskan proses belakang layar: Data disimpan di LocalStorage dan bisa disinkronkan ke Firebase Cloud (fitur Cloud Sync).
          3. Menjelaskan Administrasi: LKS harus memiliki 4 dokumen (KTP Ketua, SK Kemenkumham, Tanda Daftar, Akreditasi).
          4. Menjelaskan PM: Data By Name By Address (BNBA). Kategori 'Dalam' berarti residensial (tinggal di panti), 'Luar' berarti non-residensial.
          5. Menjelaskan Rekomendasi: Fitur cetak surat otomatis ke Dinsos Provinsi menggunakan template yang bisa diedit.
          
          Karakteristik:
          - Bahasa: Indonesia yang sopan, profesional, namun ramah.
          - Singkat dan jelas.
          - Jika ditanya teknis: Aplikasi menggunakan React, Tailwind CSS, dan Lucide Icons.
          
          Data Statis Penting:
          - Kabupaten: Blora.
          - Kecamatan: 16 (Blora, Cepu, Randublatung, dll).
          - Fokus: Akreditasi LKS (A, B, C, Belum).`,
          temperature: 0.7,
        },
      });

      const aiResponse = response.text || "Maaf, saya mengalami kendala teknis saat memproses permintaan Anda.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Maaf, koneksi ke otak AI terputus. Pastikan koneksi internet Anda stabil." }]);
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
                <h4 className="text-xs font-black uppercase tracking-widest">Smart Assistant</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Gemini 3 Flash Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500 rounded-lg transition-all text-slate-400 hover:text-white">
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
                      {m.role === 'model' && <Sparkles size={12} className="mb-2 text-blue-500" />}
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-2">
                      <span className="w-2 h-2 bg-slate-200 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-slate-200 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t rounded-b-[2.5rem]">
                <div className="relative flex items-center gap-2">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Tanya sesuatu tentang SILKS..." 
                    className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !input.trim()}
                    className="p-3.5 bg-blue-600 text-white rounded-2xl shadow-lg active:scale-90 transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className="text-[8px] text-center text-slate-400 mt-3 font-bold uppercase tracking-widest">Powered by Google Gemini 3.0</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <MessageSquare size={28} className="relative z-10" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full animate-pulse"></span>
        </button>
      )}
    </div>
  );
};

export default AIChat;
