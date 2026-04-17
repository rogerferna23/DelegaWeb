import React, { useState } from 'react';
import { Image as ImageIcon, Video, ArrowRight, User, Search } from 'lucide-react';
import {
  IMAGE_PRESETS, VIDEO_PRESETS, AVATAR_PRESETS, PRESET_CATEGORIES,
} from '../../data/modelsData';

const MEDIA_TYPES = [
  { id: 'imagen', label: 'Imagen', icon: ImageIcon },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'img2vid', label: 'Imagen → Video', icon: ImageIcon },
  { id: 'avatar', label: 'Avatar / Lipsync', icon: User },
];

export default function GenerarTab({ onOpenGenerator, onOpenModelSelector }) {
  const [mediaType, setMediaType] = useState('imagen');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Determinar presets según sub-tab
  const getPresets = () => {
    switch (mediaType) {
      case 'imagen': return IMAGE_PRESETS;
      case 'video': return VIDEO_PRESETS;
      case 'img2vid': return VIDEO_PRESETS; // mismos que video
      case 'avatar': return AVATAR_PRESETS;
      default: return IMAGE_PRESETS;
    }
  };

  const presets = getPresets();

  // Filtrar por categoría y búsqueda
  const filtered = presets.filter(p => {
    const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Sub-navegación de tipo de medio */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {MEDIA_TYPES.map(mt => {
          const Icon = mt.icon;
          const isActive = mediaType === mt.id;
          return (
            <button
              key={mt.id}
              onClick={() => { setMediaType(mt.id); setActiveCategory('Todos'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {mt.label}
            </button>
          );
        })}
      </div>

      {/* Filtros de categoría + Búsqueda */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
          {PRESET_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar preset..."
            className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/30 w-48"
          />
        </div>
      </div>

      {/* Grid de presets */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(preset => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onClick={() => onOpenGenerator && onOpenGenerator(mediaType, preset)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-gray-600 text-xs">No hay presets para esta categoría.</p>
        </div>
      )}
    </div>
  );
}

// ─── Preset Card Sub-component ─────────────────────────────

function PresetCard({ preset, onClick }) {
  // Colores de gradiente para cada tipo de imagen
  const gradients = {
    'preset-img-1': 'from-red-700 via-red-600 to-red-900',
    'preset-img-2': 'from-blue-600 via-purple-600 to-pink-500',
    'preset-img-3': 'from-sky-400 via-sky-500 to-blue-600',
    'preset-img-4': 'from-gray-500 via-gray-600 to-gray-800',
    'preset-img-5': 'from-gray-300 via-gray-200 to-gray-100',
    'preset-img-6': 'from-red-500 via-red-600 to-red-800',
    'preset-img-7': 'from-amber-400 via-amber-500 to-orange-600',
    'preset-img-8': 'from-gray-800 via-gray-900 to-black',
    'preset-vid-1': 'from-amber-700 via-amber-800 to-amber-950',
    'preset-vid-2': 'from-red-800 via-red-900 to-black',
    'preset-vid-3': 'from-gray-600 via-gray-700 to-gray-900',
    'preset-vid-4': 'from-pink-500 via-purple-500 to-purple-700',
    'preset-vid-5': 'from-green-500 via-green-600 to-green-800',
    'preset-avatar-1': 'from-rose-600 via-rose-700 to-rose-900',
  };

  const gradient = gradients[preset.id] || 'from-gray-700 to-gray-900';
  const isSmall = preset.small;

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden bg-cardbg border border-white/5 hover:border-primary/30 transition-all duration-300 text-left ${
        isSmall ? '' : ''
      }`}
    >
      {/* Image Area */}
      <div className={`relative bg-gradient-to-br ${gradient} ${isSmall ? 'aspect-[4/3]' : 'aspect-[3/4]'}`}>
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10">
          {preset.badge && (
            <span
              className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: preset.badgeColor }}
            >
              {preset.badge}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${
            preset.typeBadge === 'IMAGEN' ? 'bg-blue-500/80' :
            preset.typeBadge === 'VIDEO' ? 'bg-blue-500/80' :
            'bg-blue-500/80'
          }`}>
            {preset.typeBadge}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
      </div>

      {/* Text */}
      <div className="p-3">
        <p className="text-xs font-bold text-white truncate">{preset.name}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{preset.category}</p>
      </div>
    </button>
  );
}
