interface GuionFormData {
  nombre: string;
  servicio: string;
  cliente: string;
  problema: string;
  resultado: string;
}

export type GenerarType = 'generar' | 'optimizar';

type Tono = 'urgente' | 'cercano' | 'profesional' | 'provocador';

type Estructura =
  | 'pas'
  | 'aida'
  | 'bab'
  | 'fab'
  | 'gancho'
  | 'testimonio'
  | 'contraste'
  | 'pregunta';

interface GuionPromptResult {
  systemPrompt: string;
  userPrompt: string;
}

export const buildGuionPrompt = (
  formData: GuionFormData,
  generarType: GenerarType,
  estructura: Estructura,
  tono: Tono,
  originalText = '',
  objetivoOptimizacion = '',
): GuionPromptResult => {

  const systemPrompt = `Eres un copywriter de élite especializado en guiones de video para Meta Ads (Facebook e Instagram). Tu único objetivo es generar guiones que conviertan desconocidos en clientes. Cada palabra debe justificar su existencia: si no vende, se elimina.

REGLAS INQUEBRANTABLES:
1. El guión es para un video de Meta Ads. Formato vertical (9:16). Duración: 30-60 segundos (150-250 palabras máximo).
2. LOS PRIMEROS 3 SEGUNDOS SON VIDA O MUERTE. El gancho debe detener el scroll inmediatamente mediante afirmaciones contraintuitivas, preguntas de dolor real, datos rompe-creencias o provocaciones directas.
3. No uses jerga de marketing (funnel, lead magnet, etc.). Habla en el idioma del dolor y deseo del cliente.
4. Antes de generar, analiza internamente: quién es el avatar, qué le quita el sueño y qué necesita escuchar para actuar HOY.
5. El guión debe sentirse natural al grabarse y hablarse en voz alta.

Tu respuesta SIEMPRE debe ser en formato JSON válido, sin markdown, sin backticks, sin texto antes ni después, solo el JSON puro.`;

  const tonos: Record<Tono, string> = {
    urgente: `TONO (Urgente & Directo): Frases cortas. Ritmo rápido. Sensación de "actúa ahora o pierde". Usa escasez, plazos y consecuencias de no actuar.`,
    cercano: `TONO (Cercano & Amigable): Habla como un amigo que sabe del tema. Usa lenguaje natural, ejemplos cotidianos y empatía genuina. Sin sonar como vendedor.`,
    profesional: `TONO (Profesional & Autoridad): Habla como un experto reconocido. Datos concretos, frases con peso, sin palabras de relleno. Transmite confianza y dominio total del tema.`,
    provocador: `TONO (Provocador & Polémico): Reta creencias. Polariza. Haz que sientan que los han engañado o que lo hacen mal. Genera reacción emocional fuerte.`,
  };

  const currentTono = tonos[tono] || tonos.profesional;

  const infoNegocio = `
DATOS DEL NEGOCIO:
- Negocio: ${formData.nombre}
- Servicio: ${formData.servicio}
- Cliente ideal: ${formData.cliente}
- Problema que resuelve: ${formData.problema}
- Resultado que logra: ${formData.resultado}
`;

  const estructurasInst: Record<Estructura, string> = {
    pas: 'PAS: Problema (escena dolorosa y específica) → Agitación (consecuencias de no actuar, amplificar la emoción) → Solución (presentar la oferta como el puente lógico).',
    aida: 'AIDA: Atención (gancho disruptivo) → Interés (dato, historia o revelación) → Deseo (pintar el resultado transformador) → Acción (CTA urgente y claro).',
    bab: 'BAB: Antes (realidad actual frustrante) → Después (vida tras resolver el problema) → Puente (el producto/servicio como el camino).',
    fab: 'FAB: Feature (qué es) → Advantage (por qué es diferente) → Benefit (qué gana emocionalmente el cliente).',
    gancho: 'Gancho Directo: Oferta desde el segundo 1. Sin rodeos. Estructura: Oferta → Beneficio → Prueba rápida → CTA.',
    testimonio: 'Testimonio: Narrar caso de éxito. Situación anterior → Descubrimiento → Transformación → Invitación.',
    contraste: "Contraste: Lo que hacen todos mal vs lo que funciona. Estructura: 'Lo que hacen todos' → Por qué falla → 'Lo que nosotros hacemos' → Resultado → CTA.",
    pregunta: 'Pregunta Fuerte: Abrir con pregunta incómoda que el avatar no puede ignorar. Estructura: Pregunta → Desarrollo → Solución → CTA.',
  };

  let userPrompt = '';

  if (generarType === 'optimizar') {
    userPrompt = `Optimiza profesionalmente este guión siguiendo las reglas de Copywriter de Élite.
${infoNegocio}
GUIÓN ORIGINAL:
"""
${originalText}
"""
ESTRUCTURA OBJETIVO: ${objetivoOptimizacion.toUpperCase()}
${currentTono}

INSTRUCCIONES:
1. Mejora el gancho para que sea disruptivo (Mecánica: escarnio de error o promesa de resultado).
2. Elimina palabras de relleno y jerga.
3. Asegura que el CTA sea específico y accionable.

Responde con este JSON:
{
  "analisis": {
    "lo_que_funciona": "Aspectos positivos",
    "lo_que_mejorar": "Puntos críticos",
    "cambios_principales": "3 cambios clave"
  },
  "guion_optimizado": {
    "gancho": "NUEVO GANCHO (0-3 seg)",
    "secciones": [
      {
        "momento": "DESARROLLO (3-25 seg)",
        "lo_que_dices": "Cuerpo del guión optimizado",
        "lo_que_se_ve": "Indicación visual"
      }
    ],
    "cta": "CIERRE + CTA (25-35 seg)",
    "texto_en_pantalla": "Frases cortas overlay",
    "duracion_estimada": "~X seg",
    "tip_de_grabacion": "NOTAS DE PRODUCCIÓN (entorno, energía, ritmo)"
  },
  "nivel_de_mejora": "70%+"
}`;
  } else {
    userPrompt = `Genera un guión de Élite para un video de Meta Ads.
${infoNegocio}
ESTRUCTURA ELEGIDA: ${estructurasInst[estructura] || estructurasInst.pas}
${currentTono}

INSTRUCCIONES DE ENTREGA:
1. Genera un gancho disruptivo de 0-3 segundos.
2. Desarrolla el cuerpo del guión (3-25 seg) siguiendo fielmente la estructura.
3. El cierre debe incluir un CTA claro y una razón para actuar hoy.

Responde ÚNICAMENTE con este JSON:
{
  "gancho": "🎬 GANCHO (0-3 seg): [Texto exacto + indicación visual]",
  "secciones": [
    {
      "momento": "🔥 DESARROLLO (3-25 seg)",
      "lo_que_dices": "Cuerpo del guión persuasivo",
      "lo_que_se_ve": "Indicaciones visuales detalladas"
    }
  ],
  "cta": "💰 CIERRE + CTA (25-35 seg): [Remate persuasivo + llamado a la acción]",
  "texto_en_pantalla": "📝 TEXTO EN PANTALLA SUGERIDO",
  "duracion_estimada": "~X segundos",
  "tip_de_grabacion": "🎯 NOTAS DE PRODUCCIÓN (entorno, energía, ritmo, recurso visual)"
}`;
  }

  return { systemPrompt, userPrompt };
};
