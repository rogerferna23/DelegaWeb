import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Sparkles, FileText, Clapperboard, Image as ImageIcon,
  Smartphone, Target, ShoppingCart, Brain, Star, Zap, Flame, Diamond,
  Map, BookOpen, Lightbulb, GraduationCap, MessageSquare, Ban, HelpCircle,
  TrendingUp, Puzzle, Wand2, Loader2, PenTool, LayoutTemplate, Volume2, Archive, Download,
  Briefcase, Save, Trash2, Plus, Search, Sparkles as SparklesIcon,
  ClipboardCheck, ListOrdered, BarChart, CheckSquare, GitCompare, Eye
} from 'lucide-react';
import { CopyButton, VideoResultView, CarouselResultView, OptimizacionResultView } from '../components/guiones/GuionResultViews';
import GuionesHistoryView from '../components/guiones/GuionesHistoryView';
import type { GuionHistorial } from '../components/guiones/GuionesHistoryView';
import { buildGuionPrompt } from '../components/guiones/GuionPromptBuilder';
import type { GenerarType } from '../components/guiones/GuionPromptBuilder';
import { generarGuionDocx } from '../utils/generarGuionDocx';
import { useJob } from '../../contexts/BackgroundJobsContext';
import { useUrlParam } from '../../hooks/useUrlParam';

interface ScriptProfile {
  id: string;
  company_name: string;
  offer?: string;
  ideal_client?: string;
  differentiator?: string;
  [key: string]: unknown;
}

export default function GuionesIA() {
  // Persistimos el tab activo en ?tab=... para que F5 o compartir link
  // preserve la vista (generar vs historial).
  const [activeTab, setActiveTab] = useUrlParam('tab', 'generar'); // 'generar' | 'historial'
  const [generarType, setGenerarType] = useState<string>('carrusel'); // 'video_publicidad', 'video_contenido', 'carrusel', 'optimizar'
  const [estructura, setEstructura] = useState<string | null>(null);
  const [tono, setTono] = useState('profesional');
  
  // Para optimización
  const [textoAOptimizar, setTextoAOptimizar] = useState('');
  const [objetivoOptimizacion, setObjetivoOptimizacion] = useState('venta');

  // Estado del generador.
  // La generación de guión va por el BackgroundJobsContext para que sobreviva
  // a cambios de ruta: el usuario puede navegar mientras espera los 8-15s.
  const guionJob = useJob('guiones-ia:generar');
  const isGenerating = guionJob.isRunning;
  const jobErrorMsg = guionJob.error || null;

  // Estado local SOLO para cuando el usuario abre un guión viejo desde el
  // historial (eso no pasa por el job, es una lectura directa de la DB).
  const [historyView, setHistoryView] = useState<Record<string, unknown> | null>(null);

  // resultData: primero lo que el usuario abrió del historial, si no, el del job.
  const resultData = historyView || guionJob.result || null;

  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsgLocal, setErrorMsgLocal] = useState<string | null>(null);
  // Mensaje de error combinado: prioridad al error del job, si existe.
  const errorMsg = errorMsgLocal || jobErrorMsg;
  const setErrorMsg = setErrorMsgLocal;
  
  // Estado para ver un guión desde historial
  const [guionEnVista, setGuionEnVista] = useState<Record<string, unknown> | null>(null);

  const [formData, setFormData] = useState({
    nombre: '', servicio: '', cliente: '', problema: '', resultado: ''
  });

  // Perfiles de Negocio
  const [profiles, setProfiles] = useState<ScriptProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'script') // Filtrar solo guiones
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error cargando perfiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSelectProfile = (profile: ScriptProfile | null) => {
    if (!profile) {
      setSelectedProfileId(null);
      setFormData({ nombre: '', servicio: '', cliente: '', problema: '', resultado: '' });
      return;
    }

    setSelectedProfileId(profile.id);
    setFormData({
      nombre: profile.company_name,
      servicio: profile.offer ?? '',
      cliente: profile.ideal_client ?? '',
      problema: profile.differentiator || '',
      resultado: formData.resultado // Mantener lo que estaba si ya hay algo
    });
  };

  const saveProfile = async () => {
    if (!formData.nombre || !formData.servicio) {
      setErrorMsg('El nombre y servicio son obligatorios para guardar el perfil.');
      return;
    }

    try {
      setIsSavingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const profileData = {
        user_id: user.id,
        company_name: formData.nombre,
        offer: formData.servicio,
        ideal_client: formData.cliente,
        differentiator: formData.problema,
        target_result: formData.resultado, // Guardar resultado (campo nuevo)
        price_range: 'Variable', 
        sales_method: 'other',
        type: 'script' // Marcar como tipo guion
      };

      let result;
      if (selectedProfileId) {
        // Actualizar existente
        result = await supabase
          .from('business_profiles')
          .update(profileData)
          .eq('id', selectedProfileId)
          .select();
      } else {
        // Buscar si ya existe por nombre para evitar duplicados
        const existing = profiles.find(p => p.company_name.toLowerCase() === formData.nombre.toLowerCase());
        if (existing) {
          result = await supabase
            .from('business_profiles')
            .update(profileData)
            .eq('id', existing.id)
            .select();
        } else {
          // Crear nuevo
          result = await supabase.from('business_profiles').insert([profileData]).select();
        }
      }

      if (result.error) throw result.error;

      if (result.data && result.data[0]) {
        setSelectedProfileId(result.data[0].id);
        await fetchProfiles();
      }
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setErrorMsg('No se pudo guardar el perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGenTypeClick = (type: string) => {
    setGenerarType(type);
    setEstructura(null);
    setHistoryView(null);
    guionJob.clear();
  };

  const handleGenerar = async () => {
    if (!formData.nombre || !formData.servicio) return setErrorMsg('Faltan datos del negocio (Paso 1).');
    if (generarType !== 'optimizar' && !estructura) return setErrorMsg('Selecciona una estructura (Paso 3).');
    if (generarType === 'optimizar' && !textoAOptimizar) return setErrorMsg('Ingresa el texto a optimizar.');

    setErrorMsg(null);

    // La generación se delega al BackgroundJobsContext (vive a nivel root).
    // El usuario puede irse a Reportes mientras la IA trabaja; al volver
    // encuentra el resultado esperándolo.
    try {
      await guionJob.start(
        async () => {
          const { systemPrompt, userPrompt } = buildGuionPrompt(
            formData,
            generarType as GenerarType,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            estructura as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tono as any,
            textoAOptimizar,
            objetivoOptimizacion
          );

          const { data, error } = await supabase.functions.invoke('generate-ai-guion', {
            body: { systemPrompt, userPrompt },
          });

          if (error) throw error;
          if (!data || !data.result) throw new Error('Respuesta de IA vacía.');

          let parsedResponse;
          try {
            parsedResponse = JSON.parse(data.result);
          } catch (errParse) {
            console.error('Parsed failed, raw:', data.result, 'Error:', errParse);
            throw new Error('La IA no devolvió un formato válido.');
          }

          // Guardar en DB (no-blocking para el resultado — si falla, igual devolvemos el guión).
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              let ganchoPreview = '';
              if (parsedResponse.gancho) ganchoPreview = parsedResponse.gancho;
              else if (parsedResponse.carrusel_optimizado?.titulo_carrusel) ganchoPreview = parsedResponse.carrusel_optimizado.titulo_carrusel;
              else if (parsedResponse.guion_optimizado?.gancho) ganchoPreview = parsedResponse.guion_optimizado.gancho;
              else if (parsedResponse.titulo_carrusel) ganchoPreview = parsedResponse.titulo_carrusel;

              await supabase.from('guiones_historial').insert({
                user_id: user.id,
                tipo: generarType,
                estructura: generarType === 'optimizar' ? objetivoOptimizacion : estructura,
                tono: tono,
                negocio_nombre: formData.nombre,
                servicio: formData.servicio,
                cliente_ideal: formData.cliente,
                problema: formData.problema,
                resultado: formData.resultado,
                guion_json: parsedResponse,
                gancho_preview: ganchoPreview ? ganchoPreview.substring(0, 100) + '...' : '',
                es_optimizado: generarType === 'optimizar',
                guion_original: textoAOptimizar,
              });
            }
          } catch (dbErr) {
            console.warn('No se pudo guardar el guión en historial:', dbErr);
          }

          return parsedResponse;
        },
        { label: `Guión IA: ${formData.servicio || 'Sin servicio'} (${generarType})` }
      );
    } catch (err) {
      // El error ya queda en el job (aparece en jobErrorMsg).
      console.error('Error generando guión:', err);
    }
  };

  const handleDescargarDocx = async () => {
    if (!resultData) return;
    setIsDownloading(true);
    try {
      await generarGuionDocx(resultData, generarType, formData);
    } catch (err) {
      console.error('Error generando DOCX:', err);
      setErrorMsg('Error al generar el documento Word.');
    } finally {
      setIsDownloading(false);
    }
  };

  const verDesdeHistorial = (guion: GuionHistorial) => {
    setActiveTab('generar');
    // Al abrir desde historial, limpiamos el job activo y usamos el estado local.
    guionJob.clear();
    setHistoryView((guion as unknown as Record<string, unknown>).guion_json as Record<string, unknown> | null);
    setGenerarType(guion.tipo || '');
    setGuionEnVista(guion as unknown as Record<string, unknown>);
  };

  // Maps para renderizar dinámicamente
  const estructurasMap: Record<string, { id: string; icon: React.ElementType; iconColor: string; title: string; desc: string }[]> = {
    carrusel: [
      { id: 'venta', icon: ShoppingCart, iconColor: 'text-gray-400', title: 'Carrusel de venta', desc: 'Gancho → Dolor → Solución → CTA' },
      { id: 'educativo', icon: Brain, iconColor: 'text-pink-400', title: 'Carrusel educativo', desc: 'Problema → Tips/pasos → Cierre' },
      { id: 'exito', icon: Star, iconColor: 'text-yellow-400', title: 'Caso de éxito', desc: 'Antes → Proceso → Resultado → CTA' },
      { id: 'mitos', icon: Zap, iconColor: 'text-red-500', title: 'Rompe mitos visual', desc: 'Mito → Verdad → Tu solución → CTA' },
      { id: 'checklist', icon: ClipboardCheck, iconColor: 'text-amber-100', title: 'Checklist visual', desc: 'Título → Lista ✅/❌ → Cierre' },
      { id: 'pasoapaso', icon: ListOrdered, iconColor: 'text-blue-500', title: 'Paso a paso', desc: 'Problema → Pasos → Resultado' },
      { id: 'pyR', icon: MessageSquare, iconColor: 'text-gray-300', title: 'Pregunta y resp', desc: 'Pregunta → Respuesta → Insight' },
      { id: 'transformacion', icon: TrendingUp, iconColor: 'text-red-400', title: 'Transformación', desc: 'Actual → Método → Result' }
    ],
    video_publicidad: [
      { id: 'pas', icon: Flame, iconColor: 'text-orange-500', title: 'PAS', desc: 'Problema → Agitación → Solución' },
      { id: 'aida', icon: Target, iconColor: 'text-orange-500', title: 'AIDA', desc: 'Atención → Interés → Deseo → Acción' },
      { id: 'bab', icon: Map, iconColor: 'text-orange-500', title: 'BAB', desc: 'Antes → Después → Puente' },
      { id: 'fab', icon: Diamond, iconColor: 'text-cyan-400', title: 'FAB', desc: 'Característica → Ventaja → Beneficio' },
      { id: 'gancho', icon: Zap, iconColor: 'text-yellow-400', title: 'Gancho Directo', desc: 'Recomendado para ofertas rápidas' },
      { id: 'testimonio', icon: MessageSquare, iconColor: 'text-gray-400', title: 'Testimonio', desc: 'Caso de éxito contado' },
      { id: 'contraste', icon: Ban, iconColor: 'text-red-500', title: 'Contraste', desc: 'Lo que hacen mal vs tu método' },
      { id: 'pregunta', icon: HelpCircle, iconColor: 'text-red-500', title: 'Pregunta Fuerte', desc: 'Captar atención con curiosidad' }
    ],
    video_contenido: [
      { id: 'educativo_vid', icon: GraduationCap, iconColor: 'text-amber-400', title: 'Educativo', desc: 'Enseña algo de valor' },
      { id: 'storytelling', icon: BookOpen, iconColor: 'text-white', title: 'Storytelling', desc: 'Historia real emocional' },
      { id: 'rompe_mitos', icon: Lightbulb, iconColor: 'text-yellow-300', title: 'Rompe mitos', desc: 'Creencia errónea → verdad' },
      { id: 'detras_camaras', icon: Clapperboard, iconColor: 'text-gray-400', title: 'Detrás de escenas', desc: 'Humaniza la marca' },
      { id: 'dato_impactante', icon: BarChart, iconColor: 'text-green-500', title: 'Dato impactante', desc: 'Retiene la atención' },
      { id: 'lista_rapida', icon: CheckSquare, iconColor: 'text-green-400', title: 'Lista rápida', desc: 'Guardable y compartible' },
      { id: 'comparativa', icon: GitCompare, iconColor: 'text-orange-400', title: 'Comparativa', desc: 'Opción A vs B' },
      { id: 'prediccion', icon: Eye, iconColor: 'text-fuchsia-400', title: 'Predicción', desc: 'Genera autoridad en la industria' },
    ]
  };

  const tonosMap = [
    { id: 'profesional', title: 'Profesional & Autoridad' },
    { id: 'cercano', title: 'Cercano & Amigable' },
    { id: 'urgente', title: 'Urgente & Directo' },
    { id: 'provocador', title: 'Provocador & Polémico' },
  ];

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-white">Guiones IA</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Generador de scripts optimizados para convertir en Meta Ads e Instagram
          </p>
        </div>

        <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => { setActiveTab('generar'); setGuionEnVista(null); if(guionEnVista) { setHistoryView(null); guionJob.clear(); } }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'generar' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            ✨ Generar
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'historial' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            📚 Mis Guiones
          </button>
        </div>
      </div>

      {activeTab === 'historial' && (
        <GuionesHistoryView onVerDetalle={verDesdeHistorial} />
      )}

      {activeTab === 'generar' && (
        <>
          <div className={`bg-cardbg border border-white/10 rounded-2xl overflow-hidden transition-opacity ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>
            
            {/* Paso 1 */}
            <div className="p-6 border-b border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-300" />
                  <h2 className="text-base font-bold text-white">Paso 1 — Información de tu negocio</h2>
                </div>

                {/* Selector de Perfiles */}
                <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 px-3 py-1.5 overflow-x-auto max-w-[300px] no-scrollbar">
                    <button
                      onClick={() => handleSelectProfile(null)}
                      className={`whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${!selectedProfileId ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                    >
                      Nuevo
                    </button>
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProfile(p)}
                        className={`whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedProfileId === p.id ? 'bg-white/10 text-white border border-white/10' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                      >
                        {p.company_name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <label className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase mb-2">
                    Nombre del negocio
                    <button 
                      onClick={saveProfile}
                      disabled={isSavingProfile || !formData.nombre}
                      className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-all font-bold group"
                      title={selectedProfileId ? "Actualizar perfil guardado" : "Guardar como perfil nuevo"}
                    >
                      {isSavingProfile ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      )}
                      {selectedProfileId ? 'Actualizar' : 'Guardar'}
                    </button>
                  </label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: DelegaWeb" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Servicio principal</label>
                  <input type="text" name="servicio" value={formData.servicio} onChange={handleChange} placeholder="Ej: Web y marketing digital" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Tu cliente ideal</label>
                  <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} placeholder="Ej: Dueños que quieren automatizar ventas" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Problema que resuelves</label>
                  <input type="text" name="problema" value={formData.problema} onChange={handleChange} placeholder="Ej: Pierden clientes por no estar en internet" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Resultado que logras</label>
                  <input type="text" name="resultado" value={formData.resultado} onChange={handleChange} placeholder="Ej: Sistema automatizado de generación de clientes" className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50" />
                </div>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="p-6 border-b border-white/5 bg-background/30">
              <div className="flex items-center gap-2 mb-4">
                <Clapperboard className="w-5 h-5 text-gray-300" />
                <h2 className="text-base font-bold text-white">Paso 2 — ¿Qué quieres generar?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'video_publicidad', type: 'Video Publicidad', sub: 'Guiones para vender', icon: Target, c: 'text-red-500', bg: 'bg-red-500/10' },
                  { id: 'video_contenido', type: 'Video Contenido', sub: 'Genera autoridad', icon: Smartphone, c: 'text-blue-400', bg: 'bg-blue-500/10' },
                  { id: 'carrusel', type: 'Imágenes / Carrusel', sub: 'Estructura de slides', icon: ImageIcon, c: 'text-green-400', bg: 'bg-green-500/10' },
                  { id: 'optimizar', type: 'Optimizar mi guión', sub: 'Mágia IA para tus textos', icon: PenTool, c: 'text-purple-400', bg: 'bg-purple-500/10' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => handleGenTypeClick(opt.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col items-start ${generarType === opt.id ? 'bg-cardbg border-primary shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.02]' : 'bg-cardbg border-white/10 hover:border-white/20'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${opt.bg}`}>
                      <opt.icon className={`w-4 h-4 ${opt.c}`} />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">{opt.type}</h3>
                    <p className="text-[11px] font-medium text-gray-400">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 3 (Dinámico) */}
            {generarType === 'optimizar' ? (
              <div className="p-6 border-b border-white/5">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base font-bold text-white">Paso 3 — Pega tu guión original</h2>
                  </div>
                  <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                    <button onClick={() => setObjetivoOptimizacion('venta')} className={`px-3 py-1.5 text-xs font-bold rounded ${objetivoOptimizacion === 'venta' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Venta</button>
                    <button onClick={() => setObjetivoOptimizacion('contenido')} className={`px-3 py-1.5 text-xs font-bold rounded ${objetivoOptimizacion === 'contenido' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Contenido</button>
                    <button onClick={() => setObjetivoOptimizacion('carrusel')} className={`px-3 py-1.5 text-xs font-bold rounded ${objetivoOptimizacion === 'carrusel' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Carrusel</button>
                  </div>
                </div>
                <textarea 
                  value={textoAOptimizar}
                  onChange={(e) => setTextoAOptimizar(e.target.value)}
                  placeholder="Pega aquí el texto que tienes en mente. La IA lo analizará y devolverá una versión profesional, estructurada y persuasiva..."
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 min-h-[150px] resize-y"
                />
              </div>
            ) : (
              generarType && estructurasMap[generarType] && (
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Puzzle className="w-5 h-5 text-green-400" />
                    <h2 className="text-base font-bold text-white">Paso 3 — Elige la estructura</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {estructurasMap[generarType].map((est) => {
                      const Icon = est.icon;
                      return (
                        <button 
                          key={est.id}
                          onClick={() => setEstructura(est.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${estructura === est.id ? 'bg-background border-primary shadow-[0_0_10px_rgba(249,115,22,0.1)] scale-[1.02]' : 'bg-background border-white/10 hover:border-white/20'}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${est.iconColor}`} />
                            <span className="font-bold text-white text-[13px]">{est.title}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-medium tracking-wide">{est.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )
            )}

            {/* Paso 4 y 5 */}
            <div className="p-6 bg-background/50 flex flex-col md:flex-row gap-6 md:items-end justify-between">
              <div className="flex-1">
                 <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <h2 className="text-base font-bold text-white">Paso 4 — Tono de voz</h2>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {tonosMap.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => setTono(t.id)}
                        className={`px-4 py-2 border rounded-xl text-sm font-bold transition-all ${tono === t.id ? 'bg-primary text-white border-primary shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        {t.title}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                 {errorMsg && <p className="text-xs text-red-500 font-bold bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">{errorMsg}</p>}
                 <button 
                   onClick={handleGenerar}
                   disabled={isGenerating || (generarType !== 'optimizar' && !estructura)}
                   className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                 >
                   {isGenerating ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Generando Magia...</>
                   ) : (
                     <><Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Generar Guión Ahora</>
                   )}
                 </button>
              </div>
            </div>

          </div>

          {/* Resultados Render - MOVIDO AL FINAL */}
          {resultData && !isGenerating && (
             <div className="bg-cardbg border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)] rounded-2xl p-6 md:p-8 mt-8">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-green-400" /> Resultado Generado
                  </h2>
                  <button
                    onClick={handleDescargarDocx}
                    disabled={isDownloading}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 hover:border-white/20 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generando Word...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Descargar Word</>
                    )}
                  </button>
               </div>

               {generarType === 'optimizar' && <OptimizacionResultView data={resultData} />}
               {generarType === 'carrusel' && <CarouselResultView data={resultData} />}
               {(generarType === 'video_publicidad' || generarType === 'video_contenido') && <VideoResultView data={resultData} />}
             </div>
          )}
        </>
      )}
    </div>
  );
}
