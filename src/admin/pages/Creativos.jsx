import React, { useState } from 'react';
import {
  Palette, Zap, Plus, ArrowRight, Flame,
} from 'lucide-react';
import { DEMO_ACTIVITY } from '../data/modelsData';
import { useUrlParam } from '../../hooks/useUrlParam';

// Sub-components
import GenerarTab from '../components/creatives/GenerarTab';
import MyLibrary from '../components/creatives/MyLibrary';
import TemplatesGallery from '../components/creatives/TemplatesGallery';
import HistoryTab from '../components/creatives/HistoryTab';
import ModelSelectorModal from '../components/creatives/ModelSelectorModal';
import GenerationSidebar from '../components/creatives/GenerationSidebar';

const TABS = [
  { id: 'generar', label: 'Generar' },
  { id: 'biblioteca', label: 'Mi Biblioteca' },
  { id: 'plantillas', label: 'Plantillas' },
  { id: 'historial', label: 'Historial' },
];

export default function Creativos() {
  // El tab queda persistido en ?tab=... para que sobreviva a refresh y
  // a navegaciones entre secciones del admin (antes volvía siempre a
  // 'generar' aunque viniera de 'biblioteca').
  const [activeTab, setActiveTab] = useUrlParam('tab', 'generar');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState('imagen');

  const handleOpenGenerator = (mediaType, preset) => {
    setActivePreset(preset);
    setActiveMediaType(mediaType);
    setShowSidebar(true);
  };

  const handleOpenModelSelector = () => {
    setShowModelSelector(true);
  };

  const handleModelSelected = (model) => {
    setSelectedModel(model);
    setShowModelSelector(false);
    // You could optionally re-open the sidebar if it was the context
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-5">
        <span className="hover:text-primary cursor-pointer">Home</span>
        <span>›</span>
        <span className="text-gray-300 font-medium">Creativos</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Creativos con IA</h1>
            <p className="text-gray-500 text-xs mt-0.5">
              Genera imágenes y videos publicitarios profesionales en segundos
            </p>
          </div>
        </div>

        {/* Credits */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-cardbg border border-white/5 rounded-xl">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-white">1240</span>
            <span className="text-xs text-gray-500">créditos</span>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" /> Recargar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Layout: Content + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'generar' && (
            <GenerarTab
              onOpenGenerator={handleOpenGenerator}
              onOpenModelSelector={() => setShowModelSelector(true)}
            />
          )}
          {activeTab === 'biblioteca' && <MyLibrary />}
          {activeTab === 'plantillas' && <TemplatesGallery />}
          {activeTab === 'historial' && <HistoryTab />}
        </div>

        {/* Sidebar — Actividad reciente */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-cardbg border border-white/5 rounded-2xl p-5 sticky top-5">
            <h2 className="flex items-center gap-2 text-white font-bold text-sm mb-5">
              <Flame className="w-4 h-4 text-orange-400" />
              Actividad reciente
            </h2>

            <div className="space-y-3">
              {DEMO_ACTIVITY.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  {/* Thumb */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.thumbGradient} flex-shrink-0`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">
                      {item.model} · {item.timeAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('historial')}
              className="w-full mt-4 py-2.5 text-xs text-gray-400 hover:text-white border border-white/5 hover:border-white/10 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Ver todo el historial <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Model Selector Modal */}
      <ModelSelectorModal
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        onSelect={handleModelSelected}
        currentModelId={selectedModel?.id}
      />

      {/* Generation Sidebar */}
      <GenerationSidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        preset={activePreset}
        mediaType={activeMediaType}
        onOpenModelSelector={handleOpenModelSelector}
        selectedModelId={selectedModel?.id || (activeMediaType === 'imagen' ? 'flux-2-pro' : 'veo-3-1')}
      />
    </div>
  );
}
