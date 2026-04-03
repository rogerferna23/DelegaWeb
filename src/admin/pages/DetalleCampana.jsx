import React from 'react';
import { 
  ArrowLeft, Copy, TrendingUp, 
  Users, DollarSign, Target, ExternalLink, Layers, 
  Layout, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';

const mockChartData = [
  { name: 'Lun', cpm: 2.1, clicks: 120 },
  { name: 'Mar', cpm: 1.8, clicks: 154 },
  { name: 'Mie', cpm: 2.3, clicks: 140 },
  { name: 'Jue', cpm: 1.9, clicks: 165 },
  { name: 'Vie', cpm: 1.5, clicks: 190 },
  { name: 'Sab', cpm: 1.6, clicks: 210 },
  { name: 'Dom', cpm: 1.2, clicks: 250 },
];

const mockAdSets = [
  { id: 'as_1', name: 'Intereses: Emprendimiento', status: 'Active', spend: '$240.10', messages: 110, cpm: '$2.18' },
  { id: 'as_2', name: 'Audiencia Similar 1%', status: 'Active', spend: '$247.22', messages: 124, cpm: '$1.99' },
];

const mockAds = [
  { id: 'ad_1', name: 'Creativo 1 - Sofia IA', status: 'Active', ctr: '1.24%', spend: '$150.00', messages: 85 },
  { id: 'ad_2', name: 'Creativo 2 - Whiteboard', status: 'Paused', ctr: '0.82%', spend: '$90.10', messages: 25 },
];

export default function DetalleCampana() {
  const navigate = useNavigate();
  const { id } = useParams();

  const openInMeta = () => {
    // Ad Account ID Mock: 1234567890
    window.open(`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1234567890&campaign_ids=${id || '120209489201'}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/campanas')}
            className="p-2 border border-white/10 hover:border-white/30 text-gray-400 hover:text-white rounded-xl transition-colors bg-cardbg shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white mb-0.5">Tráfico frío - Emprendedores</h1>
              <span className="bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div> 
                Activa
              </span>
            </div>
            <p className="text-xs text-gray-400">ID Meta: <span className="font-mono text-gray-500">{id || '120209489201'}</span> · Sincronizado hace 12 min</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => navigate('/admin/campanas/nueva')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicar (Wizard)
          </button>
          <button 
            onClick={openInMeta}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)]"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir en Meta Ads
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Gasto Total", icon: DollarSign, val: "$487.32", diff: "+12%", trend: "up" },
          { title: "Conversaciones", icon: Users, val: "234", diff: "+5%", trend: "up" },
          { title: "Costo / Mensaje", icon: Target, val: "$2.08", diff: "-2.1%", trend: "down" },
          { title: "Frecuencia", icon: Zap, val: "1.45", diff: "+0.1", trend: "neutral" },
        ].map((kpi, i) => (
          <div key={i} className="bg-cardbg border border-white/5 p-5 rounded-2xl shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <kpi.icon className="w-12 h-12 text-primary" />
            </div>
            <div className="relative z-10">
              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{kpi.title}</span>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-2xl font-bold text-white font-sans">{kpi.val}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg mb-1 border 
                  ${kpi.trend === 'up' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 
                    kpi.trend === 'down' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {kpi.diff}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-cardbg border border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Rendimiento (Últimos 7 días)
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">CPM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-teal-400"></div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Clics</span>
            </div>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#ffffff05" />
              <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a131f', borderColor: '#ffffff1a', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}
                itemStyle={{ fontSize: '11px' }}
                cursor={{stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1}}
              />
              <Area type="monotone" dataKey="cpm" name="CPM ($)" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCpm)" />
              <Area type="monotone" dataKey="clicks" name="Clics" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorClicks)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ad Sets & Ads Tables (Read Only) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Ad Sets */}
        <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              Conjuntos de Anuncios
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{mockAdSets.length} registrados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-black/20 text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Nombre</th>
                  <th className="px-5 py-3 font-bold text-right">Gasto</th>
                  <th className="px-5 py-3 font-bold text-right">Mensajes</th>
                  <th className="px-5 py-3 font-bold text-right">CPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockAdSets.map(as => (
                  <tr key={as.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-200">{as.name}</td>
                    <td className="px-5 py-3 text-right text-gray-300 font-mono">{as.spend}</td>
                    <td className="px-5 py-3 text-right text-gray-300 font-mono">{as.messages}</td>
                    <td className="px-5 py-3 text-right text-teal-400 font-mono font-bold">{as.cpm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ads */}
        <div className="bg-cardbg border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              Anuncios (Ad Creatives)
            </h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase">{mockAds.length} registrados</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-black/20 text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 font-bold">Nombre</th>
                  <th className="px-5 py-3 font-bold text-right">CTR</th>
                  <th className="px-5 py-3 font-bold text-right">Gasto</th>
                  <th className="px-5 py-3 font-bold text-right">Msgs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-3 font-bold text-gray-200">{ad.name}</td>
                    <td className="px-5 py-3 text-right text-primary font-mono font-bold">{ad.ctr}</td>
                    <td className="px-5 py-3 text-right text-gray-300 font-mono">{ad.spend}</td>
                    <td className="px-5 py-3 text-right text-gray-300 font-mono">{ad.messages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
