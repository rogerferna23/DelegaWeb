import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useVentas as useVentasBase } from '../hooks/useVentas';
import { useGastos as useGastosBase } from '../hooks/useGastos';
import { useVendors as useVendorsBase } from '../hooks/useVendors';

const AdminDataContext = createContext();

export function AdminDataProvider({ children }) {
  // Call the hooks once here
  const ventasData = useVentasBase();
  const gastosData = useGastosBase();
  const vendorsData = useVendorsBase();

  const value = useMemo(() => ({
    ventasData,
    gastosData,
    vendorsData
  }), [ventasData, gastosData, vendorsData]);

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

// Custom hooks to consume the context
export function useAdminVentas() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminVentas must be used within AdminDataProvider');
  return context.ventasData;
}

export function useAdminGastos() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminGastos must be used within AdminDataProvider');
  return context.gastosData;
}

export function useAdminVendors() {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminVendors must be used within AdminDataProvider');
  return context.vendorsData;
}
