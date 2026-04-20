import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Tama\u00F1o de lote para carga progresiva.
const PAGE_SIZE = 500;

export function useGastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Map Supabase snake_case/types to UI expectations
  const mapSupabaseToGasto = (row) => ({
    id: row.id,
    description: row.description || 'Gasto Desconocido',
    amount: parseFloat(row.amount) || 0,
    date: row.date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    let cancelled = false;

    // Carga progresiva por lotes. Ver comentarios en useVentas.js.
    const fetchGastosPaginated = async () => {
      setLoading(true);
      let from = 0;
      const accumulated = [];

      while (!cancelled) {
        const { data, error } = await supabase
          .from('gastos')
          .select('*')
          .order('date', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error || !data) break;

        const mapped = data.map(mapSupabaseToGasto);
        accumulated.push(...mapped);
        // Actualizamos progresivamente para que la UI responda antes de terminar.
        setGastos([...accumulated]);

        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      if (!cancelled) setLoading(false);
    };

    fetchGastosPaginated();

    // 2. Realtime subscription (mirrors useVentas)
    const subscription = supabase
      .channel('gastos_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setGastos(prev => {
            const newArray = [...prev, mapSupabaseToGasto(payload.new)];
            return newArray.sort((a, b) => new Date(a.date) - new Date(b.date));
          });
        } else if (payload.eventType === 'DELETE') {
          setGastos(prev => prev.filter(g => g.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setGastos(prev => prev.map(g => g.id === payload.new.id ? mapSupabaseToGasto(payload.new) : g));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, []);

  const addGasto = async (entry) => {
    const { error } = await supabase.from('gastos').insert({
      description: entry.description,
      amount: parseFloat(entry.amount) || 0,
      date: entry.date
    });

    if (error) {
      console.error('Error adding gasto:', error);
      return { success: false, error };
    }
    // Realtime channel handles state update
    return { success: true };
  };

  const removeGasto = async (id) => {
    // Optimistic UI update could be added here, relying on DB and Realtime for now
    await supabase.from('gastos').delete().eq('id', id);
  };

  // Group totals by month abbreviation
  const totalsByMonth = gastos.reduce((acc, g) => {
    if (!g.date) return acc;
    const monthIdx = new Date(g.date).getMonth();
    const monthKey = MONTHS[monthIdx];
    acc[monthKey] = (acc[monthKey] || 0) + (g.amount || 0);
    return acc;
  }, {});

  const totalGastos = gastos.reduce((sum, g) => sum + (g.amount || 0), 0);

  return { gastos, addGasto, removeGasto, totalsByMonth, totalGastos };
}
