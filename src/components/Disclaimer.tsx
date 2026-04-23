
import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Disclaimer = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Descargos de Responsabilidad
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
          <section>
            <p className="text-lg leading-relaxed">
              La información contenida en este sitio web es sólo para fines de información general.
            </p>
          </section>

          <section>
            <p>
              La información es proporcionada por <span className="text-white font-semibold">DelegaWeb</span> y, si bien nos esforzamos por mantener la información actualizada y correcta, no hacemos representaciones ni garantías de ningún tipo, expresas o implícitas, sobre la integridad, precisión, confiabilidad, idoneidad o disponibilidad con respecto a el sitio web o la información, productos, servicios o gráficos relacionados contenidos en el sitio web para cualquier propósito.
            </p>
          </section>

          <section className="bg-cardbg/50 border border-white/5 p-6 rounded-2xl border-l-4 border-l-primary shadow-xl">
            <p className="font-medium text-white italic">
              Cualquier confianza que usted deposite en dicha información es estrictamente bajo su propio riesgo.
            </p>
            <p className="mt-4 text-sm">
              En ningún caso seremos responsables de ninguna pérdida o daño, incluidos, entre otros, pérdidas o daños indirectos o consecuentes, o cualquier pérdida o daño que surja de la pérdida de datos o ganancias que surjan de, o en conexión con, el uso de este sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 italic text-primary">Enlaces a terceros</h2>
            <p>
              A través de este sitio web usted puede establecer enlaces a otros sitios web que no están bajo el control de <span className="text-white font-semibold">DelegaWeb</span>. No tenemos control sobre la naturaleza, el contenido y la disponibilidad de esos sitios. La inclusión de cualquier enlace no implica necesariamente una recomendación ni respalda las opiniones expresadas en ellos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 italic text-primary">Disponibilidad del sitio</h2>
            <p>
              Se hace todo lo posible para mantener el sitio web funcionando sin problemas. Sin embargo, <span className="text-white font-semibold">DelegaWeb</span> no asume ni será responsable de que el sitio web no esté disponible temporalmente debido a problemas técnicos fuera de nuestro control.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Disclaimer;
