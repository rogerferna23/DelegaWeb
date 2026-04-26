import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface Creative {
  id: string;
  type: 'image' | 'video';
  name: string;
  created_at: string;
  url: string | null;
  dimensions?: string;
  duration?: number;
  status?: string;
}

export function useCreatives() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-library`,
        {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }
      );

      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Error al cargar creativos');

      setCreatives(data.creatives as Creative[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreatives();
  }, [fetchCreatives]);

  const deleteCreative = useCallback(async (id: string, type: 'image' | 'video') => {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-creative`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ creative_id: id, creative_type: type }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al eliminar');
    }

    setCreatives(prev => prev.filter(c => c.id !== id));
  }, []);

  return { creatives, loading, error, refetch: fetchCreatives, deleteCreative };
}
