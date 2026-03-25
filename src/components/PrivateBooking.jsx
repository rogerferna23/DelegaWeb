import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const PrivateBooking = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Asegurar que la página empiece desde arriba al navegar
    window.scrollTo(0, 0);

    const initCalendly = () => {
      if (!window.Calendly || !containerRef.current) return;
      
      containerRef.current.innerHTML = '';
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/holmanorjuelab/sesion-estrategica-de-proposito-y-marca?background_color=000000&text_color=ffffff',
        parentElement: containerRef.current,
      });
    };

    if (window.Calendly) {
      initCalendly();
    } else {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initCalendly;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-white font-sans">
      <Navbar />
      <main className="pt-20 pb-12">
        <div className="p-0 max-w-[1020px] mx-auto overflow-hidden">
          {/* Contenedor sin bordes para integración total con el fondo */}
          <div className="w-full flex justify-center items-start overflow-hidden" style={{ height: '700px' }}>
            <div 
              ref={containerRef}
              className="w-full"
              style={{ 
                width: '1060px', 
                minWidth: '1060px', 
                height: '780px', 
                transform: 'scale(1.0)', 
                transformOrigin: 'top center' 
              }}
            ></div>
          </div>
        </div>
        
        <div className="mt-2 text-center text-gray-500 text-[10px] opacity-30">
          <Link to="/" className="hover:text-primary transition-colors">Volver al inicio</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivateBooking;
