import { useState } from 'react';
import {
  Search, Download, Trash2, Grid3X3, List,
  Folder, Loader2, Image as ImageIcon, Video, AlertCircle, RefreshCw,
} from 'lucide-react';
import { useCreatives } from '../../hooks/useCreatives';
import { useToast } from '../../../contexts/ToastContext';

type ViewMode = 'grid' | 'list';

const FOLDERS = [
  { id: 'all',   label: 'Todos'    },
  { id: 'image', label: 'Imágenes' },
  { id: 'video', label: 'Videos'   },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function MyLibrary() {
  const toast = useToast();
  const { creatives, loading, error, refetch, deleteCreative } = useCreatives();
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = creatives.filter(item => {
    const matchFolder = activeFolder === 'all' || item.type === activeFolder;
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFolder && matchSearch;
  });

  const handleDelete = async (id: string, type: 'image' | 'video', name: string) => {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      setDeletingId(id);
      await deleteCreative(id, type);
      toast.success('Creativo eliminado');
    } catch (err) {
      toast.error('Error al eliminar: ' + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 flex gap-6">
      {/* Sidebar de Carpetas */}
      <div className="w-44 flex-shrink-0">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">
          CARPETAS
        </p>
        <div className="space-y-1">
          {FOLDERS.map(folder => (
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
              <span className="ml-auto text-[10px] opacity-60">
                {folder.id === 'all'
                  ? creatives.length
                  : creatives.filter(c => c.type === folder.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
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

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs">Cargando tu biblioteca...</p>
          </div>
        )}

        {error && !loading && (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={() => refetch()} className="text-primary text-xs font-bold hover:underline">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-600 text-xs">
              {creatives.length === 0
                ? 'Aún no has generado ningún creativo.'
                : 'No se encontraron creativos con esos filtros.'}
            </p>
            {(searchTerm || activeFolder !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setActiveFolder('all'); }}
                className="mt-3 text-primary text-xs font-bold hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group bg-cardbg border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="aspect-square relative bg-black flex items-center justify-center">
                  {item.url ? (
                    item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      {item.type === 'image'
                        ? <ImageIcon className="w-8 h-8 text-gray-700" />
                        : <Video className="w-8 h-8 text-gray-700" />}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white ${
                      item.type === 'image' ? 'bg-blue-600' : 'bg-violet-600'
                    }`}>
                      {item.type === 'image' ? 'IMG' : 'VID'}
                    </span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-black/60 text-white rounded-lg hover:bg-primary transition-all"
                        title="Descargar"
                        onClick={e => e.stopPropagation()}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(item.id, item.type, item.name)}
                      disabled={deletingId === item.id}
                      className="p-2 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-all"
                      title="Eliminar"
                    >
                      {deletingId === item.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-xs font-bold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && viewMode === 'list' && (
          <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_80px_120px_80px] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <div />
              <div>Nombre</div>
              <div>Tipo</div>
              <div>Fecha</div>
              <div className="text-center">Acciones</div>
            </div>
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`grid grid-cols-[40px_1fr_80px_120px_80px] gap-4 px-5 py-3 items-center hover:bg-white/[0.02] transition-colors ${
                  idx < filtered.length - 1 ? 'border-b border-white/[0.03]' : ''
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.url && item.type === 'image'
                    ? <img src={item.url} alt="" className="w-full h-full object-cover" />
                    : item.type === 'video'
                    ? <Video className="w-4 h-4 text-gray-600" />
                    : <ImageIcon className="w-4 h-4 text-gray-600" />}
                </div>
                <p className="text-sm text-white truncate">{item.name}</p>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                  item.type === 'image' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
                }`}>
                  {item.type === 'image' ? 'Imagen' : 'Video'}
                </span>
                <p className="text-xs text-gray-500">{formatDate(item.created_at)}</p>
                <div className="flex items-center justify-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                      title="Descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item.id, item.type, item.name)}
                    disabled={deletingId === item.id}
                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                    title="Eliminar"
                  >
                    {deletingId === item.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
