import { useState } from 'react';
import { Plus, Trash2, AlertCircle, ChevronDown, Check, Clock, X } from 'lucide-react';
import { SERVICES_CATALOG } from '../../../constants/services';
import { sanitizeText } from '../../../lib/sanitize';
import { validate, ventaSchema } from '../../../schemas/forms.schema';

const EMPTY_VENTA_FORM = {
  clienteNombre: '', clienteEmail: '', clienteTelefono: '',
  campanaOrigen: '', notas: '', importe: '', prioridad: false,
  fecha: new Date().toISOString().slice(0, 10),
};

const WEB_SERVICES_LIST = ['Landing Pages', 'Web con panel de administración', 'Ecommerce'];

const CAMPAIGN_OPTIONS = [
  { value: 'cold_entrepreneurs', label: 'Tráfico Frío - Emprendedores' },
  { value: 'retargeting_hot', label: 'Retargeting General' },
  { value: 'organic_social', label: 'Orgánico (No campaña)' },
  { value: 'referral', label: 'Recomendación' },
];

interface Service { name: string; price: number }

interface Venta {
  id: string; fecha: string; servicio: string; clienteNombre: string;
  clienteEmail: string; importe: number | string; estado: string; prioridad: boolean;
}

interface Props {
  ventas: Venta[];
  addVenta: (v: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  removeVenta: (id: string) => void;
  approveVenta: (id: string) => void;
  totalVentas: number;
  showRequestToast: (msg: string, type?: string) => void;
}

export default function VentasSection({ ventas, addVenta, removeVenta, approveVenta, totalVentas, showRequestToast }: Props) {
  const [ventaForm, setVentaForm] = useState(EMPTY_VENTA_FORM);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Service[]>([]);
  const [ventaError, setVentaError] = useState('');
  const [confirmDeleteVenta, setConfirmDeleteVenta] = useState<string | null>(null);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  const isWebVenta = serviciosSeleccionados.some(sel =>
    WEB_SERVICES_LIST.some(webSvc => sel.name === webSvc || sel.name.includes('Web con panel'))
  );

  const handleRegistrarVenta = () => {
    if (serviciosSeleccionados.length === 0) return setVentaError('Añade al menos un servicio a la venta.');

    const candidate = {
      ...ventaForm,
      clienteNombre: sanitizeText(ventaForm.clienteNombre),
      clienteEmail: sanitizeText(ventaForm.clienteEmail || ''),
      servicio: serviciosSeleccionados.map(s => s.name).join(', '),
      importe: ventaForm.importe,
    };

    const { ok, data, errors } = validate(ventaSchema, candidate);
    if (!ok) {
      const firstError = errors.clienteNombre || errors.clienteEmail || errors.clienteTelefono || errors.importe || 'Revisa los datos del formulario';
      return setVentaError(firstError);
    }
    setVentaError('');

    addVenta({ ...ventaForm, ...(data as Record<string, unknown>), moneda: 'USD' }).then(res => {
      if (res && res.success) {
        setServiciosSeleccionados([]);
        setVentaForm(EMPTY_VENTA_FORM);
        showRequestToast('Venta registrada', 'success');
      } else {
        setVentaError('Error al guardar la venta en la base de datos.');
      }
    });
  };

  return (
    <div className="bg-cardbg border border-white/5 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Ventas Manuales</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Registra ventas realizadas fuera del sitio web</p>
        </div>
        <span className="text-xs font-bold text-green-400">${totalVentas.toLocaleString()} USD total</span>
      </div>

      {/* Add venta form */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-4 space-y-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Nueva venta</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Services */}
          <div className="col-span-2 space-y-2">
            <label className="text-[10px] text-gray-500 block">Servicios incluidos</label>
            {serviciosSeleccionados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {serviciosSeleccionados.map((svc, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary px-2 py-1 rounded-md text-xs">
                    <span>{svc.name} <span className="opacity-70">(${svc.price})</span></span>
                    <button
                      type="button"
                      onClick={() => {
                        const newSel = [...serviciosSeleccionados];
                        const removed = newSel.splice(idx, 1)[0];
                        setServiciosSeleccionados(newSel);
                        setVentaForm(p => ({ ...p, importe: Math.max(0, parseFloat(String(p.importe) || '0') - removed.price).toString() }));
                      }}
                      className="hover:text-red-400 opacity-70 hover:opacity-100 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <span className="text-gray-400 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Agregar servicio</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isServiceDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsServiceDropdownOpen(false)}></div>
                  <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {SERVICES_CATALOG.map((s: Service) => (
                      <button key={s.name} type="button"
                        onClick={() => {
                          setServiciosSeleccionados(prev => [...prev, s]);
                          setVentaForm(p => ({ ...p, importe: (parseFloat(String(p.importe) || '0') + s.price).toString(), prioridad: false }));
                          setIsServiceDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs transition-colors text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <span>{s.name}</span>
                        <span className="opacity-60 text-[10px]">${s.price} USD</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Nombre cliente *</label>
            <input type="text" placeholder="Juan García" value={ventaForm.clienteNombre}
              onChange={e => setVentaForm(p => ({ ...p, clienteNombre: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Email cliente *</label>
            <input type="email" placeholder="juan@email.com" value={ventaForm.clienteEmail}
              onChange={e => setVentaForm(p => ({ ...p, clienteEmail: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Teléfono (WhatsApp)</label>
            <input type="tel" placeholder="+52 123 456 7890" value={ventaForm.clienteTelefono}
              onChange={e => setVentaForm(p => ({ ...p, clienteTelefono: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
          </div>

          {/* Campaign origin dropdown */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Campaña de origen *</label>
            <div className="relative">
              <button type="button" onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors text-left">
                <span className={ventaForm.campanaOrigen ? 'text-white' : 'text-gray-400'}>
                  {ventaForm.campanaOrigen
                    ? CAMPAIGN_OPTIONS.find(o => o.value === ventaForm.campanaOrigen)?.label || 'Seleccionado'
                    : 'Selecciona la campaña...'}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCampaignDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsCampaignDropdownOpen(false)}></div>
                  <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                    {CAMPAIGN_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => { setVentaForm(p => ({ ...p, campanaOrigen: opt.value })); setIsCampaignDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${ventaForm.campanaOrigen === opt.value ? 'bg-primary/20 text-primary' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="col-span-2">
            <label className="text-[10px] text-gray-500 mb-1 block">Notas cortas</label>
            <textarea rows={2} placeholder="Contexto del cliente o de la venta..."
              value={ventaForm.notas} onChange={e => setVentaForm(p => ({ ...p, notas: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Importe total (USD)</label>
            <input type="number" placeholder="0" min="0" value={ventaForm.importe}
              onChange={e => setVentaForm(p => ({ ...p, importe: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Fecha</label>
            <input type="date" value={ventaForm.fecha}
              onChange={e => setVentaForm(p => ({ ...p, fecha: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        {/* Priority delivery */}
        {isWebVenta && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">⚡ Entrega (Web)</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button"
                onClick={() => { if (ventaForm.prioridad) setVentaForm(p => ({ ...p, prioridad: false, importe: Math.max(0, parseFloat(String(p.importe) || '0') - 100).toString() })); }}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${!ventaForm.prioridad ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'}`}>
                <span className="text-xs font-bold">Estándar</span>
                <span className="text-[10px] opacity-70">14 – 21 días hábiles</span>
              </button>
              <button type="button"
                onClick={() => { if (!ventaForm.prioridad) setVentaForm(p => ({ ...p, prioridad: true, importe: (parseFloat(String(p.importe) || '0') + 100).toString() })); }}
                className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition-all ${ventaForm.prioridad ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'}`}>
                <span className="text-xs font-bold">⚡ Prioritario</span>
                <span className="text-[10px] opacity-70">2 días hábiles (+$100)</span>
              </button>
            </div>
          </div>
        )}

        {ventaError && (
          <p className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{ventaError}</p>
        )}

        <button onClick={handleRegistrarVenta}
          className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primaryhover text-white text-xs font-semibold py-2 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5" /> Registrar venta
        </button>
      </div>

      {/* Ventas table */}
      {ventas.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-white/5 mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5">
                {['Fecha','Servicio','Cliente','Importe','Estado','Entrega',''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {ventas.map(v => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-gray-400">{v.fecha}</td>
                  <td className="px-4 py-2.5 text-white font-medium">{v.servicio}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-white">{v.clienteNombre}</p>
                    <p className="text-gray-600 text-[10px]">{v.clienteEmail}</p>
                  </td>
                  <td className="px-4 py-2.5 text-white font-bold">${Number(v.importe).toLocaleString()} USD</td>
                  <td className="px-4 py-2.5">
                    {v.estado === 'pagado' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-green-400"><Check className="w-3 h-3" /> Aprobado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-500"><Clock className="w-3 h-3" /> Pendiente</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {v.prioridad ? (
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                        <span className="text-[10px] font-semibold text-amber-400 tracking-tight">Prioritario (2d)</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-600">Estandar</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {confirmDeleteVenta === v.id ? (
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => { removeVenta(v.id); setConfirmDeleteVenta(null); }}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] px-2 py-1 rounded-md transition-all border border-red-500/10 flex items-center gap-1">
                          <Trash2 className="w-2.5 h-2.5" /> Sí, eliminar
                        </button>
                        <button onClick={() => setConfirmDeleteVenta(null)}
                          className="bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] px-2 py-1 rounded-md transition-all border border-white/5">
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-end">
                        {v.estado === 'pendiente' && (
                          <button onClick={() => approveVenta(v.id)}
                            className="w-6 h-6 rounded flex items-center justify-center text-green-500 hover:bg-green-500/10 transition-all">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setConfirmDeleteVenta(v.id)}
                          className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 text-xs py-6">No hay ventas registradas aún.</p>
      )}
    </div>
  );
}
