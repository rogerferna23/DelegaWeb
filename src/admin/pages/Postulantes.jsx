import React from 'react';
import { usePostulantes } from '../../hooks/usePostulantes';
import { 
  UserPlus, 
  Mail, 
  MessageSquare, 
  Trash2, 
  Globe, 
  Calendar,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  XCircle
} from 'lucide-react';

export default function Postulantes() {
  const { postulantes, loading, removePostulante, updatePostulanteStatus } = usePostulantes();

  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleWhatsApp = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    
    // El borrado es directo para evitar bloqueos del navegador con popups nativos
    const { success, error } = await removePostulante(id);
    
    if (!success) {
      alert('Error al eliminar: ' + (error?.message || 'Error de permisos'));
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
            <UserCheck className="w-3 h-3" /> Aprobado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
            <UserX className="w-3 h-3" /> Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-lg uppercase tracking-wide">
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            Postulantes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestión y seguimiento de aspirantes al equipo de Closers
          </p>
        </div>
        <div className="bg-cardbg border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3">
          <span className="text-xs text-gray-400">Total recibidos:</span>
          <span className="text-lg font-bold text-primary">{postulantes.length}</span>
        </div>
      </div>

      <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Postulante</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contacto</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">País</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Estado</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                    Cargando postulaciones...
                  </td>
                </tr>
              ) : postulantes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                    No se han recibido postulaciones todavía.
                  </td>
                </tr>
              ) : (
                postulantes.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                          {p.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(p.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail className="w-3.5 h-3.5 text-primary/60" />
                          {p.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <MessageSquare className="w-3.5 h-3.5 text-green-500/60" />
                          {p.whatsapp}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] text-gray-300">
                        <Globe className="w-3 h-3 text-blue-400/70" />
                        {p.nationality}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        {getStatusBadge(p.status)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleWhatsApp(p.whatsapp)}
                          className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl transition-all"
                          title="Contactar por WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        
                        {p.status !== 'pending' && (
                          <button
                            onClick={() => updatePostulanteStatus(p.id, 'pending')}
                            className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 rounded-xl transition-all"
                            title="Marcar como Pendiente"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => updatePostulanteStatus(p.id, 'approved')}
                            className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 rounded-xl transition-all"
                            title="Aprobar Solicitud"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        
                        {p.status !== 'rejected' && (
                          <button
                            onClick={() => updatePostulanteStatus(p.id, 'rejected')}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-xl transition-all"
                            title="Rechazar Solicitud"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, p.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-500 hover:text-white rounded-xl transition-all ml-2"
                          title="Eliminar Registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
