-- Sofia-IA: persistent chat history and state stored in Supabase
-- Replaces the local JSON files (Sofia-IA/data/messages.json & states.json)
-- so history survives server restarts.

-- ── Messages ─────────────────────────────────────────────────────────────────

create table if not exists sofia_messages (
  id          bigserial primary key,
  chat_id     text        not null,          -- WhatsApp contact ID (e.g. 5491155443322@c.us)
  role        text        not null check (role in ('user', 'assistant')),
  content     text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists sofia_messages_chat_id_idx on sofia_messages (chat_id, created_at desc);

-- ── Chat states ───────────────────────────────────────────────────────────────

create table if not exists sofia_chat_states (
  chat_id           text        primary key,
  state             text        not null default 'discovery',
  price_asked_count integer     not null default 0,
  link_sent         boolean     not null default false,
  updated_at        timestamptz not null default now()
);

-- ── RPC: atomic increment ─────────────────────────────────────────────────────

create or replace function sofia_increment_price_asked(p_chat_id text)
returns void language plpgsql as $$
begin
  insert into sofia_chat_states (chat_id, price_asked_count)
    values (p_chat_id, 1)
  on conflict (chat_id) do update
    set price_asked_count = sofia_chat_states.price_asked_count + 1,
        updated_at        = now();
end;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Sofia-IA accesses these tables via the service role key (bypasses RLS).
-- The tables are NOT exposed to the anon/authenticated roles from the browser.

alter table sofia_messages    enable row level security;
alter table sofia_chat_states enable row level security;

-- No policies = only service_role can read/write (default Supabase behavior).
