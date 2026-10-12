
import React, { useState, useRef, useEffect, useId } from 'react';
import { Send, Bot, Terminal, RotateCcw, X, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithComplianceExpert } from '../services/geminiService';
import { useInspection } from '../context/InspectionContext';
import { useAuth } from '../context/AuthContext';

export const ComplianceChatFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatId = useId();
  const { inspections } = useInspection();
  const { user } = useAuth();

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const siteSummary = inspections.map(i => 
    `Site: ${i.name} (ID: ${i.siteId}) - Findings: ${i.findings.length} total. ` +
    i.findings.map(f => `[Finding: ${f.title}, Severity: ${f.severity}, Status: ${f.lifecycle}]`).join('; ')
  ).join('\n');

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }]);
    setIsChatLoading(true);

    try {
      const result = await chatWithComplianceExpert(userMsg, siteSummary, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: result.text }], sources: result.sources }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: "Error connecting to Compliance Engine." }] }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col items-end" role="complementary" aria-label="Compliance Assistant">
      {isOpen && (
        <div 
          id={chatId}
          className="mb-6 w-[350px] md:w-[480px] h-[600px] bg-white border border-[#E5E7EB] shadow-2xl flex flex-col animate-in slide-in-from-bottom-6 zoom-in-95 duration-300 overflow-hidden rounded-2xl"
        >
          <header className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F5F7FA]">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-[#2563EB] rounded-lg shadow-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-[#1F2937] font-oswald font-bold uppercase tracking-widest text-sm leading-none">Compliance Co-Pilot</h3>
                <span className="text-[9px] font-bold text-[#059669] uppercase tracking-widest">Active_Node</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setChatHistory([])} className="p-2 text-[#9CA3AF] hover:text-[#2563EB]" title="Clear History">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-[#9CA3AF] hover:text-[#2563EB]">
                <X className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white" ref={chatScrollRef} aria-live="polite">
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-10 space-y-6">
                <Terminal className="w-10 h-10 text-[#4B5563]" />
                <div>
                  <p className="text-xs font-bold text-[#1F2937] uppercase tracking-[0.2em]">Query Compliance Base</p>
                  <p className="text-[10px] text-[#4B5563] mt-2 leading-relaxed uppercase">Ask about OSHA standards, site risks, or findings summary.</p>
                </div>
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`text-[8px] font-bold uppercase mb-1 tracking-widest ${msg.role === 'user' ? 'text-[#9CA3AF]' : 'text-[#2563EB]'}`}>
                  {msg.role === 'user' ? user?.name : 'Compliance_AI'}
                </div>
                <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#EEF2F6] text-[#1F2937]' : 'bg-white border border-[#E5E7EB] text-[#1F2937]'}`}>
                  <div className={`prose prose-sm max-w-none ${msg.role === 'model' ? 'prose-headings:text-[#2563EB] prose-headings:font-oswald' : ''}`}>
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
                      <span className="text-[9px] font-bold uppercase text-[#9CA3AF] flex items-center gap-2">
                        <ExternalLink className="w-3 h-3" /> Grounded References:
                      </span>
                      {msg.sources.map((chunk: any, idx: number) => chunk.web && (
                        <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-[#2563EB] hover:underline truncate">
                          {chunk.web.title || chunk.web.uri}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="text-[8px] font-bold text-[#2563EB] uppercase mb-1 tracking-widest">Compliance_AI</div>
                <div className="flex items-center gap-3 bg-[#F5F7FA] px-4 py-3 rounded-2xl border border-[#E5E7EB]">
                  <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-widest">Scanning manifests...</span>
                </div>
              </div>
            )}
          </div>

          <footer className="p-4 bg-[#F5F7FA] border-t border-[#E5E7EB]">
            <form onSubmit={handleChat} className="flex gap-3">
              <input 
                ref={inputRef}
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                placeholder="Submit inquiry..."
                className="flex-1 bg-white border border-[#E5E7EB] px-4 py-2.5 text-sm rounded-xl focus:border-[#2563EB] focus:outline-none transition-all shadow-sm"
              />
              <button 
                type="submit" 
                disabled={!chatMessage.trim() || isChatLoading} 
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white p-3 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </footer>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-[#2563EB] rotate-90' : 'bg-[#2563EB]'}`}
      >
        {isOpen ? <X className="w-7 h-7 text-white" /> : <MessageSquare className="w-7 h-7 text-white" />}
      </button>
    </div>
  );
};
