import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, Target, Users,
  Image as ImageIcon, Rocket,
  Copy, ExternalLink, Save, CheckCircle2,
  Briefcase,
  MessageSquare, ShoppingCart, Mail, PlusSquare,
  Loader2, Trash2,
  LayoutTemplate, Sparkles, Globe, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import GeneradorCopyAI from '../components/GeneradorCopyAI';
import { getCsrfToken } from '../../utils/csrf';
import { sanitize } from '../../utils/sanitize';
import { buildCampaignPrompt } from '../components/campaigns/CampaignPromptBuilder';
import { useJob } from '../../contexts/BackgroundJobsContext';
import { useToast } from '../../contexts/ToastContext';

// Clave de borrador en localStorage. La versionamos por si el shape
// del formulario cambia a futuro y necesitamos invalidar drafts viejos.
const DRAFT_STORAGE_KEY = 'delegaweb:nuevacampana:draft:v1';
const DRAFT_DEBOUNCE_MS = 500;

const INITIAL_FORM_DATA = {
  // Perfil de Negocio (Paso 1)
  business_profile_id: null,
  company_name: '',
  offer: '',
  ideal_client: '',
  differentiator: '',
  price_range: '',
  sales_method: '',

  // Configuración (Paso 2)
  name: '',
  objective: 'Interacción (Mensajes a WhatsApp)',
  daily_budget: 10,

  // Audiencia (Paso 3)
  audience_age_min: 18,
  audience_age_max: 65,
  locations: ['México', 'Colombia', 'Perú'],
  interests: [],
  gender: 'Todos',

  // Creativo (Paso 4)
  primary_text: '',
  headline: '',
  description: '',
  cta: 'Enviar mensaje'
};

// Determina si un draft es "no trivial" (tiene algún campo significativo)
// para evitar mostrar "Borrador guardado" cuando el usuario aún no tocó nada.
const isMeaningfulDraft = (data) => {
  if (!data) return false;
  return Boolean(
    data.company_name?.trim() ||
    data.offer?.trim() ||
    data.ideal_client?.trim() ||
    data.differentiator?.trim() ||
    data.price_range ||
    data.sales_method ||
    data.name?.trim() ||
    (data.interests && data.interests.length > 0) ||
    data.primary_text?.trim() ||
    data.headline?.trim() ||
    data.description?.trim()
  );
};

export default function NuevaCampana() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [copySuccess, setCopySuccess] = useState(false);

  // Job global para la generación de la guía de implementación.
  // Así, si el usuario navega a otra sección mientras genera, el resultado
  // sigue disponible cuando vuelva — no se pierde.
  const guideJob = useJob('nuevacampana:generate-guide');
  const isGeneratingGuide = guideJob.isRunning;
  const isGuideGenerated = guideJob.isSuccess;
  const implementationGuideText = guideJob.result || '';

  // Estado de borrador (persistencia localStorage)
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const hasHydratedRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // States del formulario
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [profiles, setProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [tagInput, setTagInput] = useState({ locations: '', interests: '' });

  // Cargar perfiles al montar
  React.useEffect(() => {
    fetchProfiles();
  }, []);

  // Rehidratar borrador desde localStorage al montar.
  // Solo una vez: corremos antes del autosave para no sobreescribir el draft
  // con el estado inicial vacío.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.formData && isMeaningfulDraft(parsed.formData)) {
          setFormData(prev => ({ ...prev, ...parsed.formData }));
          if (typeof parsed.step === 'number' && parsed.step >= 1 && parsed.step <= 5) {
            setStep(parsed.step);
          }
          setDraftSavedAt(parsed.savedAt || null);
          setHasRestoredDraft(true);
        }
      }
    } catch (err) {
      // localStorage corrupto o no disponible (modo privado, quota llena) — ignorar.
      console.warn('No se pudo leer el borrador de campaña:', err);
    } finally {
      hasHydratedRef.current = true;
    }
  }, []);

  // Autosave del borrador con debounce.
  // Guardamos { formData, step, savedAt } cuando el usuario hace cambios.
  useEffect(() => {
    if (!hasHydratedRef.current) return; // Evita escribir antes de rehidratar.

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        // No persistas el ID del perfil: si el usuario cambia de cuenta
        // o elimina el perfil, el id quedaría colgado.
        const { business_profile_id, ...formToPersist } = formData;
        if (!isMeaningfulDraft(formToPersist)) {
          // Si el formulario quedó vacío, limpia el borrador previo.
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          setDraftSavedAt(null);
          return;
        }
        const savedAt = new Date().toISOString();
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({ formData: formToPersist, step, savedAt })
        );
        setDraftSavedAt(savedAt);
      } catch (err) {
        console.warn('No se pudo guardar el borrador de campaña:', err);
      }
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData, step]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch { /* noop */ }
    setDraftSavedAt(null);
    setHasRestoredDraft(false);
  };

  const discardDraft = () => {
    if (!confirm('¿Descartar el borrador guardado y empezar desde cero?')) return;
    clearDraft();
    setFormData(INITIAL_FORM_DATA);
    setStep(1);
  };

  const fetchProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('NuevaCampana: No se encontró usuario al cargar perfiles.');
        setIsLoadingProfiles(false);
        return;
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .or('type.eq.campaign,type.is.null') // Traer campañas o perfiles viejos (null)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error detallado de Supabase (400?):', error);
        throw error;
      }
      
      setProfiles(data || []);
    } catch (err) {
      console.error('Error cargando perfiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSelectProfile = (profile) => {
    setFormData(prev => ({
      ...prev,
      business_profile_id: profile.id,
      company_name: profile.company_name,
      offer: profile.offer,
      ideal_client: profile.ideal_client,
      differentiator: profile.differentiator || '',
      price_range: profile.price_range,
      sales_method: profile.sales_method,
      // Auto-sugerir objetivo basado en método de venta
      objective: profile.sales_method === 'whatsapp' ? 'Interacción (Mensajes a WhatsApp)' : prev.objective
    }));
  };

  const saveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autorizado');

      const profileData = {
        user_id: user.id,
        company_name: formData.company_name,
        offer: formData.offer,
        ideal_client: formData.ideal_client,
        differentiator: formData.differentiator,
        price_range: formData.price_range,
        sales_method: formData.sales_method,
        type: 'campaign' // Marcar como tipo campaña
      };

      let result;
      // 1. Buscar si ya existe un perfil con ese nombre para este usuario
      const existingProfileByName = profiles.find(p => p.company_name.toLowerCase() === formData.company_name.toLowerCase());
      
      if (existingProfileByName) {
        // Actualizar el existente
        result = await supabase.from('business_profiles')
          .update(profileData)
          .eq('id', existingProfileByName.id)
          .select();
      } else {
        // Insertar nuevo
        result = await supabase.from('business_profiles').insert([profileData]).select();
      }

      if (result.error) throw result.error;
      
      if (result.data && result.data[0]) {
        setFormData(prev => ({ ...prev, business_profile_id: result.data[0].id }));
        await fetchProfiles(); // Recargar lista
      }
      return true;
    } catch (err) {
      console.error('Error guardando perfil:', err);
      toast.error(`Error: ${err.message || 'No se pudo guardar el perfil del negocio'}`);
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const saved = await saveProfile();
      if (!saved) return;

      // RECOMENDACIONES DE LA IA: Pre-llenado de pasos siguientes
      setFormData(prev => {
        const newData = { ...prev };
        
        // Sugerir Nombre de Campaña
        if (!newData.name) {
          const dateStr = new Date().toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          newData.name = `Camp. ${prev.company_name} - ${dateStr}`;
        }

        // Sugerir Presupuesto basado en el rango de precio
        if (!newData.daily_budget || newData.daily_budget === 10) {
          if (prev.price_range.includes('5,000') || prev.price_range.includes('2,000')) newData.daily_budget = 30;
          else if (prev.price_range.includes('500')) newData.daily_budget = 15;
          else newData.daily_budget = 5;
        }

        // Sugerir Edades basada en Cliente Ideal
        const clientText = prev.ideal_client.toLowerCase();
        if (clientText.includes('dueño') || clientText.includes('emprendedor') || clientText.includes('profesional')) {
          newData.audience_age_min = 25;
          newData.audience_age_max = 55;
        } else if (clientText.includes('joven') || clientText.includes('estudiante')) {
          newData.audience_age_min = 18;
          newData.audience_age_max = 30;
        }

        // Sugerir Intereses iniciales (Simulado por ahora, se puede expandir)
        if (newData.interests.length === 0) {
          if (clientText.includes('negocio') || clientText.includes('venta')) {
            newData.interests = ['Espíritu empresarial', 'Pequeñas empresas'];
          } else if (clientText.includes('tecnología') || clientText.includes('software')) {
            newData.interests = ['Tecnología', 'Gadgets'];
          }
        }

        return newData;
      });
    }
    setStep(prev => Math.min(5, prev + 1));
  };
  const handleBack = () => {
    if (step === 1) {
      navigate('/admin/campanas');
    } else {
      setStep(prev => Math.max(1, prev - 1));
    }
  };

  const handleAddTag = (type, e) => {
    if (e.key === 'Enter' && tagInput[type].trim()) {
      e.preventDefault();
      if (!formData[type].includes(tagInput[type].trim())) {
        setFormData({ ...formData, [type]: [...formData[type], tagInput[type].trim()] });
      }
      setTagInput({ ...tagInput, [type]: '' });
    }
  };

  const removeTag = (type, tag) => {
    setFormData({ ...formData, [type]: formData[type].filter(t => t !== tag) });
  };

  const handleCopySelected = (copyData) => {
    setFormData(prev => ({
      ...prev,
      primary_text: copyData.primary_text,
      headline: copyData.headline,
      description: copyData.description
    }));
  };

  const generateGuide = async () => {
    // El job se ejecuta en el BackgroundJobsContext (nivel root), así que
    // sigue vivo aunque el usuario navegue a otra sección del sidebar.
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
      // El error ya quedó almacenado en el job — lo mostramos al usuario.
      toast.error(`Error al generar la guía: ${err.message || 'Error de conexión'}`);
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

      // Obtener token de seguridad de un solo uso
      const token = await getCsrfToken();
      if (!token) throw new Error('No se pudo validar la sesión de seguridad CSRF');

      // Invocación a la Edge Function Blindada
      const { data, error } = await supabase.functions.invoke('create-campaign-secure', {
        body: { 
          ...formData, 
          status: 'planned'
        },
        headers: {
          'X-CSRF-Token': token
        }
      });

      if (error || data?.error) throw new Error(data?.error || error?.message);

      // Campaña guardada correctamente — descartamos el borrador y el job de guía.
      clearDraft();
      guideJob.clear();
      navigate('/admin/campanas');
    } catch (err) {
      console.error('Fallo en guardado seguro:', err);
      toast.error(`Error de Seguridad: ${err.message}`);
    }
  };

  const steps = [
    { num: 1, title: 'Contexto', icon: Briefcase },
    { num: 2, title: 'Configuración', icon: Target },
    { num: 3, title: 'Audiencia', icon: Users },
    { num: 4, title: 'Creativo y Copy', icon: ImageIcon },
    { num: 5, title: 'Guía', icon: Rocket }
  ];

  return (
    <div className="flex flex-col gap-6">
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
              onClick={discardDraft}
              className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400 hover:text-red-300 hover:border-red-400/30 font-medium flex items-center gap-1 transition-colors"
              title="Descartar el borrador y empezar desde cero"
            >
              <Trash2 className="w-3 h-3" />
              Descartar
            </button>
          </div>
        )}
      </div>

      {/* Stepper Header */}
      <div className="w-full bg-cardbg border border-white/5 rounded-2xl p-3 flex justify-between relative">
        <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-white/5 -translate-y-1/2 z-0"></div>
        {steps.map((s) => {
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

      {/* Main Form Area */}
      <div className="bg-cardbg border border-white/5 rounded-2xl p-6 min-h-[350px]">
        
        {/* PASO 1: Contexto del Negocio */}
        {step === 1 && (
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
                    else setFormData(prev => ({ ...prev, business_profile_id: null, company_name: '' }));
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
                    onChange={e => setFormData({...formData, company_name: e.target.value})}
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
                    onChange={e => setFormData({...formData, offer: e.target.value})}
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
                    onChange={e => setFormData({...formData, ideal_client: e.target.value})}
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
                    onChange={e => setFormData({...formData, differentiator: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-primary outline-none resize-none transition-all"
                    placeholder="Qué te hace diferente de tu competencia..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Rango de precio *</label>
                  <select 
                    value={formData.price_range}
                    onChange={e => setFormData({...formData, price_range: e.target.value})}
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
                          onClick={() => setFormData({...formData, sales_method: m.id})}
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
        )}

        {/* PASO 2: Config */}
        {step === 2 && (
          <div className="space-y-5 max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-base font-bold text-white mb-3">Configuración Básica</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nombre de la Campaña</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
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
                  onChange={e => setFormData({...formData, objective: e.target.value})}
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
                  onChange={e => setFormData({...formData, daily_budget: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary focus:outline-none transition-colors"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Audiencia */}
        {step === 3 && (
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
                  <input type="number" value={formData.audience_age_min} onChange={e => setFormData({...formData, audience_age_min: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Edad máxima</label>
                  <input type="number" value={formData.audience_age_max} onChange={e => setFormData({...formData, audience_age_max: e.target.value === '' ? '' : Number(e.target.value)})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none" />
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
                    onChange={e => setTagInput({...tagInput, locations: e.target.value})}
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
                    onChange={e => setTagInput({...tagInput, interests: e.target.value})}
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
                    <span className="font-bold text-primary">Recomendación Estratégica:</span> Para un ticket de <span className="text-white font-medium">{formData.price_range || 'tu precio'}</span>, te recomendamos segmentar por <span className="text-white font-medium">intereses de alto valor</span> y mantener un alcance amplio. El algoritmo de Meta encontrará mejor a tus {formData.ideal_client.split(' ')[0]}s con menos restricciones.
                  </p>
                </div>
             </div>
          </div>
        )}

        {/* PASO 4: Creativo y Copy */}
        {step === 4 && (
          <div className="max-w-5xl mx-auto animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
            {/* Columna Izquierda: Instrucciones y Preview */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Visualización del Anuncio
              </h2>
              
              <div className="bg-[#1c2b3d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Facebook Mock Header */}
                <div className="p-3 flex items-center gap-2 border-b border-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/5 flex items-center justify-center">
                    <Users className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white">Tu Página</p>
                    <p className="text-[9px] text-gray-400">Publicidad · Patrocinado</p>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-3 space-y-2">
                  <p className="text-[11px] text-gray-200 line-clamp-3 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: sanitize(formData.primary_text) || 'Aquí se mostrará el cuerpo principal de tu anuncio...' }}
                  />
                </div>

                {/* Creative Placeholder */}
                <div className="aspect-video bg-background/50 flex flex-col items-center justify-center border-y border-white/5 group">
                  <ImageIcon className="w-8 h-8 text-white/5 mb-2 group-hover:text-primary/20 transition-colors" />
                  <p className="text-[10px] font-medium text-gray-500">Sube tu imagen/video directo en Meta</p>
                </div>

                {/* Footer Link Area */}
                <div className="bg-[#2a3a4d] p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-[9px] text-gray-400 uppercase font-bold truncate">FACEBOOK.COM</p>
                    <p className="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-1"
                      dangerouslySetInnerHTML={{ __html: sanitize(formData.headline) || 'Título del anuncio' }}
                    />
                    <p className="text-[10px] text-gray-300 line-clamp-1 mt-0.5"
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
              
              <GeneradorCopyAI context={{ offer: formData.offer, client: formData.ideal_client, diff: formData.differentiator, price: formData.price_range }} onSelectCopy={handleCopySelected} />

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Texto Principal</label>
                  <textarea 
                    rows={4}
                    value={formData.primary_text}
                    onChange={e => setFormData({...formData, primary_text: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none resize-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Título (Headline)</label>
                  <input 
                    type="text" 
                    value={formData.headline}
                    onChange={e => setFormData({...formData, headline: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none transition-all" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Descripción</label>
                    <input 
                      type="text" 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-primary outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 ml-1">Call to Action</label>
                    <select 
                      value={formData.cta}
                      onChange={e => setFormData({...formData, cta: e.target.value})}
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
        )}

        {/* PASO 5: Guía */}
        {step === 5 && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in py-2">
             {!isGuideGenerated ? (
               <div className="text-center py-12">
                 <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                   <Rocket className="w-8 h-8 text-primary" />
                 </div>
                 <h2 className="text-xl font-bold text-white mb-2">¡Estrategia Finalizada!</h2>
                 <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
                   Hemos estructurado todos los componentes de tu campaña. Haz clic debajo para generar tu guía de implementación manual.
                 </p>
                 <button 
                   onClick={generateGuide}
                   disabled={isGeneratingGuide}
                   className="px-8 py-3 bg-primary hover:bg-primaryhover text-white rounded-xl font-bold shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isGeneratingGuide ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Diseñando Estrategia...
                     </>
                   ) : (
                     <>
                       Generar Guía de Implementación
                       <ArrowRight className="w-5 h-5" />
                     </>
                   )}
                 </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Sidebar Actions */}
                 <div className="lg:col-span-4 space-y-4">
                    <div className="bg-background/40 border border-teal-500/10 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center border border-teal-500/20">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Guía Lista</h3>
                      </div>
                      
                      <button 
                        onClick={copyToClipboard}
                        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all border
                          ${copySuccess ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'}`}
                      >
                        {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copySuccess ? '¡Copiado!' : 'Copiar al Portapapeles'}
                      </button>

                      <button 
                        onClick={() => window.open('https://adsmanager.facebook.com/adsmanager/manage/campaigns', '_blank')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-500/50 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir Meta Ads Manager
                      </button>

                      <button 
                        onClick={savePlanned}
                        className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                        Guardar como Planificada
                      </button>
                    </div>

                    <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                      <p className="text-[10px] text-orange-400 leading-relaxed italic">
                        "Tip: Una vez que publiques la campaña en Meta con el mismo nombre, DelegaWeb la detectará automáticamente y comenzará a mostrarte métricas."
                      </p>
                    </div>
                 </div>

                 {/* Guide Content Area */}
                 <div className="lg:col-span-8">
                   <div className="bg-background border border-white/10 rounded-2xl overflow-hidden h-[500px] flex flex-col">
                     <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vista de implementación</span>
                        <div className="flex gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-500/20"></div>
                        </div>
                     </div>
                     <pre className="flex-1 p-6 text-[11px] leading-relaxed text-blue-300 font-mono overflow-y-auto whitespace-pre-wrap selection:bg-primary/30">
                        {implementationGuideText}
                     </pre>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}

      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center bg-cardbg border border-white/5 p-3 rounded-2xl">
        <button 
          onClick={handleBack}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {step === 1 ? 'Volver' : 'Atrás'}
        </button>
        
        {step < 5 && (
          <button 
            onClick={handleNext}
            disabled={step === 1 && (!formData.company_name || !formData.offer || !formData.ideal_client || !formData.price_range || !formData.sales_method)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]
              ${(step === 1 && (!formData.company_name || !formData.offer || !formData.ideal_client || !formData.price_range || !formData.sales_method)) 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primaryhover text-white'}`}
          >
            {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Siguiente'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}
