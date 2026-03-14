import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Política de Privacidad
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
          <section>
            <p className="text-lg leading-relaxed">
              En <span className="text-white font-semibold">DelegaWeb</span>, la privacidad de nuestros visitantes es de suma importancia para nosotros. Este documento de política de privacidad describe los tipos de información personal que DelegaWeb recibe y recopila y cómo se utiliza.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 italic">Archivos de registro</h2>
            <p>
              Como muchos otros sitios web, DelegaWeb utiliza archivos de registro. La información dentro de los archivos de registro incluye direcciones de protocolo de Internet (IP), tipo de navegador, proveedor de servicios de Internet (ISP), marca de fecha/hora, páginas de referencia/salida y número de clics para analizar tendencias, administrar el sitio y rastrear el movimiento del usuario alrededor del sitio y recopilar información demográfica. Las direcciones IP y otra información similar no están vinculadas a ninguna información que sea de identificación personal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 italic">Cookies y balizas web</h2>
            <p>
              DelegaWeb utiliza cookies para almacenar información sobre las preferencias de los visitantes, registrar información específica del usuario sobre qué páginas accede o visita, y personalizar el contenido de la página web según el tipo de navegador u otra información que el visitante envía a través de su navegador para mejorar su experiencia de desarrollo y marketing digital.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 italic">Cookie DART de doble clic</h2>
            <p>
              Google, como proveedor externo, utiliza cookies para publicar anuncios en nuestro sitio. El uso que hace Google de la cookie DART le permite mostrar anuncios a los usuarios según su visita a DelegaWeb y otros sitios en Internet. Los usuarios pueden optar por no utilizar la cookie de DART visitando la política de privacidad de la red de contenido y publicidad de Google en la siguiente URL: <a href="https://www.google.com/policies/privacy/" className="text-primary hover:underline">https://www.google.com/policies/privacy/</a>.
            </p>
            <p className="mt-4">
              Estos servidores de anuncios o redes publicitarias de terceros utilizan tecnología para que los anuncios y enlaces que aparecen en DelegaWeb se envíen directamente a sus navegadores. Reciben automáticamente su dirección IP cuando esto ocurre.
            </p>
          </section>

          <section className="bg-cardbg/50 border border-white/5 p-6 rounded-2xl border-l-4 border-l-primary">
            <p>
              <span className="text-white font-semibold">DelegaWeb</span> no tiene acceso ni control sobre estas cookies que utilizan los anunciantes externos. Debe consultar las políticas de privacidad respectivas de estos servidores de anuncios de terceros para obtener información más detallada sobre sus prácticas, así como para obtener instrucciones sobre cómo excluirse de ciertas prácticas. 
            </p>
            <p className="mt-4 italic text-sm">
              Nuestra política de privacidad no se aplica a otros anunciantes o sitios web, y no podemos controlar las actividades de estos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 italic">Gestión de Cookies</h2>
            <p>
              Si desea desactivar las cookies, puede hacerlo a través de las opciones individuales de su navegador. Puede encontrar información más detallada sobre la gestión de cookies con navegadores web específicos en los sitios web respectivos del navegador.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
