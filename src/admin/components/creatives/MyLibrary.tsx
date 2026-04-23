import { useState } from 'react';
import {
  Search, Download, Trash2, Grid3X3, List,
  Folder,
} from 'lucide-react';
import { DEMO_LIBRARY, LIBRARY_FOLDERS } from '../../data/modelsData';

type ViewMode = 'grid' | 'list';

export default function MyLibrary() {
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const filtered = DEMO_LIBRARY.filter(item => {
    const matchFolder = activeFolder === 'all' || item.folder === activeFolder;
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFolder && matchSearch;
  });

  return (
    <div className="animate-in fade-in duration-300 flex gap-6">
      {/* Sidebar de Carpetas */}
      <div className="w-44 flex-shrink-0">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">
          CARPETAS
        </p>
        <div className="space-y-1">
          {LIBRARY_FOLDERS.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeFolder === folder.id
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              {folder.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar en biblioteca..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/30"
            />
          </div>

          {/* View Toggle */}
          <div className="flex border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Actions */}
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-400 hover:text-white transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group bg-cardbg border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer"
              >
                {/* Thumbnail */}
                <div className={`aspect-square relative bg-gradient-to-br ${item.thumbGradient}`}>
                  {/* Model Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold text-white"
                      style={{ backgroundColor: item.modelColor }}
                    >
                      {item.modelTag}
                    </span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{item.credits}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-gray-600 text-xs">No se encontraron creativos en esta carpeta.</p>
            <button
              onClick={() => { setSearchTerm(''); setActiveFolder('all'); }}
              className="mt-3 text-primary text-xs font-bold hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
