require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { handleMessage } = require('./messageHandler');

console.log('🚀 Iniciando DelegaWeb WhatsApp Closer Bot...');
console.log(`📋 Modo: ${process.env.BOT_MODE || 'auto'}`);

// Create WhatsApp client with local session persistence
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'delegaweb-closer' }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },
});

// Show QR code to scan on first run
client.on('qr', async (qr) => {
  // Also show in terminal as fallback
  qrcode.generate(qr, { small: true });

  // Save as PNG image for easy scanning
  const qrPath = path.join(__dirname, 'qr.png');
  try {
    await QRCode.toFile(qrPath, qr, { width: 400 });
    console.log(`\n📸 QR guardado como imagen: ${qrPath}`);
    console.log('📱 Ábrela y escanéala con WhatsApp → Dispositivos vinculados\n');
    // Auto-open the image on Windows
    exec(`start "" "${qrPath}"`);
  } catch (e) {
    console.error('No se pudo guardar el QR como imagen:', e.message);
  }
});

// Session authenticated from cache
client.on('authenticated', () => {
  console.log('✅ Sesión autenticada (sin necesidad de nuevo QR)');
});

// Ready to receive messages
client.on('ready', () => {
  console.log('✅ WhatsApp conectado y listo para recibir mensajes');
  console.log('🤖 El Closer IA está activo — esperando mensajes...\n');
});

// Disconnected
client.on('disconnected', (reason) => {
  console.warn('⚠️  Bot desconectado:', reason);
  console.log('🔄 Reiniciando en 5 segundos...');
  setTimeout(() => client.initialize(), 5000);
});

// Handle incoming messages
client.on('message', async (msg) => {
  await handleMessage(client, msg);
});

// Initialize the WhatsApp client
client.initialize();
