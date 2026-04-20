import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendSaleNotification } from '../services/emailService';

// Tamaño de lote para cargar ventas sin bloquear el navegador.
// La UI va mostrando datos conforme llegan; útil cuando hay muchos registros.
const PAGE_SIZE = 500;

export function useVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper function to map from Supabase snake_case to UI camelCase expected structure
  const mapSupabaseToVenta = (row) => ({
    id: row.id,
    servicio: row.servicio || 'Desconocido',
    clienteNombre: row.cliente_nombre || 'Cliente Web',
    clienteEmail: row.cliente_email || '',
    importe: row.importe || 0,
    moneda: row.moneda || 'USD',
    prioridad: row.prioridad || false,
    fecha: row.fecha || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    origen: row.origen || 'web',
    estado: row.estado || 'pendiente',
    paypal_order_id: row.paypal_order_id
  });

  useEffect(() => {
    let cancelled = false;

    // Carga progresiva por lotes. En vez de traer miles de filas en una sola
    // query, traemos PAGE_SIZE a la vez y vamos concatenando. Así la UI
    // muestra las primeras ventas casi al instante.
    const fetchVentasPaginated = async () => {
      setLoading(true);
      let from = 0;

      while (!cancelled) {
        const { data, error } = await supabase
          .from('ventas')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error || !data) break;

        const mapped = data.map(mapSupabaseToVenta);
        setVentas(prev => (from === 0 ? mapped : [...prev, ...mapped]));

        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      if (!cancelled) setLoading(false);
    };

    fetchVentasPaginated();

    // Realtime: insert/update/delete se aplican al array en memoria.
    const subscription = supabase
      .channel('ventas_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVentas(prev => [mapSupabaseToVenta(payload.new), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setVentas(prev => prev.filter(v => v.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setVentas(prev => prev.map(v => v.id === payload.new.id ? mapSupabaseToVenta(payload.new) : v));
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, []);

  const addVenta = async (entry) => {
    // This is called from the Admin Panel (Manual sales)
    // Create a timestamp from the manual date: 'YYYY-MM-DD' -> 'YYYY-MM-DDT12:00:00.000Z'
    // We add 12:00:00 to avoid UTC timezone offset putting it on the previous day
    const fechaTimestamp = entry.fecha ? new Date(`${entry.fecha}T12:00:00Z`).toISOString() : undefined;

    const { error } = await supabase.from('ventas').insert({
      servicio: entry.servicio,
      cliente_nombre: entry.clienteNombre,
      cliente_email: entry.clienteEmail,
      importe: parseFloat(entry.importe) || 0,
      moneda: 'USD',
      prioridad: entry.prioridad || false,
      origen: 'manual',
      estado: 'pendiente',
      ...(fechaTimestamp ? { created_at: fechaTimestamp } : {})
    }).select().single();

    // We don't manually setVentas because the realtime subscription will catch the INSERT and add it.
    if (error) {
      console.error('Error adding venta:', error);
      return { success: false, error };
    }

    // Trigger email notification for manual sale
    sendSaleNotification(entry, 'manual');

    return { success: true };
  };

  const removeVenta = async (id) => {
    // Delete from Supabase
    await supabase.from('ventas').delete().eq('id', id);
    // Realtime subscription will handle removing from UI
  };

  const approveVenta = async (id) => {
    // Update in Supabase
    await supabase.from('ventas').update({ estado: 'pagado' }).eq('id', id);
    // Realtime subscription will handle the state update in the UI
  };

  // Only sum 'pagado' sales for the total
  const totalVentas = ventas
    .filter(v => v.estado === 'pagado')
    .reduce((sum, v) => sum + (v.importe || 0), 0);

  return { ventas, loading, addVenta, removeVenta, approveVenta, totalVentas };
}
