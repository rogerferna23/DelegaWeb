// Logger centralizado para toda la app.
//
// - En DEV (import.meta.env.DEV === true) reenvía a console.* tal cual.
// - En PROD los niveles `log`, `debug` e `info` se silencian (no queremos
//   ruido en la consola del navegador de usuarios reales ni filtrar
//   información interna de procesos). `warn` y `error` se mantienen
//   porque son útiles para soporte y para que sentry/logRocket los
//   capturen en el futuro si se conectan.
//
// Uso:
//   import { logger } from '@/utils/logger';
//   logger.log('saving', payload);
//   logger.warn('retrying');
//   logger.error('failed', err);

const isDev =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  import.meta.env.DEV === true;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

/* eslint-disable no-console -- este archivo es la ÚNICA excepción: por
   diseño accede a console.* para poder wrapperlo. El resto del código
   debe usar `logger.*`. */
export const logger = {
  log:   isDev ? console.log.bind(console)   : noop,
  debug: isDev ? console.debug.bind(console) : noop,
  info:  isDev ? console.info.bind(console)  : noop,
  // warn y error SÍ se emiten en prod — son útiles para soporte.
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
} as const;
/* eslint-enable no-console */

export default logger;
