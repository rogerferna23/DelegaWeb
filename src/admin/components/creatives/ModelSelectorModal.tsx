import { useState, useMemo } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import {
  IMAGE_MODELS, VIDEO_MODELS,
  IMAGE_FILTERS, VIDEO_FILTERS,
  SORT_OPTIONS, FILTER_TO_CATEGORY,
} from '../../data/modelsData';
import type { AIModel } from '../../data/modelsData';

type MediaType = 'image' | 'video';
type SortBy = 'recommended' | 'price_asc' | 'quality_desc' | 'speed_desc';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (model: AIModel) => void;
  currentModelId?: string;
}

const siglaColors: Record<string, string> = {
  'RC': '#f97316', 'BF': '#6366f1', 'G': '#9ca3af', 'BD': '#3b82f6',
  'AI': '#8b5cf6', 'X': '#fff', 'KS': '#eab308', 'MM': '#ec4899',
  'AL': '#06b6d4', 'PX': '#a855f7',
};

export default function ModelSelectorModal({ isOpen, onClose, onSelect, currentModelId }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [showSort, setShowSort] = useState(false);
  const [selectedId, setSelectedId] = useState(currentModelId || 'recraft-v3');

  const models = mediaType === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const filters = mediaType === 'image' ? IMAGE_FILTERS : VIDEO_FILTERS;

  const filteredModels = useMemo(() => {
    const cat = FILTER_TO_CATEGORY[activeFilter];
    const result = cat ? models.filter(m => m.category === cat) : [...models];

    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.credits - b.credits);
    } else if (sortBy === 'quality_desc') {
      result.sort((a, b) => b.credits - a.credits);
    } else if (sortBy === 'speed_desc') {
      result.sort((a, b) => {
        const aFast = a.category === 'velocidad' ? 0 : 1;
        const bFast = b.category === 'velocidad' ? 0 : 1;
        return aFast - bFast || a.credits - b.credits;
      });
    }

    return result;
  }, [models, activeFilter, sortBy]);

  const recommended = activeFilter === 'Todos'
    ? models.filter(m => m.recommended)
    : [];

  const handleConfirm = () => {
    const model = models.find(m => m.id === selectedId);
    if (model) onSelect(model);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[49] flex items-center justify-center p-4 lg:pr-[466px]">
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
              <span className="text-base leading-none">🖼️</span> Imagen
            </button>
            <button
              onClick={() => { setMediaType('video'); setActiveFilter('Todos'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                mediaType === 'video'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-base leading-none">🎬</span> Video
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
                      onClick={() => { setSortBy(opt.value as SortBy); setShowSort(false); }}
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
              <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                <span className="text-primary text-sm">✨</span> Recomendados para ti
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
            TODOS LOS MODELOS - {filteredModels.length}
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

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
  siglaColors: Record<string, string>;
  showRecommended?: boolean;
}

function ModelCard({ model, isSelected, onSelect, siglaColors }: ModelCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl border transition-all relative flex flex-col h-full ${
        isSelected
          ? 'bg-white/[0.02] border-primary'
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
      <div className="flex items-start gap-3 mb-3 pr-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            backgroundColor: `${siglaColors[model.sigla] || '#666'}15`,
            color: siglaColors[model.sigla] || '#666',
          }}
        >
          {model.sigla}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-white">{model.name}</span>
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider flex items-center"
              style={{
                backgroundColor: `${model.tagColor}20`,
                color: model.tagColor,
                border: `1px solid ${model.tagColor}40`,
              }}
            >
              {model.tagIcon && <span className="mr-1">{model.tagIcon}</span>}
              {model.tag}
            </span>
          </div>
          <p className="text-[11px] text-gray-400">{model.company}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-300 mb-4 leading-relaxed line-clamp-2">
        {model.description}
      </p>

      <div className="mt-auto"></div>

      {/* Pricing Row */}
      <div className="flex items-end justify-between w-full mt-2 pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-white text-[12px]">{model.pricePerUnit}</span>
          <span className="text-gray-500 text-[10px]">{model.unitsPerDollar}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-gray-500 text-[10px] text-right">Esta generación</span>
          <span className="font-bold text-primary text-[12px] text-right">{model.generationCost}</span>
        </div>
      </div>
    </button>
  );
}
