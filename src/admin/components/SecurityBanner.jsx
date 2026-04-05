import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, ShieldCheck, LogOut, X } from 'lucide-react';

/**
 * Banner de seguridad premium (IDS UI).
 * Muestra alertas críticas detectadas por el sistema de monitoreo.
 */
export default function SecurityBanner() {
  const { currentUser, logout } = useAuth();
  const [alert, setAlert] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    
    // Consultar alertas de seguridad no resueltas
    const fetchSecurityAlerts = async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('action', 'suspicious_activity')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data[0]) {
        setAlert(data[0]);
        setVisible(true);
      }
    };

    fetchSecurityAlerts();
    
    // Monitorización en tiempo real de ataques (Subscripción)
    const channel = supabase
      .channel('security_alerts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'activity_logs',
        filter: `user_id=eq.${currentUser.id}`
      }, (payload) => {
        if (payload.new.action === 'suspicious_activity' && !payload.new.is_resolved) {
          setAlert(payload.new);
          setVisible(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const handleConfirm = async () => {
    if (!alert) return;
    const { error } = await supabase
      .from('activity_logs')
      .update({ is_resolved: true })
      .eq('id', alert.id);
    
    if (!error) setVisible(false);
  };

  if (!visible || !alert) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#121212]/90 backdrop-blur-xl border border-orange-500/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_20px_rgba(249,115,22,0.1)] p-5 overflow-hidden relative">
        {/* Efecto de brillo sutil */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 blur-3xl rounded-full" />
        
        <div className="flex items-start gap-4 flex-col sm:flex-row">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-white mb-1 uppercase tracking-wider">Alerta de Seguridad Detectada</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mb-4">
              Sistema IDS: Se ha detectado un acceso desde una dirección IP o ubicación inusual ({alert.ip_address}). 
              Por tu seguridad, confirma tu identidad o cierra la sesión ahora mismo.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                SÍ, FUI YO (CONFIRMAR)
              </button>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-gray-300 hover:text-red-400 text-[10px] font-bold rounded-xl transition-all active:scale-95"
              >
                <LogOut className="w-3.5 h-3.5" />
                No fui yo (Cerrar Sesión)
              </button>
            </div>
          </div>
          
          <button 
            className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
            onClick={() => setVisible(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
