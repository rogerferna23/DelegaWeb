import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import TimeAgo from './TimeAgo';

describe('TimeAgo', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  const dateNow = new Date('2026-04-21T12:00:00Z');

  it('muestra "ahora" para menos de 1 minuto', () => {
    vi.setSystemTime(new Date('2026-04-21T12:00:30Z'));
    render(<TimeAgo dateStr="2026-04-21T12:00:00Z" />);
    expect(screen.getByText('ahora')).toBeInTheDocument();
  });

  it('muestra minutos transcurridos', () => {
    vi.setSystemTime(new Date('2026-04-21T12:05:00Z'));
    render(<TimeAgo dateStr="2026-04-21T12:00:00Z" />);
    expect(screen.getByText('hace 5m')).toBeInTheDocument();
  });

  it('muestra horas transcurridas', () => {
    vi.setSystemTime(new Date('2026-04-21T15:00:00Z'));
    render(<TimeAgo dateStr="2026-04-21T12:00:00Z" />);
    expect(screen.getByText('hace 3h')).toBeInTheDocument();
  });

  it('muestra días transcurridos', () => {
    vi.setSystemTime(new Date('2026-04-24T12:00:00Z'));
    render(<TimeAgo dateStr="2026-04-21T12:00:00Z" />);
    expect(screen.getByText('hace 3d')).toBeInTheDocument();
  });

  it('aplica className al span', () => {
    vi.setSystemTime(new Date('2026-04-21T12:01:00Z'));
    render(<TimeAgo dateStr="2026-04-21T12:00:00Z" className="text-red-400" />);
    const el = screen.getByText('hace 1m');
    expect(el).toHaveClass('text-red-400');
  });

  it('actualiza el texto al avanzar el reloj 1 minuto', () => {
    vi.setSystemTime(dateNow);
    render(<TimeAgo dateStr="2026-04-21T11:59:00Z" />);
    expect(screen.getByText('hace 1m')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(60000); });

    expect(screen.getByText('hace 2m')).toBeInTheDocument();
  });
});
