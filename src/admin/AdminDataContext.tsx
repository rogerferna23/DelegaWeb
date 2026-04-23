import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useVentas as useVentasBase } from '../hooks/useVentas';
import { useGastos as useGastosBase } from '../hooks/useGastos';
import { useVendors as useVendorsBase } from '../hooks/useVendors';

type VentasData = ReturnType<typeof useVentasBase>;
type GastosData = ReturnType<typeof useGastosBase>;
type VendorsData = ReturnType<typeof useVendorsBase>;

interface AdminDataContextValue {
  ventasData: VentasData;
  gastosData: GastosData;
  vendorsData: VendorsData;
}

const AdminDataContext = createContext<AdminDataContextValue | undefined>(undefined);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const ventasData = useVentasBase();
  const gastosData = useGastosBase();
  const vendorsData = useVendorsBase();

  const value = useMemo(() => ({
    ventasData,
    gastosData,
    vendorsData,
  }), [ventasData, gastosData, vendorsData]);

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminVentas(): VentasData {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminVentas must be used within AdminDataProvider');
  return context.ventasData;
}

export function useAdminGastos(): GastosData {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminGastos must be used within AdminDataProvider');
  return context.gastosData;
}

export function useAdminVendors(): VendorsData {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error('useAdminVendors must be used within AdminDataProvider');
  return context.vendorsData;
}
