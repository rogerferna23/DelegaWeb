import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/**
 * Build and download an Excel workbook with multiple sheets.
 * @param {object} params
 * @param {string} params.mode - 'year' | 'month'
 * @param {string|null} params.selectedMonth - e.g. 'Mar' (only for mode='month')
 * @param {object} params.gastos - { Ene: 5200, ... }
 * @param {object} params.ingresosPerMonth - { Ene: 8000, ... }
 * @param {Array} params.vendors - vendor objects from useVendors
 * @param {Array} params.products - product objects
 */
export function exportToExcel({ mode, selectedMonth, gastosList, totalsByMonth, ingresosPerMonth, vendors, products }) {
  const wb = XLSX.utils.book_new();
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  const activeMonths = mode === 'month'
    ? [selectedMonth]
    : MONTHS.filter(m => ingresosPerMonth[m] > 0 || totalsByMonth[m] > 0);

  // Filter gastos if month mode
  const getMonth = (date) => date ? MONTHS[new Date(date + 'T00:00:00').getMonth()] : null;
  const filteredGastos = mode === 'month'
    ? gastosList.filter(g => getMonth(g.date) === selectedMonth)
    : gastosList;

  // ── Sheet 1: Resumen Financiero ────────────────────────────────────────────
  const resumenHead = [['Mes', 'Ingresos ($)', 'Gastos ($)', 'Beneficio Neto ($)', 'Margen (%)']];
  const resumenRows = activeMonths.map(m => {
    const ing = ingresosPerMonth[m] || 0;
    const gas = totalsByMonth[m] || 0;
    const neto = ing - gas;
    const margen = ing > 0 ? Math.round((neto / ing) * 100) : 0;
    return [m, ing, gas, neto, margen];
  });

  // Totals row
  const totalIng = activeMonths.reduce((s, m) => s + (ingresosPerMonth[m] || 0), 0);
  const totalGas = filteredGastos.reduce((s, g) => s + (g.amount || 0), 0);
  const totalNeto = totalIng - totalGas;
  const totalMargen = totalIng > 0 ? Math.round((totalNeto / totalIng) * 100) : 0;
  resumenRows.push(['', '', '', '', '']);
  resumenRows.push(['TOTAL', totalIng, totalGas, totalNeto, totalMargen]);

  const wsResumen = XLSX.utils.aoa_to_sheet([...resumenHead, ...resumenRows]);
  wsResumen['!cols'] = [{ wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Financiero');

  // ── Sheet 2: Productos Vendidos ────────────────────────────────────────────
  const productHead = [['Producto', 'Categoría', 'Precio Unit.', 'Unidades Vendidas', 'Ingresos Totales ($)', 'Crecimiento (%)', 'Estado']];
  const productRows = products.map(p => [
    p.name,
    p.category,
    p.price,
    p.sales,
    p.revenue,
    p.growth,
    p.status,
  ]);
  const wsProducts = XLSX.utils.aoa_to_sheet([...productHead, ...productRows]);
  wsProducts['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Productos Vendidos');

  // ── Sheet 3: Analíticas de Vendedores ─────────────────────────────────────
  const vendHead = [['Nombre', 'Email', 'Especialidad', 'Teléfono', 'Ventas', 'Ingresos ($)', 'Rating', 'Estado']];
  const vendRows = vendors.map(v => [
    v.name,
    v.email,
    v.specialty,
    v.phone || '',
    v.sales,
    v.revenue,
    v.rating,
    v.status,
  ]);

  // Totals
  const totalVendSales = vendors.reduce((s, v) => s + v.sales, 0);
  const totalVendRev = vendors.reduce((s, v) => s + v.revenue, 0);
  vendRows.push(['', '', '', '', '', '', '', '']);
  vendRows.push(['TOTAL', '', '', '', totalVendSales, totalVendRev, '', '']);

  const wsVendors = XLSX.utils.aoa_to_sheet([...vendHead, ...vendRows]);
  wsVendors['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsVendors, 'Vendedores');

  // ── Sheet 4: Gastos Detallados ─────────────────────────────────────────────
  const MONTHS_LOCAL = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const gastosHead = [['Descripcion', 'Mes', 'Fecha de Pago', 'Importe ($)']];
  const gastosRows = filteredGastos.map(g => {
    const monthLabel = g.date ? MONTHS_LOCAL[new Date(g.date + 'T00:00:00').getMonth()] : '';
    return [g.description, monthLabel, g.date || '', g.amount || 0];
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

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, filename);
}
