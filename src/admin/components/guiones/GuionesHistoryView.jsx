import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Loader2, Calendar, Eye, Star, Trash2 } from 'lucide-react';

export default function GuionesHistoryView({ onVerDetalle }) {
  const [guiones, setGuiones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('guiones_historial')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setGuiones(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async (id, currentFav) => {
    setGuiones(prev => prev.map(g => g.id === id ? { ...g, favorito: !currentFav } : g));
    await supabase.from('guiones_historial').update({ favorito: !currentFav }).eq('id', id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este guión?')) return;
    setGuiones(prev => prev.filter(g => g.id !== id));
    await supabase.from('guiones_historial').delete().eq('id', id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (guiones.length === 0) {
    return (
      <div className="text-center py-20 border border-white/5 rounded-2xl bg-cardbg">
        <p className="text-gray-400">Aún no has generado ningún guión.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {guiones.map((guion) => (
        <div key={guion.id} className="bg-cardbg border border-white/10 p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/20 transition-all">
          <div className="flex items-start gap-4">
            <button onClick={() => toggleFavorito(guion.id, guion.favorito)}>
              <Star className={`w-5 h-5 mt-1 transition-colors ${guion.favorito ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-gray-400'}`} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary/20 text-primary text-[10px] uppercase font-bold py-0.5 px-2 rounded">
                  {guion.tipo}
                </span>
                {guion.es_optimizado && (
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase font-bold py-0.5 px-2 rounded">
                    Optimizado
                  </span>
                )}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(guion.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-white font-bold text-sm">
                Estructura: <span className="text-gray-300 font-normal">{guion.estructura}</span> | Tono: <span className="text-gray-300 font-normal">{guion.tono}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                {guion.gancho_preview || 'Sin vista previa'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onVerDetalle(guion)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4" /> Ver completo
            </button>
            <button 
              onClick={() => handleDelete(guion.id)}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
