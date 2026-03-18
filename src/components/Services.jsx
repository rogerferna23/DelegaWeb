import React, { useState } from 'react';
import { Zap, LayoutDashboard, ShoppingCart, Wrench, Megaphone, Users, Rocket } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import PayPalCheckout from './PayPalCheckout';

const servicesList = [
  {
    title: "Landing Pages",
    description: "Diseñadas para convertir visitas en clientes con estrategia y diseño impactante. Incluye dominio, hosting y optimización SEO básica.",
    price: "$299 USD",
    priceNote: "+ impuestos · pago único",
    icon: <Zap />,
    highlight: false,
  },
  {
    title: "Web con panel de administración",
    description: "Para que puedas gestionar tu contenido fácilmente desde cualquier dispositivo. Ideal para empresas que necesitan actualizar tu web de forma autónoma.",
    price: "$499 USD",
    priceNote: "+ impuestos · pago único",
    icon: <LayoutDashboard />,
    highlight: false,
  },
  {
    title: "Ecommerce",
    description: "Tienda online completa optimizada para vender desde el primer día. El precio varía según el catálogo de productos.",
    price: "$999 USD",
    priceNote: "+ impuestos · pago único",
    icon: <ShoppingCart />,
    highlight: true,
    badge: "Más completo",
  },
  {
    title: "Campañas publicitarias",
    description: "Gestión profesional de anuncios en Meta Ads y Google Ads. Estrategia, creatividades y seguimiento continuo de resultados.",
    price: "$299 USD",
    priceNote: "+ impuestos · mensual",
    icon: <Megaphone />,
    highlight: false,
  },
  {
    title: "Mantenimiento web",
    description: "Hosting, dominio, actualizaciones y soporte técnico incluidos. El precio mensual se adapta según las necesidades de tu empresa.",
    price: "Consulta",
    priceNote: "+ impuestos · mensual",
    icon: <Wrench />,
    highlight: false,
    disableHiring: true,
  },
  {
    title: "Coaching de ventas",
    description: "Dos sesiones personalizadas para mejorar tu estrategia de ventas, argumentario y cierre de clientes.",
    price: "$300 USD",
    priceNote: "+ impuestos · 2 sesiones",
    icon: <Users />,
    highlight: false,
  },
  {
    title: "Marca & Sistema — Programa Completo",
    description: "60 días para construir tu marca desde cero y activar un sistema de captación de clientes. Incluye 4 sesiones de coaching estratégico, identidad visual, web...",
    price: "$1,900 USD",
    priceNote: "valor real $5,400 USD · 60 días",
    icon: <Rocket />,
    highlight: false,
    premium: true,
    badge: "Todo incluido",
  },
];

const Services = () => {
  const { addToCart } = useCart();
  const [selectedService, setSelectedService] = useState(null);

  // Helper to parse price string to number
  const parsePrice = (priceStr) => {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  };

  const handleAddToCart = (service) => {
    addToCart({
      name: service.title,
      price: parsePrice(service.price)
    });
  };

  const isVariablePrice = (s) => s.price.includes('–') || s.price.includes('-');

  return (
    <section id="servicios" className="w-full py-20 max-w-7xl mx-auto">

      {/* Header */}
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Nuestros <span className="text-primary">servicios</span>
        </h2>
        <p className="text-gray-400 text-sm">Soluciones digitales completas para hacer crecer tu negocio.</p>
      </div>

      {/* Grid — primeros 6 paquetes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {servicesList.filter(s => !s.premium).map((service, index) => (
          <div
            key={index}
            className={`relative flex flex-col gap-4 rounded-2xl p-6 border transition-all duration-300 group
              ${service.highlight
                ? 'bg-primary/5 border-primary/30 hover:border-primary/60 shadow-lg shadow-primary/5'
                : 'bg-cardbg border-gray-800/60 hover:border-gray-700'
              }`}
          >
            {service.badge && (
              <span className="absolute top-4 right-4 text-[10px] font-semibold bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/30">
                {service.badge}
              </span>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${service.highlight ? 'bg-primary/15' : 'bg-gray-900/60'}`}>
              {React.cloneElement(service.icon, { className: 'w-5 h-5 text-primary' })}
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <h3 className="text-base font-bold text-white">{service.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{service.description}</p>
            </div>
            <div className={`h-px ${service.highlight ? 'bg-primary/20' : 'bg-white/5'}`} />
            <div className="flex items-end justify-between">
              <span className={`text-2xl font-extrabold tracking-tight ${service.highlight ? 'text-primary' : 'text-white'}`}>
                {service.price}
              </span>
              <span className="text-[10px] text-gray-500 text-right leading-tight max-w-[120px]">
                {service.priceNote}
              </span>
            </div>
            {/* CTA button */}
            {service.disableHiring ? (
              <a
                href="#contacto"
                className="mt-1 w-full text-center text-xs font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 py-2 rounded-xl transition-all block"
              >
                Consultar precio
              </a>
            ) : isVariablePrice(service) ? (
              <a
                href="#contacto"
                className="mt-1 w-full text-center text-xs font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 py-2 rounded-xl transition-all block"
              >
                Consultar precio
              </a>
            ) : (
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => setSelectedService(service)}
                  className={`flex-1 text-center text-xs font-semibold py-2.5 rounded-xl transition-all ${
                    service.highlight
                      ? 'bg-primary hover:bg-primaryhover text-white shadow-md shadow-primary/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  Contratar
                </button>
                <button
                  onClick={() => handleAddToCart(service)}
                  title="Agregar al carrito"
                  className={`w-10 flex shrink-0 items-center justify-center rounded-xl transition-all ${
                    service.highlight
                      ? 'bg-primary hover:bg-primaryhover text-white shadow-md shadow-primary/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card premium — ancho completo */}
      {servicesList.filter(s => s.premium).map((service, index) => (
        <div
          key={index}
          className="relative mt-5 flex flex-col gap-6 rounded-2xl p-8 border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-cardbg to-cardbg hover:border-amber-500/50 transition-all duration-300 shadow-lg shadow-amber-500/5"
        >
          {/* Cabecera con gradiente */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shadow-inner shadow-amber-500/10">
                {React.cloneElement(service.icon, { className: 'w-6 h-6 text-amber-400' })}
              </div>
              <div>
                <p className="text-[10px] text-amber-400/70 font-medium tracking-widest uppercase mb-0.5">Programa Premium · 60 días</p>
                <h3 className="text-xl font-extrabold text-white leading-tight">{service.title}</h3>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full border border-amber-500/25">
              {service.badge}
            </span>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mb-4">{service.description}</p>

          {/* Chips en 2 columnas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[
              { icon: '🎯', label: 'Coaching estratégico' },
              { icon: '🎨', label: 'Identidad visual' },
              { icon: '📖', label: 'Manual de marca' },
              { icon: '🌐', label: 'Web 5 páginas' },
              { icon: '📝', label: '12 artículos SEO' },
              { icon: '📧', label: 'Email marketing' },
              { icon: '🔀', label: 'Embudo de leads' },
              { icon: '📣', label: 'Campañas publicitarias' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] text-amber-300/80 leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* Pie: separador + precio */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-amber-500/15">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-500 line-through mb-0.5">Valor real $5,400 USD</p>
                <p className="text-3xl font-extrabold text-amber-400 tracking-tight">{service.price}</p>
              </div>
              <div className="h-10 w-px bg-amber-500/20 mx-2 hidden sm:block" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-500">Potencial estimado</span>
                <span className="text-xs font-semibold text-white">300–600 leads/mes</span>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-gradient-to-r from-amber-500 to-amber-400 text-background px-4 py-2 rounded-xl shadow shadow-amber-500/20">
              Ahorras $3,500 USD
            </span>
          </div>
        </div>
      ))}
      {/* ── Planes mensuales ── */}
      <div className="mt-16">
        <div className="text-center mb-10">
          <p className="text-[10px] text-primary font-semibold tracking-widest uppercase mb-2">Suscripción mensual</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Impulso Digital <span className="text-primary">360</span></h2>
          <p className="text-gray-400 text-sm">$770 – $2,197 · IVA incluido · Sin permanencia.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ── STARTER ── */}
          <div className="relative flex flex-col gap-5 rounded-2xl p-6 border border-gray-800/60 bg-cardbg hover:border-gray-700 transition-all duration-300">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase mb-1">Starter</p>
              <h3 className="text-lg font-extrabold text-white leading-tight">Para emprendedores que empiezan a escalar</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                '1 sesión de Coaching Expansivo',
                '1 sesión de consultoría en ventas estratégicas',
                '4 artículos optimizados para SEO (600–800 palabras)',
                '2 secuencias de email marketing (5 correos cada una)',
                '1 flujo de automatización (bienvenida o agendamiento)',
                '1 campaña publicitaria mensual (Meta Ads o Google Ads)',
                'Ajustes quincenales de campañas y estrategia',
                'Reporte mensual de resultados',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-[11px] text-gray-400">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <div className="h-px bg-white/5 mt-auto" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-extrabold text-white tracking-tight">$770 USD</p>
                <p className="text-[10px] text-gray-500">IVA incluido · mensual</p>
              </div>
              <span className="text-[10px] text-gray-500 text-right">50–100 leads/mes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedService({ title: 'Plan Starter', price: '$770 USD' })}
                className="flex-1 text-center text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all"
              >
                Contratar
              </button>
              <button
                onClick={() => handleAddToCart({ title: 'Plan Starter', price: '$770 USD' })}
                title="Agregar al carrito"
                className="w-10 flex shrink-0 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── PRO (destacado) ── */}
          <div className="relative flex flex-col gap-5 rounded-2xl p-6 border border-primary/30 bg-primary/5 hover:border-primary/60 transition-all duration-300 shadow-lg shadow-primary/5">
            <span className="absolute top-4 right-4 text-[10px] font-semibold bg-primary/20 text-primary px-2.5 py-1 rounded-full border border-primary/20">Más popular</span>
            <div>
              <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">Pro</p>
              <h3 className="text-lg font-extrabold text-white leading-tight">Para marcas que buscan crecer cada semana</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                '2 sesiones de Coaching Expansivo',
                '2 sesiones de consultoría en ventas estratégicas',
                '8 artículos optimizados para SEO (800–1,000 palabras)',
                '4 secuencias de email marketing',
                'Flujos de automatización para captación y seguimiento de leads',
                '2 campañas publicitarias activas (captación y remarketing)',
                'Revisión y ajustes semanales de campañas',
                'Call mensual de estrategia',
                'Reporte quincenal de resultados',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-[11px] text-gray-300">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <div className="h-px bg-primary/15 mt-auto" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-extrabold text-primary tracking-tight">$1,497 USD</p>
                <p className="text-[10px] text-gray-500">IVA incluido · mensual</p>
              </div>
              <span className="text-[10px] text-gray-500 text-right">130–250 leads/mes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedService({ title: 'Plan Pro', price: '$1,497 USD' })}
                className="flex-1 text-center text-xs font-semibold py-2.5 rounded-xl bg-primary hover:bg-primaryhover text-white shadow-md shadow-primary/20 transition-all"
              >
                Contratar
              </button>
              <button
                onClick={() => handleAddToCart({ title: 'Plan Pro', price: '$1,497 USD' })}
                title="Agregar al carrito"
                className="w-10 flex shrink-0 items-center justify-center rounded-xl bg-primary hover:bg-primaryhover text-white shadow-md shadow-primary/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── ELITE ── */}
          <div className="relative flex flex-col gap-5 rounded-2xl p-6 border border-gray-800/60 bg-cardbg hover:border-gray-700 transition-all duration-300">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 tracking-widest uppercase mb-1">Elite</p>
              <h3 className="text-lg font-extrabold text-white leading-tight">Para negocios que quieren escalar con sistema</h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                '4 sesiones de Coaching Expansivo',
                '4 sesiones de consultoría en ventas estratégicas',
                '12 artículos SEO premium (1,000+ palabras)',
                'Secuencias completas de email marketing automatizadas',
                'Implementación de CRM para gestión de clientes potenciales',
                '3 campañas publicitarias activas (captación, remarketing y conversión)',
                'Reunión estratégica semanal',
                'Optimización continua de campañas y estrategia',
                'Reporte mensual de impacto y evolución',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-[11px] text-gray-400">
                  <span className="text-primary mt-0.5 shrink-0">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <div className="h-px bg-white/5 mt-auto" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-extrabold text-white tracking-tight">$2,197 USD</p>
                <p className="text-[10px] text-gray-500">IVA incluido · mensual</p>
              </div>
              <span className="text-[10px] text-gray-500 text-right">300–450 leads/mes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedService({ title: 'Plan Elite', price: '$2,197 USD' })}
                className="flex-1 text-center text-xs font-semibold py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all"
              >
                Contratar
              </button>
              <button
                onClick={() => handleAddToCart({ title: 'Plan Elite', price: '$2,197 USD' })}
                title="Agregar al carrito"
                className="w-10 flex shrink-0 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedService && (
        <PayPalCheckout
          cartItems={[{ name: selectedService.title, price: parsePrice(selectedService.price) }]}
          cartTotal={parsePrice(selectedService.price)}
          onClose={() => setSelectedService(null)}
          onSuccess={() => setSelectedService(null)}
        />
      )}
    </section>
  );
};

export default Services;
