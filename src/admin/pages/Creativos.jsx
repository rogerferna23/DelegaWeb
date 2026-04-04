import React, { useState, useEffect } from 'react';
import { 
  Palette, Image as ImageIcon, Video, Folder, LayoutGrid, 
  Clock, ArrowRight, Sparkles, Download, Share2, Loader2,
  Calendar, Inbox
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Importar subcomponentes
import MyLibrary from '../components/creatives/MyLibrary';
import TemplatesGallery from '../components/creatives/TemplatesGallery';
import GenerarImageModal from '../components/creatives/GenerarImageModal';
import GenerarVideoModal from '../components/creatives/GenerarVideoModal';

export default function Creativos() {
  const [view, setView] = useState('home'); // 'home', 'image', 'video', 'library', 'templates'
  const [recentCreatives, setRecentCreatives] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      setLoadingRecent(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-library`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (data.ok) {
        setRecentCreatives(data.creatives.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching recent:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setView(template.template_type === 'video' ? 'video' : 'image');
  };

  const handleBack = () => {
    setView('home');
    setSelectedTemplate(null);
    fetchRecent(); // Refresh sidebar
  };

  // Renderizado condicional de vistas
  if (view === 'library') return <MyLibrary onBack={handleBack} />;
  if (view === 'templates') return <TemplatesGallery onSelectTemplate={handleSelectTemplate} onBack={handleBack} />;
  if (view === 'image') return <GenerarImageModal onBack={handleBack} initialPrompt={selectedTemplate?.prompt_template || ''} />;
  if (view === 'video') return <GenerarVideoModal onBack={handleBack} initialPrompt={selectedTemplate?.prompt_template || ''} />;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-6">
        <span className="hover:text-primary cursor-pointer" onClick={() => setView('home')}>Home</span>
        <span>/</span>
        <span className="text-gray-300">Creativos</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Palette className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">Creativos</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Generar Imágenes */}
            <div className="group bg-cardbg border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generar Imágenes</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Crear diseños para Meta Ads, Instagram con IA de última generación (DALL-E 3).
              </p>
              <button 
                onClick={() => setView('image')}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primaryhover text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-primary/20"
              >
                Empezar <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Generar Videos */}
            <div className="group bg-cardbg border border-white/5 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-6">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Generar Videos</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Crear videos cortos atractivos para publicidad con IA de Runway ML.
              </p>
              <button 
                onClick={() => setView('video')}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primaryhover text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-primary/20"
              >
                Empezar <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mi Biblioteca */}
            <div className="group bg-cardbg border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors mb-6">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mi Biblioteca</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Accede a todos tus creativos guardados anteriormente.
              </p>
              <button 
                onClick={() => setView('library')}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Ver <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Plantillas */}
            <div className="group bg-cardbg border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors mb-6">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Plantillas</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Utiliza plantillas prediseñadas optimizadas para conversión.
              </p>
              <button 
                onClick={() => setView('templates')}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Explorar <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Últimos creativos */}
        <div className="w-full lg:w-80">
          <div className="bg-cardbg border border-white/5 rounded-2xl p-5 sticky top-5 min-h-[400px] flex flex-col">
            <h2 className="flex items-center gap-2 text-white font-bold text-sm mb-6">
              <Clock className="w-4 h-4 text-gray-400" /> Últimos creativos
            </h2>
            
            {loadingRecent ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-[10px] text-gray-500">Actualizando historial...</p>
              </div>
            ) : recentCreatives.length > 0 ? (
              <div className="space-y-4 flex-1">
                {recentCreatives.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setView('library')}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/5 transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Video className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> 
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/5 mb-4">
                <Inbox className="w-8 h-8 text-gray-800 mb-3" />
                <p className="text-[10px] text-gray-500 leading-relaxed">No hay creaciones recientes. ¡Genera tu primera idea hoy!</p>
              </div>
            )}

            <button 
              onClick={() => setView('library')}
              className="w-full mt-4 py-2.5 text-xs text-gray-400 hover:text-white border border-white/5 hover:border-white/10 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Ver todo el historial <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
