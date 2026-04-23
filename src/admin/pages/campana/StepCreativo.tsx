import { Image as ImageIcon, Users, Info, Sparkles } from 'lucide-react';
import GeneradorCopyAI from '../../components/GeneradorCopyAI';
import { sanitize } from '../../../utils/sanitize';
import type { CampaignFormData } from './types';

interface Props {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
  handleCopySelected: (copyData: Partial<CampaignFormData>) => void;
}

export default function StepCreativo({ formData, setFormData, handleCopySelected }: Props) {
  return (
    <div className="max-w-5xl mx-auto animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
      {/* Columna Izquierda: Preview */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Visualización del Anuncio
        </h2>

        <div className="bg-[#1c2b3d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-3 flex items-center gap-2 border-b border-white/5">
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/5 flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-white">Tu Página</p>
              <p className="text-[9px] text-gray-400">Publicidad · Patrocinado</p>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <p
              className="text-[11px] text-gray-200 line-clamp-3 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: sanitize(formData.primary_text) || 'Aquí se mostrará el cuerpo principal de tu anuncio...' }}
            />
          </div>

          <div className="aspect-video bg-background/50 flex flex-col items-center justify-center border-y border-white/5 group">
            <ImageIcon className="w-8 h-8 text-white/5 mb-2 group-hover:text-primary/20 transition-colors" />
            <p className="text-[10px] font-medium text-gray-500">Sube tu imagen/video directo en Meta</p>
          </div>

          <div className="bg-[#2a3a4d] p-3 flex justify-between items-center">
            <div className="flex-1">
              <p className="text-[9px] text-gray-400 uppercase font-bold truncate">FACEBOOK.COM</p>
              <p
                className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-1"
                dangerouslySetInnerHTML={{ __html: sanitize(formData.headline) || 'Título del anuncio' }}
              />
              <p
                className="text-[10px] text-gray-300 line-clamp-1 mt-0.5"
                dangerouslySetInnerHTML={{ __html: sanitize(formData.description) || 'Descripción breve' }}
              />
            </div>
            <div className="bg-[#4b5a6d] border border-white/10 px-3 py-1 rounded text-[10px] font-bold text-white">
              {formData.cta}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
          <h4 className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5 uppercase">
            <Info className="w-3.5 h-3.5" />
            Aviso de Creativos
          </h4>
          <p className="text-[10px] leading-relaxed text-gray-400">
            Por seguridad, <span className="text-white font-medium">DelegaWeb ya no almacena tus imágenes o videos.</span> Deberás subirlos directamente en el Administrador de Anuncios de Meta siguiendo el paso 7 de la guía que generaremos al finalizar.
          </p>
        </div>
      </div>

      {/* Columna Derecha: Copy Generator */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Escritura con IA
          </h2>
        </div>

        <GeneradorCopyAI
          context={{ offer: formData.offer, client: formData.ideal_client, diff: formData.differentiator, price: formData.price_range }}
          onSelectCopy={handleCopySelected}
        />

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Texto Principal</label>
            <textarea
              rows={4}
              value={formData.primary_text}
              onChange={e => setFormData({ ...formData, primary_text: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none resize-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Título (Headline)</label>
            <input
              type="text"
              value={formData.headline}
              onChange={e => setFormData({ ...formData, headline: e.target.value })}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Call to Action</label>
              <select
                value={formData.cta}
                onChange={e => setFormData({ ...formData, cta: e.target.value })}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs focus:border-primary outline-none transition-all appearance-none"
              >
                <option value="Enviar mensaje">Enviar mensaje</option>
                <option value="Más información">Más información</option>
                <option value="Registrarte">Registrarte</option>
                <option value="Contactar">Contactar</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

StepCreativo.displayName = 'StepCreativo';
