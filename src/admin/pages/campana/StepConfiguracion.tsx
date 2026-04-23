import { Sparkles } from 'lucide-react';
import type { CampaignFormData } from './types';

interface Props {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
}

export default function StepConfiguracion({ formData, setFormData }: Props) {
  return (
    <div className="space-y-5 max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-base font-bold text-white mb-3">Configuración Básica</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Nombre de la Campaña</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
            placeholder="Ej: Tráfico Frío Octubre"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-gray-400">Objetivo en Meta Ads</label>
            {formData.sales_method === 'whatsapp' && (
              <span className="text-[10px] text-teal-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Recomendado para WhatsApp
              </span>
            )}
          </div>
          <select
            value={formData.objective}
            onChange={e => setFormData({ ...formData, objective: e.target.value })}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors appearance-none"
          >
            <option value="Tráfico (Clics en el enlace)">Tráfico (Clics en el enlace)</option>
            <option value="Interacción (Mensajes a WhatsApp)">Interacción (Mensajes a WhatsApp)</option>
            <option value="Generación de Clientes Potenciales">Generación de Clientes Potenciales</option>
            <option value="Ventas">Ventas</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Presupuesto Diario (USD)</label>
          <input
            type="number"
            value={formData.daily_budget}
            onChange={e => setFormData({ ...formData, daily_budget: e.target.value === '' ? 0 : Number(e.target.value) })}
            className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
            min="1"
          />
        </div>
      </div>
    </div>
  );
}

StepConfiguracion.displayName = 'StepConfiguracion';
