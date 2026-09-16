import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Cpu, 
  Layers, 
  Scale, 
  Zap, 
  Search, 
  FileText,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import type { PartItem } from '../types/plm';
import { useTheme } from '../context/ThemeContext';

interface AiCopilotProps {
  parts: PartItem[];
}

export const AiCopilot: React.FC<AiCopilotProps> = ({ parts }) => {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; data?: any }>>([
    {
      sender: 'ai',
      text: 'Hello Alex! I am ApexAI, your Enterprise PLM Engineering Assistant. I can analyze CAD geometry, predict ECN impact, detect duplicate part numbers, and suggest DFM material optimizations.'
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    const userText = query;
    setQuery('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);

    setTimeout(() => {
      let responseText = 'ApexAI processed your query across CAD metadata and BOM trees.';
      let extraData: any = null;

      if (userText.toLowerCase().includes('material') || userText.toLowerCase().includes('weight')) {
        responseText = 'AI Material Recommendation: Switching planet carrier from Al 7075-T6 to Carbon Fiber Composite reduces assembly mass by 1.2 kg while retaining torsional fatigue strength (> 450 Nm).';
      } else if (userText.toLowerCase().includes('duplicate') || userText.toLowerCase().includes('part')) {
        responseText = 'Duplicate Part Detection Alert: PN-PIN-515 dowel pin shares 99.4% geometric bounding dimensions with legacy part PN-PIN-402.';
      } else {
        responseText = 'ECN Impact Prediction: Increasing sun gear root fillet radius to R1.2mm will increase machining cycle time by +12 sec per gear, but reduces peak von Mises stress by 32%.';
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: responseText, data: extraData }]);
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className={`rounded-[18px] p-6 border shadow-sm flex items-center justify-between transition-colors ${
        isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white font-extrabold shadow-sm">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight flex items-center space-x-2 ${
              isDark ? 'text-[#F1F5F9]' : 'text-[#172033]'
            }`}>
              <span>ApexAI Enterprise Engineering Copilot</span>
              <span className="badge-status badge-active text-[10px]">
                GPT-4o Powered
              </span>
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
              Natural language PLM query, automated DFM material recommendations, duplicate part detection, and ECN risk prediction.
            </p>
          </div>
        </div>
      </div>

      {/* Main AI Chat & Assistant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Drawer (8 Cols) */}
        <div className={`lg:col-span-8 rounded-2xl p-5 border shadow-sm flex flex-col h-[520px] transition-colors ${
          isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
        }`}>
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl text-xs max-w-[85%] font-sans ${
                  msg.sender === 'user'
                    ? 'btn-primary ml-auto rounded-br-none'
                    : isDark ? 'bg-[#0D1628] border border-[#243149] text-[#F1F5F9] rounded-bl-none' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] rounded-bl-none'
                }`}
              >
                <div className={`font-bold mb-1 flex items-center space-x-1 text-[10px] ${
                  msg.sender === 'user' ? 'text-white/80' : isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}>
                  {msg.sender === 'ai' ? <Bot className="w-3.5 h-3.5 text-cyan-500" /> : null}
                  <span>{msg.sender === 'ai' ? 'ApexAI Copilot' : 'Alex Rivera'}</span>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className={`flex items-center space-x-2 border-t pt-3 ${
            isDark ? 'border-[#243149]' : 'border-[#E2E8F0]'
          }`}>
            <input
              type="text"
              placeholder="Ask ApexAI (e.g. 'Predict cost impact of switching shaft material to Ti-6Al-4V')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 plm-input text-xs"
            />
            <button
              type="submit"
              className="btn-primary p-2.5 rounded-xl cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* AI Insight Cards (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`rounded-2xl p-4 border shadow-sm space-y-3 text-xs ${
            isDark ? 'bg-[#111B2E] border-[#243149]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <h3 className="text-xs uppercase tracking-wider text-cyan-500 font-bold flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>AI Dashboard Insights</span>
            </h3>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className="text-emerald-500 font-bold block text-[11px]">Duplicate Geometry Flag</span>
              <p className={`text-[11px] ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                Part PN-PIN-515 shares 99.4% bounding envelope with existing inventory item PN-PIN-402. Re-using saves $1,200 tooling fee.
              </p>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 ${
              isDark ? 'bg-[#0D1628] border-[#243149]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
            }`}>
              <span className="text-amber-500 font-bold block text-[11px]">Drawing OCR Reader</span>
              <p className={`text-[11px] ${isDark ? 'text-[#CBD5E1]' : 'text-[#475569]'}`}>
                Scanned ASME Y14.5 drawing DWG-GBX-5000-01. Extracted 14 GD&T feature control frames automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

