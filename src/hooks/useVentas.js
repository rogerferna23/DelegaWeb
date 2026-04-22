import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sendSaleNotification } from '../services/emailService';

// Ventana de tiempo por defecto: últimos 13 meses.
// Cubre el año completo + el mes anterior para que los filtros
// "mes anterior" de Reportes y Productos nunca queden vacíos.
function defaultDateFrom() {
  const d = new Date();
  d.setMonth(d.getMonth() - 13);
  d.setDate(1);
  return d.toISOString().split('T')[0];
}

const PAGE_SIZE = 200;

export function useVentas({ dateFrom } = {}) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  const from = dateFrom || defaultDateFrom();
  // dateTo no se aplica en la query — solo acortamos el inicio para no
  // traer toda la historia. El extremo superior lo filtra la UI.

  const mapSupabaseToVenta = useCallback((row) => ({
    id: row.id,
    servicio: row.servicio || 'Desconocido',
    clienteNombre: row.cliente_nombre || 'Cliente Web',
    clienteEmail: row.cliente_email || '',
    importe: row.importe || 0,
    moneda: row.moneda || 'USD',
    prioridad: row.prioridad || false,
    fecha: row.fecha || (row.created_at
      ? new Date(row.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]),
    origen: row.origen || 'web',
    estado: row.estado || 'pendiente',
    paypal_order_id: row.paypal_order_id,
  }), []);

  useEffect(() => {
    let cancelled = false;

    const fetchVentas = async () => {
      setLoading(true);
      let offset = 0;
      const accumulated = [];

      while (!cancelled) {
        const { data, error } = await supabase
          .from('ventas')
          .select('*')
          .gte('created_at', from)      // filtro server-side — created_at siempre está presente
          .order('created_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error || !data) break;

        accumulated.push(...data.map(mapSupabaseToVenta));
        setVentas([...accumulated]);    // actualización progresiva

        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (!cancelled) setLoading(false);
    };

    fetchVentas();

    // Realtime: insert/update/delete dentro de la ventana cargada.
    const subscription = supabase
      .channel('ventas_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const v = mapSupabaseToVenta(payload.new);
          const insertedAt = payload.new.created_at?.split('T')[0] || '';
          if (insertedAt >= from) setVentas(prev => [v, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setVentas(prev => prev.filter(v => v.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setVentas(prev => prev.map(v =>
            v.id === payload.new.id ? mapSupabaseToVenta(payload.new) : v
          ));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, [from, mapSupabaseToVenta]);

  const addVenta = async (entry) => {
    const fechaTimestamp = entry.fecha
      ? new Date(`${entry.fecha}T12:00:00Z`).toISOString()
      : undefined;

    const { error } = await supabase.from('ventas').insert({
      servicio: entry.servicio,
      cliente_nombre: entry.clienteNombre,
      cliente_email: entry.clienteEmail,
      importe: parseFloat(entry.importe) || 0,
      moneda: 'USD',
      prioridad: entry.prioridad || false,
      origen: 'manual',
      estado: 'pendiente',
      ...(fechaTimestamp ? { created_at: fechaTimestamp } : {}),
    }).select().single();

    if (error) {
      console.error('Error adding venta:', error);
      return { success: false, error };
    }

    sendSaleNotification(entry, 'manual');
    return { success: true };
  };

  const removeVenta = async (id) => {
    await supabase.from('ventas').delete().eq('id', id);
  };

  const approveVenta = async (id) => {
    await supabase.from('ventas').update({ estado: 'pagado' }).eq('id', id);
  };

  const totalVentas = ventas
    .filter(v => v.estado === 'pagado')
    .reduce((sum, v) => sum + (v.importe || 0), 0);

  return { ventas, loading, addVenta, removeVenta, approveVenta, totalVentas };
}
