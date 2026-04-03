import React, { useState } from 'react';
import { User, Phone, Check, Calendar, FileText, X, ChevronDown } from 'lucide-react';

export default function RegistrarReunion({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    prospect_name: '',
    prospect_phone: '',
    campaign_source: '',
    status: 'scheduled',
    scheduled_at: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCampaignDropdownOpen, setIsCampaignDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const CAMPAIGN_OPTIONS = [
    { value: 'cold_entrepreneurs', label: 'Tráfico Frío - Emprendedores' },
    { value: 'retargeting_hot', label: 'Retargeting General' },
    { value: 'organic_social', label: 'Orgánico (No campaña)' },
  ];

  const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Agendada' },
    { value: 'completed', label: 'Completada' },
    { value: 'no_show', label: 'No Asistió' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock save
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-cardbg border border-white/5 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
        
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-400" />
            Registrar Reunión
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Nombre Prospecto *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input required type="text" value={formData.prospect_name} onChange={e => setFormData({...formData, prospect_name: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-teal-500 outline-none" placeholder="Juan Pérez" />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="tel" value={formData.prospect_phone} onChange={e => setFormData({...formData, prospect_phone: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-teal-500 outline-none" placeholder="+52..." />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Campaña de Origen *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCampaignDropdownOpen(!isCampaignDropdownOpen)}
                className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-white/20 rounded-lg pl-3 pr-3 py-2 text-sm text-left focus:outline-none focus:border-teal-500 transition-colors"
                style={{ minHeight: '38px' }}
              >
                <span className={formData.campaign_source ? "text-white" : "text-gray-500"}>
                  {formData.campaign_source 
                    ? CAMPAIGN_OPTIONS.find(o => o.value === formData.campaign_source)?.label || 'Seleccionado'
                    : 'Selecciona la campaña...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCampaignDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCampaignDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsCampaignDropdownOpen(false)}></div>
                  <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto">
                    {CAMPAIGN_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFormData(p => ({ ...p, campaign_source: opt.value }));
                          setIsCampaignDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          formData.campaign_source === opt.value
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Fecha y Hora *</label>
              <input required type="datetime-local" value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-500 outline-none block" style={{colorScheme: 'dark'}} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Estado</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full flex items-center justify-between bg-background border border-white/10 hover:border-white/20 rounded-lg pl-3 pr-3 py-2 text-sm text-left focus:outline-none focus:border-teal-500 transition-colors"
                  style={{ minHeight: '38px' }}
                >
                  <span className="text-white">
                    {STATUS_OPTIONS.find(o => o.value === formData.status)?.label || 'Seleccionado'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStatusDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsStatusDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1.5 bg-[#161618] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto">
                      {STATUS_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setFormData(p => ({ ...p, status: opt.value }));
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            formData.status === opt.value
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Notas Cortas</label>
            <div className="relative">
               <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
               <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-background border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-teal-500 outline-none" placeholder="Cualquier contexto sobre el lead..." />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-4 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_25px_rgba(20,184,166,0.4)] transition-all flex justify-center items-center gap-2 mt-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin block"></span>
            ) : (
              <>
                <Check className="w-5 h-5" /> Guardar Ticket
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
