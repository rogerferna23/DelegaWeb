import React, { useEffect, useRef } from 'react';

const CTA = () => {
  const containerRefDesktop = useRef(null);
  const containerRefMobile = useRef(null);

  useEffect(() => {
    const initCalendly = () => {
      if (!window.Calendly) return;
      
      const config = {
        url: 'https://calendly.com/holmanorjuelab/sesion-estrategica-de-proposito-y-marca?background_color=000000&text_color=ffffff',
      };

      if (containerRefDesktop.current) {
        containerRefDesktop.current.innerHTML = '';
        window.Calendly.initInlineWidget({
          ...config,
          parentElement: containerRefDesktop.current,
        });
      }
      
      if (containerRefMobile.current) {
        containerRefMobile.current.innerHTML = '';
        window.Calendly.initInlineWidget({
          ...config,
          parentElement: containerRefMobile.current,
        });
      }
    };

    if (window.Calendly) {
      initCalendly();
      return;
    }

    let script = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
    
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener('load', initCalendly);

    return () => {
      script.removeEventListener('load', initCalendly);
    };
  }, []);

  return (
    <section id="contacto" className="w-full py-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-cardbg border border-gray-800 rounded-3xl p-4 md:p-6 text-center transform transition-all hover:border-gray-700 overflow-hidden">
        <h2 className="text-3xl md:text-3xl font-bold mb-2">
          <span className="text-primary">Agenda tu cita</span>
        </h2>
        
        <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-0">
          Deja de perder tiempo y empieza a generar resultados con una presencia digital profesional.
        </p>

        {/* Wrapper que corta el espacio escalado sobrante */}
        <div className="w-full flex justify-center overflow-hidden -mt-4 md:-mt-8" style={{ height: '580px' }}>
          {/* Contenedor forzado a 1060px para evitar que Calendly colapse a 1 columna.
              Se reduce visualmente al 90% para que quepa en cajas de ~950px */}
          <div 
            ref={containerRefDesktop}
            className="hidden md:block"
            style={{ 
              width: '1060px', 
              minWidth: '1060px', 
              height: '650px', 
              transform: 'scale(0.9)', 
              transformOrigin: 'top center' 
            }}
          ></div>
          
          {/* Vista móvil nativa */}
          <div 
            ref={containerRefMobile}
            className="w-full md:hidden mt-4"
            style={{ minWidth: '320px', width: '100%', height: '650px' }}
          ></div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
