import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { RefreshCw, FileText, Ban, Mail } from 'lucide-react';

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Política de Reembolsos
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-10 text-gray-300">
          <section className="bg-cardbg/30 border border-white/5 p-8 rounded-3xl shadow-xl">
            <p className="text-xl leading-relaxed font-medium text-white italic">
              En <span className="text-primary font-bold">DelegaWeb</span> nos comprometemos a ofrecer mentorías de ventas y productos digitales de alta calidad enfocados en resultados reales.
            </p>
          </section>

          <section className="space-y-4">
            <p className="leading-relaxed">
              Debido a la naturaleza personalizada de nuestras mentorías y el acceso inmediato a activos digitales, todas las compras se consideran finales salvo en los casos descritos a continuación.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            {/* Mentorías de Ventas */}
            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:bg-white/[0.07] transition-all">
              <div className="w-12 h-12 bg-primary/20 border border-primary/20 rounded-2xl flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">Mentorías de Ventas</h2>
              <p className="text-sm">
                Las sesiones de mentoría premium prestadas por <span className="text-white font-semibold">DelegaWeb</span> no son reembolsables una vez que la sesión ha sido programada o iniciada, debido a la reserva de tiempo y recursos especializados.
              </p>
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-gray-400 italic">
                  * Reprogramación: Se permite con un mínimo de 24 horas de aviso previo.
                </p>
              </div>
            </section>

            {/* Productos Digitales */}
            <section className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-4 hover:bg-white/[0.07] transition-all">
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-2">
                <Ban className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Productos Digitales</h2>
              <p className="text-sm">
                Guías, materiales educativos, cursos, recursos descargables y contenidos digitales no son elegibles para reembolso una vez que el acceso o la descarga han sido otorgados.
              </p>
            </section>
          </div>

          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3 mt-6">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Errores en la Compra y Cancelaciones
            </h2>
            <div className="bg-cardbg/50 border border-white/5 p-6 rounded-2xl">
              <p className="mb-4 text-sm leading-relaxed">
                Si realiza una compra por error o experimenta un problema técnico que impida el acceso, contacte a nuestro equipo para recibir asistencia. <span className="text-white font-semibold">DelegaWeb</span> evaluará cada situación individualmente.
              </p>
              <p className="text-sm leading-relaxed italic border-l-2 border-primary/30 pl-4 py-1">
                En caso de cancelaciones, deberán notificarse con anticipación razonable. Dependiendo del estado del servicio, se podrá ofrecer una reprogramación.
              </p>
            </div>
          </section>

          <section className="pt-10 border-t border-white/10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">¿Tiene preguntas?</h2>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              Si necesita más aclaraciones relacionadas con nuestra política de reembolsos, nuestro equipo de soporte está listo para ayudarle.
            </p>
            <a 
              href="mailto:info@delegaweb.com" 
              className="text-2xl font-bold text-primary hover:text-white transition-colors"
            >
              info@delegaweb.com
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
