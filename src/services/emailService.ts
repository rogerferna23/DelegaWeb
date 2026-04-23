import emailjs from '@emailjs/browser';

/**
 * Service to handle automated email notifications for sales.
 * Uses EmailJS to send notifications without a custom backend.
 */

interface EmailConfig {
  SERVICE_ID: string;
  TEMPLATE_ID: string;
  PUBLIC_KEY: string;
  ADMIN_EMAIL: string;
}

const EMAIL_CONFIG: EmailConfig = {
  SERVICE_ID:  import.meta.env.VITE_EMAILJS_SERVICE_ID  as string,
  TEMPLATE_ID: import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string,
  PUBLIC_KEY:  import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string,
  ADMIN_EMAIL: (import.meta.env.VITE_ADMIN_EMAIL as string) || 'goldrodrigo@gmail.com',
};

interface VentaEntry {
  clienteNombre?: string;
  clienteEmail?: string;
  importe?: number;
  servicio?: string;
  moneda?: string;
  fecha?: string;
  vendedor?: string;
  prioridad?: boolean;
}

interface EmailResult {
  success: boolean;
  response?: object;
  error?: unknown;
}

/**
 * Sends a notification email when a new sale is registered.
 * @param venta - The sale data object
 * @param type - 'manual' or 'web'
 */
export const sendSaleNotification = async (
  venta: VentaEntry,
  type: 'manual' | 'web' = 'manual',
): Promise<EmailResult> => {
  if (!EMAIL_CONFIG.SERVICE_ID || !EMAIL_CONFIG.TEMPLATE_ID || !EMAIL_CONFIG.PUBLIC_KEY) {
    console.warn('EmailJS configuration is missing. Notification not sent.');
    return { success: false, error: 'Configuración de EmailJS incompleta' };
  }

  try {
    const templateParams = {
      tipo_venta:     type === 'manual' ? 'Venta Manual' : 'Venta Web (PayPal)',
      cliente_nombre: venta.clienteNombre  || 'Cliente desconocido',
      cliente_email:  venta.clienteEmail   || 'No proporcionado',
      importe:        `${venta.importe ?? 0} USD`,
      servicio:       venta.servicio       || 'Servicio no especificado',
      fecha:          venta.fecha          || new Date().toLocaleDateString(),
      admin_email:    EMAIL_CONFIG.ADMIN_EMAIL,
      notas:          venta.vendedor ? `Vendedor: ${venta.vendedor}` : '',
      prioridad:      venta.prioridad ? '¡PRIORITARIO (2 DÍAS)!' : 'Estándar',
    };

    const response = await emailjs.send(
      EMAIL_CONFIG.SERVICE_ID,
      EMAIL_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAIL_CONFIG.PUBLIC_KEY,
    );

    return { success: true, response };
  } catch (error) {
    console.error('[EmailService] Error al enviar notificación:', error);
    return { success: false, error };
  }
};
