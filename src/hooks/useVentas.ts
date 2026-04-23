import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendSaleNotification } from '../services/emailService';

function defaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  d.setDate(1);
  return d.toISOString().split('T')[0]!;
}

const PAGE_SIZE = 200;

export interface Venta {
  id: string;
  servicio: string;
  clienteNombre: string;
  clienteEmail: string;
  importe: number;
  moneda: string;
  prioridad: boolean;
  fecha: string;
  origen: string;
  estado: string;
  paypal_order_id?: string;
}

interface AddVentaEntry {
  servicio: string;
  clienteNombre: string;
  clienteEmail: string;
  importe: number | string;
  prioridad?: boolean;
  fecha?: string;
  vendedor?: string;
}

interface OperationResult {
  success: boolean;
  error?: unknown;
}

interface UseVentasOptions {
  dateFrom?: string;
}

export function useVentas({ dateFrom }: UseVentasOptions = {}) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);

  const from = dateFrom ?? defaultDateFrom();

  const mapSupabaseToVenta = useCallback((row: Record<string, unknown>): Venta => ({
    id:             String(row.id ?? ''),
    servicio:       String(row.servicio       ?? 'Desconocido'),
    clienteNombre:  String(row.cliente_nombre ?? 'Cliente Web'),
    clienteEmail:   String(row.cliente_email  ?? ''),
    importe:        Number(row.importe        ?? 0),
    moneda:         String(row.moneda         ?? 'USD'),
    prioridad:      Boolean(row.prioridad),
    fecha: row.fecha
      ? String(row.fecha)
      : row.created_at
        ? new Date(String(row.created_at)).toISOString().split('T')[0]!
        : new Date().toISOString().split('T')[0]!,
    origen:         String(row.origen  ?? 'web'),
    estado:         String(row.estado  ?? 'pendiente'),
    paypal_order_id: row.paypal_order_id ? String(row.paypal_order_id) : undefined,
  }), []);

  useEffect(() => {
    let cancelled = false;

    const fetchVentas = async () => {
      setLoading(true);
      let offset = 0;
      const accumulated: Venta[] = [];

      while (!cancelled) {
        const { data, error } = await supabase
          .from('ventas')
          .select('*')
          .gte('created_at', from)
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error || !data) break;

        accumulated.push(...data.map(mapSupabaseToVenta));
        setVentas([...accumulated]);

        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (!cancelled) setLoading(false);
    };

    fetchVentas();

    const subscription = supabase
      .channel('ventas_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const v = mapSupabaseToVenta(payload.new as Record<string, unknown>);
          const insertedAt = (payload.new as Record<string, string>).created_at?.split('T')[0] ?? '';
          if (insertedAt >= from) setVentas(prev => [v, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setVentas(prev => prev.filter(v => v.id !== (payload.old as { id: string }).id));
        } else if (payload.eventType === 'UPDATE') {
          setVentas(prev => prev.map(v =>
            v.id === (payload.new as { id: string }).id
              ? mapSupabaseToVenta(payload.new as Record<string, unknown>)
              : v,
          ));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [from, mapSupabaseToVenta]);

  const addVenta = async (entry: AddVentaEntry): Promise<OperationResult> => {
    const fechaTimestamp = entry.fecha
      ? new Date(`${entry.fecha}T12:00:00Z`).toISOString()
      : undefined;

    const { error } = await supabase.from('ventas').insert({
      servicio:       entry.servicio,
      cliente_nombre: entry.clienteNombre,
      cliente_email:  entry.clienteEmail,
      importe:        parseFloat(String(entry.importe)) || 0,
      moneda:         'USD',
      prioridad:      entry.prioridad ?? false,
      origen:         'manual',
      estado:         'pendiente',
      ...(fechaTimestamp ? { created_at: fechaTimestamp } : {}),
    }).select().single();

    if (error) {
      console.error('Error adding venta:', error);
      return { success: false, error };
    }

    sendSaleNotification({ ...entry, importe: parseFloat(String(entry.importe)) || 0 }, 'manual');
    return { success: true };
  };

  const removeVenta  = async (id: string) => { await supabase.from('ventas').delete().eq('id', id); };
  const approveVenta = async (id: string) => { await supabase.from('ventas').update({ estado: 'pagado' }).eq('id', id); };

  const totalVentas = ventas
    .filter(v => v.estado === 'pagado')
    .reduce((sum, v) => sum + (v.importe || 0), 0);

  return { ventas, loading, addVenta, removeVenta, approveVenta, totalVentas };
}
