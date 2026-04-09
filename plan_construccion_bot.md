# Plan de Implementación: Bot de WhatsApp Híbrido (IA + Reglas) desde cero

Este documento detalla el paso a paso exacto para reconstruir la arquitectura de Sofía IA desde un entorno vacío inicial hasta el producto final operativo.

## Fase 1: Fundamentos y Configuración del Entorno (Node.js)

En esta fase creamos el cascarón del proyecto e instalamos las dependencias necesarias.

1. **Inicialización del Proyecto:**
   * Crear la carpeta del proyecto (ej: `my-whatsapp-bot`).
   * Ejecutar `npm init -y` para generar el archivo `package.json`.
2. **Instalación de Dependencias Clave:**
   * `npm install whatsapp-web.js qrcode-terminal qrcode dotenv openai`
3. **Configuración de Variables de Entorno:**
   * Crear un archivo `.env` en la raíz.
   * Configurar: `OPENAI_API_KEY`, `MY_WHATSAPP_NUMBER`, y `BOT_MODE=auto`.

## Fase 2: Conexión Inicial con WhatsApp

Aquí logramos hacer que nuestro código levante un WhatsApp Web invisible y nos devuelva un QR para escanear.

1. **Creación del Punto de Entrada (`index.js`):**
   * Importar `Client` y `LocalAuth` de `whatsapp-web.js`.
   * Instanciar el cliente usando `LocalAuth` (para que una vez logueado, no pida QR de nuevo y guarde la sesión en `.wwebjs_auth`).
2. **Generación del QR:**
   * Configurar el oyente `client.on('qr', ...)` para imprimir el código QR en la consola (`qrcode-terminal`) y guardarlo en una imagen `qr.png` (`qrcode`).
3. **Oyente de Conexión:**
   * Escuchar `client.on('ready', ...)` para imprimir un console.log de que el bot ya está activo.
   * Añadir `client.initialize()`.
4. **Prueba 1:** Correr `node index.js` y escanear el QR con tu propio celular para verificar que conecta.

## Fase 3: La Memoria (Base de Datos Local JSON)

El bot necesita recordar conversaciones y el estado del usuario (si pidió precio, si ya le mandamos el link).

1. **Crear Módulo de Memoria (`memory/store.js`):**
   * Importar `fs` nativo de Node.js.
   * Crear funciones asíncronas para leer y escribir `messages.json` y `states.json` en una carpeta `/data/`.
2. **Funciones del Historial:**
   * `addMessage(chatId, role, content)`: Agrega texto al JSON del historial.
   * `getHistory(chatId, limit)`: Recupera los últimos N mensajes para dárselos a la IA.
3. **Funciones de Estado:**
   * `getChatState(chatId)`: Verifica las variables de estado del usuario.
   * `incrementPriceAsked(chatId)`: Cuenta si el usuario ha sido insistente con el precio.
   * `setLinkSent(chatId)` / `getLinkSent(chatId)`: Asegura que el link de calendario se manda solo una vez en el momento correcto.

## Fase 4: Enrutamiento de Mensajes y Factor Humano

Conectamos Whatsapp con la lógica y agregamos comportamientos humanos.

1. **El Gestor de Mensajes (`messageHandler.js`):**
   * Configurar en `index.js` que `client.on('message', ...)` ejecute una función exportada por `messageHandler.js`.
2. **Filtros de Seguridad:**
   * Ignorar mensajes de grupos (`msg.getChat().isGroup`).
   * Ignorar mensajes enviados por nosotros mismos en el celular (`msg.fromMe`).
   * Ignorar si el modo está en "manual".
3. **Factor Humano (Tipado dinámico):**
   * Crear la función `humanDelay(text)`: `Math.min(8000, Math.max(1500, text.length * 50))`.
   * Poner al bot "escribiendo..." visualmente con `chat.sendStateTyping()` antes de responder.

## Fase 5: El Cerebro IA y el Closer Agent

Integramos OpenAI y establecemos las barandillas de la personalidad y reglas de la venta.

1. **Configurar Cliente de OpenAI (`closer/closerAgent.js`):**
   * Instanciar `new OpenAI({ apiKey })`.
2. **El System Prompt Maestro:**
   * Crear una constante GIGANTE de texto con:
     * Personalidad (cálida, persuasiva, respuestas muy cortas).
     * Secuencia de venta prohibiciones (A. Hola y pedir país, B. Diagnóstico, C. Redirección o precio, D. Cierre a Calendario, E. Restricción estricta de retroceder).
     * El Catálogo de servicios en viñetas claras.
3. **Función de Completado:**
   * Programar `generateCloserResponse(history, newMessage)` pasándole el rol *system* y encadenándole el historial y el mensaje actual llamando a `gpt-5.4-mini`.
4. **Respuesta en Cadena:**
   * Ir al `messageHandler.js`: Guardar msg usuario -> Obtener historia -> Llamar AI -> Aplicar Delay de tipeo -> Enviar msg whatsapp -> Guardar msg AI. 

## Fase 6: Sistema de Alertas, Reportes e Inteligencia Avanzada (El "Ninja")

Aquí el bot se vuelve autónomo para reportarnos cierres inminentes o peligros sin que tengamos que abrir WhatsApp.

1. **Creación del Clasificador de Intención:**
   * En `closerAgent.js` crear `detectClientIntent()`. Una pequeñísima llamada AI paralela de 5 tokens (temp=0) que SOLO escanea el último mensaje para responder una de 4 palabras: `"VENTA"`, `"HUMANO"`, `"AGENDADO"`, `"NADA"`.
2. **Generador de Reportes Ejecutivos:**
   * Crear función `generateClientReport()` que le pida a la IA: *"Resume esta charla en Nombre, Negocio, Dolor y Solución"*.
3. **Notificador Automático (`notifier/notify.js`):**
   * Crear `notifyRoger(client, info)` para usar el mismo `cliente` de whatsapp y auto-enviarse a los números "Admin" (o al Grupo de Empresa) el resumen de emergencia.
4. **Conexión Final:**
   * En `messageHandler`, si `detectClientIntent` da `VENTA`, invocar a `notifyRoger` mandando *"Alerta: Cliente quiere el proceso ya"*.
   * Si da `AGENDADO`, lanzar la función de reporte para entregar el *"Resumen de lo que debes saber de este cliente para tu videollamada"*.

---
> [!NOTE]  
> Este es el mapa de ruta definitivo y probado de la lógica de Sofía. Al seguir este plan rigurosamente, logramos en menos de unas horas desde código vacío un bot cognitivo con retención histórica y alertas ejecutivas.
