import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function useGastos() {
  const [gastos, setGastos] = useState([]);

  // Map Supabase snake_case/types to UI expectations
  const mapSupabaseToGasto = (row) => ({
    id: row.id,
    description: row.description || 'Gasto Desconocido',
    amount: parseFloat(row.amount) || 0,
    date: row.date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    // 1. Initial fetch
    const fetchGastos = async () => {
      const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .order('date', { ascending: true }); // sort chronologically

      if (!error && data) {
        setGastos(data.map(mapSupabaseToGasto));
      }
    };
    fetchGastos();

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
