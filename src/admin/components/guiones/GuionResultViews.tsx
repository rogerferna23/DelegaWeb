import { useState } from 'react';
import { Copy, Video, Image as ImageIcon, Sparkles, Check, Play, Clock, Hash, AlignLeft, Info } from 'lucide-react';

interface GuionSeccion {
  momento: string;
  lo_que_dices: string;
  lo_que_se_ve: string;
}

interface GuionData {
  gancho?: string;
  secciones?: GuionSeccion[];
  cta?: string;
  cierre?: string;
  texto_en_pantalla?: string;
  duracion_estimada?: string;
  tip_de_grabacion?: string;
  hashtags_sugeridos?: string[];
}

interface CarruselSlide {
  numero: number;
  funcion: string;
  texto_imagen: string;
  subtexto?: string;
  formato: string;
  prompt_visual: string;
}

interface CarruselData {
  titulo_carrusel?: string;
  slides?: CarruselSlide[];
  caption_sugerido?: string;
  hashtags_sugeridos?: string[];
}

interface Analisis {
  lo_que_funciona: string;
  lo_que_mejorar: string;
  cambios_principales: string;
}

interface OptimizacionData {
  analisis?: Analisis;
  nivel_de_mejora?: string;
  guion_optimizado?: GuionData;
  carrusel_optimizado?: CarruselData;
}

interface CopyButtonProps {
  text: string;
}

export const CopyButton = ({ text }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
      title="Copiar al portapapeles"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

interface VideoResultViewProps {
  data: GuionData;
}

export const VideoResultView = ({ data }: VideoResultViewProps) => {
  if (!data?.secciones) return null;

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
        <div className="bg-red-500/20 p-2 rounded-lg">
          <Sparkles className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-red-400">GANCHO (0-3s)</h3>
            <CopyButton text={data.gancho ?? ''} />
          </div>
          <p className="text-sm font-medium mt-1">"{data.gancho}"</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Video className="w-4 h-4" />
          <h4 className="font-semibold">Cuerpo del video</h4>
        </div>

        {data.secciones.map((sec, i) => (
          <div key={i} className="bg-background border border-white/5 rounded-xl p-4 relative group hover:border-white/10 transition-colors">
            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyButton text={sec.lo_que_dices} />
            </div>
            <div className="inline-block px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-primary mb-3">
              {sec.momento}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Lo que dices</span>
                <p className="text-sm">{sec.lo_que_dices}</p>
              </div>
              <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Lo que se ve</span>
                <p className="text-xs text-gray-400 italic">{sec.lo_que_se_ve}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(data.cta || data.cierre) && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-4">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary">LLAMADO A LA ACCIÓN</h3>
              <CopyButton text={data.cta ?? data.cierre ?? ''} />
            </div>
            <p className="text-sm font-medium mt-1 text-orange-100">"{data.cta || data.cierre}"</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
        {data.texto_en_pantalla && (
          <div className="flex items-center gap-2 text-xs text-gray-300 bg-white/5 px-3 py-2 rounded-lg">
            <AlignLeft className="w-3.5 h-3.5" />
            <span><strong className="text-white">Texto overlay:</strong> {data.texto_en_pantalla}</span>
          </div>
        )}
        {data.duracion_estimada && (
          <div className="flex items-center gap-2 text-xs text-gray-300 bg-white/5 px-3 py-2 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span><strong className="text-white">Duración:</strong> {data.duracion_estimada}</span>
          </div>
        )}
      </div>

      {data.tip_de_grabacion && (
        <div className="bg-blue-500/10 text-blue-300 text-xs p-4 rounded-xl border border-blue-500/20 flex gap-3 mt-4">
          <Info className="w-4 h-4 shrink-0" />
          <p><strong>Tip Experto:</strong> {data.tip_de_grabacion}</p>
        </div>
      )}

      {data.hashtags_sugeridos && (
        <div className="flex flex-wrap gap-2 mt-4">
          {data.hashtags_sugeridos.map((h, i) => (
            <span key={i} className="text-xs bg-white/5 text-gray-300 px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
              <Hash className="w-3 h-3 text-primary" /> {h.replace('#', '')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface CarouselResultViewProps {
  data: CarruselData;
}

export const CarouselResultView = ({ data }: CarouselResultViewProps) => {
  if (!data?.slides) return null;

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div className="text-center pb-4 border-b border-white/5">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
          {data.titulo_carrusel}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.slides.map((slide, i) => (
          <div key={i} className="bg-background border border-white/5 rounded-xl overflow-hidden hover:border-green-500/30 transition-colors flex flex-col">
            <div className="bg-white/5 p-3 flex items-center justify-between border-b border-white/5">
              <span className="text-xs font-bold text-gray-400">Slide {slide.numero}</span>
              <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase">
                {slide.funcion}
              </span>
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <div className="mb-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg leading-tight mb-2 flex-1">{slide.texto_imagen}</h4>
                  <CopyButton text={slide.texto_imagen} />
                </div>
                {slide.subtexto && (
                  <p className="text-xs text-gray-400">{slide.subtexto}</p>
                )}
              </div>

              <div className="mt-auto bg-white/[0.02] p-3 rounded-lg border border-white/5 flex gap-3">
                <ImageIcon className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Visual ({slide.formato})</span>
                  <p className="text-xs text-gray-400 italic">{slide.prompt_visual}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.caption_sugerido && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-primary" /> Caption para el post
            </h4>
            <CopyButton text={data.caption_sugerido} />
          </div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{data.caption_sugerido}</p>

          {data.hashtags_sugeridos && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
              {data.hashtags_sugeridos.map((h, i) => (
                <span key={i} className="text-xs text-primary">{h.startsWith('#') ? h : `#${h}`}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface OptimizacionResultViewProps {
  data: OptimizacionData;
}

export const OptimizacionResultView = ({ data }: OptimizacionResultViewProps) => {
  const isCarrusel = !!data.carrusel_optimizado;
  const contentData = isCarrusel ? data.carrusel_optimizado : data.guion_optimizado;

  if (!data?.analisis || !contentData) return null;

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Sección de Análisis */}
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" /> Análisis del Guión Original
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-green-400 uppercase mb-1">Lo que funciona</h4>
              <p className="text-sm text-gray-300">{data.analisis.lo_que_funciona}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase mb-1">Lo que mejorar</h4>
              <p className="text-sm text-gray-300">{data.analisis.lo_que_mejorar}</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-primary uppercase mb-2">Cambios principales realizados</h4>
            <p className="text-sm text-gray-300 italic">"{data.analisis.cambios_principales}"</p>
            {data.nivel_de_mejora && (
              <div className="mt-4 inline-block bg-primary/20 text-primary text-xs font-bold px-3 py-1.5 rounded-lg border border-primary/30">
                Mejora estimada: {data.nivel_de_mejora}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          {isCarrusel ? <ImageIcon className="w-5 h-5 text-green-400" /> : <Video className="w-5 h-5 text-red-500" />}
          Resultado Optimizado
        </h3>

        {isCarrusel ? (
          <CarouselResultView data={contentData as CarruselData} />
        ) : (
          <VideoResultView data={contentData as GuionData} />
        )}
      </div>
    </div>
  );
};
