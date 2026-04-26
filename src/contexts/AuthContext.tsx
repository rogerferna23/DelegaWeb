import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';
import { getCsrfToken } from '../utils/csrf';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email?: string;
  role: string;
  name: string;
}

interface UserProfile {
  id: string;
  name: string;
  role: string;
  email?: string;
}

export interface AdminRequest {
  id: string;
  action: string;
  target_email: string;
  target_name: string;
  target_role: string;
  target_password?: string;
  amount?: number | null;
  request_date?: string | null;
  metadata?: Record<string, unknown>;
  status: string;
  requested_by?: string;
  ip_address?: string;
  created_at?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
  mfaRequired?: boolean;
  factorId?: string;
}

interface OperationResult {
  success: boolean;
  error?: string;
}

interface ReviewResult extends OperationResult {
  req?: AdminRequest;
}

export interface MFAEnrollResult {
  success: boolean;
  error?: string;
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
}

export interface MFAFactor {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface RequestAdminActionParams {
  action: string;
  targetEmail?: string;
  targetName?: string;
  targetRole?: string;
  targetPassword?: string;
  amount?: number | null;
  requestDate?: string | null;
  metadata?: Record<string, unknown>;
}

interface AddAdminParams {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  users: UserProfile[];
  pendingRequests: AdminRequest[];
  allRequests: AdminRequest[];
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  addAdmin: (params: AddAdminParams) => Promise<OperationResult>;
  removeAdmin: (userId: string) => Promise<OperationResult>;
  requestAdminAction: (params: RequestAdminActionParams) => Promise<OperationResult>;
  reviewRequest: (requestId: string, approved: boolean) => Promise<ReviewResult>;
  fetchPendingRequests: () => Promise<void>;
  fetchAllRequests: () => Promise<void>;
  verifyMFA: (factorId: string, code: string) => Promise<OperationResult>;
  enrollMFA: () => Promise<MFAEnrollResult>;
  unenrollMFA: (factorId: string) => Promise<OperationResult>;
  getMFAFactors: () => Promise<{ success: boolean; factors: MFAFactor[] }>;
}

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// Genera una contraseña temporal segura (16 chars, sin ambiguos) cuando
// el superadmin aprueba la creación de un admin sin contraseña explícita.
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AdminRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: { id: string }): Promise<UserProfile | null> => {
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PROFILE_TIMEOUT')), 5000)
      );

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      if (error) throw error;
      return data as UserProfile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("fetchProfile: Error o timeout al cargar perfil:", msg);
      return null;
    }
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setUsers((data as UserProfile[]) || []);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingRequests((data as AdminRequest[]) || []);
  };

  const fetchAllRequests = async () => {
    const { data } = await supabase
      .from('admin_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    const rows = (data as AdminRequest[]) || [];
    setAllRequests(rows);
    setPendingRequests(rows.filter(r => r.status === 'pending'));
  };

  const applySession = useCallback(async (authUser: { id: string; email?: string }) => {
    try {
      if (!authUser) {
        setCurrentUser(null);
        setUsers([]);
        setPendingRequests([]);
        return;
      }

      const p = await fetchProfile(authUser);
      if (p) {
        const user: AuthUser = { ...authUser, role: p.role, name: p.name };
        setCurrentUser(user);
        fetchAllProfiles();
        fetchAllRequests();
      } else {
        const fallbackUser: AuthUser = {
          ...authUser,
          role: 'admin',
          name: authUser.email?.split('@')[0] || 'Usuario',
        };
        setCurrentUser(fallbackUser);

        setTimeout(async () => {
          const retry = await fetchProfile(authUser);
          if (retry) {
            setCurrentUser({ ...authUser, role: retry.role, name: retry.name });
            fetchAllProfiles();
            fetchAllRequests();
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Error al aplicar sesión:", err);
      if (authUser) {
        setCurrentUser({
          ...authUser,
          role: 'admin',
          name: authUser.email?.split('@')[0] || 'Usuario',
        });
      } else {
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('INIT_TIMEOUT')), 15000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        if (session) await applySession(session.user);
        else setLoading(false);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("AuthContext: Error o timeout al inicializar sesión:", msg);
        setLoading(false);
      }
    };

    initSession();

    const hardTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) console.warn("AuthContext: Forzando fin de carga por hard-timeout.");
        return false;
      });
    }, 18000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.nextLevel === 'aal2' && aal?.currentLevel === 'aal1' && event !== 'SIGNED_OUT') {
            setLoading(false);
            return;
          }
        } catch (mfaErr) {
          console.warn("AuthContext: Error checking AAL in state change:", mfaErr);
        }
        await applySession(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(hardTimeout);
    };
  }, [applySession]);

  // ── Login ─────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const MAX_ATTEMPTS = 3;
      const ATTEMPT_TIMEOUT_MS = 12000;

      const attemptSignIn = (): Promise<Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>> =>
        Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT_ERROR')), ATTEMPT_TIMEOUT_MS)
          ),
        ]);

      let lastErr: unknown;
      let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>> | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          result = await attemptSignIn();
          break;
        } catch (err) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          if (msg !== 'TIMEOUT_ERROR') throw new Error('NETWORK_ERROR');
          if (attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, 800 * attempt));
          }
        }
      }

      if (!result) {
        // All attempts timed out — clear stale Supabase tokens and report
        try {
          Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
        } catch { /* ignore */ }
        console.error('Login: todos los intentos agotados', lastErr);
        return { success: false, error: 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.' };
      }

      const { data, error } = result;

      if (error) {
        return { success: false, error: 'Credenciales inválidas.' };
      }

      const { user } = data;
      if (!user) throw new Error('SESSION_MISSING');

      const MFA_TIMEOUT_MS = 10000;
      const MFA_CHECK_FAILED = Symbol('mfa_check_failed');

      type MFASuccess = { mfaRequired: true; factorId: string } | { mfaRequired: false };
      let mfaResult: MFASuccess | typeof MFA_CHECK_FAILED;

      try {
        const mfaCheckPromise = (async (): Promise<MFASuccess> => {
          const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalError) throw aalError;

          if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
            const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;
            const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');
            if (totpFactor) return { mfaRequired: true, factorId: totpFactor.id };
          }
          return { mfaRequired: false };
        })();

        mfaResult = await Promise.race([
          mfaCheckPromise,
          new Promise<typeof MFA_CHECK_FAILED>(resolve =>
            setTimeout(() => resolve(MFA_CHECK_FAILED), MFA_TIMEOUT_MS)
          ),
        ]);
      } catch (mfaErr) {
        const msg = mfaErr instanceof Error ? mfaErr.message : String(mfaErr);
        console.error('MFA check error:', msg);
        mfaResult = MFA_CHECK_FAILED;
      }

      if (mfaResult === MFA_CHECK_FAILED) {
        try { await supabase.auth.signOut(); } catch { /* noop */ }
        return {
          success: false,
          error: 'No se pudo verificar el segundo factor. Por favor, intenta nuevamente en unos segundos.',
        };
      }

      if (mfaResult.mfaRequired) {
        return { success: true, mfaRequired: true, factorId: mfaResult.factorId };
      }

      await applySession(user);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error en login:', msg);
      return { success: false, error: 'Error de conexión. Verifica tu red e inténtalo de nuevo.' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logAction(currentUser, 'logout', 'Cierre de sesión');
    }
    await supabase.auth.signOut();
  };

  // ── MFA helpers ───────────────────────────────────────────────────────────

  const withMFATimeout = <T,>(promise: Promise<T>, ms = 10000): Promise<T> =>
    Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('La operación tardó demasiado. Intenta de nuevo.')), ms)
      ),
    ]);

  const verifyMFA = async (factorId: string, code: string): Promise<OperationResult> => {
    try {
      const { data: challengeData, error: challengeError } = await withMFATimeout(
        supabase.auth.mfa.challenge({ factorId })
      );
      if (challengeError) return { success: false, error: challengeError.message };

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) return { success: false, error: verifyError.message };

      const { data: { user } } = await supabase.auth.getUser();
      if (user) await applySession(user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const enrollMFA = async (): Promise<MFAEnrollResult> => {
    try {
      const { data, error } = await withMFATimeout(
        supabase.auth.mfa.enroll({ factorType: 'totp' })
      );
      if (error) return { success: false, error: error.message };
      return {
        success: true,
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const unenrollMFA = async (factorId: string): Promise<OperationResult> => {
    try {
      const { error } = await withMFATimeout(
        supabase.auth.mfa.unenroll({ factorId })
      );
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const getMFAFactors = async (): Promise<{ success: boolean; factors: MFAFactor[] }> => {
    try {
      const { data, error } = await withMFATimeout(
        supabase.auth.mfa.listFactors()
      );
      if (error) return { success: false, factors: [] };
      return { success: true, factors: (data?.totp as unknown as MFAFactor[]) || [] };
    } catch {
      return { success: false, factors: [] };
    }
  };

  // ── Admin management ──────────────────────────────────────────────────────

  const addAdmin = async ({ name, email, password, role = 'admin' }: AddAdminParams): Promise<OperationResult> => {
    const token = await getCsrfToken();
    if (!token) return { success: false, error: 'No se pudo validar la sesión de seguridad' };

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { success: false, error: error.message };
    if (!data.user) return { success: false, error: 'No se pudo crear el usuario' };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ id: data.user.id, name, role, email });

    if (profileError) return { success: false, error: profileError.message };

    await logAction(currentUser, 'admin_created', `Creó admin: ${email} (${role})`);
    await fetchAllProfiles();
    return { success: true };
  };

  const removeAdmin = async (userId: string): Promise<OperationResult> => {
    if (userId === currentUser?.id) return { success: false, error: 'No puedes eliminarte a ti mismo' };

    const token = await getCsrfToken();
    if (!token) return { success: false, error: 'No se pudo validar la sesión de seguridad' };

    const target = users.find(u => u.id === userId);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };

    await logAction(currentUser, 'admin_deleted', `Eliminó admin: ${target?.email}`);
    await fetchAllProfiles();
    return { success: true };
  };

  const requestAdminAction = async ({
    action, targetEmail, targetName, targetRole, targetPassword,
    amount, requestDate, metadata,
  }: RequestAdminActionParams): Promise<OperationResult> => {
    const { error } = await supabase.from('admin_requests').insert({
      requested_by: currentUser!.id,
      action,
      target_email: targetEmail || '',
      target_name: targetName || '',
      target_role: targetRole || '',
      target_password: targetPassword || '',
      amount: amount ?? null,
      request_date: requestDate || null,
      metadata: metadata || {},
    });
    if (error) return { success: false, error: error.message };
    await logAction(currentUser, 'request_submitted', `Solicitud: ${action}`);
    await fetchAllRequests();
    return { success: true };
  };

  const reviewRequest = async (requestId: string, approved: boolean): Promise<ReviewResult> => {
    const token = await getCsrfToken();
    if (!token) return { success: false, error: 'No se pudo validar la sesión de seguridad' };

    const req = pendingRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Solicitud no encontrada' };

    if (approved) {
      if (req.action === 'create_admin') {
        const result = await addAdmin({
          name: req.target_name,
          email: req.target_email,
          password: req.target_password || generateTempPassword(),
          role: req.target_role,
        });
        if (!result.success) return result;
      } else if (req.action === 'delete_admin') {
        const target = users.find(u => u.email === req.target_email);
        if (target) await removeAdmin(target.id);
      } else if (req.action === 'add_expense') {
        const resolvedAmount =
          req.amount != null ? Number(req.amount) : parseFloat(req.target_email) || 0;
        const resolvedDate = req.request_date || req.target_role;

        const { error: gastoError } = await supabase.from('gastos').insert({
          description: req.target_name,
          amount: resolvedAmount,
          date: resolvedDate,
        });
        if (gastoError) return { success: false, error: gastoError.message };
      }
    }

    const { error } = await supabase
      .from('admin_requests')
      .update({ status: approved ? 'approved' : 'rejected', reviewed_by: currentUser!.id })
      .eq('id', requestId);

    if (error) return { success: false, error: error.message };

    await logAction(currentUser, approved ? 'request_approved' : 'request_rejected',
      `${approved ? 'Aprobó' : 'Rechazó'} solicitud: ${req.action}`);
    await fetchAllRequests();
    return { success: true, req };
  };

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      currentUser, users, pendingRequests, allRequests, loading,
      login, logout, addAdmin, removeAdmin,
      requestAdminAction, reviewRequest, fetchPendingRequests, fetchAllRequests,
      verifyMFA, enrollMFA, unenrollMFA, getMFAFactors,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
