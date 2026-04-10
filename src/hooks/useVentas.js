import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sendSaleNotification } from '../services/emailService';

export function useVentas() {
  const [ventas, setVentas] = useState([]);

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
    // 1. Fetch sales initially
    const fetchVentas = async () => {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setVentas(data.map(mapSupabaseToVenta));
      }
    };
    fetchVentas();

    // 2. Subscribe to new, updated or deleted sales automatically (Realtime)
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

  return { ventas, addVenta, removeVenta, approveVenta, totalVentas };
}
