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
    <section id="contacto" className="w-full py-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-cardbg border border-gray-800 rounded-3xl p-3 md:p-5 text-center transform transition-all hover:border-gray-700 overflow-hidden">
        <h2 className="text-2xl font-bold mb-2">
          <span className="text-primary">Agenda tu cita</span>
        </h2>
        
        <p className="text-gray-400 text-sm max-w-2xl mx-auto mb-4">
          Deja de perder tiempo y empieza a generar resultados con una presencia digital profesional. 
          Habla con nuestra estratega Sofía para ver cómo podemos impulsarte.
        </p>
 
        <div className="flex flex-col items-center gap-3 py-2">
          <a 
            href="https://wa.me/34711208967?text=Hola%20Sofía,%20vengo%20de%20la%20web%20y%20quiero%20recibir%20mi%20asesoría%20gratuita" 
            className="inline-flex items-center gap-2.5 bg-green-600 hover:bg-green-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-green-900/20 text-lg"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            ¡Solicitar Asesoría Ya!
          </a>
          <span className="text-[10px] text-gray-500 italic">Respuesta inmediata por WhatsApp</span>
        </div>
      </div>
    </section>
  );
};

export default CTA;
