import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePostulantes() {
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapSupabaseToPostulante = (row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    whatsapp: row.whatsapp,
    nationality: row.nationality,
    status: row.status,
    createdAt: row.created_at,
  });

  useEffect(() => {
    const fetchPostulantes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('postulantes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setPostulantes(data.map(mapSupabaseToPostulante));
      }
      setLoading(false);
    };

    fetchPostulantes();

    const subscription = supabase
      .channel('postulantes_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'postulantes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPostulantes(prev => [mapSupabaseToPostulante(payload.new), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setPostulantes(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setPostulantes(prev => prev.map(p => p.id === payload.new.id ? mapSupabaseToPostulante(payload.new) : p));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const removePostulante = async (id) => {
    try {
      const { error } = await supabase.from('postulantes').delete().eq('id', id);
      if (error) throw error;
      setPostulantes(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updatePostulanteStatus = async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('postulantes')
        .update({ status })
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setPostulantes(prev => prev.map(p => p.id === id ? mapSupabaseToPostulante(data[0]) : p));
      } else {
        // Fallback if select row is not returned due to RLS but update might have worked
        setPostulantes(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      }
      return { success: true };
    } catch (error) {
      console.error('Error in updatePostulanteStatus:', error);
      alert('Error al actualizar estado: ' + (error.message || 'Error desconocido'));
      return { success: false, error };
    }
  };

  return { postulantes, loading, removePostulante, updatePostulanteStatus };
}
