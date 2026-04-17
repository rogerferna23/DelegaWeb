import React, { useState, useMemo } from 'react';
import { X, Image as ImageIcon, Video, ChevronDown, Check } from 'lucide-react';
import {
  IMAGE_MODELS, VIDEO_MODELS,
  IMAGE_FILTERS, VIDEO_FILTERS,
  SORT_OPTIONS, FILTER_TO_CATEGORY,
} from '../../data/modelsData';

export default function ModelSelectorModal({ isOpen, onClose, onSelect, currentModelId }) {
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('recommended');
  const [showSort, setShowSort] = useState(false);
  const [selectedId, setSelectedId] = useState(currentModelId || 'recraft-v3');

  if (!isOpen) return null;

  const models = mediaType === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const filters = mediaType === 'image' ? IMAGE_FILTERS : VIDEO_FILTERS;

  const filteredModels = useMemo(() => {
    const cat = FILTER_TO_CATEGORY[activeFilter];
    let result = cat ? models.filter(m => m.category === cat) : [...models];

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.credits - b.credits);
    } else if (sortBy === 'quality_desc') {
      result.sort((a, b) => b.credits - a.credits);
    } else if (sortBy === 'speed_desc') {
      result.sort((a, b) => a.credits - b.credits);
    }

    return result;
  }, [models, activeFilter, sortBy]);

  const recommended = mediaType === 'image' && activeFilter === 'Todos'
    ? models.filter(m => m.recommended)
    : [];

  const handleConfirm = () => {
    const model = models.find(m => m.id === selectedId);
    if (model) onSelect(model);
    onClose();
  };

  const siglaColors = {
    'RC': '#f97316', 'BF': '#6366f1', 'G': '#9ca3af', 'BD': '#3b82f6',
    'AI': '#8b5cf6', 'X': '#fff', 'KS': '#eab308', 'MM': '#ec4899',
    'AL': '#06b6d4', 'PX': '#a855f7',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#0c1520] border border-white/10 rounded-3xl w-full max-w-[680px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-bold text-white mb-1">Elige tu modelo de IA</h2>
          <p className="text-gray-500 text-xs mb-5">
            Acceso a los mejores modelos del mundo. Transparencia total de precios.
          </p>

          {/* Media Type Toggle */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => { setMediaType('image'); setActiveFilter('Todos'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mediaType === 'image'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Imagen
            </button>
            <button
              onClick={() => { setMediaType('video'); setActiveFilter('Todos'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mediaType === 'video'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Video
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {filters.map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    activeFilter === f
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSort && (
                <div className="absolute top-full right-0 mt-1 bg-[#0f1a28] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[160px] z-10">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2 text-[11px] transition-colors flex items-center gap-2 ${
                        sortBy === opt.value ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {sortBy === opt.value && <Check className="w-3 h-3 text-primary" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 scrollbar-thin">
          {/* Recommended Section */}
          {recommended.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Recomendados para ti
              </p>
              {recommended.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedId === model.id}
                  onSelect={() => setSelectedId(model.id)}
                  siglaColors={siglaColors}
                  showRecommended
                />
              ))}
            </div>
          )}

          {/* All Models */}
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
            TODOS LOS MODELOS · {filteredModels.length}
          </p>

          {filteredModels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
              {filteredModels.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={selectedId === model.id}
                  onSelect={() => setSelectedId(model.id)}
                  siglaColors={siglaColors}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-gray-600 text-xs">No hay modelos en esta categoría.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex items-center justify-between gap-4">
          <p className="text-[10px] text-gray-600 leading-relaxed flex-1">
            Los precios reflejan el costo real de la API. Los créditos se descuentan al completarse la generación.
          </p>
          <button
            onClick={handleConfirm}
            className="px-8 py-3 bg-primary hover:bg-primaryhover text-white font-bold text-sm rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            Seleccionar modelo
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Model Card Sub-component ──────────────────────────────

function ModelCard({ model, isSelected, onSelect, siglaColors, showRecommended }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-all relative ${
        isSelected
          ? 'bg-primary/5 border-primary/60'
          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
      }`}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Sigla + Name + Tag */}
      <div className="flex items-start gap-3 mb-1.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: `${siglaColors[model.sigla] || '#666'}15`,
            color: siglaColors[model.sigla] || '#666',
          }}
        >
          {model.sigla}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white">{model.name}</span>
            <span
              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: `${model.tagColor}20`,
                color: model.tagColor,
              }}
            >
              {model.tagIcon && <span className="mr-0.5">{model.tagIcon}</span>}
              {model.tag}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5">{model.company}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-primary/80 mb-3 leading-relaxed">
        {model.description}
      </p>

      {/* Pricing Row */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1">
          <span className="font-bold text-white">{model.pricePerUnit}</span>
          <span className="text-gray-600 ml-1">{model.unitsPerDollar}</span>
        </div>
        <div className="text-gray-500">
          Esta generación <span className="font-bold text-gray-400 ml-1">{model.generationCost}</span>
        </div>
      </div>
    </button>
  );
}
