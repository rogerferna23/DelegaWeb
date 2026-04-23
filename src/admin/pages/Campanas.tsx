import { useState, useEffect } from 'react';
import {
  DollarSign, MessageCircle, Target, Calendar,
  RefreshCw, Eye, BarChart2, Plus, ExternalLink
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { sanitize } from '../../utils/sanitize';
import AIChatPanel from '../components/AIChatPanel';
import RegistrarReunion from '../components/RegistrarReunion';

// --- MOCK DATA ---
const chartData = [
  { name: '03 mar', gasto: 38, mensajes: 32 },
  { name: '04 mar', gasto: 38, mensajes: 37 },
  { name: '05 mar', gasto: 50, mensajes: 39 },
  { name: '06 mar', gasto: 56, mensajes: 15 },
  { name: '07 mar', gasto: 25, mensajes: 13 },
  { name: '08 mar', gasto: 42, mensajes: 52 },
  { name: '09 mar', gasto: 30, mensajes: 32 },
  { name: '10 mar', gasto: 50, mensajes: 49 },
  { name: '11 mar', gasto: 46, mensajes: 35 },
  { name: '12 mar', gasto: 25, mensajes: 20 },
  { name: '13 mar', gasto: 55, mensajes: 36 },
  { name: '14 mar', gasto: 40, mensajes: 26 },
  { name: '15 mar', gasto: 43, mensajes: 22 },
  { name: '16 mar', gasto: 39, mensajes: 44 },
  { name: '17 mar', gasto: 51, mensajes: 45 },
  { name: '18 mar', gasto: 39, mensajes: 30 },
  { name: '19 mar', gasto: 31, mensajes: 30 },
  { name: '20 mar', gasto: 52, mensajes: 20 },
  { name: '21 mar', gasto: 23, mensajes: 58 },
  { name: '22 mar', gasto: 21, mensajes: 55 },
  { name: '23 mar', gasto: 25, mensajes: 15 },
  { name: '24 mar', gasto: 55, mensajes: 23 },
  { name: '25 mar', gasto: 50, mensajes: 42 },
  { name: '26 mar', gasto: 23, mensajes: 20 },
  { name: '27 mar', gasto: 54, mensajes: 55 },
  { name: '28 mar', gasto: 30, mensajes: 28 },
  { name: '29 mar', gasto: 26, mensajes: 20 },
  { name: '30 mar', gasto: 30, mensajes: 53 },
  { name: '31 mar', gasto: 41, mensajes: 13 },
  { name: '01 abr', gasto: 20, mensajes: 44 },
];

const initialCampaigns = [
  { id: 1, metaId: '120209489201', estado: 'Activa', color: 'bg-teal-500', nombre: 'Tráfico frío - Emprendedores', tipo: 'Tráfico frío', tipoColor: 'text-blue-400 bg-blue-900/40', presup: '$25.00', gasto: '$487.32', mensajes: 234, cpm: '$2.08', reuniones: 18 },
  { id: 2, metaId: '120209489202', estado: 'Activa', color: 'bg-teal-500', nombre: 'Retargeting - Visitantes web', tipo: 'Retargeting', tipoColor: 'text-purple-400 bg-purple-900/40', presup: '$15.00', gasto: '$312.50', mensajes: 189, cpm: '$1.65', reuniones: 24 },
  { id: 3, metaId: '120209489203', estado: 'Pausada', color: 'bg-yellow-500', nombre: 'Leads - Marketing Digital', tipo: 'Tráfico frío', tipoColor: 'text-blue-400 bg-blue-900/40', presup: '$30.00', gasto: '$654.20', mensajes: 312, cpm: '$2.10', reuniones: 29 },
  { id: 4, metaId: '120209489204', estado: 'Activa', color: 'bg-teal-500', nombre: 'Retargeting - Carrito abandonado', tipo: 'Retargeting', tipoColor: 'text-purple-400 bg-purple-900/40', presup: '$20.00', gasto: '$198.75', mensajes: 156, cpm: '$1.27', reuniones: 14 },
  { id: 5, metaId: '120209489205', estado: 'Planificada', color: 'bg-blue-500', nombre: 'Tráfico frío - IA para negocios', tipo: 'Tráfico frío', tipoColor: 'text-blue-400 bg-blue-900/40', presup: '$35.00', gasto: '$0.00', mensajes: 0, cpm: '$0.00', reuniones: 0 },
];

// --- COMPONENTES ---
export default function Campanas() {
  const [isAssistantVisible, setAssistantVisible] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [activeCampaigns] = useState(initialCampaigns);
  const [syncCooldown, setSyncCooldown] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  // Gestión del cooldown de sincronización
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (syncCooldown > 0) {
      timer = setInterval(() => {
        setSyncCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [syncCooldown]);

  const handleSync = () => {
    if (syncCooldown > 0 || isSyncing) return;
    
    setIsSyncing(true);
    // Simular llamada a Edge Function de sincronización
    setTimeout(() => {
      setIsSyncing(false);
      setSyncCooldown(300); // 5 minutos = 300 segundos
    }, 2000);
  };

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openInMeta = (metaId: string) => {
    // Ad Account ID Mock: 1234567890
    const metaAdsUrl = `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1234567890&campaign_ids=${metaId}`;
    window.open(metaAdsUrl, '_blank');
  };

  return (
    <div className="relative h-full flex w-full">
      {/* Contenido principal */}
      <div className="flex-1 w-full">
        
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">Campañas</h1>
            <p className="text-gray-400 text-xs mt-1">Gestión estratégica de campañas (Modo Solo Lectura)</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button 
              onClick={handleSync}
              disabled={syncCooldown > 0 || isSyncing}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border
                ${syncCooldown > 0 || isSyncing 
                  ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed' 
                  : 'bg-background/50 hover:bg-white/5 border-white/10 text-gray-300'}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : syncCooldown > 0 ? `Sincronizar (${formatCooldown(syncCooldown)})` : 'Sincronizar ahora'}
            </button>

            <button 
              onClick={() => setIsMeetingModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-background/50 hover:bg-cardbg border border-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-teal-400" />
              Registrar Reunión
            </button>
            <button 
              onClick={() => navigate('/admin/campanas/nueva')}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-primary hover:bg-primaryhover text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Campaña
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {/* Tarjeta 1 */}
          <div className="bg-cardbg border border-white/5 rounded-xl p-4 shadow-sm transform hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-xs font-medium">Gasto total</span>
              <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
                <DollarSign className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-xl font-bold text-white">$1,742.17</span>
              <span className="text-[10px] font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-full mb-1">+12.5%</span>
            </div>
            <span className="text-[10px] text-gray-500">Últimos 30 días</span>
          </div>

          {/* Tarjeta 2 */}
          <div className="bg-cardbg border border-white/5 rounded-xl p-4 shadow-sm transform hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-xs font-medium">Mensajes recibidos</span>
              <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-xl font-bold text-white">933</span>
              <span className="text-[10px] font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-full mb-1">+8.3%</span>
            </div>
            <span className="text-[10px] text-gray-500">Conversaciones iniciadas</span>
          </div>

          {/* Tarjeta 3 */}
          <div className="bg-cardbg border border-white/5 rounded-xl p-4 shadow-sm transform hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-xs font-medium">Costo / mensaje</span>
              <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
                <Target className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-xl font-bold text-white">$1.87</span>
              <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full mb-1">-5.2%</span>
            </div>
            <span className="text-[10px] text-gray-500">Promedio general</span>
          </div>

          {/* Tarjeta 4 */}
          <div className="bg-cardbg border border-white/5 rounded-xl p-4 shadow-sm transform hover:-translate-y-1 transition duration-300">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-xs font-medium">Reuniones agendadas</span>
              <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-xl font-bold text-white">88</span>
              <span className="text-[10px] font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded-full mb-1">+15.7%</span>
            </div>
            <span className="text-[10px] text-gray-500">Desde WhatsApp</span>
          </div>
        </div>

        {/* Gráfica de Rendimiento */}
        <div className="bg-cardbg border border-white/5 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">Rendimiento de campañas</h2>
            <div className="hidden sm:flex bg-background border border-white/5 rounded-md p-0.5 text-[10px] font-medium">
              <button className="px-2 py-1 text-gray-400 rounded hover:text-white transition-colors">7 días</button>
              <button className="px-2 py-1 bg-primary text-white rounded shadow-sm">30 días</button>
              <button className="px-2 py-1 text-gray-400 rounded hover:text-white transition-colors">90 días</button>
            </div>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorMensajes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a131f', borderColor: '#ffffff1a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                  cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1}}
                />
                <Area type="monotone" dataKey="gasto" name="Gasto diario ($)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorGasto)" />
                <Area type="monotone" dataKey="mensajes" name="Mensajes recibidos" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#colorMensajes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 mt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border border-primary bg-primary/20"></div>
              <span className="text-xs font-medium text-primary">Gasto diario ($)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border border-teal-400 bg-teal-400/20"></div>
              <span className="text-xs font-medium text-teal-400">Mensajes recibidos</span>
            </div>
          </div>
        </div>

        {/* Tabla Campañas Activas */}
        <div className="bg-cardbg border border-white/5 rounded-xl shadow-sm overflow-hidden mb-5">
          <div className="p-3 border-b border-white/5 flex justify-between items-center bg-cardbg">
            <h2 className="text-sm font-semibold text-white">Campañas activas</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-400">
              <thead className="text-[10px] text-gray-500 uppercase bg-background/50 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Nombre</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Presup.</th>
                  <th className="px-4 py-3 font-semibold">Gasto</th>
                  <th className="px-4 py-3 font-semibold">Mensajes</th>
                  <th className="px-4 py-3 font-semibold">CPM</th>
                  <th className="px-4 py-3 font-semibold">Reuniones</th>
                  <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeCampaigns.map((camp) => (
                  <tr key={camp.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${camp.color} shadow-[0_0_8px_rgba(0,0,0,0.5)] ${camp.color.replace('bg-', 'shadow-')}`}></div>
                        <span className="font-medium text-gray-300">{camp.estado}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-white">{sanitize(camp.nombre)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${camp.tipoColor}`}>
                        {sanitize(camp.tipo)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-300">{camp.presup}</td>
                    <td className="px-4 py-2.5 font-medium text-white">{camp.gasto}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-300">{camp.mensajes}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-300">{camp.cpm}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-300">{camp.reuniones}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-center items-center gap-3 text-gray-500">
                        <button 
                          onClick={() => navigate(`/admin/campanas/${camp.id}`)}
                          className="hover:text-teal-400 transition-colors" 
                          title="Ver detalle y métricas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openInMeta(camp.metaId)}
                          className="hover:text-blue-400 transition-colors" 
                          title="Abrir en Meta Ads Manager"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-background/30 border-t border-white/5 text-[10px] text-gray-500 flex justify-between items-center rounded-b-xl">
            <span>Mostrando {activeCampaigns.length} campañas</span>
            <div className="flex items-center gap-1">
                <button className="w-5 h-5 rounded flex justify-center items-center bg-primary text-white font-medium">1</button>
            </div>
          </div>
        </div>

      </div>

      {/* Asistente IA Flotante (Portal integrado) */}
      <AIChatPanel isVisible={isAssistantVisible} setVisible={setAssistantVisible} />

      {/* Modal Manual de Agendar Reunión */}
      <RegistrarReunion isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} />
    </div>
  );
}
