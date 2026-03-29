const config = require('../config');

/**
 * Send a self-notification to Roger's WhatsApp number
 * @param {Object} client - whatsapp-web.js client instance
 * @param {Object} info - { contactName, contactNumber, chatId, summary, title, footer }
 */
async function notifyRoger(client, { contactName, contactNumber, chatId, summary, title, footer }) {
  if (!config.ADMIN_NUMBERS || config.ADMIN_NUMBERS.length === 0) {
    console.warn('[Notifier] No admin numbers set — skipping notifications.');
    return;
  }

  const finalTitle = title || `🚨 *Lead list para agendar*`;
  const finalFooter = footer || `(El cliente ya recibió el link)`;

  // Clean phone number (extract digits only) to make a clean wa.me link
  const cleanNumber = (contactNumber || chatId).replace(/\D/g, '');
  const waLink = cleanNumber ? `https://wa.me/${cleanNumber}` : '';

  const message =
`${finalTitle}

👤 *Lead:* ${contactName}

📌 *REPORTE:*
${summary}

${finalFooter}
🔗 ${waLink}`;

  // Determine target(s)
  const targets = [];
  
  // 1. Prioritize Group if configured (Stop sending to personal DMs)
  if (config.NOTIFICATIONS_GROUP_ID) {
    targets.push(config.NOTIFICATIONS_GROUP_ID);
    console.log('[Notifier] Usando Grupo de Notificaciones exclusivamente, omitiendo DMs personales.');
  } 
  // 2. Fallback to individual admin numbers if NO group is configured
  else if (config.ADMIN_NUMBERS && config.ADMIN_NUMBERS.length > 0) {
    config.ADMIN_NUMBERS.forEach(num => {
      if (num) targets.push(`${num.replace(/\D/g, '')}@c.us`);
    });
  }

  console.log(`[Notifier] Preparing to send message to ${targets.length} targets. Content:\n${message}`);

  // Send to all targets
  for (const target of targets) {
    try {
      await client.sendMessage(target, message, { linkPreview: false });
      console.log(`[Notifier] Alert sent to ${target} for lead: ${contactName}`);
    } catch (err) {
      console.error(`[Notifier] Failed to send notification to ${target}:`, err.message);
    }
  }
}

module.exports = { notifyRoger };
