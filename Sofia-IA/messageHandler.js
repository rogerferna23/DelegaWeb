const { generateCloserResponse, detectClientIntent, generateClientReport } = require('./closer/closerAgent');
const { addMessage, getHistory, incrementPriceAsked, setLinkSent, getLinkSent } = require('./memory/store');
const { notifyRoger } = require('./notifier/notify');
const config = require('./config');

// Detect if the user is asking about price
function isPriceQuestion(text) {
  const keywords = ['precio', 'cuánto', 'cuanto', 'costo', 'vale', 'cobran', 'tarifa', 'inversión', 'inversion', 'cuesta'];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// Dynamic delay based on text length — simulates human typing speed
// ~50ms per character, min 1.5s, max 8s
function humanDelay(text = '') {
  const ms = Math.min(8000, Math.max(1500, text.length * 50));
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main handler for incoming WhatsApp messages
 * @param {Object} client - whatsapp-web.js client
 * @param {Object} msg - incoming message object
 */
async function handleMessage(client, msg) {
  // Only respond to private chats (not groups)
  const chat = await msg.getChat();
  if (chat.isGroup) {
    // Hidden command for the group to get its own ID
    if (msg.body === '!id') {
      console.log(`[Info Grupo] ID del grupo "${chat.name}": ${chat.id._serialized}`);
      await msg.reply(`El ID de este grupo es:\n*${chat.id._serialized}*\n\nCópialo y pégalo en tu archivo config.js en la variable NOTIFICATIONS_GROUP_ID.`);
    }
    return;
  }

  // Only process text messages
  if (!msg.body || msg.body.trim() === '') return;

  // Skip messages sent by the bot itself (our own number)
  if (msg.fromMe) return;

  const chatId = msg.from;
  const userText = msg.body.trim();
  const contact = await msg.getContact();
  const contactName = contact.pushname || contact.number || chatId;

  console.log(`[${new Date().toLocaleTimeString()}] 📩 ${contactName}: ${userText}`);

  if (config.BOT_MODE === 'manual') {
    console.log('[BOT_MODE=manual] Logging only, not responding.');
    return;
  }

  // --- COMANDO SECRETO PARA PROBAR REPORTES ---
  if (userText.toLowerCase() === '!testreport') {
    console.log('[Test] Triggering test report...');
    await notifyRoger(client, { 
      contactName,
      contactNumber: contact.number || 'N/A',
      chatId, 
      summary: "Este es un reporte de prueba para verificar que los mensajes están llegando correctamente al grupo de WhatsApp. Si estás leyendo esto, Sofia IA está perfectamente conectada al grupo.",
      title: "🧪 *Test de Notificación - Sofía IA*",
      footer: "✅ Conexión con el grupo exitosa"
    });
    await msg.reply('✅ He enviado el reporte de prueba al grupo y a los números de los administradores configurados.');
    return;
  }
  // --------------------------------------------

  try {
    // Track if client is asking about price
    if (isPriceQuestion(userText)) {
      const count = await incrementPriceAsked(chatId);
      console.log(`[Price Question] Count for ${contactName}: ${count}`);
    }

    // Get conversation history
    const history = await getHistory(chatId, config.HISTORY_LIMIT);

    // Save incoming user message
    await addMessage(chatId, 'user', userText);

    // Generate AI response first, then wait proportionally before sending
    const aiResponse = await generateCloserResponse(history, userText);

    // Simulate typing delay proportional to response length
    await humanDelay(aiResponse);
    await chat.sendStateTyping();

    // Save AI response
    await addMessage(chatId, 'assistant', aiResponse);

    // Send the response
    await msg.reply(aiResponse);
    console.log(`[${new Date().toLocaleTimeString()}] 🤖 Bot → ${contactName}: ${aiResponse.substring(0, 80)}...`);

    // If the bot's response contains the meeting link, mark it as sent in the state
    if (aiResponse.includes('/sesion-estrategica')) {
      console.log(`[State] Link detectado en la respuesta del bot. Marcando link_sent para ${contactName}.`);
      await setLinkSent(chatId);
    }

    // Check client intent with recent context and link status
    const updatedHistoryContext = await getHistory(chatId, 15);
    const isLinkSent = await getLinkSent(chatId);
    const intent = await detectClientIntent(updatedHistoryContext, userText, isLinkSent);
    console.log(`[Intent Detection] Resultado: ${intent} (Link Sent: ${isLinkSent})`);
    if (intent === 'VENTA') {
      const summary = `💸 ATENCIÓN: El cliente parece listo para agendar o pagar. Último mensaje: "${userText}"`;
      console.log('[Notifier] Enviando alerta de VENTA a Roger...');
      await notifyRoger(client, { contactName, contactNumber: contact.number, chatId, summary });
    } else if (intent === 'HUMANO') {
      const summary = `👨‍💼 ATENCIÓN: El cliente pidió hablar con un asesor o humano real. Último mensaje: "${userText}"`;
      console.log('[Notifier] Enviando alerta de HUMANO a Roger...');
      await notifyRoger(client, { contactName, contactNumber: contact.number, chatId, summary });
    } else if (intent === 'AGENDADO') {
      console.log(`[Notifier] Generando reporte de cita para ${contactName}...`);
      const updatedHistory = await getHistory(chatId, config.HISTORY_LIMIT);
      const report = await generateClientReport(updatedHistory);
      await notifyRoger(client, { 
        contactName,
        contactNumber: contact.number,
        chatId, 
        summary: report,
        title: "🚀 *Cita Agendada!*",
        footer: "✅ El cliente ha confirmado su agendamiento."
      });
    }

  } catch (err) {
    console.error(`[Handler] Error processing message from ${contactName}:`, err.message);
  }
}

module.exports = { handleMessage };
