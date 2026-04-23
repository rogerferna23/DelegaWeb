import React from 'react';
import { Globe, Info } from 'lucide-react';
import type { CampaignFormData, TagField } from './types';

interface Props {
  formData: CampaignFormData;
  setFormData: (data: CampaignFormData) => void;
  tagInput: { locations: string; interests: string };
  setTagInput: (v: { locations: string; interests: string }) => void;
  handleAddTag: (type: TagField, e: React.KeyboardEvent<HTMLInputElement>) => void;
  removeTag: (type: TagField, tag: string) => void;
}

export default function StepAudiencia({ formData, setFormData, tagInput, setTagInput, handleAddTag, removeTag }: Props) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-base font-bold text-white">Público y Segmentación</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] text-gray-400 italic">IA enfocada en: {formData.ideal_client.substring(0, 30)}...</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Edad mínima</label>
          <input type="number" value={formData.audience_age_min} onChange={e => setFormData({ ...formData, audience_age_min: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Edad máxima</label>
          <input type="number" value={formData.audience_age_max} onChange={e => setFormData({ ...formData, audience_age_max: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Ubicaciones (Escribe y presiona Enter)</label>
        <div className="bg-background border border-white/10 rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-primary transition-colors">
          {formData.locations.map(loc => (
            <span key={loc} className="bg-primary/20 text-primary px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold">
              {loc}
              <button onClick={() => removeTag('locations', loc)} className="hover:text-white">×</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput.locations}
            onChange={e => setTagInput({ ...tagInput, locations: e.target.value })}
            onKeyDown={e => handleAddTag('locations', e)}
            placeholder="Añadir..."
            className="bg-transparent outline-none text-white text-xs flex-1 min-w-[80px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Intereses (Escribe y presiona Enter)</label>
        <div className="bg-background border border-white/10 rounded-lg p-2 flex flex-wrap gap-2 focus-within:border-primary transition-colors">
          {formData.interests.map(int => (
            <span key={int} className="bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold">
              {int}
              <button onClick={() => removeTag('interests', int)} className="hover:text-white">×</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput.interests}
            onChange={e => setTagInput({ ...tagInput, interests: e.target.value })}
            onKeyDown={e => handleAddTag('interests', e)}
            placeholder="Ej: Emprendimiento..."
            className="bg-transparent outline-none text-white text-xs flex-1 min-w-[120px]"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] leading-relaxed text-gray-300">
            <span className="font-bold text-primary">Recomendación Estratégica:</span> Para un ticket de{' '}
            <span className="text-white font-medium">{formData.price_range || 'tu precio'}</span>, te recomendamos segmentar por{' '}
            <span className="text-white font-medium">intereses de alto valor</span> y mantener un alcance amplio. El algoritmo de Meta encontrará mejor a tus {formData.ideal_client.split(' ')[0]}s con menos restricciones.
          </p>
        </div>
      </div>
    </div>
  );
}

StepAudiencia.displayName = 'StepAudiencia';
