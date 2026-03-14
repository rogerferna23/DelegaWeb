import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Términos y Condiciones
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-10 text-gray-300">
          <section className="bg-cardbg/30 border border-white/5 p-8 rounded-3xl shadow-xl">
            <p className="text-xl leading-relaxed font-medium text-white italic">
              Bienvenido a <span className="text-primary font-bold">DelegaWeb</span>. Al navegar y utilizar este sitio web, usted acepta cumplir con los términos y condiciones que, junto con nuestra política de privacidad, rigen nuestra relación profesional.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Identificación y Ámbito
            </h2>
            <p>
              El término <span className="text-white font-semibold">DelegaWeb</span>, «nosotros» o «nuestro» se refiere al titular de este sitio web. El término «usted» se refiere al usuario, cliente o visitante. El uso de este sitio está sujeto a las siguientes condiciones.
            </p>
            <p>
              Como agencia de soluciones digitales, el contenido de estas páginas es para su información general y puede ser actualizado para reflejar nuevas tecnologías o servicios sin previo aviso.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Compromiso de Exactitud
            </h2>
            <p>
              En <span className="text-white font-semibold">DelegaWeb</span> nos esforzamos por la excelencia técnicos. Sin embargo, ni nosotros ni terceros garantizamos la exactitud absoluta o idoneidad de la información y materiales para proyectos específicos sin una consultoría previa.
            </p>
            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl">
              <p className="text-sm">
                Usted reconoce que la información puede contener errores técnicos e incluimos expresamente la exclusión de responsabilidad por dichas inexactitudes en la máxima medida permitida por la ley. El uso de cualquier material es bajo su propio riesgo.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Propiedad Intelectual y Activos
            </h2>
            <p>
              DelegaWeb es propietaria del material gráfico, estructural y de diseño en este sitio web. Esto incluye, pero no se limita a, la arquitectura de la web, el código fuente visual, los gráficos y la disposición estética.
            </p>
            <p className="border-l-2 border-white/10 pl-4 py-2 text-sm italic">
              Queda prohibida cualquier reproducción fuera de los términos de derechos de autor. Todas las marcas externas mencionadas en el sitio se reconocen como propiedad de sus respectivos dueños.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Responsabilidad sobre el Uso y Enlaces
            </h2>
            <p>
              El uso no autorizado de los activos de DelegaWeb puede constituir una reclamación por daños.
            </p>
            <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
              <p className="mb-4 text-sm">
                Podemos incluir enlaces a otras plataformas digitales para su conveniencia informativa. Esto no implica un respaldo a dichos sitios. No nos hacemos responsables del contenido externo compartido a través de estos enlaces.
              </p>
              <p className="font-bold text-white text-sm">
                Se requiere el consentimiento por escrito de la dirección de DelegaWeb para crear enlaces profundos o menciones oficiales a nuestra documentación desde sitios externos.
              </p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;
