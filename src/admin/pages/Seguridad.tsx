
import { Shield } from 'lucide-react';
import MFASetup from '../components/MFASetup';
import { useAuth } from '../../contexts/AuthContext';

export default function Seguridad() {
  const { currentUser } = useAuth();

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-lg font-bold text-white">Seguridad de la Cuenta</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Configura la autenticación en dos pasos y gestiona la seguridad de tu acceso al panel.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-2xl">
        {/* MFA Section */}
        <div className="xl:col-span-2">
          <MFASetup />
        </div>

        {/* Account info card */}
        <div className="bg-cardbg border border-white/5 rounded-xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <h2 className="text-xs font-semibold text-white">Sesión activa</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Usuario</span>
              <span className="text-[10px] text-gray-300">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Email</span>
              <span className="text-[10px] text-gray-300">{currentUser?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500">Rol</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                currentUser?.role === 'superadmin'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {currentUser?.role === 'superadmin' ? 'Super Admin' : 'Administrador'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
