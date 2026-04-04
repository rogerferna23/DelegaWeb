import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, ImageIcon, Video, Search, 
  Sparkles, Loader2, Bookmark, CheckCircle2,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function TemplatesGallery({ onSelectTemplate }) {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-templates`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      setCategories(data.templates || {});
      const firstCat = Object.keys(data.templates)[0];
      if (firstCat) setActiveCategory('all');
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const allTemplates = Object.values(categories).flat();
  const filtered = (activeCategory === 'all' 
    ? allTemplates 
    : categories[activeCategory] || []
  ).filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryNames = {
    'meta_ads': 'Meta Ads',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'tiktok': 'TikTok',
    'all': 'Todos'
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 text-primary" /> Plantillas de IA
          </h2>
          <p className="text-gray-500 text-xs mt-1">Lanza campañas en segundos con prompts optimizados por expertos.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar plantilla..."
            className="bg-cardbg border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-64"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeCategory === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          Todos
        </button>
        {Object.keys(categories).map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {categoryNames[cat] || cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Cargando catálogo...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <div 
              key={t.id} 
              className="group bg-cardbg border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col"
            >
              <div className="aspect-[16/9] relative bg-background overflow-hidden">
                <img 
                  src={t.thumbnail_url || 'https://via.placeholder.com/400x225/111/444?text=Plantilla'} 
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-[10px] text-white font-bold px-2 py-1 rounded-md uppercase">
                    {categoryNames[t.category] || t.category}
                  </span>
                  {t.template_type === 'video' ? (
                    <span className="bg-orange-500 text-[10px] text-white font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Video
                    </span>
                  ) : (
                    <span className="bg-blue-500 text-[10px] text-white font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" /> Imagen
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-white font-bold text-base mb-2 group-hover:text-primary transition-colors">{t.name}</h3>
                <p className="text-gray-500 text-[11px] mb-6 flex-1 italic leading-relaxed">"{t.description}"</p>
                
                <button 
                  onClick={() => onSelectTemplate(t)}
                  className="w-full py-3 bg-white/5 hover:bg-primary text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 group-active:scale-95"
                >
                  Usar Plantilla <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cardbg border border-white/5 border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500 text-xs">No se encontraron plantillas para tu búsqueda.</p>
          <button 
            onClick={() => { setSearchTerm(''); setActiveCategory('all'); }}
            className="mt-4 text-primary text-xs font-bold hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
