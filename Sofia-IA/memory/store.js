const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STATES_FILE = path.join(DATA_DIR, 'states.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '{}');
if (!fs.existsSync(STATES_FILE)) fs.writeFileSync(STATES_FILE, '{}');

async function readJSON(file) {
  try { return JSON.parse(await fs.promises.readFile(file, 'utf8')); }
  catch { return {}; }
}

async function writeJSON(file, data) {
  await fs.promises.writeFile(file, JSON.stringify(data, null, 2));
}

/**
 * Add a message to the conversation history
 */
async function addMessage(chatId, role, content) {
  const db = await readJSON(MESSAGES_FILE);
  if (!db[chatId]) db[chatId] = [];
  db[chatId].push({ role, content, ts: Date.now() });
  await writeJSON(MESSAGES_FILE, db);
}

/**
 * Get the last N messages for a chat, formatted for Gemini
 * @returns {Promise<Array>} - [{role, parts: [{text}]}]
 */
async function getHistory(chatId, limit = 20) {
  const db = await readJSON(MESSAGES_FILE);
  const msgs = (db[chatId] || []).slice(-limit);
  return msgs.map(m => ({ role: m.role, content: m.content }));
}

/**
 * Get or create the state for a chat
 */
async function getChatState(chatId) {
  const db = await readJSON(STATES_FILE);
  if (!db[chatId]) {
    db[chatId] = { state: 'discovery', price_asked_count: 0 };
    await writeJSON(STATES_FILE, db);
  }
  return db[chatId];
}

/**
 * Increment how many times a client asked for price
 * @returns {Promise<number>} new count
 */
async function incrementPriceAsked(chatId) {
  const db = await readJSON(STATES_FILE);
  if (!db[chatId]) db[chatId] = { state: 'discovery', price_asked_count: 0 };
  db[chatId].price_asked_count = (db[chatId].price_asked_count || 0) + 1;
  await writeJSON(STATES_FILE, db);
  return db[chatId].price_asked_count;
}

/**
 * Mark that the link was sent to this chatId
 */
async function setLinkSent(chatId) {
  const db = await readJSON(STATES_FILE);
  if (!db[chatId]) db[chatId] = { state: 'discovery', price_asked_count: 0, link_sent: false };
  db[chatId].link_sent = true;
  await writeJSON(STATES_FILE, db);
}

/**
 * Check if the link was already sent
 */
async function getLinkSent(chatId) {
  const db = await readJSON(STATES_FILE);
  return db[chatId]?.link_sent || false;
}

module.exports = { addMessage, getHistory, getChatState, incrementPriceAsked, setLinkSent, getLinkSent };
