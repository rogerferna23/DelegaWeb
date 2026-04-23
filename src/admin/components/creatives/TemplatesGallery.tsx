import { Copy } from 'lucide-react';
import { DEMO_TEMPLATES } from '../../data/modelsData';

export default function TemplatesGallery() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DEMO_TEMPLATES.map(tpl => (
          <div
            key={tpl.id}
            className="group bg-cardbg border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
          >
            {/* Thumbnail */}
            <div className={`aspect-[16/10] relative bg-gradient-to-br ${tpl.thumbGradient}`}>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-primary transition-colors">
                {tpl.name}
              </h3>
              <p className="text-gray-500 text-[11px] mb-5 leading-relaxed">
                {tpl.description}
              </p>

              {/* Bottom row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span>{tpl.category}</span>
                  <span>·</span>
                  <span>{tpl.uses.toLocaleString()} usos</span>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primaryhover text-white text-[11px] font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-primary/20">
                  <Copy className="w-3 h-3" />
                  Duplicar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
