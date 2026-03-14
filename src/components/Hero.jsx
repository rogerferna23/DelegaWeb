import React from 'react';

const Hero = () => {
  return (
    <section className="w-full flex flex-col items-center justify-center text-center pt-16 pb-20 max-w-5xl mx-auto">
      <div className="inline-block border border-gray-800 rounded-full px-4 py-1.5 mb-8 invisible">
        <span className="text-xs text-primary font-medium tracking-wide">Agencia de desarrollo web & marketing digital</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
        Deleganos tu presencia <br className="hidden md:block"/>
        digital para que tú te <br className="hidden md:block"/>
        centres en <span className="text-primary">crecer</span>
      </h1>
      
      <p className="text-gray-400 text-base md:text-lg max-w-2xl mb-12">
        Creamos, optimizamos y gestionamos tu web y tus campañas para que generes más clientes sin complicaciones.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
        <a href="#presupuesto" className="w-full sm:w-auto bg-primary hover:bg-primaryhover text-white px-6 py-3 rounded-lg font-semibold transition-colors text-base">
          Solicitar presupuesto
        </a>
        <a href="#servicios" className="w-full sm:w-auto bg-transparent hover:bg-white/5 border border-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-base">
          Ver servicios
        </a>
      </div>
    </section>
  );
};

export default Hero;
