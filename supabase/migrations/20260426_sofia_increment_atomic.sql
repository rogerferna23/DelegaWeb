-- Hace que sofia_increment_price_asked devuelva el nuevo contador en la misma
-- transacción, eliminando una race condition entre el INSERT/UPDATE y el SELECT
-- separado que el cliente hacía después.

create or replace function sofia_increment_price_asked(p_chat_id text)
returns integer language plpgsql as $$
declare
  v_new_count integer;
begin
  insert into sofia_chat_states (chat_id, price_asked_count)
    values (p_chat_id, 1)
  on conflict (chat_id) do update
    set price_asked_count = sofia_chat_states.price_asked_count + 1,
        updated_at        = now()
  returning price_asked_count into v_new_count;
  return v_new_count;
end;
$$;
