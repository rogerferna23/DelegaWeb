import { useState, useEffect } from 'react';

const DEFAULT_VENDORS = [
  { id: '1', name: 'Carlos Mendoza', email: 'carlos@delegaweb.com', specialty: 'Web', phone: '+1 555-0101', revenue: 18500, sales: 38, rating: 4.9, status: 'Activo' },
  { id: '2', name: 'Ana López', email: 'ana@delegaweb.com', specialty: 'Marketing', phone: '+1 555-0102', revenue: 14200, sales: 31, rating: 4.7, status: 'Activo' },
  { id: '3', name: 'Roberto García', email: 'roberto@delegaweb.com', specialty: 'Web', phone: '+1 555-0103', revenue: 12900, sales: 27, rating: 4.8, status: 'Activo' },
  { id: '4', name: 'María Torres', email: 'maria@delegaweb.com', specialty: 'Diseño', phone: '+1 555-0104', revenue: 10300, sales: 22, rating: 4.5, status: 'Activo' },
  { id: '5', name: 'Diego Ramírez', email: 'diego@delegaweb.com', specialty: 'SEO', phone: '+1 555-0105', revenue: 8700, sales: 18, rating: 4.3, status: 'Activo' },
  { id: '6', name: 'Sofía Ruiz', email: 'sofia@delegaweb.com', specialty: 'Marketing', phone: '+1 555-0106', revenue: 6500, sales: 14, rating: 4.6, status: 'Inactivo' },
  { id: '7', name: 'Luis Herrera', email: 'luis@delegaweb.com', specialty: 'Web', phone: '+1 555-0107', revenue: 5400, sales: 12, rating: 4.1, status: 'Activo' },
];

const STORAGE_KEY = 'dw_vendors';

export function useVendors() {
  const [vendors, setVendors] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_VENDORS;
    } catch {
      return DEFAULT_VENDORS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vendors));
  }, [vendors]);

  const addVendor = (data) => {
    if (vendors.find(v => v.email === data.email)) {
      return { success: false, error: 'Ya existe un vendedor con ese email' };
    }
    const newVendor = {
      ...data,
      id: Date.now().toString(),
      revenue: 0,
      sales: 0,
      rating: 5.0,
      status: 'Activo',
    };
    setVendors(prev => [...prev, newVendor]);
    return { success: true };
  };

  const removeVendor = (id) => {
    setVendors(prev => prev.filter(v => v.id !== id));
    return { success: true };
  };

  const totalRevenue = vendors.reduce((sum, v) => sum + (v.revenue || 0), 0);

  return { vendors, addVendor, removeVendor, totalRevenue };
}
