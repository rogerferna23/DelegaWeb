import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, Mail, Shield, AlertTriangle } from 'lucide-react';

// Rate limiting config
const RATE_KEY = 'dw_login_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

function getAttempts() {
  try { return JSON.parse(localStorage.getItem(RATE_KEY)) || { count: 0, lockedUntil: 0 }; }
  catch { return { count: 0, lockedUntil: 0 }; }
}
function saveAttempts(data) { localStorage.setItem(RATE_KEY, JSON.stringify(data)); }

export default function AdminLogin() {
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);

  React.useEffect(() => {
    if (currentUser) navigate(from, { replace: true });
  }, [currentUser]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(0);
        setCountdown(0);
        setAttemptsLeft(MAX_ATTEMPTS);
        saveAttempts({ count: 0, lockedUntil: 0 });
        clearInterval(interval);
      } else {
        setCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Check lockout on mount
  useEffect(() => {
    const a = getAttempts();
    if (Date.now() < a.lockedUntil) {
      setLockedUntil(a.lockedUntil);
      setCountdown(Math.ceil((a.lockedUntil - Date.now()) / 1000));
    } else {
      setAttemptsLeft(MAX_ATTEMPTS - a.count);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockedUntil && Date.now() < lockedUntil) return;

    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      const a = getAttempts();
      const newCount = a.count + 1;
      if (newCount >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        saveAttempts({ count: 0, lockedUntil: until });
        setLockedUntil(until);
        setAttemptsLeft(0);
        setError(`Demasiados intentos. Bloqueado 15 minutos.`);
      } else {
        saveAttempts({ count: newCount, lockedUntil: 0 });
        setAttemptsLeft(MAX_ATTEMPTS - newCount);
        setError(result.error);
      }
    } else {
      saveAttempts({ count: 0, lockedUntil: 0 });
      navigate(from, { replace: true });
    }
  };

  const isLocked = lockedUntil > 0 && Date.now() < lockedUntil;
  const mins = Math.floor(countdown / 60);
  const secs = String(countdown % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
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

          {/* Lockout banner */}
          {isLocked && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-xs font-medium">Cuenta bloqueada temporalmente</p>
                <p className="text-red-400/70 text-[11px] mt-0.5">
                  Demasiados intentos fallidos. Vuelve a intentarlo en{' '}
                  <span className="font-mono font-semibold">{mins}:{secs}</span>
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@delegaweb.com"
                  required
                  disabled={isLocked}
                  className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLocked}
                  className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error + intentos restantes */}
            {error && !isLocked && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs">
                {error}
                {attemptsLeft < MAX_ATTEMPTS && attemptsLeft > 0 && (
                  <span className="ml-1.5 opacity-70">({attemptsLeft} intentos restantes)</span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : isLocked ? (
                `Bloqueado — ${mins}:${secs}`
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
