import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user) => {
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return data;
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    setUsers(data || []);
  };

  const fetchPendingRequests = async () => {
    const { data } = await supabase
      .from('admin_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    setPendingRequests(data || []);
  };

  const fetchAllRequests = async () => {
    const { data } = await supabase
      .from('admin_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setAllRequests(data || []);
    setPendingRequests((data || []).filter(r => r.status === 'pending'));
  };

  const applySession = useCallback(async (authUser) => {
    try {
      if (!authUser) {
        setCurrentUser(null);
        setUsers([]);
        setPendingRequests([]);
        return;
      }
      const p = await fetchProfile(authUser);
      if (p) {
        const user = { ...authUser, role: p.role, name: p.name };
        setCurrentUser(user);
        fetchAllProfiles();
        fetchAllRequests();
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Error al aplicar sesión:", err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await applySession(session.user);
        else setLoading(false);
      } catch (err) {
        console.error("Error al inicializar sesión:", err);
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Prevent auto-applying session if MFA is required (aal1 -> aal2 escalation needed).
        // This ensures AdminLogin don't redirect before the second factor is entered.
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.nextLevel === 'aal2' && aal?.currentLevel === 'aal1' && event !== 'SIGNED_OUT') {
          setLoading(false);
          return;
        }
        await applySession(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const login = async (email, password) => {
    try {
      console.log('Iniciando direct signInWithPassword...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 25000)
      );

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeoutPromise
      ]).catch(err => {
        if (err.message === 'TIMEOUT_ERROR') throw err;
        throw new Error('NETWORK_ERROR');
      });

      console.log('signInWithPassword terminado', { error, userId: data?.user?.id });

      if (error) {
        return { success: false, error: 'Credenciales inválidas.' };
      }

      const { user } = data;
      if (!user) throw new Error('SESSION_MISSING');

      // MFA check — wrapped in timeout + try/catch so a hanging Supabase call
      // never blocks login. Fails OPEN: if the check hangs or errors, user gets in.
      try {
        const mfaCheckPromise = (async () => {
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

          if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            // Only VERIFIED factors require MFA — cancelled/unverified enrollments are ignored
            const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');
            if (totpFactor) return { mfaRequired: true, factorId: totpFactor.id };
          }
          return { mfaRequired: false };
        })();

        const mfaResult = await Promise.race([
          mfaCheckPromise,
          new Promise(resolve => setTimeout(() => resolve({ mfaRequired: false }), 10000)),
        ]);

        if (mfaResult.mfaRequired) {
          return { success: true, mfaRequired: true, factorId: mfaResult.factorId };
        }
      } catch {
        // MFA check failed — fail open, let the user in
        console.warn('MFA check failed or timed out, proceeding without MFA.');
      }


      await applySession(user);
      return { success: true };
    } catch (err) {
      console.error('Error en login:', err.message);
      if (err.message === 'TIMEOUT_ERROR') {
        try {
          const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
          keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch { /* ignore localStorage errors */ }
        return { success: false, error: 'La conexión tardó demasiado (Timeout). Hemos limpiado la caché, intenta nuevamente conectarte a una red estable.' };
      }
      return { success: false, error: 'Error de conexión directa con Supabase.' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logAction(currentUser, 'logout', 'Cierre de sesión');
    }
    await supabase.auth.signOut();
  };

  // ── MFA helper ────────────────────────────────────────────────────────────
  // Wraps any promise with a timeout so a hanging Supabase call never freezes the UI
  const withMFATimeout = (promise, ms = 10000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('La operación tardó demasiado. Intenta de nuevo.')), ms)
      ),
    ]);

  // ── MFA Functions ─────────────────────────────────────────────────────────

  const verifyMFA = async (factorId, code) => {
    try {
      const { data: challengeData, error: challengeError } = await withMFATimeout(
        supabase.auth.mfa.challenge({ factorId })
      );
      if (challengeError) return { success: false, error: challengeError.message };

      const { error: verifyError } = await supabase.auth.mfa.verify({ 
        factorId, 
        challengeId: challengeData.id, 
        code 
      });
      if (verifyError) return { success: false, error: verifyError.message };

      const { data: { user } } = await supabase.auth.getUser();
      if (user) await applySession(user);

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const enrollMFA = async () => {
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
      return { success: false, error: err.message };
    }
  };

  const unenrollMFA = async (factorId) => {
    try {
      const { error } = await withMFATimeout(
        supabase.auth.mfa.unenroll({ factorId })
      );
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getMFAFactors = async () => {
    try {
      const { data, error } = await withMFATimeout(
        supabase.auth.mfa.listFactors()
      );
      if (error) return { success: false, factors: [] };
      return { success: true, factors: data?.totp || [] };

    } catch {
      return { success: false, factors: [] };
    }
  };

  const addAdmin = async ({ name, email, password, role = 'admin' }) => {
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

  const removeAdmin = async (userId) => {
    if (userId === currentUser?.id) return { success: false, error: 'No puedes eliminarte a ti mismo' };

    const target = users.find(u => u.id === userId);
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) return { success: false, error: error.message };

    await logAction(currentUser, 'admin_deleted', `Eliminó admin: ${target?.email}`);
    await fetchAllProfiles();
    return { success: true };
  };

  // --- Flujo de aprobación ---

  const requestAdminAction = async ({ action, targetEmail, targetName, targetRole, targetPassword }) => {
    const { error } = await supabase.from('admin_requests').insert({
      requested_by: currentUser.id,
      action,
      target_email: targetEmail || '',
      target_name: targetName || '',
      target_role: targetRole || '',
      target_password: targetPassword || '',
    });
    if (error) return { success: false, error: error.message };
    await logAction(currentUser, 'request_submitted', `Solicitud: ${action}`);
    await fetchAllRequests();
    return { success: true };
  };

  const reviewRequest = async (requestId, approved) => {
    const req = pendingRequests.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Solicitud no encontrada' };

    if (approved) {
      if (req.action === 'create_admin') {
        const result = await addAdmin({
          name: req.target_name,
          email: req.target_email,
          password: req.target_password || 'TempPass123!',
          role: req.target_role,
        });
        if (!result.success) return result;
      } else if (req.action === 'delete_admin') {
        const target = users.find(u => u.email === req.target_email);
        if (target) await removeAdmin(target.id);
      } else if (req.action === 'add_expense') {
        // Write gasto to Supabase
        const { error: gastoError } = await supabase.from('gastos').insert({
          description: req.target_name,
          amount: parseFloat(req.target_email) || 0,
          date: req.target_role,
        });
        if (gastoError) return { success: false, error: gastoError.message };
      }
      // download_report: just mark approved — superadmin downloads from notification UI
    }

    const { error } = await supabase
      .from('admin_requests')
      .update({ status: approved ? 'approved' : 'rejected', reviewed_by: currentUser.id })
      .eq('id', requestId);

    if (error) return { success: false, error: error.message };

    await logAction(currentUser, approved ? 'request_approved' : 'request_rejected',
      `${approved ? 'Aprobó' : 'Rechazó'} solicitud: ${req.action}`);
    await fetchAllRequests();
    return { success: true, req };
  };

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
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
