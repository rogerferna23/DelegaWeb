import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sanitizeText } from '../lib/sanitize';

export interface Vendor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
  revenue: number;
  sales: number;
  rating: number;
  status: string;
}

interface AddVendorData {
  name: string;
  email: string;
  specialty: string;
  phone: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const mapSupabaseToVendor = useCallback((row: Record<string, unknown>): Vendor => ({
    id:        String(row.id        ?? ''),
    name:      String(row.name      ?? ''),
    email:     String(row.email     ?? ''),
    specialty: String(row.specialty ?? ''),
    phone:     String(row.phone     ?? ''),
    revenue:   parseFloat(String(row.revenue ?? 0)) || 0,
    sales:     parseInt(String(row.sales     ?? 0)) || 0,
    rating:    parseFloat(String(row.rating  ?? 5.0)) || 5.0,
    status:    String(row.status    ?? 'Activo'),
  }), []);

  useEffect(() => {
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

    const subscription = supabase
      .channel('vendors_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setVendors(prev =>
            [...prev, mapSupabaseToVendor(payload.new as Record<string, unknown>)]
              .sort((a, b) => a.name.localeCompare(b.name)),
          );
        } else if (payload.eventType === 'DELETE') {
          setVendors(prev => prev.filter(v => v.id !== (payload.old as { id: string }).id));
        } else if (payload.eventType === 'UPDATE') {
          setVendors(prev => prev.map(v =>
            v.id === (payload.new as { id: string }).id
              ? mapSupabaseToVendor(payload.new as Record<string, unknown>)
              : v,
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [mapSupabaseToVendor]);

  const addVendor = async (data: AddVendorData): Promise<OperationResult> => {
    const { error } = await supabase.from('vendors').insert({
      name:      sanitizeText(data.name),
      email:     sanitizeText(data.email),
      specialty: sanitizeText(data.specialty),
      phone:     sanitizeText(data.phone),
      revenue: 0,
      sales:   0,
      rating:  5.0,
      status:  'Activo',
    });

    if (error) {
      console.error('Error adding vendor:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const removeVendor = async (id: string): Promise<OperationResult> => {
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
