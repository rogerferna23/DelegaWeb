require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Add a message to the conversation history
 */
async function addMessage(chatId, role, content) {
  const { error } = await supabase
    .from('sofia_messages')
    .insert({ chat_id: chatId, role, content });
  if (error) console.error('[Store] addMessage error:', error.message);
}

/**
 * Get the last N messages for a chat
 * @returns {Promise<Array>} - [{role, content}]
 */
async function getHistory(chatId, limit = 20) {
  const { data, error } = await supabase
    .from('sofia_messages')
    .select('role, content')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('[Store] getHistory error:', error.message); return []; }
  return (data || []).reverse();
}

/**
 * Get or create the state for a chat
 */
async function getChatState(chatId) {
  const { data, error } = await supabase
    .from('sofia_chat_states')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (error) console.error('[Store] getChatState error:', error.message);
  if (data) return data;

  // Create default state
  const { data: created } = await supabase
    .from('sofia_chat_states')
    .insert({ chat_id: chatId, state: 'discovery', price_asked_count: 0, link_sent: false })
    .select()
    .single();
  return created || { state: 'discovery', price_asked_count: 0, link_sent: false };
}

/**
 * Increment how many times a client asked for price
 * @returns {Promise<number>} new count (atomic — el RPC devuelve el valor
 * actualizado en la misma transacción para evitar race conditions con
 * mensajes simultáneos del mismo chat).
 */
async function incrementPriceAsked(chatId) {
  const { data, error } = await supabase.rpc('sofia_increment_price_asked', { p_chat_id: chatId });
  if (error) {
    console.error('[Store] incrementPriceAsked error:', error.message);
    return 1;
  }
  return typeof data === 'number' ? data : 1;
}

/**
 * Mark that the meeting link was sent to this chatId
 */
async function setLinkSent(chatId) {
  const { error } = await supabase
    .from('sofia_chat_states')
    .upsert({ chat_id: chatId, link_sent: true }, { onConflict: 'chat_id' });
  if (error) console.error('[Store] setLinkSent error:', error.message);
}

/**
 * Check if the meeting link was already sent
 */
async function getLinkSent(chatId) {
  const { data } = await supabase
    .from('sofia_chat_states')
    .select('link_sent')
    .eq('chat_id', chatId)
    .maybeSingle();
  return data?.link_sent ?? false;
}

module.exports = { addMessage, getHistory, getChatState, incrementPriceAsked, setLinkSent, getLinkSent };
