import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Send, Sparkles, BarChart2, MessageSquare, Target, Zap, Brain, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '../../lib/supabase';

// Sanitiza un mensaje del chat permitiendo solo <strong> y <br>, tras aplicar markdown mínimo.
const renderMessage = (content) => {
  const withFormatting = String(content ?? '')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n/g, '<br/>');
  return DOMPurify.sanitize(withFormatting, {
    ALLOWED_TAGS: ['strong', 'br'],
    ALLOWED_ATTR: ['class'],
  });
};

export default function AIChatPanel({ isVisible, setVisible }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy Claude, tu estratega de Meta Ads en DelegaWeb.\n\nEn este **modo de solo lectura**, analizo tus datos reales para darte instrucciones exactas de optimización que tú mismo aplicarás en Meta Ads Manager. ¿Qué campaña analizamos hoy?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState({ name: 'Cargando...', icon: Sparkles });
  const messagesEndRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isVisible) fetchActiveModel();
  }, [isVisible]);

  const fetchActiveModel = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('preferred_claude_model')
        .eq('user_id', user.id)
        .maybeSingle();

      const modelId = data?.preferred_claude_model || 'claude-sonnet-4-6';
      const modelMap = {
        'claude-haiku-4-5-20251001': { name: 'Haiku 4.5', icon: Zap, color: 'text-blue-400' },
        'claude-sonnet-4-6': { name: 'Sonnet 4.6', icon: Sparkles, color: 'text-primary' },
        'claude-opus-4-6': { name: 'Opus 4.6', icon: Brain, color: 'text-purple-400' },
        'gpt-5-4': { name: 'GPT 5.4', icon: Bot, color: 'text-green-400' }
      };
      setActiveModel(modelMap[modelId] || modelMap['claude-sonnet-4-6']);
    } catch (err) {
      console.error('Error fetching active model:', err);
    }
  };


  const quickSuggestions = [
    { label: "Analizar CPM", message: "Analiza el CPM de mis campañas, ¿cuál debo optimizar?", icon: Target },
    { label: "Ideas de Audiencia", message: "Dame sugerencias de segmentación para un público de emprendedores", icon: Sparkles },
    { label: "Estrategia de Copy", message: "Genera 3 variaciones de copy para retargeting", icon: MessageSquare },
    { label: "Resumen Semanal", message: "Dame un resumen del rendimiento de los últimos 7 días", icon: BarChart2 },
  ];

  const handleSend = async (text = null) => {
    const textToSend = text || input;
    if (!textToSend.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { message: textToSend }
      });

      if (error) throw error;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message || 'Lo siento, no pude procesar tu mensaje.' 
      }]);
    } catch (err) {
      console.error('Error en AI Chat:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Hubo un error al conectar con el estratega IA. Por favor, verifica tu conexión o intenta de nuevo.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {/* Botón flotante para abrir el Asistente IA */}
      <button 
        onClick={() => setVisible(true)}
        className={`fixed bottom-6 right-6 bg-primary hover:bg-primaryhover text-white rounded-full p-3.5 shadow-[0_8px_20px_-4px_rgba(249,115,22,0.6)] flex items-center justify-center z-[60] group transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible ? 'scale-0 opacity-0 translate-y-5 pointer-events-none' : 'scale-100 opacity-100 translate-y-0 hover:scale-110 active:scale-95'}`}
        title="Abrir Asistente IA"
      >
        <Bot className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-orange-500 border-2 border-[#040b14] rounded-full text-[8px] font-bold flex items-center justify-center translate-x-1 outline outline-1 outline-[#1e293b]">1</span>
      </button>

      {/* Asistente IA Flotante/Dockado */}
      <div className={`fixed top-24 right-5 w-[330px] bg-cardbg/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col h-[calc(100vh-130px)] z-[60] overflow-hidden origin-bottom-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isVisible ? 'scale-100 opacity-100 translate-y-0 translate-x-0' : 'scale-75 opacity-0 translate-y-12 translate-x-8 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 ${activeModel.color}`}>
              <activeModel.icon className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-tight">{activeModel.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div>
            <span className="font-bold text-white text-[10px] uppercase tracking-widest opacity-70">Estratega IA</span>
          </div>
          <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-white pb-0.5 transition-colors p-1 hover:bg-white/5 rounded-lg ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                className={`p-3.5 rounded-2xl text-[12px] shadow-sm max-w-[90%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary/90 text-white rounded-tr-sm'
                  : 'bg-background border border-white/5 rounded-tl-sm text-gray-300'
              }`} />
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col gap-1 items-start">
              <div className="bg-background border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input libre y Sugerencias */}
        <div className="p-4 bg-background/50 border-t border-white/5 space-y-4 backdrop-blur-sm">
          
          <div className="grid grid-cols-2 gap-2">
            {quickSuggestions.map((sug, i) => {
              const Icon = sug.icon;
              return (
                <button 
                  key={i} 
                  onClick={() => handleSend(sug.message)} 
                  className="flex flex-col items-start gap-1 p-2 rounded-xl border border-white/5 text-gray-400 hover:text-white hover:border-white/10 transition-all bg-white/[0.02] hover:bg-white/[0.05] group"
                >
                  <Icon className="w-3.5 h-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                  <span className="text-[9px] font-bold uppercase tracking-tight text-left leading-tight">{sug.label}</span>
                </button>
              );
            })}
          </div>
          
          <div className="relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre tus campañas..." 
              disabled={isLoading}
              className="w-full bg-cardbg border border-white/10 rounded-xl pl-4 pr-10 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all disabled:opacity-50"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-primary text-white px-3 rounded-lg hover:bg-primaryhover transition-colors flex items-center justify-center disabled:opacity-50 shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-center">
            <p className="text-[9px] text-gray-600 font-medium">Asesoría basada en datos reales de Meta Ads</p>
          </div>
        </div>

      </div>
    </>, document.body
  );
}
