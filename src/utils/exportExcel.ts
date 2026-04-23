// SECURITY NOTE: xlsx tiene CVEs activas (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
// que afectan únicamente a XLSX.read() y parsing de input externo.
// Este archivo usa xlsx solo para escritura (write-only) con datos internos
// de Supabase. No se procesa ningún archivo externo. Riesgo: no aplica.
// Revisado: 2026-04-09. Pendiente: evaluar migración a exceljs si xlsx
// recibe una CVE que afecte operaciones de escritura.
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const;
type Month = typeof MONTHS[number];

interface GastoItem {
  date?: string;
  description?: string;
  amount?: number;
}

interface ProductItem {
  name: string;
  category: string;
  price: number;
  sales: number;
  revenue: number;
  growth: number;
  status: string;
}

interface VendorItem {
  name: string;
  email: string;
  specialty: string;
  phone?: string;
  sales: number;
  revenue: number;
  rating: number;
  status: string;
}

interface ExportParams {
  mode: 'year' | 'month';
  selectedMonth: Month | null;
  gastosList: GastoItem[];
  totalsByMonth: Partial<Record<Month, number>>;
  ingresosPerMonth: Partial<Record<Month, number>>;
  vendors: VendorItem[];
  products: ProductItem[];
}

/**
 * Build and download an Excel workbook with multiple sheets.
 */
export function exportToExcel({
  mode,
  selectedMonth,
  gastosList,
  totalsByMonth,
  ingresosPerMonth,
  vendors,
  products,
}: ExportParams): void {
  const wb = XLSX.utils.book_new();

  const activeMonths: Month[] = mode === 'month'
    ? (selectedMonth ? [selectedMonth] : [])
    : MONTHS.filter(m => (ingresosPerMonth[m] ?? 0) > 0 || (totalsByMonth[m] ?? 0) > 0);

  const getMonth = (date?: string): Month | null =>
    date ? MONTHS[new Date(date + 'T00:00:00').getMonth()] ?? null : null;

  const filteredGastos = mode === 'month'
    ? gastosList.filter(g => getMonth(g.date) === selectedMonth)
    : gastosList;

  // ── Sheet 1: Resumen Financiero ────────────────────────────────────────────
  const resumenHead = [['Mes', 'Ingresos ($)', 'Gastos ($)', 'Beneficio Neto ($)', 'Margen (%)']];
  const resumenRows: unknown[][] = activeMonths.map(m => {
    const ing = ingresosPerMonth[m] ?? 0;
    const gas = totalsByMonth[m] ?? 0;
    const neto = ing - gas;
    const margen = ing > 0 ? Math.round((neto / ing) * 100) : 0;
    return [m, ing, gas, neto, margen];
  });

  const totalIng = activeMonths.reduce((s, m) => s + (ingresosPerMonth[m] ?? 0), 0);
  const totalGas = filteredGastos.reduce((s, g) => s + (g.amount ?? 0), 0);
  const totalNeto = totalIng - totalGas;
  const totalMargen = totalIng > 0 ? Math.round((totalNeto / totalIng) * 100) : 0;
  resumenRows.push(['', '', '', '', '']);
  resumenRows.push(['TOTAL', totalIng, totalGas, totalNeto, totalMargen]);

  const wsResumen = XLSX.utils.aoa_to_sheet([...resumenHead, ...resumenRows]);
  wsResumen['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Financiero');

  // ── Sheet 2: Productos Vendidos ────────────────────────────────────────────
  const productHead = [['Producto', 'Categoría', 'Precio Unit.', 'Unidades Vendidas', 'Ingresos Totales ($)', 'Crecimiento (%)', 'Estado']];
  const productRows: unknown[][] = products.map(p => [p.name, p.category, p.price, p.sales, p.revenue, p.growth, p.status]);
  const wsProducts = XLSX.utils.aoa_to_sheet([...productHead, ...productRows]);
  wsProducts['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos Vendidos');

  // ── Sheet 3: Analíticas de Vendedores ─────────────────────────────────────
  const vendHead = [['Nombre', 'Email', 'Especialidad', 'Teléfono', 'Ventas', 'Ingresos ($)', 'Rating', 'Estado']];
  const vendRows: unknown[][] = vendors.map(v => [v.name, v.email, v.specialty, v.phone ?? '', v.sales, v.revenue, v.rating, v.status]);

  const totalVendSales = vendors.reduce((s, v) => s + v.sales, 0);
  const totalVendRev = vendors.reduce((s, v) => s + v.revenue, 0);
  vendRows.push(['', '', '', '', '', '', '', '']);
  vendRows.push(['TOTAL', '', '', '', totalVendSales, totalVendRev, '', '']);

  const wsVendors = XLSX.utils.aoa_to_sheet([...vendHead, ...vendRows]);
  wsVendors['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendedores');

  // ── Sheet 4: Gastos Detallados ─────────────────────────────────────────────
  const gastosHead = [['Descripcion', 'Mes', 'Fecha de Pago', 'Importe ($)']];
  const gastosRows: unknown[][] = filteredGastos.map(g => {
    const monthLabel = g.date ? MONTHS[new Date(g.date + 'T00:00:00').getMonth()] ?? '' : '';
    return [g.description ?? '', monthLabel, g.date ?? '', g.amount ?? 0];
  });
  gastosRows.push(['', '', '', '']);
  gastosRows.push(['TOTAL', '', '', totalGas]);

  const wsGastos = XLSX.utils.aoa_to_sheet([...gastosHead, ...gastosRows]);
  wsGastos['!cols'] = [{ wch: 32 }, { wch: 10 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Detallados');

  // ── Download ───────────────────────────────────────────────────────────────
  const year = new Date().getFullYear();
  const label = mode === 'month' ? `${selectedMonth}_${year}` : `Anual_${year}`;
  const filename = `DelegaWeb_Reporte_${label}.xlsx`;

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}
