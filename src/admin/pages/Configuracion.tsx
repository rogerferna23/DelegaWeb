import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeText } from '../../lib/sanitize';
import { Plus, Trash2, Shield, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { addAdminSchema } from '../../schemas/auth.schema';
import ClaudeModelSelector from '../components/ClaudeModelSelector';

interface Toast { msg: string; type: 'success' | 'error' }
interface FieldErrors { name?: string; email?: string; password?: string; role?: string }

const ROLE_LABELS: Record<string, string> = { superadmin: 'Super Admin', admin: 'Administrador' };
const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-primary/10 text-primary border-primary/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export default function Configuracion() {
  const { users, currentUser, addAdmin, removeAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    if (form.role === 'superadmin' && currentUser?.role !== 'superadmin') {
      setFormError('No tienes permisos para crear un Super Admin');
      return;
    }

    const parsed = addAdminSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        name: flat.name?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
        role: flat.role?.[0],
      });
      return;
    }

    setSubmitting(true);
    const result = await addAdmin({ ...form, name: sanitizeText(form.name) });
    setSubmitting(false);
    if (result.success) {
      setForm({ name: '', email: '', password: '', role: 'admin' });
      setFieldErrors({});
      showToast('Administrador creado correctamente');
    } else {
      setFormError(result.error ?? 'Error desconocido');
    }
  };

  const handleDelete = async (userId: string) => {
    const result = await removeAdmin(userId);
    if (result.success) showToast('Administrador eliminado');
    else showToast(result.error ?? 'Error', 'error');
    setConfirmDelete(null);
  };

  const formFields: { key: keyof typeof form; label: string; type: string; placeholder: string }[] = [
    { key: 'name', label: 'Nombre completo', type: 'text', placeholder: 'Juan Pérez' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'juan@delegaweb.com' },
  ];

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-2xl border text-xs font-medium ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Configuración</h1>
        <p className="text-gray-500 text-xs mt-0.5">Gestión de accesos al panel de administración</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Admin list */}
        <div className="xl:col-span-2">
          <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-semibold text-white">Administradores</h2>
              <p className="text-gray-500 text-[10px] mt-0.5">{users.length} usuarios con acceso</p>
            </div>
            <div className="divide-y divide-white/5">
              {users.map(user => {
                const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                const isMe = user.id === currentUser?.id;
                const isSuperAdmin = user.role === 'superadmin';
                return (
                  <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primaryhover flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-white">{user.name}</p>
                        {isMe && (
                          <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded-full">Tú</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${ROLE_COLORS[user.role] ?? ''}`}>
                      {user.role === 'superadmin' && <Shield className="w-2.5 h-2.5" />}
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                    <div className="flex-shrink-0 w-7">
                      {!isSuperAdmin && !isMe ? (
                        confirmDelete === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleDelete(user.id)} className="text-[10px] text-red-400 hover:text-red-300 font-medium transition-colors">OK</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors">No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(user.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <ClaudeModelSelector />
          </div>
        </div>

        {/* Add admin form */}
        <div className="bg-cardbg border border-white/5 rounded-xl p-5 h-fit">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white">Nuevo Administrador</h2>
              <p className="text-gray-500 text-[10px]">Agrega acceso al panel</p>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            {formFields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setFieldErrors(fe => ({ ...fe, [key]: undefined })); }}
                  placeholder={placeholder}
                  className={`w-full bg-background border rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none transition-all ${
                    fieldErrors[key] ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/40'
                  }`}
                />
                {fieldErrors[key] && (
                  <p className="text-red-400 text-[10px] mt-0.5 ml-0.5">{fieldErrors[key]}</p>
                )}
              </div>
            ))}

            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setFieldErrors(fe => ({ ...fe, password: undefined })); }}
                  placeholder="Mín. 6 caracteres"
                  className={`w-full bg-background border rounded-lg px-3 pr-9 py-2 text-xs text-white placeholder-gray-600 focus:outline-none transition-all ${
                    fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/40'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-[10px] mt-0.5 ml-0.5">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/40 transition-all"
              >
                <option value="admin">Administrador</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            {formError && (
              <div className="flex items-center gap-1.5 text-red-400 text-[10px] bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creando...</>
              ) : (
                <><UserCheck className="w-3.5 h-3.5" /> Crear Administrador</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
