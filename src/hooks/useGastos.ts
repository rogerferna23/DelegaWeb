import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const;
type Month = typeof MONTHS[number];

function defaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  d.setDate(1);
  return d.toISOString().split('T')[0]!;
}

const PAGE_SIZE = 200;

export interface Gasto {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface AddGastoEntry {
  description: string;
  amount: number | string;
  date: string;
}

interface OperationResult {
  success: boolean;
  error?: unknown;
}

interface UseGastosOptions {
  dateFrom?: string;
}

export function useGastos({ dateFrom }: UseGastosOptions = {}) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  const from = dateFrom ?? defaultDateFrom();

  const mapSupabaseToGasto = useCallback((row: Record<string, unknown>): Gasto => ({
    id:          String(row.id          ?? ''),
    description: String(row.description ?? 'Gasto Desconocido'),
    amount:      parseFloat(String(row.amount ?? 0)) || 0,
    date:        String(row.date        ?? new Date().toISOString().split('T')[0]),
  }), []);

  useEffect(() => {
    let cancelled = false;

    const fetchGastos = async () => {
      setLoading(true);
      let offset = 0;
      const accumulated: Gasto[] = [];

      while (!cancelled) {
        const { data, error } = await supabase
          .from('gastos')
          .select('*')
          .gte('date', from)
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
          const g = mapSupabaseToGasto(payload.new as Record<string, unknown>);
          if (g.date >= from) {
            setGastos(prev => [...prev, g].sort((a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
            ));
          }
        } else if (payload.eventType === 'DELETE') {
          setGastos(prev => prev.filter(g => g.id !== (payload.old as { id: string }).id));
        } else if (payload.eventType === 'UPDATE') {
          setGastos(prev => prev.map(g =>
            g.id === (payload.new as { id: string }).id
              ? mapSupabaseToGasto(payload.new as Record<string, unknown>)
              : g,
          ));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [from, mapSupabaseToGasto]);

  const addGasto = async (entry: AddGastoEntry): Promise<OperationResult> => {
    const { error } = await supabase.from('gastos').insert({
      description: entry.description,
      amount:      parseFloat(String(entry.amount)) || 0,
      date:        entry.date,
    });

    if (error) {
      console.error('Error adding gasto:', error);
      return { success: false, error };
    }
    return { success: true };
  };

  const removeGasto = async (id: string) => {
    await supabase.from('gastos').delete().eq('id', id);
  };

  const totalsByMonth = gastos.reduce<Partial<Record<Month, number>>>((acc, g) => {
    if (!g.date) return acc;
    const monthKey = MONTHS[new Date(g.date).getMonth()];
    if (monthKey) acc[monthKey] = (acc[monthKey] ?? 0) + (g.amount || 0);
    return acc;
  }, {});

  const totalGastos = gastos.reduce((sum, g) => sum + (g.amount || 0), 0);

  return { gastos, loading, addGasto, removeGasto, totalsByMonth, totalGastos };
}
