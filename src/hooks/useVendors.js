import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeText } from '../lib/sanitize';

export function useVendors() {
  const [vendors, setVendors] = useState([]);

  // Map Supabase snake_case to UI camelCase
  const mapSupabaseToVendor = (row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    specialty: row.specialty,
    phone: row.phone,
    revenue: parseFloat(row.revenue) || 0,
    sales: parseInt(row.sales) || 0,
    rating: parseFloat(row.rating) || 5.0,
    status: row.status || 'Activo',
  });

  useEffect(() => {
    // 1. Initial fetch
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true });
        
      if (!error && data) {
        setVendors(data.map(mapSupabaseToVendor));
      } else if (error) {
        console.error('Error fetching vendors:', error);
      }
    };
    fetchVendors();

    // 2. Realtime subscription
    const subscription = supabase
      .channel('vendors_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVendors(prev => [...prev, mapSupabaseToVendor(payload.new)].sort((a, b) => a.name.localeCompare(b.name)));
        } else if (payload.eventType === 'DELETE') {
          setVendors(prev => prev.filter(v => v.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setVendors(prev => prev.map(v => v.id === payload.new.id ? mapSupabaseToVendor(payload.new) : v));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const addVendor = async (data) => {
    const { error } = await supabase.from('vendors').insert({
      name: sanitizeText(data.name),
      email: sanitizeText(data.email),
      specialty: sanitizeText(data.specialty),
      phone: sanitizeText(data.phone),
      revenue: 0,
      sales: 0,
      rating: 5.0,
      status: 'Activo',
    });

    if (error) {
      console.error('Error adding vendor:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const removeVendor = async (id) => {
    const { error } = await supabase.from('vendors').delete().eq('id', id);
    if (error) {
      console.error('Error removing vendor:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const totalRevenue = vendors.reduce((sum, v) => sum + (v.revenue || 0), 0);

  return { vendors, addVendor, removeVendor, totalRevenue };
}
