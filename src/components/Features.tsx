import { cloneElement, type ReactElement } from 'react';
import { Target, Search, Zap, Lightbulb, Headphones } from 'lucide-react';

interface Feature { title: string; icon: ReactElement<{ className?: string }> }

const featuresList: Feature[] = [
  { title: 'Diseño orientado a resultados',         icon: <Target    className="text-primary w-5 h-5" /> },
  { title: 'Optimización SEO básica incluida',       icon: <Search    className="text-primary w-5 h-5" /> },
  { title: 'Velocidad y rendimiento optimizados',    icon: <Zap       className="text-primary w-5 h-5" /> },
  { title: 'Asesoramiento estratégico',              icon: <Lightbulb className="text-primary w-5 h-5" /> },
  { title: 'Soporte personalizado',                  icon: <Headphones className="text-primary w-5 h-5" /> },
];

const Features = () => (
  <section className="w-full py-16 max-w-5xl mx-auto border-t border-gray-800/30">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold">¿Por qué elegir <span className="text-primary">DelegaWeb</span>?</h2>
    </div>
    <div className="flex flex-wrap justify-center gap-4">
      {featuresList.map((feature) => (
        <div key={feature.title} className="bg-cardbg border border-gray-800/60 rounded-xl p-4 flex items-center gap-3 hover:border-gray-700 transition-colors min-w-[250px]">
          <div className="w-8 h-8 rounded-lg bg-gray-900/50 flex items-center justify-center shrink-0">
            {cloneElement(feature.icon, { className: 'text-primary w-4 h-4' })}
          </div>
          <span className="font-medium text-xs">{feature.title}</span>
        </div>
      ))}
    </div>
  </section>
);

export default Features;
