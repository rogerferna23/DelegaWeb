import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// Misma ventana por defecto que useVentas: últimos 13 meses.
function defaultDateFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

const PAGE_SIZE = 200;

export function useGastos({ dateFrom } = {}) {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);

  const from = dateFrom || defaultDateFrom();

  const mapSupabaseToGasto = useCallback((row) => ({
    id: row.id,
    description: row.description || 'Gasto Desconocido',
    amount: parseFloat(row.amount) || 0,
    date: row.date || new Date().toISOString().split('T')[0],
  }), []);

  useEffect(() => {
    let cancelled = false;

    const fetchGastos = async () => {
      setLoading(true);
      let offset = 0;
      const accumulated = [];

      while (!cancelled) {
        const { data, error } = await supabase
          .from('gastos')
          .select('*')
          .gte('date', from)            // filtro server-side — 'date' siempre se inserta explícito
          .order('date', { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error || !data) break;

        accumulated.push(...data.map(mapSupabaseToGasto));
        setGastos([...accumulated]);

        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (!cancelled) setLoading(false);
    };

    fetchGastos();

    const subscription = supabase
      .channel('gastos_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gastos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const g = mapSupabaseToGasto(payload.new);
          if (g.date >= from) {
            setGastos(prev => [...prev, g].sort((a, b) =>
              new Date(a.date) - new Date(b.date)
            ));
          }
        } else if (payload.eventType === 'DELETE') {
          setGastos(prev => prev.filter(g => g.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setGastos(prev => prev.map(g =>
            g.id === payload.new.id ? mapSupabaseToGasto(payload.new) : g
          ));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [from, mapSupabaseToGasto]);

  const addGasto = async (entry) => {
    const { error } = await supabase.from('gastos').insert({
      description: entry.description,
      amount: parseFloat(entry.amount) || 0,
      date: entry.date,
    });

    if (error) {
      console.error('Error adding gasto:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const removeGasto = async (id) => {
    await supabase.from('gastos').delete().eq('id', id);
  };

  const totalsByMonth = gastos.reduce((acc, g) => {
    if (!g.date) return acc;
    const monthIdx = new Date(g.date).getMonth();
    const monthKey = MONTHS[monthIdx];
    acc[monthKey] = (acc[monthKey] || 0) + (g.amount || 0);
    return acc;
  }, {});

  const totalGastos = gastos.reduce((sum, g) => sum + (g.amount || 0), 0);

  return { gastos, loading, addGasto, removeGasto, totalsByMonth, totalGastos };
}
