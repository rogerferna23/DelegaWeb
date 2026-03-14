import emailjs from '@emailjs/browser';

/**
 * Service to handle automated email notifications for sales.
 * Uses EmailJS to send notifications without a custom backend.
 */

const EMAIL_CONFIG = {
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  ADMIN_EMAIL: import.meta.env.VITE_ADMIN_EMAIL || 'goldrodrigo@gmail.com'
};

/**
 * Sends a notification email when a new sale is registered.
 * @param {Object} venta - The sale data object
 * @param {string} type - 'manual' or 'web'
 */
export const sendSaleNotification = async (venta, type = 'manual') => {
  // Check if configuration is present
  if (!EMAIL_CONFIG.SERVICE_ID || !EMAIL_CONFIG.TEMPLATE_ID || !EMAIL_CONFIG.PUBLIC_KEY) {
    console.warn('EmailJS configuration is missing. Notification not sent.');
    return { success: false, error: 'Configuración de EmailJS incompleta' };
  }

  try {
    const templateParams = {
      tipo_venta: type === 'manual' ? 'Venta Manual' : 'Venta Web (PayPal)',
      cliente_nombre: venta.clienteNombre || 'Cliente desconocido',
      cliente_email: venta.clienteEmail || 'No proporcionado',
      importe: `${venta.importe} USD`,
      servicio: venta.servicio || 'Servicio no especificado',
      fecha: venta.fecha || new Date().toLocaleDateString(),
      admin_email: EMAIL_CONFIG.ADMIN_EMAIL,
      // Add any additional context that might be useful
      notas: venta.vendedor ? `Vendedor: ${venta.vendedor}` : '',
      prioridad: venta.prioridad ? '¡PRIORITARIO (2 DÍAS)!' : 'Estándar'
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAIL_CONFIG.PUBLIC_KEY
    );

    console.log('[EmailService] Notificación enviada:', response.status, response.text);
    return { success: true, response };
  } catch (error) {
    console.error('[EmailService] Error al enviar notificación:', error);
    return { success: false, error };
  }
};
