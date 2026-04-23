import { ArrowRight, Copy, ExternalLink, CheckCircle2, Rocket, Loader2 } from 'lucide-react';

interface Props {
  isGuideGenerated: boolean;
  isGeneratingGuide: boolean;
  implementationGuideText: string;
  generateGuide: () => void;
  copyToClipboard: () => void;
  copySuccess: boolean;
  savePlanned: () => void;
}

export default function StepGuia({ isGuideGenerated, isGeneratingGuide, implementationGuideText, generateGuide, copyToClipboard, copySuccess, savePlanned }: Props) {
  return (
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
  );
}

StepGuia.displayName = 'StepGuia';
