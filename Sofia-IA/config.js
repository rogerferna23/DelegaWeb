require('dotenv').config();

module.exports = {
  // Modo del bot
  BOT_MODE: process.env.BOT_MODE || 'auto', // 'auto' | 'manual'

  // Números que reciben los reportes (Roger y socios)
  ADMIN_NUMBERS: [
    process.env.MY_WHATSAPP_NUMBER, // Roger
    '573219082556',                // Socio 1
    '34657473191'                 // Socio 2
  ],

  // ID del grupo de WhatsApp para notificaciones (ej: 120363024891234567@g.us)
  // Si se configura, se enviará aquí en lugar de a cada admin individualmente.
  NOTIFICATIONS_GROUP_ID: '120363425256598785@g.us',

  // Link de agendamiento apuntando a la página privada de la web
  MEETING_LINK: 'https://delegaweb.com/#/sesion-estrategica',

  // Delay simulado antes de responder (ms) — simula tiempo humano
  MIN_DELAY_MS: 2000,
  MAX_DELAY_MS: 5000,

  // Cuántos mensajes de historial enviar a la IA por cada chat. 
  // Aumentado a 20 para mayor contexto.
  HISTORY_LIMIT: 20,
};
