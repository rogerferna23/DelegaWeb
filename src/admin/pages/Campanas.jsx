import React from 'react';
import { Megaphone, Clock } from 'lucide-react';

export default function Campanas() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Campañas</h1>
        <p className="text-gray-500 text-xs mt-0.5">Gestión de campañas publicitarias</p>
      </div>

      <div className="bg-cardbg border border-white/5 rounded-xl flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <Megaphone className="w-6 h-6 text-primary" />
        </div>
        <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full mb-3">
          <Clock className="w-3 h-3" />
          Próximamente
        </div>
        <h2 className="text-base font-semibold text-white mb-2">Módulo de Campañas en Desarrollo</h2>
        <p className="text-gray-500 text-xs max-w-md">
          Pronto podrás gestionar campañas de Google Ads, Meta Ads y Email Marketing directamente desde este panel.
          Seguimiento de ROI, presupuestos y rendimiento en tiempo real.
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full max-w-sm">
          {['Google Ads', 'Meta Ads', 'Email Marketing'].map(feature => (
            <div key={feature} className="bg-background border border-white/5 rounded-lg px-3 py-2.5 text-xs text-gray-400">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
