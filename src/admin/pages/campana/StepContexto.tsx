import { Briefcase, LayoutTemplate, Save, Loader2, MessageSquare, ShoppingCart, Mail, PlusSquare } from 'lucide-react';
import type { CampaignFormData } from './types';
import type { BusinessProfile } from '../../hooks/useBusinessProfiles';

interface Props {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData | ((prev: CampaignFormData) => CampaignFormData)) => void;
  profiles: BusinessProfile[];
  isLoadingProfiles: boolean;
  isSavingProfile: boolean;
  handleSelectProfile: (profile: BusinessProfile) => void;
  saveProfile: () => Promise<boolean>;
}

export default function StepContexto({ formData, setFormData, profiles, isLoadingProfiles, isSavingProfile, handleSelectProfile, saveProfile }: Props) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center bg-primary/5 border border-primary/10 rounded-xl p-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Perfil del Negocio</h3>
            <p className="text-[10px] text-gray-400">Selecciona una empresa guardada o crea una nueva.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            onChange={(e) => {
              const profile = profiles.find(p => p.id === e.target.value);
              if (profile) handleSelectProfile(profile);
              else setFormData((prev: CampaignFormData) => ({ ...prev, business_profile_id: undefined, company_name: '' }));
            }}
            disabled={isLoadingProfiles}
            className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-primary outline-none min-w-[150px]"
            value={formData.business_profile_id || ''}
          >
            <option value="">{isLoadingProfiles ? 'Cargando...' : '-- Nuevo Perfil --'}</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.company_name}</option>
            ))}
          </select>
          <button
            onClick={saveProfile}
            disabled={isSavingProfile || !formData.company_name}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 rounded-lg transition-all"
          >
            {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar Perfil
          </button>
        </div>
      </div>

      {profiles.length > 0 && formData.business_profile_id && (
        <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg px-4 py-2 text-[10px] text-teal-400 font-medium">
          ✨ Contexto cargado de tu última campaña para <strong>{formData.company_name}</strong>. Puedes editarlo si algo cambió.
        </div>
      )}

      {profiles.length === 0 && (
        <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg px-4 py-2 text-[10px] text-orange-400 italic">
          💡 Esta información se guarda para futuras campañas. Solo la llenas una vez por empresa.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nombre de la Empresa *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={e => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all"
              placeholder="Ej: DelegaWeb"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1.5 ml-1">
              <label className="block text-xs font-bold text-gray-400 uppercase">¿Qué ofreces? *</label>
              <span className={`text-[10px] ${formData.offer.length > 280 ? 'text-orange-500' : 'text-gray-500'}`}>{formData.offer.length}/300</span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={formData.offer}
              onChange={e => setFormData({ ...formData, offer: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none resize-none transition-all"
              placeholder="Describe tu producto o servicio en 1-2 frases..."
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-1.5 ml-1">
              <label className="block text-xs font-bold text-gray-400 uppercase">¿Quién es tu cliente ideal? *</label>
              <span className={`text-[10px] ${formData.ideal_client.length > 280 ? 'text-orange-500' : 'text-gray-500'}`}>{formData.ideal_client.length}/300</span>
            </div>
            <textarea
              rows={3}
              maxLength={300}
              value={formData.ideal_client}
              onChange={e => setFormData({ ...formData, ideal_client: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none resize-none transition-all"
              placeholder="Describe a quién le vendes..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-end mb-1.5 ml-1">
              <label className="block text-xs font-bold text-gray-400 uppercase">¿Cuál es tu diferenciador?</label>
              <span className={`text-[10px] ${formData.differentiator.length > 180 ? 'text-orange-500' : 'text-gray-500'}`}>{formData.differentiator.length}/200</span>
            </div>
            <textarea
              rows={2}
              maxLength={200}
              value={formData.differentiator}
              onChange={e => setFormData({ ...formData, differentiator: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none resize-none transition-all"
              placeholder="Qué te hace diferente de tu competencia..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Rango de precio *</label>
            <select
              value={formData.price_range}
              onChange={e => setFormData({ ...formData, price_range: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-all appearance-none"
            >
              <option value="">Seleccionar rango...</option>
              <option value="Menos de $100 USD">Menos de $100 USD</option>
              <option value="$100 - $500 USD">$100 - $500 USD</option>
              <option value="$500 - $2,000 USD">$500 - $2,000 USD</option>
              <option value="$2,000 - $5,000 USD">$2,000 - $5,000 USD</option>
              <option value="Más de $5,000 USD">Más de $5,000 USD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">¿Cómo cierras tus ventas? *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'whatsapp', label: 'WhatsApp → Llamada', sub: 'Closer', icon: MessageSquare },
                { id: 'direct', label: 'Venta Directa', sub: 'E-commerce', icon: ShoppingCart },
                { id: 'lead', label: 'Formulario', sub: 'Email', icon: Mail },
                { id: 'other', label: 'Otro', sub: 'Variable', icon: PlusSquare },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = formData.sales_method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setFormData({ ...formData, sales_method: m.id })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      isSelected ? 'bg-primary/10 border-primary text-white' : 'bg-background border-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20 text-primary' : 'bg-white/5'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold leading-tight">{m.label}</p>
                      <p className="text-[8px] opacity-60 uppercase">{m.sub}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

StepContexto.displayName = 'StepContexto';
