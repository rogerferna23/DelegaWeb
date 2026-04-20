-- =====================================================================
-- Habilitación de Row-Level Security (RLS) para DelegaWeb — VERSIÓN SEGURA
-- =====================================================================
-- Este script está diseñado para ser TOLERANTE A FALLOS:
--   · Cada bloque verifica si la tabla existe antes de aplicar políticas.
--   · Si una tabla no existe en tu proyecto, ese bloque se salta sin error.
--   · Puedes correrlo las veces que quieras (idempotente).
--
-- Puedes correrlo completo aunque te falten tablas. Al final, un diagnóstico
-- te dirá exactamente qué tablas están protegidas y cuáles faltan.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Helpers: funciones is_admin() e is_superadmin()
-- ---------------------------------------------------------------------
-- Si la tabla `profiles` no existe, las funciones igual se crean pero
-- devuelven `false` siempre (a nadie lo considerarán admin vía policy).
-- Eso no rompe nada pero tampoco te deja leer datos con esas policies.
-- Si NO tienes profiles, mejor no habilites RLS en tablas admin-only
-- (déjalas como están hasta crear `profiles`).
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'profiles') then
    -- Versión real: consulta profiles.role
    execute $f$
      create or replace function public.is_admin()
      returns boolean
      language sql
      security definer
      set search_path = public
      as $body$
        select exists (
          select 1 from public.profiles
          where id = auth.uid()
            and role in ('admin', 'superadmin')
        );
      $body$;
    $f$;

    execute $f$
      create or replace function public.is_superadmin()
      returns boolean
      language sql
      security definer
      set search_path = public
      as $body$
        select exists (
          select 1 from public.profiles
          where id = auth.uid()
            and role = 'superadmin'
        );
      $body$;
    $f$;

    raise notice '[OK] Funciones is_admin() / is_superadmin() creadas usando tabla profiles.';
  else
    -- Stub: si no hay profiles, devuelve false siempre (seguro por defecto).
    execute $f$
      create or replace function public.is_admin()
      returns boolean
      language sql
      security definer
      as $body$ select false; $body$;
    $f$;

    execute $f$
      create or replace function public.is_superadmin()
      returns boolean
      language sql
      security definer
      as $body$ select false; $body$;
    $f$;

    raise notice '[AVISO] No existe public.profiles — is_admin/is_superadmin devolverán FALSE. Saltaremos políticas que dependan de ello.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2) Helper interno: aplicar RLS solo si la tabla existe
-- ---------------------------------------------------------------------
-- Uso: select public._enable_rls_if_exists('ventas');
create or replace function public._enable_rls_if_exists(tbl text)
returns boolean
language plpgsql
as $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = tbl) then
    execute format('alter table public.%I enable row level security', tbl);
    raise notice '[RLS ON] public.%', tbl;
    return true;
  else
    raise notice '[SKIP] Tabla public.% no existe — no se aplicará RLS', tbl;
    return false;
  end if;
end $$;

-- =====================================================================
-- 3) VENTAS  (admins leen y escriben)
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('ventas') then
    drop policy if exists "ventas: admins read" on public.ventas;
    create policy "ventas: admins read"
      on public.ventas for select
      using (public.is_admin());

    drop policy if exists "ventas: admins write" on public.ventas;
    create policy "ventas: admins write"
      on public.ventas for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- NOTA: PayPalCheckout.jsx inserta ventas desde clientes anónimos.
-- Lo ideal es mover eso a una Edge Function con service_role.
-- Mientras tanto, si necesitas permitir insert anon, descomenta:
-- do $$
-- begin
--   if exists (select 1 from information_schema.tables
--              where table_schema='public' and table_name='ventas') then
--     drop policy if exists "ventas: public insert (checkout)" on public.ventas;
--     create policy "ventas: public insert (checkout)"
--       on public.ventas for insert to anon
--       with check (true);
--   end if;
-- end $$;

-- =====================================================================
-- 4) GASTOS
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('gastos') then
    drop policy if exists "gastos: admins read" on public.gastos;
    create policy "gastos: admins read"
      on public.gastos for select using (public.is_admin());

    drop policy if exists "gastos: admins write" on public.gastos;
    create policy "gastos: admins write"
      on public.gastos for all
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- =====================================================================
-- 5) VENDORS
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('vendors') then
    drop policy if exists "vendors: admins read" on public.vendors;
    create policy "vendors: admins read"
      on public.vendors for select using (public.is_admin());

    drop policy if exists "vendors: admins write" on public.vendors;
    create policy "vendors: admins write"
      on public.vendors for all
      using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- =====================================================================
-- 6) BUSINESS_PROFILES  (cada usuario ve solo lo suyo)
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('business_profiles') then
    drop policy if exists "business_profiles: owner read" on public.business_profiles;
    create policy "business_profiles: owner read"
      on public.business_profiles for select
      using (auth.uid() = user_id or public.is_superadmin());

    drop policy if exists "business_profiles: owner write" on public.business_profiles;
    create policy "business_profiles: owner write"
      on public.business_profiles for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- =====================================================================
-- 7) GUIONES_HISTORIAL
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('guiones_historial') then
    drop policy if exists "guiones_historial: owner read" on public.guiones_historial;
    create policy "guiones_historial: owner read"
      on public.guiones_historial for select
      using (auth.uid() = user_id or public.is_superadmin());

    drop policy if exists "guiones_historial: owner write" on public.guiones_historial;
    create policy "guiones_historial: owner write"
      on public.guiones_historial for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- =====================================================================
-- 8) USER_PREFERENCES
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('user_preferences') then
    drop policy if exists "user_preferences: self" on public.user_preferences;
    create policy "user_preferences: self"
      on public.user_preferences for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- =====================================================================
-- 9) PROFILES (si existe)
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('profiles') then
    drop policy if exists "profiles: self or admin read" on public.profiles;
    create policy "profiles: self or admin read"
      on public.profiles for select
      using (auth.uid() = id or public.is_admin());

    drop policy if exists "profiles: self update" on public.profiles;
    create policy "profiles: self update"
      on public.profiles for update
      using (auth.uid() = id) with check (auth.uid() = id);

    drop policy if exists "profiles: superadmin manage" on public.profiles;
    create policy "profiles: superadmin manage"
      on public.profiles for all
      using (public.is_superadmin())
      with check (public.is_superadmin());
  end if;
end $$;

-- =====================================================================
-- 10) ADMIN_REQUESTS
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('admin_requests') then
    drop policy if exists "admin_requests: admins read" on public.admin_requests;
    create policy "admin_requests: admins read"
      on public.admin_requests for select using (public.is_admin());

    drop policy if exists "admin_requests: admins insert" on public.admin_requests;
    create policy "admin_requests: admins insert"
      on public.admin_requests for insert
      with check (public.is_admin() and requested_by = auth.uid());

    drop policy if exists "admin_requests: superadmin update" on public.admin_requests;
    create policy "admin_requests: superadmin update"
      on public.admin_requests for update
      using (public.is_superadmin())
      with check (public.is_superadmin());
  end if;
end $$;

-- =====================================================================
-- 11) AUDIT_LOG
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('audit_log') then
    drop policy if exists "audit_log: superadmin read" on public.audit_log;
    create policy "audit_log: superadmin read"
      on public.audit_log for select using (public.is_superadmin());

    drop policy if exists "audit_log: authenticated insert" on public.audit_log;
    create policy "audit_log: authenticated insert"
      on public.audit_log for insert
      with check (auth.role() = 'authenticated');
  end if;
end $$;

-- =====================================================================
-- 12) ACTIVITY_LOGS
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('activity_logs') then
    drop policy if exists "activity_logs: superadmin read" on public.activity_logs;
    create policy "activity_logs: superadmin read"
      on public.activity_logs for select using (public.is_superadmin());

    drop policy if exists "activity_logs: anyone insert" on public.activity_logs;
    create policy "activity_logs: anyone insert"
      on public.activity_logs for insert with check (true);
  end if;
end $$;

-- =====================================================================
-- 13) POSTULANTES (insert público desde /trabaja-con-nosotros)
-- =====================================================================
do $$
begin
  if public._enable_rls_if_exists('postulantes') then
    drop policy if exists "postulantes: admins read" on public.postulantes;
    create policy "postulantes: admins read"
      on public.postulantes for select using (public.is_admin());

    drop policy if exists "postulantes: admins manage" on public.postulantes;
    create policy "postulantes: admins manage"
      on public.postulantes for update
      using (public.is_admin()) with check (public.is_admin());

    drop policy if exists "postulantes: admins delete" on public.postulantes;
    create policy "postulantes: admins delete"
      on public.postulantes for delete using (public.is_admin());

    drop policy if exists "postulantes: public insert" on public.postulantes;
    create policy "postulantes: public insert"
      on public.postulantes for insert with check (true);
  end if;
end $$;

-- =====================================================================
-- DIAGNÓSTICO FINAL
-- =====================================================================
-- Después de correr el script, ejecuta esta query para ver el estado real
-- de RLS en cada tabla de tu proyecto:
--
--   select schemaname, tablename, rowsecurity as rls_activo
--   from pg_tables
--   where schemaname = 'public'
--   order by tablename;
--
-- Las que estén en `true` están protegidas. Las que no existan, obviamente
-- no aparecerán en la lista.
-- =====================================================================

-- Limpieza: borra el helper interno (opcional, puedes dejarlo)
drop function if exists public._enable_rls_if_exists(text);
