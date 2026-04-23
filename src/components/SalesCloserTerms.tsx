import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const SalesCloserTerms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Términos y Condiciones del Programa de Closers
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
              <li>Ser mayor de edad y contar con una cuenta activa en nuestra plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">2. Cómo funciona el programa</h2>
            <p>
              Una vez superados los filtros de selección:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Te conviertes en <span className="text-white font-medium">Closer Directo de DelegaWeb</span>.</li>
              <li>Se te asignarán clientes propios de la agencia para que los atiendas y cierres las ventas de nuestros servicios de desarrollo web y marketing.</li>
            </ul>
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

export default SalesCloserTerms;
