import React, { useState, useEffect } from 'react';
import { 
  Folder, Search, Filter, Download, Trash2, 
  Image as ImageIcon, Video, Calendar, ArrowUpRight, 
  Loader2, AlertCircle, Inbox
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function MyLibrary({ onBack }) {
  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'image', 'video'

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-library`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error);

      setCreatives(data.creatives || []);
    } catch (err) {
      console.error('Error fetching library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este creativo?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-creative`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ creative_id: id, creative_type: type }),
      });

      if (response.ok) {
        setCreatives(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error('Error deleting creative:', err);
    }
  };

  const filtered = creatives.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || c.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Folder className="w-7 h-7 text-primary" /> Mi Biblioteca
          </h2>
          <p className="text-gray-500 text-xs mt-1">Gestiona y descarga tus creaciones generadas con IA.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por prompt..."
              className="bg-cardbg border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 w-64"
            />
          </div>
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-cardbg border border-white/5 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          >
            <option value="all">Todos</option>
            <option value="image">Imágenes</option>
            <option value="video">Videos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 text-sm">Cargando tu biblioteca...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="group bg-cardbg border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300">
              <div className="aspect-square relative bg-background flex items-center justify-center overflow-hidden">
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <video 
                    src={item.url} 
                    className="w-full h-full object-cover"
                    muted
                    onMouseOver={e => e.target.play()}
                    onMouseOut={e => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-3 bg-primary hover:bg-primaryhover text-white rounded-full transition-transform hover:scale-110"
                    title="Ver original"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => handleDelete(item.id, item.type)}
                    className="p-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/20"
                    title="Eliminar"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    item.type === 'image' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {item.type}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-white font-medium line-clamp-2 mb-3 h-8 leading-relaxed">
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {item.dimensions && <span>{item.dimensions}</span>}
                  {item.duration && <span>{item.duration}s</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-cardbg border border-white/5 border-dashed rounded-3xl py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-700" />
          </div>
          <h3 className="text-white font-bold mb-1">No hay creativos</h3>
          <p className="text-gray-500 text-xs max-w-[250px]">
            {searchTerm || filter !== 'all' 
              ? 'No se encontraron resultados para los filtros aplicados.' 
              : 'Aún no has generado ningún creativo. ¡Empieza creando algo increíble!'}
          </p>
          {(searchTerm || filter !== 'all') && (
            <button 
              onClick={() => { setSearchTerm(''); setFilter('all'); }}
              className="mt-6 text-primary text-xs font-bold hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
