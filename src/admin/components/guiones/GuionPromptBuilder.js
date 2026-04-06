export const buildGuionPrompt = (formData, generarType, estructura, tono, originalText = '', objetivoOptimizacion = '') => {

  const systemPrompt = `Eres un experto en copywriting, marketing digital y creación de contenido para redes sociales. Tu especialidad es crear guiones para videos cortos (30-60 segundos) y estructuras de carruseles/imágenes que CONVIERTEN.

Reglas que SIEMPRE sigues:
1. El gancho de los primeros 3 segundos es lo más importante. Debe detener el scroll inmediatamente.
2. Usas lenguaje conversacional, directo, como si hablaras con un amigo. Nada de lenguaje corporativo ni formal.
3. Cada frase debe tener un propósito: o engancha, o genera emoción, o vende.
4. Los CTA son claros, directos y urgentes.
5. Adaptas el tono según lo que te pidan.
6. NUNCA uses clichés como "¿Sabías que...?", "En el mundo actual...", "Hoy en día...", "¿Te ha pasado que...?".
7. Los guiones deben sentirse naturales al hablarlos en voz alta.
8. Siempre piensas en formato vertical (9:16) para Reels, TikTok, Shorts.
9. También eres experto en tomar guiones existentes y transformarlos en guiones profesionales optimizados, manteniendo la esencia original pero mejorando: estructura, gancho, ritmo, lenguaje persuasivo y CTA.

Tu respuesta SIEMPRE debe ser en formato JSON válido, sin markdown, sin backticks, sin texto antes ni después, solo el JSON puro.`;

  const tonos = {
    urgente: `TONO: Urgente. Frases cortas y directas. Genera escasez y FOMO. Palabras como "ahora", "última oportunidad", "no esperes más", "cada día que pasa pierdes...". Ritmo rápido y punzante.`,
    cercano: `TONO: Cercano y amigable. Habla como un amigo que da un consejo sincero. Tutea, sé empático. "Mira, te voy a ser honesto...", "esto me hubiera encantado saber antes...", "te entiendo porque...". Cálido pero profesional.`,
    profesional: `TONO: Profesional y con autoridad. Confianza y conocimiento. Usa datos cuando puedas. Evita slang. Directo pero elegante. Posiciónate como experto indiscutible. Inspira confianza y seriedad.`,
    provocador: `TONO: Provocador y polémico. Reta al espectador. "La verdad que nadie te dice...", "vas a odiar escuchar esto pero...", "el 90% hace esto mal...". Incomodidad constructiva. Descaro con verdad útil.`
  };

  const currentTono = tonos[tono] || tonos.profesional;

  const infoNegocio = `
INFORMACIÓN DEL NEGOCIO:
- Negocio: ${formData.nombre}
- Servicio: ${formData.servicio}
- Cliente ideal: ${formData.cliente}
- Problema que resuelve: ${formData.problema}
- Resultado que da: ${formData.resultado}
`;

  let userPrompt = '';

  if (generarType === 'optimizar') {
    if (objetivoOptimizacion === 'carrusel') {
      userPrompt = `Tengo un texto/guión existente que necesito que transformes en un carrusel profesional optimizado.
${infoNegocio}
TEXTO/GUIÓN ORIGINAL DEL USUARIO:
"""
${originalText}
"""
OBJETIVO: Carrusel / Imágenes
${currentTono}

INSTRUCCIONES:
1. Analiza el texto original: qué funciona y qué mejorar
2. Transforma el contenido en un carrusel de 6-9 slides optimizado
3. Cada slide: texto corto e impactante (máximo 15 palabras)
4. Incluye prompts visuales coherentes para generar imágenes con IA
5. Gancho fuerte en slide 1 y CTA claro al final

Responde ÚNICAMENTE con este JSON:
{
  "analisis": {
    "lo_que_funciona": "Qué del texto original está bien",
    "lo_que_mejorar": "Qué necesita mejorar para funcionar como carrusel",
    "cambios_principales": "Los cambios más importantes"
  },
  "carrusel_optimizado": {
    "titulo_carrusel": "Título general",
    "slides": [
      {
        "numero": 1,
        "funcion": "Gancho / Desarrollo / CTA",
        "texto_imagen": "Texto encima de la imagen",
        "subtexto": "Texto secundario (puede ser vacío)",
        "prompt_visual": "Descripción para generar imagen con IA",
        "formato": "1080x1080 (Feed)"
      }
    ],
    "caption_sugerido": "Caption del post",
    "hashtags_sugeridos": ["hashtag1", "hashtag2", "hashtag3"]
  },
  "nivel_de_mejora": "70%"
}`;
    } else {
      userPrompt = `Tengo un guión existente que necesito que optimices y mejores profesionalmente.
${infoNegocio}
GUIÓN ORIGINAL DEL USUARIO:
"""
${originalText}
"""
OBJETIVO: ${objetivoOptimizacion === 'venta' ? 'Video de venta' : 'Video de contenido'}
${currentTono}

INSTRUCCIONES:
1. Analiza el guión original: qué funciona bien y qué necesita mejorar
2. Reescribe el guión completo manteniendo la idea central del usuario
3. Mejora el gancho para que detenga el scroll en los primeros 3 segundos
4. Optimiza la estructura para un flujo persuasivo lógico
5. Mejora el lenguaje: más directo, emocional y conversacional
6. Agrega o mejora el CTA
7. Ajusta el tono según lo indicado
8. Asegura que se pueda grabar en 30-60 segundos

Responde ÚNICAMENTE con este JSON:
{
  "analisis": {
    "lo_que_funciona": "Qué aspectos del guión original están bien y por qué",
    "lo_que_mejorar": "Qué necesita mejorar y por qué no funciona como está",
    "cambios_principales": "Los 3-5 cambios más importantes que hiciste"
  },
  "guion_optimizado": {
    "gancho": "El nuevo gancho mejorado",
    "secciones": [
      {
        "momento": "Nombre del momento",
        "lo_que_dices": "El texto optimizado",
        "lo_que_se_ve": "Indicaciones visuales"
      }
    ],
    "cta": "CTA optimizado",
    "texto_en_pantalla": "Texto overlay sugerido",
    "duracion_estimada": "~X segundos",
    "tip_de_grabacion": "Consejo de grabación"
  },
  "nivel_de_mejora": "Porcentaje estimado de mejora"
}`;
    }
  } 
  else if (generarType === 'video_publicidad') {
    let estructuraInst = '';
    if (estructura === 'pas') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Menciona el problema de forma directa y dolorosa en los primeros 3 segundos\n2. PROBLEMA: Describe la situación actual del cliente ideal\n3. AGITACIÓN: Haz que el problema se sienta más grande, más urgente\n4. SOLUCIÓN: Presenta el servicio como la solución perfecta\n5. CTA: Llamado a la acción urgente y claro`;
    if (estructura === 'aida') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Captura la atención con algo impactante\n2. ATENCIÓN: Amplía el gancho\n3. INTERÉS: Muestra datos que generen curiosidad\n4. DESEO: Pinta cómo sería su vida con el resultado\n5. ACCIÓN: CTA claro y directo`;
    if (estructura === 'bab') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Describe la situación "antes"\n2. ANTES: Profundiza en la situación actual dolorosa\n3. DESPUÉS: Muestra su vida después de resolver el problema\n4. PUENTE: Revela que el servicio es el puente\n5. CTA: Invita a dar el primer paso`;
    if (estructura === 'fab') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Menciona una característica llamativa del servicio\n2. CARACTERÍSTICA: Explica qué incluye\n3. VENTAJA: Explica por qué es mejor\n4. BENEFICIO: Resultado tangible\n5. CTA: Enfocado en el beneficio`;
    if (estructura === 'gancho') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Promesa fuerte de resultado en los primeros 3 segundos\n2. PROMESA: Amplía con números\n3. PRUEBA: Respalda con dato o testimonio\n4. OFERTA: Qué van a obtener\n5. CTA: Urgencia limitada`;
    if (estructura === 'testimonio') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Empieza como cliente contando experiencia\n2. RESULTADO: El cliente cuenta su resultado\n3. CÓMO LO LOGRÓ: Qué hizo\n4. EL SERVICIO: Lo menciona como la clave\n5. CTA: Invita a probarlo`;
    if (estructura === 'contraste') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: "El X% hacen esto mal..."\n2. LO QUE HACEN MAL: Describe el error común\n3. POR QUÉ NO FUNCIONA: Breve explicación\n4. TU MÉTODO: Alternativa inteligente\n5. CTA: "Deja de perder tiempo y haz esto"`;
    if (estructura === 'pregunta') estructuraInst = `Sigue esta estructura exacta:\n1. GANCHO: Pregunta incómoda o provocadora\n2. DATO/VERDAD: Responde con dato impactante\n3. CONSECUENCIA: Qué pasa si ignoran\n4. SOLUCIÓN: El servicio como respuesta\n5. CTA: Actuar por urgencia`;

    userPrompt = `Genera un guión de video publicitario de 30-60 segundos para vender un servicio.
${infoNegocio}
ESTRUCTURA: ${estructura}
${estructuraInst}

${currentTono}

Responde ÚNICAMENTE con este JSON:
{
  "gancho": "El texto del gancho (primeros 3 segundos, máximo 2 frases cortas)",
  "secciones": [
    {
      "momento": "Nombre del momento (ej: Problema, Agitación, Solución, etc.)",
      "lo_que_dices": "El texto exacto que se dice en cámara",
      "lo_que_se_ve": "Descripción de lo que se muestra en pantalla"
    }
  ],
  "cta": "El llamado a la acción final",
  "texto_en_pantalla": "Texto overlay sugerido",
  "duracion_estimada": "Ej: ~40 segundos",
  "tip_de_grabacion": "Un consejo práctico para grabar este guión"
}`;
  } 
  else if (generarType === 'video_contenido') {
    let estructuraInst = '';
    if (estructura === 'educativo_vid') estructuraInst = `1. GANCHO: "X errores que cometes al..." o afirmación sorprendente\n2. CONTEXTO: Por qué es importante\n3. ENSEÑANZA 1: Primer punto de valor\n4. ENSEÑANZA 2: Segundo punto\n5. ENSEÑANZA 3: Tercer punto\n6. CIERRE: Invita a seguir (No ventas directas)`;
    if (estructura === 'storytelling') estructuraInst = `1. GANCHO: Empieza en medio de la acción\n2. SITUACIÓN: Establece el contexto\n3. CONFLICTO: El problema que apareció\n4. PUNTO DE GIRO: Qué se hizo diferente\n5. RESULTADO: Cómo terminó\n6. LECCIÓN: Qué se aprende (Historia creíble)`;
    if (estructura === 'rompe_mitos') estructuraInst = `1. GANCHO: "Te mintieron sobre..."\n2. EL MITO: Creencia errónea\n3. POR QUÉ ES FALSO: Evidencia o razonamiento\n4. LA VERDAD: Lo que funciona\n5. PRUEBA: Ejemplo o dato\n6. CIERRE: Módulo de debate o share`;
    if (estructura === 'detras_camaras') estructuraInst = `1. GANCHO: "Te voy a mostrar cómo hago X..."\n2. SETUP: Qué vas a mostrar y por qué\n3. PROCESO PASO 1: Primer detalle\n4. PROCESO PASO 2: Segundo detalle\n5. RESULTADO: Final del proceso\n6. CIERRE: Reflexión`;
    if (estructura === 'dato_impactante') estructuraInst = `1. GANCHO: Dato estadístico sorprendente\n2. CONTEXTO DEL DATO: De dónde sale\n3. QUÉ SIGNIFICA: Traduce al mundo real\n4. QUÉ HACER: Consejo práctico\n5. CIERRE: Invita a compartir`;
    if (estructura === 'lista_rapida') estructuraInst = `1. GANCHO: "X cosas que debes saber..."\n2. ITEM 1: Corto y directo\n3. ITEM 2: Segundo punto\n4. ITEM 3: Más fuerte o sorprendente\n5. BONUS: Tip extra\n6. CIERRE: "Guarda esto"`;
    if (estructura === 'comparativa') estructuraInst = `1. GANCHO: "X vs Y: ¿cuál es mejor?"\n2. OPCIÓN A: Pros y contras\n3. OPCIÓN B: Pros y contras\n4. VEREDICTO: Tu opinión experta\n5. CIERRE: ¿Tú cuál prefieres?`;
    if (estructura === 'prediccion') estructuraInst = `1. GANCHO: "Esto va a cambiar tu industria..."\n2. TENDENCIA: Qué viene\n3. EVIDENCIA: Señales de que ya pasa\n4. IMPACTO: Cómo afecta al cliente ideal\n5. QUÉ HACER: Consejo\n6. CIERRE: Urgencia y exclusividad`;

    userPrompt = `Genera un guión de video de contenido orgánico de 30-60 segundos para posicionar marca y atraer clientes. NO es un video de venta directa.
${infoNegocio}
ESTRUCTURA: ${estructura}
Sigue esta estructura exacta:
${estructuraInst}

${currentTono}

Responde ÚNICAMENTE con este JSON:
{
  "gancho": "El texto del gancho (primeros 3 segundos)",
  "secciones": [
    {
      "momento": "Nombre del momento",
      "lo_que_dices": "El texto exacto que se dice en cámara",
      "lo_que_se_ve": "Descripción de lo que se muestra en pantalla"
    }
  ],
  "cierre": "Frase de cierre que invita a seguir, guardar o comentar (NO venta directa)",
  "texto_en_pantalla": "Texto overlay sugerido",
  "duracion_estimada": "Ej: ~45 segundos",
  "tip_de_grabacion": "Un consejo práctico para grabar este guión",
  "hashtags_sugeridos": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;
  } 
  else if (generarType === 'carrusel') {
    let estructuraInst = '';
    if (estructura === 'venta') estructuraInst = `- Slide 1: GANCHO visual potente\n- Slide 2-3: DOLOR\n- Slide 4-5: SOLUCIÓN\n- Slide 6: PRUEBA SOCIAL\n- Slide 7: OFERTA\n- Slide 8: CTA`;
    if (estructura === 'educativo') estructuraInst = `- Slide 1: GANCHO con tema educativo\n- Slide 2: CONTEXTO\n- Slide 3-7: UN TIP/PASO POR SLIDE\n- Slide 8: RESUMEN\n- Slide 9: CIERRE con autoridad`;
    if (estructura === 'exito') estructuraInst = `- Slide 1: GANCHO con resultado impactante\n- Slide 2: ANTES\n- Slide 3: EL PROBLEMA PRINCIPAL\n- Slide 4: QUÉ SE HIZO\n- Slide 5: RESULTADOS concretos\n- Slide 6: TESTIMONIO\n- Slide 7: CTA`;
    if (estructura === 'mitos') estructuraInst = `- Slide 1: GANCHO polémico\n- Slide 2-3: EL MITO explicado\n- Slide 4-5: LA VERDAD\n- Slide 6: QUÉ HACER en su lugar\n- Slide 7: TU SOLUCIÓN\n- Slide 8: CTA`;
    if (estructura === 'checklist') estructuraInst = `- Slide 1: GANCHO título checklist\n- Slide 2-8: UN ÍTEM POR SLIDE ✅/❌\n- Slide final: CIERRE + CTA`;
    if (estructura === 'pasoapaso') estructuraInst = `- Slide 1: GANCHO "Cómo lograr..."\n- Slide 2: EL PROBLEMA\n- Slides 3-6: PASOS\n- Slide 7: RESULTADO FINAL\n- Slide 8: CTA`;
    if (estructura === 'pyR') estructuraInst = `- Slide 1: PREGUNTA grande\n- Slide 2: CONTEXTO\n- Slide 3-4: RESPUESTA\n- Slide 5: INSIGHT EXTRA\n- Slide 6: RESUMEN\n- Slide 7: CTA`;
    if (estructura === 'transformacion') estructuraInst = `- Slide 1: GANCHO resultado\n- Slide 2: ESTADO ACTUAL\n- Slide 3: OBSTÁCULOS\n- Slide 4: DECISIÓN\n- Slide 5: MÉTODO\n- Slide 6: PRIMEROS RESULTADOS\n- Slide 7: RESULTADO COMPLETO\n- Slide 8: CTA`;

    userPrompt = `Genera la estructura completa de un carrusel para redes sociales.
${infoNegocio}
ESTRUCTURA: ${estructura}
Genera un carrusel con esta estructura (textos CORTOS de max 10-15 palabras por slide):
${estructuraInst}

${currentTono}

Responde ÚNICAMENTE con este JSON:
{
  "titulo_carrusel": "Título general del carrusel",
  "slides": [
    {
      "numero": 1,
      "funcion": "Gancho / Desarrollo / CTA / etc.",
      "texto_imagen": "El texto exacto que va ENCIMA de la imagen (corto, máximo 15 palabras)",
      "subtexto": "Texto secundario más pequeño (opcional, puede ser vacío)",
      "prompt_visual": "Descripción detallada para generar la imagen con IA. Incluye estilo y mood. Coherente entre slides.",
      "formato": "1080x1080 (Feed)"
    }
  ],
  "caption_sugerido": "Texto sugerido para el caption del post",
  "hashtags_sugeridos": ["hash1", "hash2", "hash3"]
}`;
  }

  return { systemPrompt, userPrompt };
};
