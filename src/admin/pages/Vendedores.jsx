import React, { useState } from 'react';
import { Users, Star, TrendingUp, Plus, Trash2, AlertCircle, CheckCircle, UserCheck, X } from 'lucide-react';
import { useAdminVendors } from '../AdminDataContext';

const SPECIALTIES = ['Web', 'Marketing', 'Diseño', 'SEO', 'Otro'];

export default function Vendedores() {
  const { vendors, addVendor, removeVendor } = useAdminVendors();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: 'Web' });
  const [formError, setFormError] = useState('');

  const totalSales = vendors.reduce((acc, v) => acc + v.sales, 0);
  const bestVendor = vendors.length ? vendors.reduce((best, v) => v.sales > best.sales ? v : best, vendors[0]) : null;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email) { setFormError('Nombre y email son obligatorios'); return; }
    const result = addVendor(form);
    if (result.success) {
      setForm({ name: '', email: '', phone: '', specialty: 'Web' });
      setShowForm(false);
      showToast('Vendedor agregado correctamente');
    } else {
      setFormError(result.error);
    }
  };

  const handleDelete = (id) => {
    removeVendor(id);
    showToast('Vendedor eliminado');
    setConfirmDelete(null);
  };

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-2xl border text-xs font-medium ${
          toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-white">Vendedores</h1>
          <p className="text-gray-500 text-xs mt-0.5">{vendors.length} vendedores registrados</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 bg-primary hover:bg-primaryhover text-white font-semibold px-3 py-2 rounded-lg text-xs transition-all"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancelar' : 'Nuevo Vendedor'}
        </button>
      </div>

      {/* Add vendor form (collapsible) */}
      {showForm && (
        <div className="bg-cardbg border border-primary/20 rounded-xl p-5 mb-4">
          <h2 className="text-xs font-semibold text-white mb-4 flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-primary" /> Agregar Nuevo Vendedor
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Nombre completo *</label>
              <input
                type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Juan Pérez"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Email *</label>
              <input
                type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="juan@delegaweb.com"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Teléfono</label>
              <input
                type="text" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-0000"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-400 mb-1 block">Especialidad</label>
              <select
                value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/40 transition-all"
              >
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {formError && (
              <div className="sm:col-span-2 xl:col-span-4 flex items-center gap-1.5 text-red-400 text-[10px] bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5" /> {formError}
              </div>
            )}
            <div className="sm:col-span-2 xl:col-span-4 flex justify-end">
              <button type="submit" className="flex items-center gap-1.5 bg-primary hover:bg-primaryhover text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all">
                <UserCheck className="w-3.5 h-3.5" /> Agregar Vendedor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total Vendedores', value: vendors.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Ventas Combinadas', value: totalSales, icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Mejor Vendedor', value: bestVendor?.name.split(' ')[0] ?? '—', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-cardbg border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px]">{label}</p>
              <p className="text-lg font-bold text-white mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Vendedor','Especialidad','Teléfono','Ventas','Ingresos','Rating','Estado',''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vendors.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-xs text-gray-500">No hay vendedores. Agrega uno con el botón de arriba.</td></tr>
            )}
            {vendors.map(v => {
              const initials = v.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              return (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primaryhover flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{v.name}</p>
                        <p className="text-[10px] text-gray-500">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-gray-400">{v.specialty}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-gray-400">{v.phone || '—'}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-gray-300">{v.sales}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-white">${v.revenue.toLocaleString()}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-white">{v.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      v.status === 'Activo' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmDelete === v.id ? (
                      <div className="flex items-center gap-1.5 animation-fade-in">
                        <button 
                          onClick={() => handleDelete(v.id)} 
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] px-2 py-1 rounded-md transition-all border border-red-500/10"
                        >
                          Sí, eliminar
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(null)} 
                          className="bg-white/5 hover:bg-white/10 text-gray-400 text-[9px] px-2 py-1 rounded-md transition-all border border-white/5"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(v.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
