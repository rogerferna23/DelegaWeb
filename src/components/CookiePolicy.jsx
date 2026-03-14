import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Política de Cookies
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introducción</h2>
            <p>
              En DelegaWeb, valoramos la transparencia y tu privacidad. Esta política detalla cómo y por qué utilizamos cookies en nuestro sitio web para ofrecerte la mejor experiencia posible en tu camino hacia una presencia digital profesional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. ¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo (ordenador, móvil o tablet) cuando visitas nuestro sitio. Nos ayudan a recordar tus preferencias y a entender cómo interactúas con nuestra plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Tipos de cookies que utilizamos</h2>
            <div className="grid gap-4 mt-4">
              <div className="bg-cardbg/50 border border-white/5 p-5 rounded-xl">
                <h3 className="text-primary font-medium mb-2">Cookies Técnicas (Necesarias)</h3>
                <p className="text-sm">
                  Fundamentales para el funcionamiento del sitio, como la gestión de sesiones o la persistencia de tu consentimiento de privacidad. No pueden ser desactivadas.
                </p>
              </div>
              <div className="bg-cardbg/50 border border-white/5 p-5 rounded-xl">
                <h3 className="text-primary font-medium mb-2">Cookies de Experiencia</h3>
                <p className="text-sm">
                  Nos permiten recordar tus preferencias y ofrecerte una navegación más fluida y personalizada basada en tus interacciones previas.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Control de Cookies</h2>
            <p>
              Puedes gestionar o desactivar las cookies a través de la configuración de tu navegador. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad de algunas secciones de este sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, no dudes en contactarnos a través de nuestros canales oficiales.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
