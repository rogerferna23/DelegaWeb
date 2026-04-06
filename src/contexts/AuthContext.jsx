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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await applySession(session.user);
      else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [applySession]);

  const login = async (email, password) => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT_ERROR')), 12000)
      );

      const { data, error } = await Promise.race([
        supabase.functions.invoke('auth-login-limiter', {
          body: { email, password },
          headers: { 'Content-Type': 'application/json' }
        }),
        timeoutPromise
      ]).catch(err => {
        if (err.message === 'TIMEOUT_ERROR') throw err;
        throw new Error('NETWORK_ERROR');
      });

      if (error || data?.error) {
        const errorMessage = data?.error || error?.message || 'Error de credenciales.';
        return { success: false, error: errorMessage };
      }

      const { session, user } = data;
      if (!session) throw new Error('SESSION_MISSING');

      const { error: sessionError } = await supabase.auth.setSession(session);
      if (sessionError) throw sessionError;

      setTimeout(async () => {
        await applySession(user);
      }, 0);

      return { success: true };
    } catch (err) {
      if (err.message === 'TIMEOUT_ERROR') {
        return { success: false, error: 'El servidor de seguridad no respondió a tiempo. Por favor, reintenta.' };
      }
      return { success: false, error: 'Error de conexión con el servidor de autenticación.' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await logAction(currentUser, 'logout', 'Cierre de sesión');
    }
    await supabase.auth.signOut();
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
