import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield, AlertTriangle, KeyRound, ArrowLeft, Smartphone } from 'lucide-react';
import { loginSchema } from '../schemas/auth.schema';

export default function AdminLogin() {
  const { login, verifyMFA, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/admin';

  // Credentials step
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // MFA step
  const [mfaStep, setMfaStep] = useState<{ factorId: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    // If MFA is required, don't auto-navigate even if currentUser exists (at aal1)
    if (currentUser && !mfaStep) {
      navigate(from, { replace: true });
    }
  }, [currentUser, mfaStep, navigate, from]);

  // ── Step 1: Credentials ──────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Zod client-side validation
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Error al iniciar sesión.');
      return;
    }

    if (result.mfaRequired) {
      setMfaStep({ factorId: result.factorId! });
      return;
    }

    navigate(from, { replace: true });
  };

  // ── Step 2: MFA verify ───────────────────────────────────────────────────

  const handleMfaVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMfaError('');

    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setMfaError('El código debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    setMfaLoading(true);
    const result = await verifyMFA(mfaStep!.factorId, otpCode);
    setMfaLoading(false);

    if (!result.success) {
      setMfaError(result.error || 'Código incorrecto. Inténtalo nuevamente.');
      setOtpCode('');
      return;
    }

    navigate(from, { replace: true });
  };

  const isLocked = error && error.toLowerCase().includes('bloqueado');

  // ── Render: MFA screen ───────────────────────────────────────────────────

  if (mfaStep) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Smartphone className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Delega<span className="text-primary">Web</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Verificación en dos pasos</p>
          </div>

          <div className="bg-cardbg border border-white/5 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-1">Código de verificación</h2>
            <p className="text-gray-500 text-xs mb-6">
              Abre <span className="text-white font-medium">Google Authenticator</span> o{' '}
              <span className="text-white font-medium">Authy</span> e ingresa el código de 6 dígitos.
            </p>

            <form onSubmit={handleMfaVerify} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      setMfaError('');
                    }}
                    placeholder="• • • • • •"
                    autoFocus
                    autoComplete="one-time-code"
                    className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all tracking-[0.3em] font-mono text-center"
                  />
                </div>
              </div>

              {mfaError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{mfaError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={mfaLoading || otpCode.length !== 6}
                className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              >
                {mfaLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar código'
                )}
              </button>
            </form>
          </div>

          <button
            onClick={() => { setMfaStep(null); setOtpCode(''); setMfaError(''); }}
            className="mt-4 mx-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Credentials screen ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
      </div>

      {/* Back to web button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all"
      >
        <span className="text-[14px]">←</span> Volver a la web
      </button>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Delega<span className="text-primary">Web</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Panel de Administración</p>
        </div>

        <div className="bg-cardbg border border-white/5 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Iniciar Sesión</h2>
          <p className="text-gray-500 text-xs mb-6">Acceso restringido a personal autorizado</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors(fe => ({ ...fe, email: undefined })); }}
                  placeholder="admin@delegaweb.com"
                  required
                  disabled={!!isLocked}
                  className={`w-full bg-background border rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all disabled:opacity-50 ${
                    fieldErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-400 text-[11px] mt-1 ml-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({ ...fe, password: undefined })); }}
                  placeholder="••••••••"
                  required
                  disabled={!!isLocked}
                  className={`w-full bg-background border rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all disabled:opacity-50 ${
                    fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-primary/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-[11px] mt-1 ml-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* General error banner */}
            {error && (
              <div className={`bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs flex items-start gap-2 ${isLocked ? 'animate-pulse' : ''}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!isLocked}
              className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : isLocked ? (
                'Acceso Bloqueado'
              ) : (
                'Ingresar al Panel'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          ¿No tienes acceso? Contacta al administrador principal.
        </p>
      </div>
    </div>
  );
}
