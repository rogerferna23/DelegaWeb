import React, { useState } from 'react';
import { Facebook, CheckCircle2, Info, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CampanasOnboarding() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    // Simulación de conexión exitosa en modo lectura
    setIsConnected(true);
  };

  return (
    <div className="flex w-full h-[calc(100vh-100px)] items-center justify-center p-4">
      <div className="bg-cardbg border border-white/5 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10">
          {!isConnected ? (
            <>
              <div className="bg-blue-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                <Facebook className="w-10 h-10 text-blue-500" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Conecta tu cuenta Meta</h2>
              <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-500/20">
                <Info className="w-3 h-3" />
                Modo Solo Lectura
              </div>
              
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                DelegaWeb leerá automáticamente tus métricas para que la IA pueda analizarlas. Los cambios en las campañas se realizan manualmente en Meta Ads Manager.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleConnect}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 px-6 rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] flex justify-center items-center gap-2 group"
                >
                  <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Conectar Administrador Comercial
                </button>
                
                <p className="text-[10px] text-gray-500/70 max-w-xs mx-auto">
                  Al conectar, autorizas el acceso de lectura a tus campañas, anuncios y métricas de rendimiento.
                </p>
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              <div className="bg-teal-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/20 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                <CheckCircle2 className="w-10 h-10 text-teal-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1">¡Cuenta Conectada!</h2>
              <p className="text-teal-400 text-xs font-medium mb-6">Modo lectura activo exitosamente</p>
              
              <div className="bg-background/50 border border-white/5 rounded-xl p-4 mb-8 text-left space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Cuenta:</span>
                  <span className="text-gray-200 font-medium font-sans">Business_Account_Mock</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Ad Account ID:</span>
                  <span className="text-gray-400">act_1234567890</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Divisa:</span>
                  <span className="text-gray-200 font-medium">USD</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/admin/campanas')}
                  className="w-full bg-primary hover:bg-primaryhover text-white font-bold py-3.5 px-6 rounded-xl transition-all flex justify-center items-center gap-2"
                >
                  Ir al dashboard de campañas
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <button 
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mt-2 mx-auto"
                  onClick={() => setIsConnected(false)}
                >
                  Cambiar cuenta o desconectar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
