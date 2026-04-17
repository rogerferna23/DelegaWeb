import React, { useState, useEffect } from 'react';
import { X, Sparkles, Upload, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '../../data/modelsData';

export default function GenerationSidebar({ isOpen, onClose, preset, mediaType, onOpenModelSelector, selectedModelId }) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [variations, setVariations] = useState(1);
  const [duration, setDuration] = useState(8);

  // Determinar el modelo actual
  const allModels = mediaType === 'imagen' ? IMAGE_MODELS : VIDEO_MODELS;
  const currentModel = allModels.find(m => m.id === selectedModelId) || allModels[0];

  useEffect(() => {
    if (preset) {
      setPrompt(preset.imageDesc || '');
    }
  }, [preset]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[450px] bg-[#0a131f] border-l border-white/5 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              PRESET · {preset?.category || 'CUSTOM'}
            </p>
            <h2 className="text-xl font-bold text-white">{preset?.name || 'Nueva Generación'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          
          {/* Tu Prompt */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-white">Tu prompt</label>
              <button className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primaryhover transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Mejorar con IA
              </button>
            </div>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-background border border-white/10 rounded-xl p-4 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-primary/50 resize-none transition-colors"
              placeholder="Describe lo que quieres generar..."
            />
          </div>

          {/* Referencias */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Referencias <span className="text-xs font-normal text-gray-500">(opcional - hasta 4)</span>
            </label>
            <button className="w-full py-8 border border-white/10 border-dashed rounded-xl bg-background hover:bg-white/[0.02] transition-colors flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-gray-400 hover:border-white/20">
              <Upload className="w-5 h-5" />
              <span className="text-[11px]">Arrastra imágenes o haz clic para subir</span>
            </button>
          </div>

          {/* Modelo de IA */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
              🤖 Modelo de IA
            </label>
            <button 
              onClick={onOpenModelSelector}
              className="w-full p-4 border border-white/10 rounded-xl bg-background hover:border-white/20 hover:bg-white/[0.02] transition-all flex items-center gap-4 text-left"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: `${currentModel.tagColor}15`, color: currentModel.tagColor }}
              >
                {currentModel.sigla}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{currentModel.name}</span>
                  <span 
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${currentModel.tagColor}20`, color: currentModel.tagColor }}
                  >
                    {currentModel.tagIcon && <span className="mr-0.5">{currentModel.tagIcon}</span>}
                    {currentModel.tag}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                  <span>{currentModel.company}</span>
                  <span>·</span>
                  <span className="font-bold text-gray-300">{currentModel.generationCost}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Configuración */}
          <div>
            <label className="block text-sm font-bold text-white mb-4">Configuración</label>
            
            {/* Aspect Ratio */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-2">Aspect ratio</label>
              <div className="flex gap-2">
                {['1:1', '9:16', '16:9', '4:5', '3:4'].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      aspectRatio === ratio
                        ? 'bg-transparent border border-primary text-primary'
                        : 'bg-transparent border border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Variaciones */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">Variaciones</label>
                <span className="text-xs font-bold text-white">{variations}</span>
              </div>
              <input 
                type="range" 
                min="1" max="4" 
                value={variations}
                onChange={(e) => setVariations(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Duración (Solo Video) */}
            {mediaType === 'video' || mediaType === 'img2vid' ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-500">Duración</label>
                  <span className="text-xs font-bold text-white">{duration}s</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="30" step="1"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full h-1 bg-primary/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f97316 ${((duration - 5) / 25) * 100}%, rgba(255,255,255,0.1) ${((duration - 5) / 25) * 100}%)`
                  }}
                />
              </div>
            ) : null}

            {/* Resolución */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-2">Resolución</label>
              <button className="px-4 py-1.5 rounded-lg border border-primary text-primary text-xs font-bold">
                1080p
              </button>
            </div>

            {/* Avanzado */}
            <button className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
              <ChevronDown className="w-3.5 h-3.5" /> Avanzado
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0a131f]">
          <div className="flex items-end justify-between mb-4">
            <span className="text-[10px] font-bold text-gray-500">
              {currentModel.sigla} · {mediaType === 'imagen' ? 'HQ' : `${duration}s`} · HD
            </span>
            <span className="text-sm font-bold text-white flex gap-1">
              {currentModel.generationCost.split('·')[0].trim()} <span className="text-primary font-normal text-sm">· {currentModel.generationCost.split('·')[1].trim()}</span>
            </span>
          </div>
          
          <button className="w-full py-4 bg-primary hover:bg-primaryhover text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transform active:scale-[0.98]">
            <Zap className="w-4 h-4" /> Generar
          </button>
        </div>
      </div>
    </>
  );
}
