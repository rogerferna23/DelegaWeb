import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, Clock, User, UserPlus, UserMinus, AlertCircle } from 'lucide-react';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  return `hace ${h}h`;
}

export default function AdminRequests() {
  const { currentUser, pendingRequests, reviewRequest, requestAdminAction, fetchPendingRequests } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const [processing, setProcessing] = useState(null);
  const [toast, setToast] = useState(null);

  // Form state (for non-superadmin to submit request)
  const [form, setForm] = useState({ targetName: '', targetEmail: '', targetRole: 'admin', targetPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReview = async (id, approved) => {
    setProcessing(id + (approved ? '_a' : '_r'));
    const result = await reviewRequest(id, approved);
    setProcessing(null);
    if (result.success) showToast(approved ? 'Solicitud aprobada' : 'Solicitud rechazada');
    else showToast(result.error, 'error');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.targetName || !form.targetEmail || !form.targetPassword) {
      setFormError('Completa todos los campos');
      return;
    }
    if (form.targetPassword.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSubmitting(true);
    const result = await requestAdminAction({ action: 'create_admin', ...form });
    setSubmitting(false);
    if (result.success) {
      setForm({ targetName: '', targetEmail: '', targetRole: 'admin', targetPassword: '' });
      showToast('Solicitud enviada al superadmin');
    } else {
      setFormError(result.error);
    }
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-lg border transition-all ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Solicitudes de Administración</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          {isSuperAdmin ? 'Revisa y aprueba solicitudes de administradores' : 'Envía una solicitud para agregar un nuevo administrador'}
        </p>
      </div>

      {/* SUPERADMIN: ver solicitudes pendientes */}
      {isSuperAdmin ? (
        <div className="space-y-3">
          {pendingRequests.length === 0 ? (
            <div className="bg-cardbg border border-white/5 rounded-xl flex flex-col items-center justify-center py-14 text-center">
              <CheckCircle className="w-8 h-8 text-green-500/40 mb-3" />
              <p className="text-white text-sm font-medium">Sin solicitudes pendientes</p>
              <p className="text-gray-500 text-xs mt-1">Todo está al día</p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const ActionIcon = req.action === 'create_admin' ? UserPlus : UserMinus;
              const isCreate = req.action === 'create_admin';
              return (
                <div key={req.id} className="bg-cardbg border border-white/5 rounded-xl p-4 flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    isCreate ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                  }`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        {isCreate ? 'Agregar administrador' : 'Eliminar administrador'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock className="w-3 h-3" /> {timeAgo(req.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Destino: <span className="text-white">{req.target_email}</span>
                      {req.target_name && <span className="text-gray-600"> ({req.target_name})</span>}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Solicitado por: {req.requested_by}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(req.id, true)}
                      disabled={processing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReview(req.id, false)}
                      disabled={processing}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ADMIN NORMAL: enviar solicitud */
        <div className="max-w-md">
          <div className="bg-cardbg border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <AlertCircle className="w-4 h-4 text-primary" />
              <p className="text-xs text-gray-400">
                Solo el <span className="text-white font-medium">superadmin</span> puede crear admins. Envía una solicitud y recibirá una notificación.
              </p>
            </div>
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Nombre</label>
                <input type="text" value={form.targetName} onChange={e => setForm(f => ({ ...f, targetName: e.target.value }))}
                  placeholder="Juan García" required
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Email</label>
                <input type="email" value={form.targetEmail} onChange={e => setForm(f => ({ ...f, targetEmail: e.target.value }))}
                  placeholder="juan@empresa.com" required
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-1">Contraseña temporal</label>
                <input type="password" value={form.targetPassword} onChange={e => setForm(f => ({ ...f, targetPassword: e.target.value }))}
                  placeholder="mín. 6 caracteres" required
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40" />
              </div>
              {formError && <p className="text-red-400 text-xs">{formError}</p>}
              <button type="submit" disabled={submitting}
                className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5">
                {submitting ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</> : <><UserPlus className="w-3.5 h-3.5" /> Enviar Solicitud</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
