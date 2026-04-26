import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Sparkles, Zap, Brain, Coins, CheckCircle, Loader2 } from 'lucide-react';

const MODELS = [
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    speed: '⚡ <1s',
    useCase: 'Respuestas rápidas y tareas sencillas',
    cost: '💵 Muy económico',
    icon: Zap,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20'
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    speed: '📊 2-3s',
    useCase: 'Análisis sólido y redacción creativa',
    cost: '💰 Costo medio',
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20'
  },
  {
    id: 'claude-opus-4-7',
    name: 'Claude Opus 4.7',
    speed: '🧠 5-10s',
    useCase: 'Análisis profundo y estrategia compleja',
    cost: '💰💰 Premium',
    icon: Brain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/20'
  },
  {
    id: 'gpt-5-4',
    name: 'ChatGPT 5.4',
    speed: '⚡ 1-2s',
    useCase: 'Razonamiento avanzado y estrategia compleja',
    cost: '💰💰 Premium',
    icon: Sparkles,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    borderColor: 'border-green-400/20'
  },
  {
    id: 'gpt-5-4-mini',
    name: 'ChatGPT 5.4 mini',
    speed: '⚡ Instantáneo',
    useCase: 'Tareas rápidas y generación de copy eficiente',
    cost: '💴 Económico',
    icon: Zap,
    color: 'text-teal-400',
    bgColor: 'bg-teal-400/10',
    borderColor: 'border-teal-400/20'
  }
];

export default function ClaudeModelSelector() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    fetchPreference();
  }, []);

  const fetchPreference = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_preferences')
        .select('preferred_claude_model')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setSelectedModel(data.preferred_claude_model);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (modelId: string) => {
    try {
      setIsSaving(true);
      setSelectedModel(modelId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          preferred_claude_model: modelId,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Preferencia guardada' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preference:', err);
      setMessage({ type: 'error', text: 'Error al guardar' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-cardbg border border-white/5 rounded-xl">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-cardbg border border-white/5 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white">Modelo de IA</h2>
            <p className="text-gray-500 text-[10px]">Configura el cerebro de tu asistente</p>
          </div>
        </div>
        {message && (
          <span className={`text-[10px] font-medium ${message.type === 'success' ? 'text-teal-400' : 'text-red-400'} animate-fade-in`}>
            {message.text}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {MODELS.map((m) => {
          const isActive = selectedModel === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => handleSave(m.id)}
              disabled={isSaving}
              className={`w-full text-left p-3.5 rounded-xl border transition-all relative group
                ${isActive ? `bg-background ${m.borderColor} shadow-[0_0_20px_rgba(255,255,255,0.02)]` : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isActive ? m.bgColor + ' ' + m.color : 'bg-white/5 text-gray-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
                      {m.name}
                    </span>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-teal-400" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" /> {m.speed}
                    </span>
                    <span className="text-[9px] text-gray-500 flex items-center gap-1">
                      <Coins className="w-2.5 h-2.5" /> {m.cost}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">{m.useCase}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2 px-1">
        <p className="text-[9px] text-gray-600 leading-relaxed italic">
          * El cambio de modelo se aplicará en tu siguiente mensaje del chat de IA.
        </p>
      </div>
    </div>
  );
}
