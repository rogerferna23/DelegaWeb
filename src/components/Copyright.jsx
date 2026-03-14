import React, { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const Copyright = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Copyright y Propiedad Intelectual
        </h1>
        
        <div className="prose prose-invert max-w-none space-y-10 text-gray-300">
          <section className="bg-cardbg/30 border border-white/5 p-8 rounded-3xl shadow-xl">
            <p className="text-xl leading-relaxed font-medium text-white italic">
              Este sitio web y su contenido tienen derechos de autor de <span className="text-primary font-bold">DelegaWeb – © DelegaWeb 2025</span>. Todos los derechos reservados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Restricciones de Distribución
            </h2>
            <p>
              Se prohíbe cualquier redistribución o reproducción de parte o la totalidad del contenido en cualquier forma que no sea la siguiente:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm text-primary">
                  Uso Personal
                </h3>
                <p className="text-sm text-gray-400">
                  Puede imprimir o descargar extractos en un disco duro local únicamente para su uso personal y no comercial.
                </p>
              </div>
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                <h3 className="font-bold mb-2 flex items-center gap-2 text-sm text-primary">
                  Uso Informativo
                </h3>
                <p className="text-sm text-gray-400">
                  Puede copiar el contenido a terceros individuales para su uso personal, pero solo si reconoce el sitio web como la fuente del material.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 bg-primary/10 border border-primary/20 p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Prohibición de Explotación Comercial
            </h2>
            <p className="text-white/80 leading-relaxed font-medium">
              No puede, excepto con nuestro permiso expreso por escrito, distribuir o explotar comercialmente el contenido. Tampoco podrá transmitirlo ni almacenarlo en ningún otro sitio web u otra forma de sistema de recuperación electrónica.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Copyright;
