import { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, Target, Users,
  Image as ImageIcon, Rocket, Save, Briefcase, Trash2, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getCsrfToken } from '../../utils/csrf';
import { buildCampaignPrompt } from '../components/campaigns/CampaignPromptBuilder';
import { useJob } from '../../contexts/BackgroundJobsContext';
import { useToast } from '../../contexts/ToastContext';
import { useCampaignDraft } from '../hooks/useCampaignDraft';
import { useBusinessProfiles } from '../hooks/useBusinessProfiles';
import StepContexto from './campana/StepContexto';
import StepConfiguracion from './campana/StepConfiguracion';
import StepAudiencia from './campana/StepAudiencia';
import StepCreativo from './campana/StepCreativo';
import StepGuia from './campana/StepGuia';
import type { CampaignFormData, TagField } from './campana/types';

const INITIAL_FORM_DATA: CampaignFormData = {
  business_profile_id: undefined,
  company_name: '', offer: '', ideal_client: '', differentiator: '',
  price_range: '', sales_method: '',
  name: '', objective: 'Interacción (Mensajes a WhatsApp)', daily_budget: 10,
  audience_age_min: 18, audience_age_max: 65,
  locations: ['México', 'Colombia', 'Perú'], interests: [], gender: 'Todos',
  primary_text: '', headline: '', description: '', cta: 'Enviar mensaje',
};

const STEPS = [
  { num: 1, title: 'Contexto', icon: Briefcase },
  { num: 2, title: 'Configuración', icon: Target },
  { num: 3, title: 'Audiencia', icon: Users },
  { num: 4, title: 'Creativo y Copy', icon: ImageIcon },
  { num: 5, title: 'Guía', icon: Rocket },
];

export default function NuevaCampana() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);
  const [formData, setFormData] = useState<CampaignFormData>(INITIAL_FORM_DATA);
  const [tagInput, setTagInput] = useState({ locations: '', interests: '' });

  const guideJob = useJob('nuevacampana:generate-guide');
  const isGeneratingGuide = guideJob.isRunning;
  const isGuideGenerated = guideJob.isSuccess;
  const implementationGuideText = String(guideJob.result || '');

  // Hooks expect their own looser CampaignFormData — cast at boundary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hookForm = formData as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hookSetForm = setFormData as any;

  const { draftSavedAt, hasRestoredDraft, clearDraft, discardDraft } =
    useCampaignDraft({ formData: hookForm, step, setFormData: hookSetForm, setStep });

  const { profiles, isLoadingProfiles, isSavingProfile, fetchProfiles, handleSelectProfile, saveProfile } =
    useBusinessProfiles({ formData: hookForm, setFormData: hookSetForm });

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleNext = async () => {
    if (step === 1) {
      const saved = await saveProfile();
      if (!saved) return;

      setFormData(prev => {
        const d = { ...prev };
        if (!d.name) {
          const dateStr = new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          d.name = `Camp. ${prev.company_name} - ${dateStr}`;
        }
        if (!d.daily_budget || d.daily_budget === 10) {
          if (prev.price_range.includes('5,000') || prev.price_range.includes('2,000')) d.daily_budget = 30;
          else if (prev.price_range.includes('500')) d.daily_budget = 15;
          else d.daily_budget = 5;
        }
        const clientText = prev.ideal_client.toLowerCase();
        if (clientText.includes('dueño') || clientText.includes('emprendedor') || clientText.includes('profesional')) {
          d.audience_age_min = 25; d.audience_age_max = 55;
        } else if (clientText.includes('joven') || clientText.includes('estudiante')) {
          d.audience_age_min = 18; d.audience_age_max = 30;
        }
        if (d.interests.length === 0) {
          if (clientText.includes('negocio') || clientText.includes('venta')) d.interests = ['Espíritu empresarial', 'Pequeñas empresas'];
          else if (clientText.includes('tecnología') || clientText.includes('software')) d.interests = ['Tecnología', 'Gadgets'];
        }
        return d;
      });
    }
    setStep(prev => Math.min(5, prev + 1));
  };

  const handleBack = () => step === 1 ? navigate('/admin/campanas') : setStep(prev => Math.max(1, prev - 1));

  const handleAddTag = (type: TagField, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput[type].trim()) {
      e.preventDefault();
      const current: string[] = formData[type];
      if (!current.includes(tagInput[type].trim())) {
        setFormData({ ...formData, [type]: [...current, tagInput[type].trim()] });
      }
      setTagInput({ ...tagInput, [type]: '' });
    }
  };

  const removeTag = (type: TagField, tag: string) => {
    const current: string[] = formData[type];
    setFormData({ ...formData, [type]: current.filter(t => t !== tag) });
  };

  const handleCopySelected = (copyData: Partial<CampaignFormData>) =>
    setFormData(prev => ({ ...prev, ...copyData }));

  const generateGuide = async () => {
    try {
      await guideJob.start(
        async () => {
          const prompt = buildCampaignPrompt(formData);
          const { data, error } = await supabase.functions.invoke('ai-chat', {
            body: { message: prompt, is_copy_generation: false },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          return data.result || 'No se pudo generar la guía. Intenta de nuevo.';
        },
        { label: `Guía de campaña: ${formData.company_name || 'Sin nombre'}` }
      );
    } catch (err) {
      console.error('Error generando guía:', err);
      toast.error(`Error al generar la guía: ${(err as Error).message || 'Error de conexión'}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(implementationGuideText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const savePlanned = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Debe iniciar sesión para guardar');
      const token = await getCsrfToken();
      if (!token) throw new Error('No se pudo validar la sesión de seguridad CSRF');
      const { data, error } = await supabase.functions.invoke('create-campaign-secure', {
        body: { ...formData, status: 'planned' },
        headers: { 'X-CSRF-Token': token },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      clearDraft();
      guideJob.clear();
      navigate('/admin/campanas');
    } catch (err) {
      console.error('Fallo en guardado seguro:', err);
      toast.error(`Error de Seguridad: ${(err as Error).message}`);
    }
  };

  const isStep1Incomplete = !formData.company_name || !formData.offer || !formData.ideal_client || !formData.price_range || !formData.sales_method;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white mb-0.5 text-balance">Planificador de Campaña</h1>
          <p className="text-xs text-gray-400">Diseña tu estrategia y genera la guía para Meta Ads Manager</p>
        </div>
        {(draftSavedAt || hasRestoredDraft) && (
          <div className="flex items-center gap-2">
            {hasRestoredDraft && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 font-medium">
                ✨ Borrador restaurado
              </span>
            )}
            {draftSavedAt && (
              <span
                className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400 font-medium flex items-center gap-1"
                title={`Guardado automáticamente: ${new Date(draftSavedAt).toLocaleString()}`}
              >
                <Save className="w-3 h-3" />
                Borrador guardado
              </span>
            )}
            <button
              type="button"
              onClick={() => discardDraft(hookForm)}
              className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:text-red-300 hover:border-red-400/30 font-medium flex items-center gap-1 transition-colors"
              title="Descartar el borrador y empezar desde cero"
            >
              <Trash2 className="w-3 h-3" />
              Descartar
            </button>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="w-full bg-cardbg border border-white/5 rounded-2xl p-3 flex justify-between relative">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
        {STEPS.map((s) => {
          const isActive = step === s.num;
          const isPast = step > s.num;
          const Icon = s.icon;
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 w-24">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2
                ${isActive ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' :
                  isPast ? 'bg-background border-primary text-primary' : 'bg-background border-white/10 text-gray-500'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-white' : isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-cardbg border border-white/5 rounded-2xl p-6 min-h-[350px]">
        {step === 1 && <StepContexto formData={formData} setFormData={setFormData} profiles={profiles} isLoadingProfiles={isLoadingProfiles} isSavingProfile={isSavingProfile} handleSelectProfile={handleSelectProfile} saveProfile={saveProfile} />}
        {step === 2 && <StepConfiguracion formData={formData} setFormData={setFormData} />}
        {step === 3 && <StepAudiencia formData={formData} setFormData={setFormData} tagInput={tagInput} setTagInput={setTagInput} handleAddTag={handleAddTag} removeTag={removeTag} />}
        {step === 4 && <StepCreativo formData={formData} setFormData={setFormData} handleCopySelected={handleCopySelected} />}
        {step === 5 && <StepGuia isGuideGenerated={isGuideGenerated} isGeneratingGuide={isGeneratingGuide} implementationGuideText={implementationGuideText} generateGuide={generateGuide} copyToClipboard={copyToClipboard} copySuccess={copySuccess} savePlanned={savePlanned} />}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center bg-cardbg border border-white/5 p-3 rounded-2xl">
        <button onClick={handleBack} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          {step === 1 ? 'Volver' : 'Atrás'}
        </button>
        {step < 5 && (
          <button
            onClick={handleNext}
            disabled={step === 1 && isStep1Incomplete}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]
              ${step === 1 && isStep1Incomplete ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primaryhover text-white'}`}
          >
            {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Siguiente'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
