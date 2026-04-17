// src/admin/utils/generarGuionDocx.js
// Genera un documento Word (.docx) con el formato profesional de guiones de video para Meta Ads
// Usa la librería 'docx' (npm install docx file-saver)

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak, PageNumber
} from 'docx';
import { saveAs } from 'file-saver';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE ESTILOS
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  primary: 'F97316',      // Naranja DelegaWeb
  dark: '1A1A2E',         // Fondo oscuro
  accent: '3B82F6',       // Azul
  green: '22C55E',        // Verde
  red: 'EF4444',          // Rojo
  gray: '6B7280',         // Gris texto
  grayLight: 'F3F4F6',   // Gris fondo claro
  white: 'FFFFFF',
  black: '111111',
  tableBorder: 'D1D5DB',
  tableHeader: 'F97316',
  tableHeaderText: 'FFFFFF',
  tableAlt: 'FFF7ED',     // Naranja muy suave para filas alternas
  tipBg: 'EFF6FF',        // Azul claro para tips
  ctaBg: 'FEF3C7',        // Amarillo suave para CTA
};

const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const PAGE_WIDTH = 12240; // US Letter
const PAGE_HEIGHT = 15840;
const MARGIN = 1440; // 1 inch
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 9360

// Anchos de columnas para la tabla de guión (3 columnas)
const COL_MOMENTO = 1800;
const COL_CAMARA = 3300;
const COL_GUION = CONTENT_WIDTH - COL_MOMENTO - COL_CAMARA; // 4260

const cellMargins = { top: 100, bottom: 100, left: 120, right: 120 };

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function emptyLine(spacing = 100) {
  return new Paragraph({ spacing: { after: spacing }, children: [] });
}

function titleParagraph(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({ text, bold: true, font: 'Arial', size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 28 : 24, color: COLORS.black })],
  });
}

function bodyText(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: options.color || COLORS.black, bold: options.bold || false, italics: options.italics || false })],
  });
}

function labelValue(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, font: 'Arial', size: 22, bold: true, color: COLORS.black }),
      new TextRun({ text: value, font: 'Arial', size: 22, color: COLORS.gray }),
    ],
  });
}

function bulletItem(text, emoji = '•') {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${emoji} `, font: 'Arial', size: 22, color: COLORS.primary }),
      new TextRun({ text, font: 'Arial', size: 22, color: COLORS.black }),
    ],
  });
}

function dividerLine() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary, space: 1 } },
    children: [],
  });
}

function highlightBox(emoji, title, description) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: CONTENT_WIDTH, type: WidthType.DXA },
            shading: { fill: COLORS.tipBg, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: `${emoji} ${title}`, font: 'Arial', size: 22, bold: true, color: COLORS.accent })],
              }),
              new Paragraph({
                children: [new TextRun({ text: description, font: 'Arial', size: 20, color: COLORS.gray })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// ═══════════════════════════════════════════════════════════════
// TABLA PRINCIPAL DEL GUIÓN (5 momentos)
// ═══════════════════════════════════════════════════════════════
function buildGuionTable(momentos) {
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        borders,
        width: { size: COL_MOMENTO, type: WidthType.DXA },
        shading: { fill: COLORS.tableHeader, type: ShadingType.CLEAR },
        margins: cellMargins,
        verticalAlign: 'center',
        children: [new Paragraph({ children: [new TextRun({ text: 'MOMENTO', font: 'Arial', size: 20, bold: true, color: COLORS.tableHeaderText })] })],
      }),
      new TableCell({
        borders,
        width: { size: COL_CAMARA, type: WidthType.DXA },
        shading: { fill: COLORS.tableHeader, type: ShadingType.CLEAR },
        margins: cellMargins,
        verticalAlign: 'center',
        children: [new Paragraph({ children: [new TextRun({ text: 'INDICACIÓN DE CÁMARA', font: 'Arial', size: 20, bold: true, color: COLORS.tableHeaderText })] })],
      }),
      new TableCell({
        borders,
        width: { size: COL_GUION, type: WidthType.DXA },
        shading: { fill: COLORS.tableHeader, type: ShadingType.CLEAR },
        margins: cellMargins,
        verticalAlign: 'center',
        children: [new Paragraph({ children: [new TextRun({ text: 'GUIÓN (LO QUE DICES)', font: 'Arial', size: 20, bold: true, color: COLORS.tableHeaderText })] })],
      }),
    ],
  });

  // Data rows
  const dataRows = momentos.map((m, i) => {
    const isAlt = i % 2 === 1;
    const fill = isAlt ? COLORS.tableAlt : COLORS.white;

    return new TableRow({
      children: [
        new TableCell({
          borders,
          width: { size: COL_MOMENTO, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [
            new Paragraph({ children: [new TextRun({ text: m.nombre || m.momento || '', font: 'Arial', size: 20, bold: true, color: COLORS.primary })] }),
            new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: m.tiempo || '', font: 'Arial', size: 18, color: COLORS.gray })] }),
          ],
        }),
        new TableCell({
          borders,
          width: { size: COL_CAMARA, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: m.indicacion_camara || m.lo_que_se_ve || '', font: 'Arial', size: 20, italics: true, color: COLORS.gray })] })],
        }),
        new TableCell({
          borders,
          width: { size: COL_GUION, type: WidthType.DXA },
          shading: { fill, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: m.guion || m.lo_que_dices || '', font: 'Arial', size: 20, color: COLORS.black })] })],
        }),
      ],
    });
  });

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [COL_MOMENTO, COL_CAMARA, COL_GUION],
    rows: [headerRow, ...dataRows],
  });
}

// ═══════════════════════════════════════════════════════════════
// CONSTRUIR SECCIONES DEL DOCUMENTO
// ═══════════════════════════════════════════════════════════════
function buildCoverPage(data, formData) {
  const marca = formData?.nombre || data?.marca || 'Mi Negocio';
  const children = [
    emptyLine(600),
    emptyLine(600),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: marca.toUpperCase(), font: 'Arial', size: 52, bold: true, color: COLORS.primary })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Guiones de Video para Meta Ads', font: 'Arial', size: 28, color: COLORS.gray })],
    }),
    emptyLine(200),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: `Generado por DelegaWeb — ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`, font: 'Arial', size: 20, color: COLORS.gray, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: 'Duración estimada por video: 50-60 segundos', font: 'Arial', size: 20, color: COLORS.gray })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
  return children;
}

function buildMejorasSection() {
  const mejoras = [
    { emoji: '⬆', titulo: 'ESTRUCTURA CLARA (5 BLOQUES)', desc: 'Cada guión tiene 5 momentos definidos: GANCHO → DOLOR → GIRO → OFERTA → CTA. Facilita grabación, edición y testeo A/B.' },
    { emoji: '⏱', titulo: 'DURACIÓN OPTIMIZADA PARA META', desc: 'Ajustado a 50-60 segundos de habla natural. Meta penaliza videos donde la retención cae antes de los 15 seg.' },
    { emoji: '🎯', titulo: 'GANCHOS DE ALTO IMPACTO', desc: 'Primeros 3-5 segundos diseñados para retener. Incluyen pausa dramática y texto en pantalla.' },
    { emoji: '📹', titulo: 'INDICACIONES DE CÁMARA', desc: 'Instrucciones de planos, B-roll y expresiones para cada momento. Video profesional sin equipo grande.' },
    { emoji: '🔥', titulo: 'CTA DIRECTO Y VISIBLE', desc: 'Cierre con pocas palabras, instrucción clara y texto en pantalla para quienes ven sin sonido.' },
    { emoji: '✍', titulo: 'LENGUAJE CONCISO Y PERSUASIVO', desc: 'Sin repeticiones. Tono auténtico pero afilado. Diferenciación clara del negocio.' },
  ];

  const children = [
    titleParagraph('MEJORAS APLICADAS A LOS GUIONES', HeadingLevel.HEADING_1),
    bodyText('A continuación se detallan las optimizaciones incluidas en cada guión:', { color: COLORS.gray }),
    emptyLine(100),
  ];

  mejoras.forEach((m) => {
    children.push(new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [new TextRun({ text: `${m.emoji} ${m.titulo}`, font: 'Arial', size: 22, bold: true, color: COLORS.primary })],
    }));
    children.push(new Paragraph({
      spacing: { after: 100 },
      indent: { left: 360 },
      children: [new TextRun({ text: m.desc, font: 'Arial', size: 20, color: COLORS.gray })],
    }));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

function buildVideoGuion(data, index, formData) {
  const children = [];

  // Título del guión
  children.push(titleParagraph(`GUIÓN #${index + 1}`, HeadingLevel.HEADING_1));

  // Metadata
  if (data.publico) children.push(labelValue('Público', data.publico));
  if (data.tono) children.push(labelValue('Tono', data.tono));
  if (data.duracion || data.duracion_estimada) children.push(labelValue('Duración', data.duracion || data.duracion_estimada));
  if (data.objetivo) children.push(labelValue('Objetivo', data.objetivo));
  if (formData?.servicio) children.push(labelValue('Servicio', formData.servicio));

  children.push(emptyLine(100));

  // Construir los momentos para la tabla
  const momentos = [];

  // Si la data viene del formato actual de la UI (gancho + secciones + cta)
  if (data.gancho && data.secciones) {
    momentos.push({
      nombre: 'GANCHO',
      tiempo: '0-3s',
      indicacion_camara: 'Primer plano, mirando fijo a cámara. Pausa dramática.',
      guion: data.gancho,
    });

    data.secciones.forEach((sec) => {
      momentos.push({
        nombre: sec.momento || 'DESARROLLO',
        tiempo: sec.tiempo || '',
        indicacion_camara: sec.lo_que_se_ve || '',
        guion: sec.lo_que_dices || '',
      });
    });

    if (data.cta || data.cierre) {
      momentos.push({
        nombre: 'CTA',
        tiempo: '',
        indicacion_camara: 'Plano cercano. Texto en pantalla con CTA visible.',
        guion: data.cta || data.cierre || '',
      });
    }
  }
  // Si la data viene con momentos ya estructurados
  else if (data.momentos) {
    data.momentos.forEach((m) => momentos.push(m));
  }

  // Tabla
  if (momentos.length > 0) {
    children.push(buildGuionTable(momentos));
  }

  children.push(emptyLine(200));

  // Texto en pantalla
  if (data.texto_en_pantalla) {
    children.push(highlightBox('📺', 'TEXTO EN PANTALLA SUGERIDO', data.texto_en_pantalla));
    children.push(emptyLine(100));
  }

  // Consejo de grabación
  if (data.tip_de_grabacion || data.consejo_grabacion) {
    children.push(highlightBox('🎬', 'CONSEJO DE GRABACIÓN', data.tip_de_grabacion || data.consejo_grabacion));
    children.push(emptyLine(100));
  }

  // Para testear
  if (data.para_testear) {
    children.push(highlightBox('🧪', 'PARA TESTEAR', data.para_testear));
    children.push(emptyLine(100));
  }

  // Hashtags
  if (data.hashtags_sugeridos && data.hashtags_sugeridos.length > 0) {
    children.push(new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({ text: '# Hashtags: ', font: 'Arial', size: 20, bold: true, color: COLORS.primary }),
        new TextRun({ text: data.hashtags_sugeridos.join('  '), font: 'Arial', size: 20, color: COLORS.gray }),
      ],
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

function buildCarouselGuion(data, index) {
  const children = [];

  children.push(titleParagraph(`CARRUSEL #${index + 1} — ${data.titulo_carrusel || ''}`, HeadingLevel.HEADING_1));
  children.push(emptyLine(100));

  if (data.slides && data.slides.length > 0) {
    // Header
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['SLIDE', 'FUNCIÓN', 'TEXTO IMAGEN', 'VISUAL'].map((h, i) => {
        const widths = [800, 1600, 3800, 3160];
        return new TableCell({
          borders,
          width: { size: widths[i], type: WidthType.DXA },
          shading: { fill: COLORS.tableHeader, type: ShadingType.CLEAR },
          margins: cellMargins,
          children: [new Paragraph({ children: [new TextRun({ text: h, font: 'Arial', size: 18, bold: true, color: COLORS.tableHeaderText })] })],
        });
      }),
    });

    const dataRows = data.slides.map((slide, i) => {
      const fill = i % 2 === 1 ? COLORS.tableAlt : COLORS.white;
      const widths = [800, 1600, 3800, 3160];
      return new TableRow({
        children: [
          new TableCell({
            borders, width: { size: widths[0], type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${slide.numero || i + 1}`, font: 'Arial', size: 20, bold: true, color: COLORS.primary })] })],
          }),
          new TableCell({
            borders, width: { size: widths[1], type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: slide.funcion || '', font: 'Arial', size: 18, bold: true, color: COLORS.accent })] })],
          }),
          new TableCell({
            borders, width: { size: widths[2], type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [
              new Paragraph({ children: [new TextRun({ text: slide.texto_imagen || '', font: 'Arial', size: 20, color: COLORS.black })] }),
              ...(slide.subtexto ? [new Paragraph({ spacing: { before: 40 }, children: [new TextRun({ text: slide.subtexto, font: 'Arial', size: 18, italics: true, color: COLORS.gray })] })] : []),
            ],
          }),
          new TableCell({
            borders, width: { size: widths[3], type: WidthType.DXA },
            shading: { fill, type: ShadingType.CLEAR }, margins: cellMargins,
            children: [new Paragraph({ children: [new TextRun({ text: slide.prompt_visual || '', font: 'Arial', size: 18, italics: true, color: COLORS.gray })] })],
          }),
        ],
      });
    });

    children.push(new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [800, 1600, 3800, 3160],
      rows: [headerRow, ...dataRows],
    }));
  }

  children.push(emptyLine(200));

  // Caption
  if (data.caption_sugerido) {
    children.push(titleParagraph('Caption para el post', HeadingLevel.HEADING_2));
    children.push(bodyText(data.caption_sugerido));
  }

  // Hashtags
  if (data.hashtags_sugeridos && data.hashtags_sugeridos.length > 0) {
    children.push(new Paragraph({
      spacing: { before: 100, after: 100 },
      children: [
        new TextRun({ text: 'Hashtags: ', font: 'Arial', size: 20, bold: true, color: COLORS.primary }),
        new TextRun({ text: data.hashtags_sugeridos.join('  '), font: 'Arial', size: 20, color: COLORS.accent }),
      ],
    }));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
}

function buildConfigMetaAds(formData) {
  const children = [
    titleParagraph('CONFIGURACIÓN RECOMENDADA EN META ADS', HeadingLevel.HEADING_1),
    emptyLine(100),
    labelValue('Objetivo de campaña', 'Mensajes (WhatsApp) o Tráfico con destino WhatsApp'),
    emptyLine(100),
    titleParagraph('Recomendaciones finales', HeadingLevel.HEADING_2),
    bulletItem('Sube los guiones como creativos dentro del mismo conjunto de anuncios.'),
    bulletItem('Meta distribuirá presupuesto automáticamente al que mejor funcione.'),
    bulletItem('Deja correr mínimo 5 días antes de tomar decisiones.'),
    bulletItem('SUBTÍTULOS: Añade siempre subtítulos al video (CapCut gratis).'),
    bulletItem('El 85% de los usuarios ven videos sin sonido.'),
  ];

  return children;
}

// ═══════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL: GENERAR Y DESCARGAR
// ═══════════════════════════════════════════════════════════════
export async function generarGuionDocx(resultData, generarType, formData) {
  const allChildren = [];

  // 1. Portada
  allChildren.push(...buildCoverPage(resultData, formData));

  // 2. Mejoras aplicadas
  allChildren.push(...buildMejorasSection());

  // 3. Contenido principal según tipo
  if (generarType === 'carrusel') {
    // Si es un solo carrusel
    if (resultData.slides) {
      allChildren.push(...buildCarouselGuion(resultData, 0));
    }
    // Si son múltiples
    else if (resultData.guiones) {
      resultData.guiones.forEach((g, i) => allChildren.push(...buildCarouselGuion(g, i)));
    }
  } else if (generarType === 'video_publicidad' || generarType === 'video_contenido') {
    // Si es un solo guión (formato actual: gancho + secciones)
    if (resultData.gancho || resultData.secciones) {
      allChildren.push(...buildVideoGuion(resultData, 0, formData));
    }
    // Si son múltiples guiones
    else if (resultData.guiones) {
      resultData.guiones.forEach((g, i) => allChildren.push(...buildVideoGuion(g, i, formData)));
    }
  } else if (generarType === 'optimizar') {
    // Optimización: mostrar análisis + guión optimizado
    if (resultData.analisis) {
      allChildren.push(titleParagraph('ANÁLISIS DEL GUIÓN ORIGINAL', HeadingLevel.HEADING_1));
      if (resultData.analisis.lo_que_funciona) {
        allChildren.push(new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '✅ Lo que funciona: ', font: 'Arial', size: 22, bold: true, color: COLORS.green })],
        }));
        allChildren.push(bodyText(resultData.analisis.lo_que_funciona));
      }
      if (resultData.analisis.lo_que_mejorar) {
        allChildren.push(new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: '❌ Lo que mejorar: ', font: 'Arial', size: 22, bold: true, color: COLORS.red })],
        }));
        allChildren.push(bodyText(resultData.analisis.lo_que_mejorar));
      }
      if (resultData.analisis.cambios_principales) {
        allChildren.push(highlightBox('🔧', 'Cambios principales realizados', resultData.analisis.cambios_principales));
      }
      allChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }

    const optimizado = resultData.carrusel_optimizado || resultData.guion_optimizado;
    if (optimizado) {
      allChildren.push(titleParagraph('RESULTADO OPTIMIZADO', HeadingLevel.HEADING_1));
      if (resultData.carrusel_optimizado) {
        allChildren.push(...buildCarouselGuion(optimizado, 0));
      } else {
        allChildren.push(...buildVideoGuion(optimizado, 0, formData));
      }
    }
  }

  // 4. Configuración Meta Ads
  allChildren.push(...buildConfigMetaAds(formData));

  // 5. Crear documento
  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: COLORS.black },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: COLORS.black },
          paragraph: { spacing: { before: 180, after: 160 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'DelegaWeb — Guiones IA', font: 'Arial', size: 16, color: COLORS.gray, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Página ', font: 'Arial', size: 16, color: COLORS.gray }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: COLORS.gray }),
            ],
          })],
        }),
      },
      children: allChildren,
    }],
  });

  // 6. Generar y descargar
  const buffer = await Packer.toBlob(doc);
  const fileName = `guion-${formData?.nombre?.toLowerCase().replace(/\s+/g, '-') || 'delegaweb'}-${Date.now()}.docx`;
  saveAs(buffer, fileName);

  return fileName;
}