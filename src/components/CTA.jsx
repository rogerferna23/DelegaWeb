import React from 'react';

const CTA = () => {
  return (
    <section className="w-full py-16 max-w-5xl mx-auto">
      <div className="bg-cardbg border border-gray-800 rounded-3xl p-8 md:p-12 text-center transform transition-all hover:border-gray-700">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Es momento de <span className="text-primary">delegar tu web</span>
        </h2>
        
        <p className="text-gray-400 text-base max-w-2xl mx-auto mb-8">
          Deja de perder tiempo y empieza a generar resultados con una presencia digital profesional.
        </p>
        
        <a href="#contacto" className="inline-block bg-primary hover:bg-primaryhover text-white px-6 py-3 rounded-lg font-bold text-base transition-colors">
          Solicitar presupuesto ahora
        </a>
      </div>
    </section>
  );
};

export default CTA;
