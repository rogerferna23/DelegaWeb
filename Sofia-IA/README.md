# DelegaWeb — WhatsApp AI Closer Bot

Bot de IA que actúa como closer de ventas en WhatsApp para DelegaWeb.

## Estructura

```
whatsapp-bot/
├── index.js              # Punto de entrada — cliente WhatsApp
├── config.js             # Configuración global
├── messageHandler.js     # Lógica de manejo de mensajes
├── closer/
│   └── closerAgent.js    # IA con Gemini — prompt del closer
├── memory/
│   └── store.js          # SQLite — historial por chat
├── notifier/
│   └── notify.js         # Alertas a Roger por WhatsApp
├── data/                 # Base de datos SQLite (auto-generada)
├── .env                  # Variables de entorno (crear desde .env.example)
└── .gitignore
```

## Setup

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
Edita `.env` con:
- `OPENAI_API_KEY` — Obtén en https://platform.openai.com/api-keys
- `MY_WHATSAPP_NUMBER` — Tu número con código de país (ej: `5219991234567`)
- `BOT_MODE` — `auto` (responde todo) o `manual` (solo loguea)

### 3. Arrancar el bot
```bash
npm start
```

La primera vez aparecerá un **QR** en la terminal. Escanéalo con tu WhatsApp desde:
`Ajustes → Dispositivos vinculados → Vincular un dispositivo`

La sesión se guarda automáticamente. Las siguientes veces no necesitas escanear el QR.

## Flujo del bot

1. **Diagnóstico** — Identifica el perfil del cliente (ECO & FUEGO / TU MARCA CON HUELLA / IMPACTO 360)
2. **Educación** — Explica qué hace Delega antes de proponer nada
3. **Recomendación** — Sugiere el producto principal + 1 complementario
4. **Cierre** — Regala la 🎁 Sesión Estratégica y de Propósito (Holman Global Group)

Cuando el cliente muestra señal de cierre, Roger recibe un **WhatsApp de alerta** automáticamente.
