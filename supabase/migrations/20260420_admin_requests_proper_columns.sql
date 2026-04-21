-- =====================================================================
-- admin_requests: columnas propias (amount / request_date / metadata)
-- =====================================================================
-- Hasta ahora las solicitudes de gastos reutilizaban target_email para
-- guardar el monto y target_role para la fecha (hack documentado en el
-- reporte de auditoría como #11). Esto era frágil y confuso: cualquier
-- refactor futuro podía romperlo porque los nombres de los campos no
-- coincidían con lo que realmente guardaban.
--
-- Esta migración añade columnas con nombre claro y hace backfill de las
-- filas existentes para no perder datos. Los campos antiguos se dejan
-- por compatibilidad (el código de reviewRequest tiene fallback a ellos
-- durante la transición).
-- =====================================================================

alter table if exists public.admin_requests
  add column if not exists amount numeric(12, 2),
  add column if not exists request_date date,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.admin_requests.amount is
  'Monto solicitado cuando action = add_expense. Reemplaza el hack previo que guardaba el monto en target_email.';
comment on column public.admin_requests.request_date is
  'Fecha asociada a la solicitud (p.ej. fecha del gasto). Reemplaza el hack que guardaba la fecha en target_role.';
comment on column public.admin_requests.metadata is
  'Datos flexibles específicos del tipo de solicitud (p.ej. export_mode / export_month en download_report).';

-- -------------------------------------------------------------------
-- Backfill: rescatar datos viejos sólo si parsean sin ruido.
-- -------------------------------------------------------------------

-- add_expense: amount estaba en target_email (como string)
update public.admin_requests
   set amount = nullif(target_email, '')::numeric
 where action = 'add_expense'
   and amount is null
   and target_email ~ '^[0-9]+(\.[0-9]+)?$';

-- add_expense: fecha estaba en target_role (formato YYYY-MM-DD)
update public.admin_requests
   set request_date = nullif(target_role, '')::date
 where action = 'add_expense'
   and request_date is null
   and target_role ~ '^\d{4}-\d{2}-\d{2}$';

-- download_report: target_name = export_mode, target_email = export_month
update public.admin_requests
   set metadata = jsonb_build_object(
         'export_mode',  coalesce(target_name,  ''),
         'export_month', coalesce(target_email, '')
       )
 where action = 'download_report'
   and (metadata is null or metadata = '{}'::jsonb);

-- -------------------------------------------------------------------
-- Índice opcional: listar rápido pendientes por acción y fecha.
-- -------------------------------------------------------------------
create index if not exists admin_requests_action_status_idx
  on public.admin_requests (action, status);
