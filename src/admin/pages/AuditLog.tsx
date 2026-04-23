import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, LogIn, LogOut, UserPlus, UserMinus, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useUrlParam } from '../../hooks/useUrlParam';
import type { LucideIcon } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  created_at: string;
  user_email: string;
  details?: string;
}

interface ActionCfg { label: string; icon: LucideIcon; color: string }

const ACTION_CONFIG: Record<string, ActionCfg> = {
  login_success:      { label: 'Inicio de sesión',     icon: LogIn,      color: 'text-green-400  bg-green-500/10  border-green-500/20' },
  login_failed:       { label: 'Intento fallido',       icon: Shield,     color: 'text-red-400    bg-red-500/10    border-red-500/20'   },
  logout:             { label: 'Cierre de sesión',      icon: LogOut,     color: 'text-gray-400   bg-white/5       border-white/10'     },
  admin_created:      { label: 'Admin creado',          icon: UserPlus,   color: 'text-blue-400   bg-blue-500/10   border-blue-500/20'  },
  admin_deleted:      { label: 'Admin eliminado',       icon: UserMinus,  color: 'text-orange-400 bg-orange-500/10 border-orange-500/20'},
  request_submitted:  { label: 'Solicitud enviada',     icon: FileText,   color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'},
  request_approved:   { label: 'Solicitud aprobada',    icon: CheckCircle,color: 'text-green-400  bg-green-500/10  border-green-500/20' },
  request_rejected:   { label: 'Solicitud rechazada',   icon: XCircle,    color: 'text-red-400    bg-red-500/10    border-red-500/20'   },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'hace un momento';
  if (m < 60) return `hace ${m} min`;
  if (h < 24) return `hace ${h}h`;
  return `hace ${d}d`;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useUrlParam('accion', 'all');

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data as AuditEntry[]) || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">Registro de Auditoría</h1>
          <p className="text-gray-500 text-xs mt-0.5">Historial completo de acciones en el panel</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-cardbg border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary/40"
        >
          <option value="all">Todas las acciones</option>
          {Object.entries(ACTION_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-cardbg border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-xs">No hay registros aún</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(log => {
              const cfg: ActionCfg = ACTION_CONFIG[log.action] || { label: log.action, icon: FileText, color: 'text-gray-400 bg-white/5 border-white/10' };
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border text-xs mt-0.5 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">{cfg.label}</span>
                      <span className="text-[10px] text-gray-600">{timeAgo(log.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate">{log.user_email}</p>
                    {log.details && <p className="text-[10px] text-gray-600 mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap flex-shrink-0">
                    {new Date(log.created_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
