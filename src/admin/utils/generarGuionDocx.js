import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  Header, 
  Footer, 
  AlignmentType, 
  BorderStyle,
  VerticalAlign,
  HeadingLevel,
  PageNumber,
  NumberFormat
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Genera un documento Word profesional a partir de los datos de un guion de IA.
 * Procesa tanto videos (PAS, AIDA, etc) como carruseles y optimizaciones.
 */
export const generarGuionDocx = async (resultData, generarType, formData) => {
  // Detectar si es optimización y extraer la data real
  const isOptimized = !!resultData.analisis;
  const contentData = isOptimized 
    ? (resultData.guion_optimizado || resultData.carrusel_optimizado) 
    : resultData;
  const contentIsCarrusel = !!contentData.slides;

  // 1. Configuración de Estilos y Colores
  const TEXT_PRIMARY = "f97316"; // Naranja Delega
  const TEXT_DARK = "111827";
  const TEXT_GRAY = "4b5563";

  // 2. Definición del Header y Footer (aparecen en todas las páginas)
  const header = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: "DelegaWeb — Guiones IA ",
            bold: true,
            color: TEXT_PRIMARY,
            size: 20
          }),
          new TextRun({
            text: "| Copyright © 2024",
            color: TEXT_GRAY,
            size: 18
          })
        ]
      })
    ]
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: ["Página ", PageNumber.CURRENT],
            color: TEXT_GRAY,
            size: 18
          })
        ]
      })
    ]
  });

  // 3. SECCIÓN 1: Portada
  const seccionesDocumento = [
    new Paragraph({
      text: "PLAN ESTRATÉGICO DE PUBLICIDAD",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 400 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `NEGOCIO: ${formData.nombre.toUpperCase()}`,
          bold: true,
          size: 32,
          color: TEXT_PRIMARY
        })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Servicio: ${formData.servicio}`,
          italic: true,
          size: 24,
          color: TEXT_GRAY
        })
      ],
      spacing: { after: 800 }
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "TIPO DE CONTENIDO", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: generarType.replace('_', ' ').toUpperCase() })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "FECHA DE CREACIÓN", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: new Date().toLocaleDateString() })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "DURACIÓN ESTIMADA", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: contentData.duracion_estimada || "N/A" })] }),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { before: 1000 } }) // Espacio
  ];

  // 4. SECCIÓN 2: Análisis (Solo si es optimización)
  if (isOptimized && resultData.analisis) {
    seccionesDocumento.push(
      new Paragraph({ text: "I. ANÁLISIS DE MEJORAS", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
      new Paragraph({
        children: [
          new TextRun({ text: "✓ Lo que funciona: ", bold: true, color: "16a34a" }),
          new TextRun({ text: resultData.analisis.lo_que_funciona })
        ],
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "⚠ Lo que se mejoró: ", bold: true, color: "dc2626" }),
          new TextRun({ text: resultData.analisis.lo_que_mejorar })
        ],
        spacing: { after: 120 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "✨ Cambios Clave: ", bold: true, color: TEXT_PRIMARY }),
          new TextRun({ text: resultData.analisis.cambios_principales })
        ],
        spacing: { after: 400 }
      })
    );
  }

  // 5. SECCIÓN 3: El Guión / Carrusel (Tabla de Producción)
  seccionesDocumento.push(
    new Paragraph({ 
      text: contentIsCarrusel ? "II. ESTRUCTURA DE SLIDES (CARRUSEL)" : "II. GUION DE PRODUCCIÓN", 
      heading: HeadingLevel.HEADING_2, 
      spacing: { after: 200 } 
    })
  );

  if (contentIsCarrusel) {
    // TABLA PARA CARRUSEL
    const cRows = [
      new TableRow({
        children: [
          new TableCell({ width: {size: 10, type: WidthType.PERCENTAGE}, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ text: "Slide", bold: true, alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
          new TableCell({ width: {size: 45, type: WidthType.PERCENTAGE}, children: [new Paragraph({ text: "Visual / Prompt", bold: true })], shading: { fill: "f3f4f6" } }),
          new TableCell({ width: {size: 45, type: WidthType.PERCENTAGE}, children: [new Paragraph({ text: "Texto en Imagen", bold: true })], shading: { fill: "f3f4f6" } }),
        ]
      })
    ];

    contentData.slides.forEach(slide => {
      cRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: slide.numero?.toString() || "-", alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [
            new Paragraph({ text: `Función: ${slide.funcion}`, bold: true, size: 16 }),
            new Paragraph({ text: slide.prompt_visual, italic: true, size: 18, color: TEXT_GRAY })
          ] }),
          new TableCell({ children: [
            new Paragraph({ text: slide.texto_imagen, bold: true }),
            new Paragraph({ text: slide.subtexto || "", size: 18 })
          ] }),
        ]
      }));
    });

    seccionesDocumento.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: cRows }));
    
    if (contentData.caption_sugerido) {
      seccionesDocumento.push(
        new Paragraph({ text: "CAPTION / COPY PARA EL POST", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 } }),
        new Paragraph({ text: contentData.caption_sugerido, size: 20, spacing: { after: 200 } })
      );
    }
  } else {
    // TABLA PARA VIDEO (GANCHO + SECCIONES + CTA)
    const vRows = [
      new TableRow({
        children: [
          new TableCell({ width: {size: 15, type: WidthType.PERCENTAGE}, children: [new Paragraph({ text: "MOMENTO", bold: true, alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" } }),
          new TableCell({ width: {size: 40, type: WidthType.PERCENTAGE}, children: [new Paragraph({ text: "INDICACIÓN DE CÁMARA", bold: true })], shading: { fill: "f3f4f6" } }),
          new TableCell({ width: {size: 45, type: WidthType.PERCENTAGE}, children: [new Paragraph({ text: "GUION (LO QUE DICES)", bold: true })], shading: { fill: "f3f4f6" } }),
        ]
      }),
      // El Gancho
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "GANCHO (0-3s)", bold: true, color: "dc2626" })] }),
          new TableCell({ children: [new Paragraph({ text: "Escena disruptiva para frenar el scroll.", italic: true, size: 16 })] }),
          new TableCell({ children: [new Paragraph({ text: contentData.gancho })] }),
        ]
      })
    ];

    // Secciones cuerpo
    contentData.secciones.forEach(sec => {
      vRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: sec.momento, size: 16, bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: sec.lo_que_se_ve, italic: true, size: 18, color: TEXT_GRAY })] }),
          new TableCell({ children: [new Paragraph({ text: sec.lo_que_dices })] }),
        ]
      }));
    });

    // El CTA
    vRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "CIERRE", bold: true, color: TEXT_PRIMARY })] }),
        new TableCell({ children: [new Paragraph({ text: "Llamado a la acción claro.", italic: true, size: 16 })] }),
        new TableCell({ children: [new Paragraph({ text: contentData.cta || contentData.cierre })] }),
      ]
    }));

    seccionesDocumento.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: vRows }));
    
    if (contentData.texto_en_pantalla) {
      seccionesDocumento.push(
        new Paragraph({ text: "OVERLAY / TEXTOS EN PANTALLA SUGERIDOS", heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 } }),
        new Paragraph({ text: contentData.texto_en_pantalla, italic: true })
      );
    }
  }

  // 6. SECCIÓN 4: Tips y Config Ads
  seccionesDocumento.push(
    new Paragraph({ text: "III. CONFIGURACIÓN RECOMENDADA META ADS", heading: HeadingLevel.HEADING_2, spacing: { before: 800, after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "OBJETIVO", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Ventas o Clientes Potenciales" })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "UBICACIONES", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Reels, Stories, Feed (Advantage+)" })] }),
          ]
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: "CONSEJO", bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: "Sube este video con subtítulos dinámicos integrados." })] }),
          ]
        })
      ]
    }),
    new Paragraph({ text: "", spacing: { after: 200 } }),
    new Paragraph({
      children: [
        new TextRun({ text: "💡 Tip de Producción: ", bold: true, color: TEXT_PRIMARY }),
        new TextRun({ text: contentData.tip_de_grabacion || "Asegúrate de tener buena luz y sonido limpio." })
      ]
    })
  );

  // 7. Crear el Documento Final
  const doc = new Document({
    sections: [
      {
        headers: { default: header },
        footers: { default: footer },
        children: seccionesDocumento,
      },
    ],
  });

  // 8. Serializar y Descargar
  const buffer = await Packer.toBlob(doc);
  const fileName = `Guion_${formData.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(buffer, fileName);
};
