import { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { X, CheckCircle, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sendSaleNotification } from '../services/emailService';
import { validate, checkoutSchema } from '../schemas/forms.schema';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface CartItem { name: string; price: number }

interface PayPalCheckoutProps {
  cartItems: CartItem[];
  cartTotal: number;
  onClose: () => void;
  onSuccess?: () => void;
}

interface CampaignOption { value: string; label: string }

interface CaptureResult {
  ok: boolean;
  dbSyncError?: boolean;
  order?: { id: string; payer: Record<string, unknown> };
  error?: string;
}

async function captureAndRecordSale(params: {
  orderId: string;
  expectedAmount: string;
  currency: string;
  service: string;
  payerPhone: string;
  campaignSource: string;
  projectNotes: string;
  priority: boolean;
  accessToken: string;
}): Promise<CaptureResult> {
  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/capture-paypal-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        orderId: params.orderId,
        expectedAmount: params.expectedAmount,
        currency: params.currency,
        service: params.service,
        payerPhone: params.payerPhone,
        campaignSource: params.campaignSource,
        projectNotes: params.projectNotes,
        priority: params.priority,
      }),
    }
  );
  return res.json() as Promise<CaptureResult>;
}

export default function PayPalCheckout({ cartItems, cartTotal, onClose, onSuccess }: PayPalCheckoutProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [payer, setPayer] = useState<Record<string, unknown> | null>(null);
  const [priority, setPriority] = useState(false);
  const [dbSyncError, setDbSyncError] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Record<string, unknown> | null>(null);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [payerPhone, setPayerPhone] = useState('');
  const [campaignSource, setCampaignSource] = useState('');
  const [projectNotes, setProjectNotes] = useState('');
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);

  const CAMPAIGN_OPTIONS: CampaignOption[] = [
    { value: 'cold_entrepreneurs', label: 'Anuncio de Facebook / Meta' },
    { value: 'organic_social', label: 'Redes Sociales (Orgánico)' },
    { value: 'search_engine', label: 'Búsqueda en Google' },
    { value: 'referral', label: 'Recomendación de un conocido' },
    { value: 'other', label: 'Otro' },
  ];

  if (!cartItems || cartItems.length === 0) return null;

  // Detect if any item in the cart is a web service that supports priority delivery
  const WEB_SERVICES = ['landing', 'web con panel', 'ecommerce'];
  const isWebService = cartItems.some(item =>
    WEB_SERVICES.some(s => item.name.toLowerCase().includes(s))
  );
  const PRIORITY_FEE = 100;

  const basePrice = Number(cartTotal) || 0;
  const finalPrice = (isWebService && priority ? basePrice + PRIORITY_FEE : basePrice).toFixed(2);
  const currency = 'USD';

  const displayPrice = `$${Number(finalPrice).toLocaleString('en-US', { minimumFractionDigits: 0 })} USD`;

  // Create a combined name for the receipt and DB: "Ecommerce, Mantenimiento web"
  const combinedServiceNames = cartItems.map(item => item.name).join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-2xl shadow-2xl overflow-visible">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          aria-label="Cerrar checkout"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <p className="text-[10px] text-primary font-semibold tracking-widest uppercase mb-1">Checkout seguro</p>
          <h2 id="checkout-modal-title" className="text-base font-bold text-white">Tu Carrito ({cartItems.length} {cartItems.length === 1 ? 'ítem' : 'ítems'})</h2>
          <p className="text-gray-500 text-xs mt-1 leading-snug truncate" title={combinedServiceNames}>
            {combinedServiceNames}
          </p>
        </div>

        <div className="px-6 py-5">

          {/* Priority delivery selector — only for web services */}
          {isWebService && status !== 'success' && (
            <div className="mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">⚡ Tiempo de entrega (Web)</p>
              <div className="grid grid-cols-2 gap-2">
                {/* Standard */}
                <button
                  onClick={() => setPriority(false)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                    !priority
                      ? 'bg-primary/10 border-primary/40 text-primary'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold">Estándar</span>
                  <span className="text-[10px] opacity-70">14 – 21 días hábiles</span>
                  <span className="text-[10px] font-semibold mt-1">Incluido</span>
                </button>
                {/* Priority */}
                <button
                  onClick={() => setPriority(true)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                    priority
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-bold">⚡ Prioritario</span>
                  <span className="text-[10px] opacity-70">2 días hábiles</span>
                  <span className="text-[10px] font-semibold mt-1">+$100 USD</span>
                </button>
              </div>
            </div>
          )}

          {/* User information (Phone, Campaign, Notes) */}
          {status !== 'success' && status !== 'error' && (
            <div className="mb-5 space-y-3 relative z-[30]">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Teléfono (WhatsApp) *</label>
                <input
                  type="tel"
                  placeholder="+52 123 456 7890"
                  value={payerPhone}
                  onChange={e => setPayerPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] text-gray-500 mb-1 block">¿Cómo nos conociste? *</label>
                  <div className="relative z-[40]">
                    <button
                      type="button"
                      onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                      className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors text-left"
                    >
                      <span className={campaignSource ? "text-white" : "text-gray-400"}>
                        {campaignSource
                          ? CAMPAIGN_OPTIONS.find(o => o.value === campaignSource)?.label || 'Seleccionado'
                          : 'Selecciona...'}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCampaignDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsCampaignDropdownOpen(false)}></div>
                        <div className="absolute z-[70] w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                          {CAMPAIGN_OPTIONS.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setCampaignSource(opt.value);
                                setIsCampaignDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                campaignSource === opt.value
                                  ? 'bg-primary/20 text-primary'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] text-gray-500 mb-1 block">Notas / Requerimientos</label>
                  <input
                    type="text"
                    placeholder="Breve detalle..."
                    value={projectNotes}
                    onChange={e => setProjectNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 mb-5">
            <div>
              <span className="text-xs text-gray-400">Total a pagar</span>
              {isWebService && priority && (
                <p className="text-[10px] text-amber-400 mt-0.5">Incluye entrega prioritaria +$100</p>
              )}
            </div>
            <span className="text-xl font-extrabold text-white">{displayPrice}</span>
          </div>

          {/* Success state */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">¡Pago completado!</h3>
              <p className="text-gray-400 text-xs mb-3">
                Hola {String((payer as Record<string, Record<string, unknown>> | null)?.name?.given_name ?? '')}, recibirás un email de confirmación en{' '}
                <span className="text-white">{String((payer as Record<string, unknown> | null)?.email_address ?? '')}</span>.
              </p>

              {dbSyncError && (
                <div className="text-left bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-1">
                    <AlertCircle className="w-4 h-4" /> Importante
                  </div>
                  <p className="text-[10px] text-amber-200/80 mb-2 leading-relaxed">
                    Tu pago fue procesado exitosamente por PayPal, pero hubo un retraso sincronizando con nuestra base de datos.
                  </p>
                  <p className="text-[10px] text-amber-200/90 font-semibold bg-black/20 p-2 rounded-lg break-all">
                    Por favor, guarda tu ID de pedido de PayPal: <br/>
                    <span className="text-white font-mono text-xs mt-1 block">{String(orderDetails?.id ?? '')}</span>
                  </p>
                  <p className="text-[10px] text-amber-200/80 mt-2">
                    Si no te contactamos en las próximas horas, escríbenos a hola@delegaweb.com indicando tu ID.
                  </p>
                </div>
              )}

              {!dbSyncError && (
                <p className="text-gray-500 text-[10px] mb-5">Nos pondremos en contacto contigo en las próximas 24h.</p>
              )}

              <button
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="w-full bg-primary hover:bg-primaryhover text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-primary/20 mt-2"
              >
                Cerrar y continuar
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg || 'Ocurrió un error con el pago. Inténtalo de nuevo.'}</span>
            </div>
          )}

          {/* Error de validación del formulario */}
          {formError && status !== 'success' && status !== 'error' && (
            <div className="mb-3 flex items-center gap-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* PayPal buttons */}
          {status !== 'success' && status !== 'error' && (
            <div className="relative z-[10]">
              <PayPalButtons
                style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay', height: 44 }}
                disabled={status === 'processing'}
                forceReRender={[finalPrice, currency, priority]}
                createOrder={(_, actions) => {
                  // Validamos teléfono y campaña antes de crear la orden de PayPal.
                  const { ok, errors } = validate(
                    checkoutSchema.pick({ telefono: true, campana: true }),
                    { telefono: payerPhone, campana: campaignSource }
                  );
                  if (!ok) {
                    setFormError(errors.telefono || errors.campana || 'Revisa los datos');
                    throw new Error(errors.telefono || errors.campana || 'INVALID_FORM');
                  }
                  setFormError('');
                  return actions.order.create({
                    purchase_units: [{
                      description: priority
                        ? `DelegaWeb Compra Múltiple — Entrega prioritaria`
                        : `DelegaWeb Compra`,
                      amount: { value: finalPrice, currency_code: currency },
                    }],
                    intent: 'CAPTURE',
                  });
                }}
                onApprove={async (data) => {
                  setStatus('processing');
                  try {
                    // Token sync de localStorage si el comprador está logueado.
                    // Fallback al anon key porque la gateway de Supabase exige
                    // un Bearer aunque la función esté marcada no-verify-jwt.
                    let accessToken = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
                    try {
                      const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                      if (key) {
                        const parsed = JSON.parse(localStorage.getItem(key) ?? '{}');
                        const userToken = parsed?.access_token ?? parsed?.session?.access_token;
                        if (userToken) accessToken = userToken;
                      }
                    } catch { /* ignore */ }

                    const result = await captureAndRecordSale({
                      orderId: data.orderID,
                      expectedAmount: finalPrice,
                      currency,
                      service: combinedServiceNames,
                      payerPhone,
                      campaignSource,
                      projectNotes,
                      priority,
                      accessToken,
                    });

                    if (result.error && !result.order) {
                      setErrorMsg(result.error);
                      setStatus('error');
                      return;
                    }

                    const payerData = result.order?.payer ?? {};
                    setPayer(payerData as Record<string, unknown>);
                    setOrderDetails({ id: result.order?.id } as Record<string, unknown>);

                    if (result.dbSyncError) {
                      setDbSyncError(true);
                    } else {
                      const nameData = (payerData as Record<string, Record<string, string>>).name;
                      sendSaleNotification({
                        servicio: combinedServiceNames,
                        importe: parseFloat(finalPrice),
                        moneda: currency,
                        clienteNombre: `${nameData?.given_name ?? ''} ${nameData?.surname ?? ''}`.trim(),
                        clienteEmail: (payerData as Record<string, string>).email_address ?? '',
                        fecha: new Date().toLocaleDateString(),
                      }, 'web');
                    }
                    setStatus('success');
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : 'Error al procesar el pago.';
                    setErrorMsg(msg);
                    setStatus('error');
                  }
                }}
                onError={() => {
                  setErrorMsg('PayPal reportó un error. Inténtalo de nuevo.');
                  setStatus('error');
                }}
                onCancel={() => setStatus('idle')}
              />
            </div>
          )}

          {/* Security note */}
          {status !== 'success' && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-gray-600">
              <ShieldCheck className="w-3 h-3" />
              Pago 100% seguro cifrado con SSL · PayPal
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
