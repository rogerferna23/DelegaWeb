import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Postulante {
  id: string;
  fullName: string;
  email: string;
  whatsapp: string;
  nationality: string;
  status: string;
  createdAt: string;
}

interface OperationResult {
  success: boolean;
  error?: unknown;
}

export function usePostulantes() {
  const [postulantes, setPostulantes] = useState<Postulante[]>([]);
  const [loading, setLoading] = useState(true);

  const mapSupabaseToPostulante = useCallback((row: Record<string, unknown>): Postulante => ({
    id:          String(row.id          ?? ''),
    fullName:    String(row.full_name   ?? ''),
    email:       String(row.email       ?? ''),
    whatsapp:    String(row.whatsapp    ?? ''),
    nationality: String(row.nationality ?? ''),
    status:      String(row.status      ?? ''),
    createdAt:   String(row.created_at  ?? ''),
  }), []);

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
          setPostulantes(prev => [mapSupabaseToPostulante(payload.new as Record<string, unknown>), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setPostulantes(prev => prev.filter(p => p.id !== (payload.old as { id: string }).id));
        } else if (payload.eventType === 'UPDATE') {
          setPostulantes(prev => prev.map(p =>
            p.id === (payload.new as { id: string }).id
              ? mapSupabaseToPostulante(payload.new as Record<string, unknown>)
              : p,
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [mapSupabaseToPostulante]);

  const removePostulante = async (id: string): Promise<OperationResult> => {
    try {
      const { error } = await supabase.from('postulantes').delete().eq('id', id);
      if (error) throw error;
      setPostulantes(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const updatePostulanteStatus = async (id: string, status: string): Promise<OperationResult> => {
    try {
      const { data, error } = await supabase
        .from('postulantes')
        .update({ status })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setPostulantes(prev => prev.map(p =>
          p.id === id ? mapSupabaseToPostulante(data[0] as Record<string, unknown>) : p,
        ));
      } else {
        setPostulantes(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      }
      return { success: true };
    } catch (error) {
      console.error('Error in updatePostulanteStatus:', error);
      return { success: false, error };
    }
  };

  return { postulantes, loading, removePostulante, updatePostulanteStatus };
}
