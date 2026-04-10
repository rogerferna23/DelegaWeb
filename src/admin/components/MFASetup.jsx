import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Shield, Smartphone, KeyRound, CheckCircle, AlertTriangle,
  Copy, Eye, EyeOff, Loader2, ShieldOff, ChevronRight
} from 'lucide-react';

// ── Helper: step indicator ────────────────────────────────────────────────────
function Step({ num, label, active, done }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-white' : done ? 'text-primary' : 'text-gray-600'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${
        done ? 'bg-primary border-primary text-white' :
        active ? 'border-white text-white' :
        'border-gray-700 text-gray-600'
      }`}>
        {done ? '✓' : num}
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );
}

// ── Helper: copy button ───────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="ml-1.5 text-gray-500 hover:text-primary transition-colors" title="Copiar">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MFASetup() {
  const { currentUser, getMFAFactors, enrollMFA, verifyMFA, unenrollMFA } = useAuth();

  // All hooks must be declared unconditionally — guard comes after
  const [activeFactor, setActiveFactor] = useState(null);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [stage, setStage] = useState('idle'); // idle | enrolling | success
  const [enrollData, setEnrollData] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  const loadFactors = useCallback(async () => {
    setLoadingFactors(true);
    const result = await getMFAFactors();
    const verified = result.factors?.find(f => f.status === 'verified');
    setActiveFactor(verified || null);
    setLoadingFactors(false);
  }, [getMFAFactors]);

  useEffect(() => {
    if (currentUser) {
      // Usamos una microtarea para evitar el aviso de setState síncrono en el effect
      Promise.resolve().then(() => loadFactors());
    }
  }, [currentUser, loadFactors]);

  // Guard: explicit check after all hooks
  if (!currentUser) return null;

  // ── Enroll ──────────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    setLoadingAction(true);
    setError('');
    const result = await enrollMFA();
    setLoadingAction(false);
    if (!result.success) { setError(result.error); return; }
    setEnrollData(result);
    setStage('enrolling');
  };

  // ── Verify after enroll ──────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otpCode.length !== 6) { setError('Ingresa los 6 dígitos del código.'); return; }
    setLoadingAction(true);
    setError('');
    const result = await verifyMFA(enrollData.factorId, otpCode);
    setLoadingAction(false);
    if (!result.success) {
      setError('Código incorrecto. Revisa la app y vuelve a intentarlo.');
      setOtpCode('');
      return;
    }
    setStage('success');
    await loadFactors();
  };

  // ── Unenroll ─────────────────────────────────────────────────────────────────
  const handleUnenroll = async () => {
    if (!activeFactor) return;
    setLoadingAction(true);
    setError('');
    const result = await unenrollMFA(activeFactor.id);
    setLoadingAction(false);
    if (!result.success) { setError(result.error); return; }
    setActiveFactor(null);
    setConfirmUnenroll(false);
    setStage('idle');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingFactors) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-xs py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando estado de seguridad...
      </div>
    );
  }

  // ── Active MFA (already enrolled) ────────────────────────────────────────────
  if (activeFactor && stage !== 'enrolling') {
    return (
      <div className="bg-cardbg border border-white/5 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Autenticación en dos pasos activa</h3>
            <p className="text-gray-500 text-[11px] mt-0.5">
              Tu cuenta está protegida con TOTP (Google Authenticator, Authy).
            </p>
          </div>
          <span className="ml-auto text-[10px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            Activo
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {confirmUnenroll ? (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs">
            <p className="text-red-400 font-medium mb-2">⚠️ ¿Confirmas que quieres desactivar la verificación en dos pasos?</p>
            <p className="text-gray-500 mb-3">Tu cuenta quedará protegida solo por contraseña.</p>
            <div className="flex gap-2">
              <button
                onClick={handleUnenroll}
                disabled={loadingAction}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loadingAction ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                Sí, desactivar
              </button>
              <button
                onClick={() => setConfirmUnenroll(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-1.5 rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmUnenroll(true)}
            className="text-[11px] text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <ShieldOff className="w-3 h-3" /> Desactivar verificación en dos pasos
          </button>
        )}
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <div className="bg-cardbg border border-green-500/20 rounded-xl p-5 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">¡2FA activado correctamente!</h3>
        <p className="text-gray-500 text-xs">
          A partir de ahora, cada vez que inicies sesión te pediremos el código de tu app de autenticación.
        </p>
      </div>
    );
  }

  // ── Enrolling: show QR ────────────────────────────────────────────────────────
  if (stage === 'enrolling' && enrollData) {
    return (
      <div className="bg-cardbg border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Configura tu app de autenticación</h3>
        <p className="text-gray-500 text-[11px] mb-5">
          Sigue estos pasos para vincular Google Authenticator o Authy.
        </p>

        <div className="flex gap-4 mb-5">
          <Step num="1" label="Escanear QR" active={true} done={false} />
          <ChevronRight className="w-3 h-3 text-gray-700 mt-1" />
          <Step num="2" label="Verificar código" active={false} done={false} />
        </div>

        <div className="flex flex-col items-center mb-5">
          <div className="bg-white p-3 rounded-xl mb-3 shadow-lg">
            <QRCodeSVG value={enrollData.uri} size={160} />
          </div>
          <p className="text-gray-500 text-[11px] text-center max-w-[240px]">
            Abre <span className="text-white font-medium">Google Authenticator</span> o{' '}
            <span className="text-white font-medium">Authy</span> → toca el{' '}
            <span className="text-white font-medium">+</span> → "Escanear código QR"
          </p>
        </div>

        <div className="bg-background border border-white/5 rounded-lg px-3 py-2 mb-5">
          <p className="text-[10px] text-gray-600 mb-1">¿No puedes escanear? Ingresa la clave manualmente:</p>
          <div className="flex items-center gap-1">
            <code className={`text-[11px] font-mono text-gray-300 flex-1 tracking-widest ${!showSecret ? 'blur-sm select-none' : ''}`}>
              {enrollData.secret}
            </code>
            <button onClick={() => setShowSecret(v => !v)} className="text-gray-500 hover:text-gray-300 transition-colors">
              {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            {showSecret && <CopyButton text={enrollData.secret} />}
          </div>
        </div>

        <div className="mb-4">
          <label className="text-[10px] font-medium text-gray-400 mb-1.5 block">
            Ingresa el código de 6 dígitos que aparece en tu app para confirmar
          </label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              placeholder="• • • • • •"
              autoFocus
              autoComplete="one-time-code"
              className="w-full bg-background border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all tracking-[0.3em] font-mono text-center"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loadingAction || otpCode.length !== 6}
          className="w-full bg-primary hover:bg-primaryhover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
        >
          {loadingAction ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando...</> : 'Confirmar y activar 2FA'}
        </button>

        <button
          onClick={async () => {
            // Clean up the pending unverified factor before cancelling
            // so it does not interfere with future logins
            if (enrollData?.factorId) {
              try { await unenrollMFA(enrollData.factorId); } catch { /* ignore */ }
            }
            setStage('idle');
            setEnrollData(null);
            setOtpCode('');
            setError('');
          }}
          className="w-full mt-2 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── Idle: invite to enroll ────────────────────────────────────────────────────
  return (
    <div className="bg-cardbg border border-white/5 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Smartphone className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Verificación en dos pasos (2FA)</h3>
          <p className="text-gray-500 text-[11px] mt-0.5">
            Agrega una capa extra de seguridad con Google Authenticator o Authy.
            Aunque alguien obtenga tu contraseña, no podrá iniciar sesión sin tu teléfono.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs mb-3">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <button
        onClick={handleEnroll}
        disabled={loadingAction}
        className="w-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-semibold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
      >
        {loadingAction
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Iniciando configuración...</>
          : <><Shield className="w-3.5 h-3.5" /> Activar verificación en dos pasos</>
        }
      </button>
    </div>
  );
}
