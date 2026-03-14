import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CloserProgram = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.target);
    const data = {
      full_name: formData.get('fullName'),
      email: formData.get('email'),
      whatsapp: formData.get('whatsapp'),
      nationality: formData.get('nationality'),
    };

    try {
      const { error } = await supabase.from('postulantes').insert([data]);
      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Hubo un error al enviar tu solicitud. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Trabaja con nosotros
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
          <section>
            <p className="text-xl leading-relaxed italic border-l-4 border-primary pl-6 py-2">
              En <span className="text-white font-semibold">DelegaWeb</span> creemos que las conexiones auténticas transforman negocios. Por eso, nuestro Programa de Closers está diseñado para profesionales que creen en nuestra visión y quieren ser el puente entre soluciones tecnológicas de alto impacto y clientes que las necesitan.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">1. Selección y Filtros de Participación</h2>
            <p>
              A diferencia de programas abiertos, en <span className="text-white font-semibold">DelegaWeb</span> buscamos excelencia operativa. Los aspirantes deben:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Pasar un <span className="text-white font-medium">filtro de selección inicial</span> donde evaluamos el perfil profesional.</li>
              <li>Superar una <span className="text-white font-medium">prueba de habilidad</span> demostrable para asegurar que se alinean con nuestros estándares de cierre y atención.</li>
              <li>Ser mayor de edad y completar el registro base para una evaluación administrativa.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">2. Proceso de Alta y Vías de Colaboración</h2>
            <p>
              Una vez superados satisfactoriamente los filtros de selección y pruebas técnicas, nuestro equipo administrativo determinará tu vía de colaboración según tu perfil:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Atención Directa
                </h3>
                <p className="text-sm text-gray-400">
                  Para perfiles con alta experiencia, se les asignará directamente nuestra cartera de clientes activos para gestionar cierres bajo el respaldo de la agencia.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Sistema de Afiliados
                </h3>
                <p className="text-sm text-gray-400">
                  Se activará un código de embajador único. Por cada cliente que use tu código y realice una compra, generarás una comisión automática sobre la venta.
                </p>
              </div>
            </div>
            <p className="mt-6">
              En cualquiera de los dos casos, un administrador de <span className="text-white font-semibold">DelegaWeb</span> procederá a la <span className="text-white font-medium">activación manual de tu cuenta profesional</span> para que puedas empezar a operar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">3. Comisiones y Pagos</h2>
            <div className="bg-cardbg/50 border border-white/5 p-6 rounded-2xl shadow-xl">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <p><span className="text-white font-semibold">Comisión por venta:</span> 10% neto por cada venta ya pagada y confirmada.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <p><span className="text-white font-semibold">Frecuencia de pagos:</span> Quincenal o mensual (a convenir directamente con el Closer según volumen).</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <p><span className="text-white font-semibold">Métodos de pago:</span> PayPal o transferencia bancaria (según disponibilidad geográfica).</p>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">4. Compromiso y Normas</h2>
            <p>
              Al representar directamente a <span className="text-white font-semibold">DelegaWeb</span>, se exige:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Mantenimiento de la integridad de nuestra marca en todo momento.</li>
              <li>Prohibición total de publicidad engañosa o suplantación no autorizada de identidad fuera de los canales acordados.</li>
              <li>Uso responsable y confidencial de la información de los clientes asignados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">5. Suspensión y Cambios</h2>
            <p>
              DelegaWeb se reserva el derecho de suspender la colaboración si se detectan incumplimientos de estas normas o falta de resultados sostenidos. Los términos pueden ser actualizados para mejorar la operativa del programa.
            </p>
          </section>

          <section className="pt-8 border-t border-white/10">
            <h2 className="text-3xl font-bold text-white mb-8 text-center text-gradient bg-gradient-to-r from-white to-primary bg-clip-text text-transparent italic">
              Aplica ahora para ser Closer
            </h2>
            
            <div className="bg-cardbg/30 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl max-w-2xl mx-auto">
              {submitted ? (
                <div className="py-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">¡Solicitud Enviada!</h3>
                  <p className="text-gray-400 max-w-sm mx-auto">
                    Gracias por tu interés en unirte a DelegaWeb. Nuestro equipo administrativo revisará tu perfil y te contactaremos vía WhatsApp pronto.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-primary hover:text-white transition-colors text-sm font-medium"
                  >
                    Enviar otra aplicación
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Nombre Completo</label>
                      <input 
                        name="fullName"
                        type="text" 
                        required
                        disabled={isSubmitting}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Correo Electrónico</label>
                      <input 
                        name="email"
                        type="email" 
                        required
                        disabled={isSubmitting}
                        placeholder="nombre@ejemplo.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Número de WhatsApp</label>
                      <input 
                        name="whatsapp"
                        type="tel" 
                        required
                        disabled={isSubmitting}
                        placeholder="+34 000 000 000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400 ml-1">Nacionalidad</label>
                      <input 
                        name="nationality"
                        type="text" 
                        required
                        disabled={isSubmitting}
                        placeholder="Tu país de origen"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transform active:scale-95 transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        'Enviar Aplicación'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
            
            <p className="text-center text-gray-500 text-sm mt-8">
              Al enviar este formulario, aceptas que nuestro equipo administrativo se ponga en contacto contigo para el proceso de selección.
            </p>
          </section>

          <section className="pt-8 border-t border-white/10">
            <p className="text-center font-medium">
              💡 Este programa no es solo un medio para generar ingresos; es una oportunidad para ser parte activa de un equipo que transforma la presencia digital de los negocios.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CloserProgram;
