import React, { useState, useMemo } from 'react';
import { Plus, Trash2, AlertCircle, ChevronRight, FolderOpen, Folder, Send } from 'lucide-react';
import { validate, gastoSchema } from '../../../schemas/forms.schema';

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const EMPTY_FORM = { description: '', amount: '', date: new Date().toISOString().slice(0, 10) };

interface Gasto { id: string; date: string; description: string; amount: number }
interface MonthGroup { key: string; entries: Gasto[] }

interface Props {
  gastos: Gasto[];
  addGasto: (data: { description: string; amount: number; date: string }) => void;
  removeGasto: (id: string) => void;
  totalGastos: number;
  isSuperAdmin: boolean;
  requestAdminAction: (p: { action: string; targetName: string; amount: number; requestDate: string }) => Promise<{ success: boolean; error?: string }>;
  showRequestToast: (msg: string) => void;
}

const getMonthKey = (date: string | null | undefined): string | null =>
  date ? date.slice(0, 7) : null;

const getMonthLabel = (key: string): string => {
  if (!key) return '';
  const [y, m] = key.split('-');
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
};

const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function GastosSection({ gastos, addGasto, removeGasto, totalGastos, isSuperAdmin, requestAdminAction, showRequestToast }: Props) {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [openMonths, setOpenMonths] = useState(() => new Set([currentMonthKey]));
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const grouped = useMemo<MonthGroup[]>(() => {
    const map: Record<string, MonthGroup> = {};
    gastos.forEach(g => {
      const key = getMonthKey(g.date);
      if (!key) return;
      if (!map[key]) map[key] = { key, entries: [] };
      map[key].entries.push(g);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [gastos]);

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAddGasto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    const { ok, data, errors } = validate(gastoSchema, form);
    if (!ok) {
      setFormError(errors.description || errors.amount || errors.date || 'Datos inválidos');
      return;
    }

    if (isSuperAdmin) {
      addGasto(data as { description: string; amount: number; date: string });
      const newKey = getMonthKey((data as { date: string }).date);
      if (newKey) setOpenMonths(prev => new Set([...prev, newKey]));
      setForm(EMPTY_FORM);
    } else {
      const result = await requestAdminAction({
        action: 'add_expense',
        targetName: form.description,
        amount: Number(form.amount),
        requestDate: form.date,
      });
      if (result.success) {
        setForm(EMPTY_FORM);
        showRequestToast('Solicitud de gasto enviada al superadmin 🔔');
      } else {
        setFormError(result.error ?? 'Error desconocido');
      }
    }
  };

  return (
    <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden mb-3">
      <div className="px-5 py-3.5 border-b border-white/5">
        <div className="flex items-center justify-between mb-0">
          <div>
            <h2 className="text-xs font-semibold text-white">Registro de Gastos</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">{gastos.length} partidas · Total: ${totalGastos.toLocaleString()}</p>
          </div>
        </div>

        <form onSubmit={handleAddGasto} className="mt-3.5" aria-label="Registrar nuevo gasto" aria-describedby={formError ? 'gasto-form-error' : undefined}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="gasto-description" className="text-[10px] font-medium text-gray-400 mb-1 block">Descripción *</label>
              <input
                id="gasto-description"
                type="text" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ej: Hosting, Publicidad, Nómina..."
                aria-invalid={!!formError}
                aria-required="true"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="gasto-amount" className="text-[10px] font-medium text-gray-400 mb-1 block">Importe ($) *</label>
              <input
                id="gasto-amount"
                type="number" min="0" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                aria-invalid={!!formError}
                aria-required="true"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label htmlFor="gasto-date" className="text-[10px] font-medium text-gray-400 mb-1 block">Fecha de pago *</label>
              <div className="flex gap-2">
                <input
                  id="gasto-date"
                  type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  aria-invalid={!!formError}
                  aria-required="true"
                  className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/40 transition-all [color-scheme:dark]"
                />
                <button type="submit"
                  className="flex items-center gap-1 bg-primary hover:bg-primaryhover text-white font-semibold px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap">
                  {isSuperAdmin
                    ? <><Plus className="w-3.5 h-3.5" aria-hidden="true" /> Agregar</>
                    : <><Send className="w-3.5 h-3.5" aria-hidden="true" /> Solicitar</>}
                </button>
              </div>
            </div>
          </div>
          {formError && (
            <div id="gasto-form-error" role="alert" className="flex items-center gap-1.5 text-red-400 text-[10px] bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-2">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" /> {formError}
            </div>
          )}
        </form>
      </div>

      <div className="divide-y divide-white/5">
        {grouped.length === 0 && (
          <div className="px-5 py-8 text-center text-xs text-gray-500">
            No hay gastos registrados. Agrega el primero arriba.
          </div>
        )}
        {grouped.map(({ key, entries }) => {
          const isOpen = openMonths.has(key);
          const isCurrent = key === currentMonthKey;
          const monthTotal = entries.reduce((s, g) => s + (g.amount || 0), 0);
          return (
            <div key={key}>
              <button
                onClick={() => toggleMonth(key)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors text-left"
              >
                {isOpen
                  ? <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  : <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
                }
                <span className="text-xs font-semibold text-white flex-1">{getMonthLabel(key)}</span>
                {isCurrent && (
                  <span className="text-[9px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    Mes actual
                  </span>
                )}
                <span className="text-xs font-semibold text-red-400 mr-2">${monthTotal.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">{entries.length} partida{entries.length !== 1 ? 's' : ''}</span>
                <ChevronRight className={`w-3.5 h-3.5 text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 bg-background/30">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Descripción', 'Fecha de Pago', 'Importe', ''].map(h => (
                          <th key={h} className="px-5 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {entries.map(g => (
                        <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-2.5"><span className="text-xs text-white">{g.description}</span></td>
                          <td className="px-5 py-2.5"><span className="text-xs text-gray-400">{fmtDate(g.date)}</span></td>
                          <td className="px-5 py-2.5"><span className="text-xs font-semibold text-red-400">${Number(g.amount).toLocaleString()}</span></td>
                          <td className="px-5 py-2.5">
                            {confirmDelete === g.id ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => { removeGasto(g.id); setConfirmDelete(null); }} className="text-[10px] text-red-400 hover:text-red-300 font-medium">Sí</button>
                                <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-gray-500 hover:text-gray-300">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDelete(g.id)} className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-white/[0.02]">
                        <td colSpan={2} className="px-5 py-2 text-[10px] text-gray-500 font-medium">Total {getMonthLabel(key)}</td>
                        <td className="px-5 py-2 text-xs font-bold text-red-400">${monthTotal.toLocaleString()}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
