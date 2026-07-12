import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import { useAccount } from '../context/AccountContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your AI Financial Advisor. Ask me how to save, about your total spend, or if your account is secure." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const endOfMessagesRef = useRef(null);
  const { activeAccount } = useAccount();

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/ai/chat?account_name=${encodeURIComponent(activeAccount)}`, { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        <div className="absolute w-14 h-14 bg-emerald-500 rounded-full animate-ping opacity-30"></div>
        <button 
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-emerald-500 hover:bg-emerald-400 text-[#09090b] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all group z-10"
        >
          <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] h-[500px] glass-card shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl border border-white/10 flex flex-col z-50 overflow-hidden transform transition-all">
      {/* Header */}
      <div className="bg-black/40 p-4 border-b border-white/5 flex justify-between items-center relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500"></div>
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white tracking-wide flex items-center">
            Guardian AI <Sparkles className="w-3 h-3 ml-1 text-yellow-400" />
          </h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-transparent">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
              m.role === 'user' 
                ? 'bg-emerald-500 text-[#09090b] font-medium rounded-tr-sm' 
                : 'bg-white/5 text-zinc-200 border border-white/10 rounded-tl-sm backdrop-blur-md'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3 rounded-2xl bg-white/5 text-zinc-200 border border-white/10 rounded-tl-sm backdrop-blur-md flex space-x-1 items-center h-10 shadow-lg">
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="w-full bg-zinc-800 text-sm text-white placeholder-zinc-500 border border-zinc-700 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="absolute right-2 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 p-1">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
