import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReporteSummaryCards from './ReporteSummaryCards';

describe('ReporteSummaryCards', () => {
  it('muestra los 3 títulos de las tarjetas', () => {
    render(<ReporteSummaryCards totalIngresos={0} totalGastos={0} gastosCount={0} beneficioNeto={0} />);
    expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
    expect(screen.getByText('Gastos Totales')).toBeInTheDocument();
    expect(screen.getByText('Beneficio Neto')).toBeInTheDocument();
  });

  it('formatea los valores incluyendo el símbolo $', () => {
    render(<ReporteSummaryCards totalIngresos={5000} totalGastos={1200} gastosCount={3} beneficioNeto={3800} />);
    // toLocaleString puede variar por locale en jsdom — verificamos el símbolo y los dígitos
    expect(screen.getByText(/^\$5[,.]?000$/)).toBeInTheDocument();
    expect(screen.getByText(/^\$1[,.]?200$/)).toBeInTheDocument();
    expect(screen.getByText(/^\$3[,.]?800$/)).toBeInTheDocument();
  });

  it('muestra el margen calculado cuando hay ingresos', () => {
    render(<ReporteSummaryCards totalIngresos={1000} totalGastos={200} gastosCount={2} beneficioNeto={800} />);
    expect(screen.getByText('Margen del 80%')).toBeInTheDocument();
  });

  it('muestra "Sin ventas" cuando totalIngresos es 0', () => {
    render(<ReporteSummaryCards totalIngresos={0} totalGastos={100} gastosCount={1} beneficioNeto={-100} />);
    expect(screen.getByText('Sin ventas')).toBeInTheDocument();
  });

  it('muestra conteo de registros de gastos', () => {
    render(<ReporteSummaryCards totalIngresos={500} totalGastos={300} gastosCount={7} beneficioNeto={200} />);
    expect(screen.getByText('7 registros')).toBeInTheDocument();
  });

  it('aplica color rojo en beneficio negativo', () => {
    render(<ReporteSummaryCards totalIngresos={100} totalGastos={500} gastosCount={1} beneficioNeto={-400} />);
    const beneficioEl = screen.getByText(/\$-?400/);
    expect(beneficioEl).toHaveClass('text-red-400');
  });

  it('aplica color primary en beneficio positivo', () => {
    render(<ReporteSummaryCards totalIngresos={1000} totalGastos={200} gastosCount={1} beneficioNeto={800} />);
    const beneficioEl = screen.getByText(/\$800/);
    expect(beneficioEl).toHaveClass('text-primary');
  });
});
