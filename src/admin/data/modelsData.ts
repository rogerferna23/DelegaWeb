// ============================================================
// modelsData.ts — Datos estáticos para la sección Creativos con IA
// ============================================================

export interface AIModel {
  id: string;
  sigla: string;
  name: string;
  company: string;
  tag: string;
  tagColor: string;
  tagIcon?: string;
  description: string;
  pricePerUnit: string;
  unitsPerDollar: string;
  generationCost: string;
  credits: number;
  category: string;
  recommended?: boolean;
}

export interface CreativePreset {
  id: string;
  name: string;
  category: string;
  badge: string | null;
  badgeColor: string | null;
  typeBadge: string;
  imageDesc: string;
  previewUrl?: string;
  small?: boolean;
}

export interface ActivityItem {
  id: string;
  name: string;
  model: string;
  timeAgo: string;
  thumb: string;
  thumbGradient: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  model: string;
  credits: number;
  status: string;
  date: string;
  thumbGradient: string;
}

export interface LibraryItem {
  id: string;
  name: string;
  modelTag: string;
  modelColor: string;
  credits: string;
  folder: string;
  thumbGradient: string;
}

export interface LibraryFolder {
  id: string;
  label: string;
  icon: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: string;
  uses: number;
  imageDesc: string;
  thumbGradient: string;
}

// ─── Modelos de Imagen (10) ────────────────────────────────

export const IMAGE_MODELS: AIModel[] = [
  {
    id: 'recraft-v3',
    sigla: 'RC',
    name: 'Recraft V3',
    company: 'Recraft',
    tag: 'TIPOGRAFÍA',
    tagColor: '#3b82f6',
    tagIcon: '✦',
    description: 'Mejor renderizado de texto. Ads con copy, logos, posters.',
    pricePerUnit: '$0.04/img',
    unitsPerDollar: '25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'tipografia',
    recommended: true,
  },
  {
    id: 'flux-2-pro',
    sigla: 'BF',
    name: 'Flux 2 Pro',
    company: 'Black Forest Labs',
    tag: 'REALISMO',
    tagColor: '#ef4444',
    tagIcon: '◉',
    description: 'Fotos de producto indistinguibles de reales. Máximo fotorrealismo por API.',
    pricePerUnit: '$0.03/MP',
    unitsPerDollar: '~33 imgs por $1',
    generationCost: '$0.06 · 6 cr',
    credits: 6,
    category: 'realismo',
  },
  {
    id: 'flux-1-1-pro',
    sigla: 'BF',
    name: 'Flux 1.1 Pro',
    company: 'Black Forest Labs',
    tag: 'CALIDAD',
    tagColor: '#a855f7',
    tagIcon: '◆',
    description: 'Composición profesional. Equilibrio calidad/costo para producción diaria.',
    pricePerUnit: '$0.04/MP',
    unitsPerDollar: '~25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'calidad',
  },
  {
    id: 'flux-schnell',
    sigla: 'BF',
    name: 'Flux Schnell',
    company: 'Black Forest Labs',
    tag: 'VELOCIDAD',
    tagColor: '#22c55e',
    tagIcon: '✓',
    description: 'Borradores y pruebas ultra rápidas. 10x más barato que Pro.',
    pricePerUnit: '$0.003/MP',
    unitsPerDollar: '~233 imgs por $1',
    generationCost: '$0.01 · 1 cr',
    credits: 1,
    category: 'velocidad',
  },
  {
    id: 'flux-kontext-pro',
    sigla: 'BF',
    name: 'Flux Kontext Pro',
    company: 'Black Forest Labs',
    tag: 'EDICIÓN',
    tagColor: '#f97316',
    tagIcon: '✏',
    description: 'Editar imágenes con texto. Consistencia de personaje sin fine-tuning.',
    pricePerUnit: '$0.04/img',
    unitsPerDollar: '25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'edicion',
  },
  {
    id: 'nano-banana-2',
    sigla: 'G',
    name: 'Nano Banana 2',
    company: 'Google',
    tag: 'CALIDAD',
    tagColor: '#a855f7',
    tagIcon: '◆',
    description: 'Generación rápida con buena semántica. Texto legible en imágenes.',
    pricePerUnit: '$0.04/img',
    unitsPerDollar: '25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'calidad',
  },
  {
    id: 'nano-banana-pro',
    sigla: 'G',
    name: 'Nano Banana Pro',
    company: 'Google',
    tag: 'REALISMO',
    tagColor: '#ef4444',
    tagIcon: '◉',
    description: 'Máxima calidad de Google. Fotorrealismo editorial y mockups premium.',
    pricePerUnit: '$0.04/img',
    unitsPerDollar: '25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'realismo',
  },
  {
    id: 'seedream-4-5',
    sigla: 'BD',
    name: 'Seedream 4.5',
    company: 'ByteDance',
    tag: 'REALISMO',
    tagColor: '#ef4444',
    tagIcon: '◉',
    description: 'Fotorrealismo ByteDance. Excelente calidad/precio para volumen alto.',
    pricePerUnit: '$0.03/img',
    unitsPerDollar: '33 imgs por $1',
    generationCost: '$0.06 · 6 cr',
    credits: 6,
    category: 'realismo',
  },
  {
    id: 'gpt-image-1-5',
    sigla: 'AI',
    name: 'GPT Image 1.5',
    company: 'OpenAI',
    tag: 'PROMPT',
    tagColor: '#ec4899',
    tagIcon: '🔘',
    description: 'Mejor adherencia al prompt. Sigue instrucciones exactas al pie de la letra.',
    pricePerUnit: '$0.04/img',
    unitsPerDollar: '25 imgs por $1',
    generationCost: '$0.08 · 8 cr',
    credits: 8,
    category: 'prompt',
  },
  {
    id: 'grok-imagine',
    sigla: 'X',
    name: 'Grok Imagine',
    company: 'xAI',
    tag: 'ECONÓMICO',
    tagColor: '#22c55e',
    tagIcon: '💰',
    description: 'Edición rápida y económica. 45 ediciones por $1 para alto volumen.',
    pricePerUnit: '$0.02/img',
    unitsPerDollar: '45 imgs por $1',
    generationCost: '$0.04 · 4 cr',
    credits: 4,
    category: 'economico',
  },
];

// ─── Modelos de Video (10) ─────────────────────────────────

export const VIDEO_MODELS: AIModel[] = [
  {
    id: 'seedance-2-0',
    sigla: 'BD',
    name: 'Seedance 2.0',
    company: 'ByteDance',
    tag: 'CONTROL',
    tagColor: '#ef4444',
    tagIcon: '🎛️',
    description: 'Control tipo director. 12 refs (imagen+video+audio). Control creativo total.',
    pricePerUnit: '$0.14/seg',
    unitsPerDollar: '~7 seg por $1',
    generationCost: '$1.40 · 140 cr',
    credits: 140,
    category: 'control',
  },
  {
    id: 'seedance-1-5-pro',
    sigla: 'BD',
    name: 'Seedance 1.5 Pro',
    company: 'ByteDance',
    tag: 'AUDIO',
    tagColor: '#0d9488',
    tagIcon: '🔊',
    description: 'Audio nativo + lip-sync. Mejor relación calidad/precio para producción diaria.',
    pricePerUnit: '$0.05/seg',
    unitsPerDollar: '~20 seg por $1',
    generationCost: '$0.50 · 50 cr',
    credits: 50,
    category: 'audio',
    recommended: true,
  },
  {
    id: 'kling-3-0-pro',
    sigla: 'KS',
    name: 'Kling 3.0 Pro',
    company: 'Kuaishou',
    tag: 'MOVIMIENTO',
    tagColor: '#ef4444',
    tagIcon: '⚡',
    description: 'Mejor movimiento humano realista. Multi-shot con consistencia. Hasta 4K.',
    pricePerUnit: '$0.22/seg',
    unitsPerDollar: '~4.5 seg por $1',
    generationCost: '$2.20 · 220 cr',
    credits: 220,
    category: 'movimiento',
  },
  {
    id: 'kling-2-5-turbo',
    sigla: 'KS',
    name: 'Kling 2.5 Turbo',
    company: 'Kuaishou',
    tag: 'ECONÓMICO',
    tagColor: '#22c55e',
    tagIcon: '💰',
    description: 'Mejor valor Kling. Alto volumen de clips con buena calidad.',
    pricePerUnit: '$0.07/seg',
    unitsPerDollar: '~14 seg por $1',
    generationCost: '$0.70 · 70 cr',
    credits: 70,
    category: 'economico',
  },
  {
    id: 'veo-3-1',
    sigla: 'G',
    name: 'Veo 3.1',
    company: 'Google',
    tag: 'CINE',
    tagColor: '#9333ea',
    tagIcon: '🎬',
    description: 'Calidad cinematográfica máxima. Mejor lip-sync y audio. Premium.',
    pricePerUnit: '$0.40/seg',
    unitsPerDollar: '~2.5 seg por $1',
    generationCost: '$4.00 · 400 cr',
    credits: 400,
    category: 'cine',
  },
  {
    id: 'veo-3',
    sigla: 'G',
    name: 'Veo 3',
    company: 'Google',
    tag: 'CINE',
    tagColor: '#9333ea',
    tagIcon: '🎬',
    description: 'Audio nativo Google. Diálogo, efectos de sonido y ambiente integrados.',
    pricePerUnit: '$0.40/seg',
    unitsPerDollar: '~2.5 seg por $1',
    generationCost: '$4.00 · 400 cr',
    credits: 400,
    category: 'cine',
  },
  {
    id: 'sora-2-pro',
    sigla: 'AI',
    name: 'Sora 2 Pro',
    company: 'OpenAI',
    tag: 'FÍSICA',
    tagColor: '#6366f1',
    tagIcon: '⚛️',
    description: 'Mejor simulación de física real. Agua, gravedad, objetos creíbles. Hasta 20s.',
    pricePerUnit: '$0.15/seg',
    unitsPerDollar: '~6.6 seg por $1',
    generationCost: '$1.50 · 150 cr',
    credits: 150,
    category: 'fisica',
  },
  {
    id: 'hailuo-2-3',
    sigla: 'MM',
    name: 'Hailuo 2.3',
    company: 'MiniMax',
    tag: 'RÁPIDO',
    tagColor: '#0ea5e9',
    tagIcon: '⚡',
    description: 'Precio fijo por video. Prototipado rápido de ideas y contenido social.',
    pricePerUnit: '$0.49/vid',
    unitsPerDollar: '~2 vids por $1',
    generationCost: '$0.98 · 98 cr',
    credits: 98,
    category: 'rapido',
  },
  {
    id: 'wan-2-5',
    sigla: 'AL',
    name: 'Wan 2.5',
    company: 'Alibaba',
    tag: 'ECONÓMICO',
    tagColor: '#22c55e',
    tagIcon: '💰',
    description: 'El más barato del catálogo. 20 seg por $1. Generación masiva de variantes.',
    pricePerUnit: '$0.05/seg',
    unitsPerDollar: '~20 seg por $1',
    generationCost: '$0.50 · 50 cr',
    credits: 50,
    category: 'economico',
  },
  {
    id: 'pixverse-v5-6',
    sigla: 'PX',
    name: 'PixVerse v5.6',
    company: 'PixVerse',
    tag: 'EFECTOS',
    tagColor: '#d946ef',
    tagIcon: '✨',
    description: 'Transiciones creativas y efectos visuales. Menos realista, más artístico.',
    pricePerUnit: '$0.35/vid',
    unitsPerDollar: '~3 vids por $1',
    generationCost: '$0.70 · 70 cr',
    credits: 70,
    category: 'efectos',
  },
];

// ─── Filtros ───────────────────────────────────────────────

export const IMAGE_FILTERS: string[] = [
  'Todos', 'Realismo', 'Velocidad', 'Calidad', 'Económico', 'Edición', 'Tipografía', 'Prompt',
];

export const VIDEO_FILTERS: string[] = [
  'Todos', 'Realismo', 'Velocidad', 'Calidad', 'Económico', 'Edición', 'Tipografía', 'Prompt',
  'Movimiento', 'Cine', 'Audio', 'Física', 'Control', 'Efectos', 'Rápido',
];

export const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Recomendados', value: 'recommended' },
  { label: 'Menor precio', value: 'price_asc' },
  { label: 'Mayor calidad', value: 'quality_desc' },
  { label: 'Más rápido', value: 'speed_desc' },
];

// Mapeo de nombre de filtro → category del modelo
export const FILTER_TO_CATEGORY: Record<string, string | null> = {
  'Todos': null,
  'Realismo': 'realismo',
  'Velocidad': 'velocidad',
  'Calidad': 'calidad',
  'Económico': 'economico',
  'Edición': 'edicion',
  'Tipografía': 'tipografia',
  'Prompt': 'prompt',
  'Movimiento': 'movimiento',
  'Cine': 'cine',
  'Audio': 'audio',
  'Física': 'fisica',
  'Control': 'control',
  'Efectos': 'efectos',
  'Rápido': 'rapido',
};

// ─── Categorías de presets ─────────────────────────────────

export const PRESET_CATEGORIES: string[] = [
  'Todos', 'E-commerce', 'Social Media', 'Anuncios', 'Branding', 'Producto', 'Lifestyle', 'Cinemático', 'UGC',
];

// ─── Presets por sub-tab ───────────────────────────────────

// Imágenes de Unsplash (libres de uso). Si alguna URL falla, la tarjeta cae
// elegantemente al gradiente de fondo gracias al onError del <img>.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80&auto=format&fit=crop`;

export const IMAGE_PRESETS: CreativePreset[] = [
  {
    id: 'preset-img-1',
    name: 'Producto en Estudio',
    category: 'Producto',
    badge: 'Popular',
    badgeColor: '#ef4444',
    typeBadge: 'IMAGEN',
    imageDesc: 'Zapatilla deportiva roja Nike sobre fondo rojo vibrante, iluminación de estudio profesional',
    previewUrl: unsplash('1542291026-7eec264c27ff'),
  },
  {
    id: 'preset-img-2',
    name: 'Anuncio Instagram',
    category: 'Social Media',
    badge: 'Popular',
    badgeColor: '#ef4444',
    typeBadge: 'IMAGEN',
    imageDesc: 'Collage colorido de iconos de redes sociales: Instagram, Spotify, Twitter, TikTok flotando sobre fondo degradado',
    previewUrl: unsplash('1611162617213-7d7a39e9b1d7'),
  },
  {
    id: 'preset-img-3',
    name: 'Banner Promocional',
    category: 'Anuncios',
    badge: 'Nuevo',
    badgeColor: '#22c55e',
    typeBadge: 'IMAGEN',
    imageDesc: 'Arco arquitectónico minimalista con cielo azul, estilo editorial de revista',
    previewUrl: unsplash('1486718448742-163732cd1544'),
  },
  {
    id: 'preset-img-4',
    name: 'UGC Style',
    category: 'UGC',
    badge: 'Nuevo',
    badgeColor: '#22c55e',
    typeBadge: 'IMAGEN',
    imageDesc: 'Gafas de sol estilo moderno sobre fondo gris minimalista, fotografía de producto',
    previewUrl: unsplash('1572635196237-14b3f281503f'),
  },
  {
    id: 'preset-img-5',
    name: '🔥Flat Lay',
    category: 'Producto',
    badge: null,
    badgeColor: null,
    typeBadge: 'IMAGEN',
    imageDesc: 'Vista cenital flat lay de productos cosméticos sobre fondo blanco, estilo minimalista',
    previewUrl: unsplash('1556228720-195a672e8a03'),
    small: true,
  },
  {
    id: 'preset-img-6',
    name: 'Street Fashion',
    category: 'Lifestyle',
    badge: null,
    badgeColor: null,
    typeBadge: 'IMAGEN',
    imageDesc: 'Persona con conjunto rojo moderno posando en la calle, fotografía de moda urbana',
    previewUrl: unsplash('1483985988355-763728e1935b'),
    small: true,
  },
  {
    id: 'preset-img-7',
    name: 'Festival Look',
    category: 'Lifestyle',
    badge: 'Nuevo',
    badgeColor: '#22c55e',
    typeBadge: 'IMAGEN',
    imageDesc: 'Mujer joven con sombrero y gafas de sol posando al aire libre, estilo festival bohemio',
    previewUrl: unsplash('1469334031218-e382a71b716b'),
    small: true,
  },
  {
    id: 'preset-img-8',
    name: 'Dark Portrait',
    category: 'Branding',
    badge: null,
    badgeColor: null,
    typeBadge: 'IMAGEN',
    imageDesc: 'Retrato artístico oscuro con iluminación dramática, estilo cinematográfico',
    previewUrl: unsplash('1492288991661-058aa541ff43'),
    small: true,
  },
];

export const VIDEO_PRESETS: CreativePreset[] = [
  {
    id: 'preset-vid-1',
    name: 'Cinematic Ad',
    category: 'Cinemático',
    badge: null,
    badgeColor: null,
    typeBadge: 'VIDEO',
    imageDesc: 'Claqueta de cine con escena de acción al fondo, estilo cinematográfico',
    previewUrl: unsplash('1485846234645-a62644f84728'),
  },
  {
    id: 'preset-vid-2',
    name: 'Bullet Time',
    category: 'Cinemático',
    badge: 'Pro',
    badgeColor: '#ef4444',
    typeBadge: 'VIDEO',
    imageDesc: 'Logo de Netflix sobre fondo rojo oscuro con efecto cinematográfico',
    previewUrl: unsplash('1574375927938-d5a98e8ffe85'),
  },
  {
    id: 'preset-vid-3',
    name: 'Zoom Cinemático',
    category: 'Cinemático',
    badge: null,
    badgeColor: null,
    typeBadge: 'VIDEO',
    imageDesc: 'Coche blanco deportivo en movimiento con efecto zoom cinematográfico',
    previewUrl: unsplash('1552519507-da3b142c6e3d'),
  },
  {
    id: 'preset-vid-4',
    name: 'Reels Hook',
    category: 'Social Media',
    badge: null,
    badgeColor: null,
    typeBadge: 'VIDEO',
    imageDesc: 'Logo grande de Instagram en degradado rosa y morado sobre fondo vibrante',
    previewUrl: unsplash('1611162617213-7d7a39e9b1d7'),
  },
  {
    id: 'preset-vid-5',
    name: 'Explosión de ingredientes',
    category: 'Producto',
    badge: null,
    badgeColor: null,
    typeBadge: 'VIDEO',
    imageDesc: 'Bowl de comida saludable con verduras frescas, fotografía cenital food styling',
    previewUrl: unsplash('1546069901-ba9599a7e63c'),
  },
];

export const AVATAR_PRESETS: CreativePreset[] = [
  {
    id: 'preset-avatar-1',
    name: 'Avatar Presentador',
    category: 'UGC',
    badge: null,
    badgeColor: null,
    typeBadge: 'AVATAR',
    imageDesc: 'Mujer joven sonriente con sweater burgundy, fondo bokeh cálido, retrato profesional',
    previewUrl: unsplash('1494790108377-be9c29b29330'),
  },
];

// ─── Actividad Reciente (Sidebar) ──────────────────────────

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: 'act-1', name: 'Sneakers Hero V2',     model: 'Flux 2 Pro',        timeAgo: 'hace 35d', thumb: '/demo/sneakers-hero.webp',    thumbGradient: 'from-red-600 to-red-900' },
  { id: 'act-2', name: 'Ad Black Friday',      model: 'Recraft V3',        timeAgo: 'hace 35d', thumb: '/demo/ad-black-friday.webp', thumbGradient: 'from-amber-700 to-amber-950' },
  { id: 'act-3', name: 'UGC Crema Facial',     model: 'Seedream 4.5',      timeAgo: 'hace 35d', thumb: '/demo/ugc-crema.webp',       thumbGradient: 'from-pink-500 to-pink-900' },
  { id: 'act-4', name: 'Spot Cinemático Café', model: 'Veo 3.1',           timeAgo: 'hace 35d', thumb: '/demo/spot-cafe.webp',       thumbGradient: 'from-violet-600 to-violet-950' },
  { id: 'act-5', name: 'Reels Bebida',         model: 'Seedance 1.5 Pro',  timeAgo: 'hace 35d', thumb: '/demo/reels-bebida.webp',    thumbGradient: 'from-rose-500 to-rose-900' },
];

// ─── Historial Demo ────────────────────────────────────────

export const DEMO_HISTORY: HistoryItem[] = [
  { id: 'h-1',  name: 'Sneakers Hero V2',     model: 'Flux 2 Pro',        credits: 3,   status: 'Completado', date: '17/4/2025, 5:23:00',  thumbGradient: 'from-red-600 to-red-900' },
  { id: 'h-2',  name: 'Ad Black Friday',      model: 'Recraft V3',        credits: 4,   status: 'Completado', date: '17/4/2025, 4:51:00',  thumbGradient: 'from-amber-700 to-amber-950' },
  { id: 'h-3',  name: 'UGC Crema Facial',     model: 'Seedream 4.5',      credits: 3,   status: 'Completado', date: '17/4/2025, 3:12:00',  thumbGradient: 'from-pink-500 to-pink-900' },
  { id: 'h-4',  name: 'Spot Cinemático Café', model: 'Veo 3.1',           credits: 320, status: 'Completado', date: '17/4/2025, 2:45:30',  thumbGradient: 'from-violet-600 to-violet-950' },
  { id: 'h-5',  name: 'Reels Bebida',         model: 'Seedance 1.5 Pro',  credits: 30,  status: 'Completado', date: '16/4/2025, 17:10:00', thumbGradient: 'from-rose-500 to-rose-900' },
  { id: 'h-6',  name: 'Mockup Packaging',     model: 'Nano Banana Pro',   credits: 4,   status: 'Completado', date: '16/4/2025, 13:30:00', thumbGradient: 'from-green-600 to-green-900' },
  { id: 'h-7',  name: 'Flat Lay Skincare',    model: 'Flux 1.1 Pro',      credits: 4,   status: 'Completado', date: '16/4/2025, 10:02:00', thumbGradient: 'from-orange-500 to-orange-900' },
  { id: 'h-8',  name: 'Hero Landing',         model: 'Flux 2 Pro',        credits: 3,   status: 'Completado', date: '16/4/2025, 7:00:00',  thumbGradient: 'from-red-600 to-red-900' },
  { id: 'h-9',  name: 'Bullet Time Botella',  model: 'Kling 3.0 Pro',     credits: 110, status: 'Completado', date: '15/4/2025, 15:14:00', thumbGradient: 'from-yellow-600 to-yellow-900' },
  { id: 'h-10', name: 'Avatar Presentador',   model: 'Veo 3',             credits: 320, status: 'Completado', date: '15/4/2025, 11:00:00', thumbGradient: 'from-indigo-600 to-indigo-900' },
];

// ─── Biblioteca Demo ───────────────────────────────────────

export const DEMO_LIBRARY: LibraryItem[] = [
  { id: 'lib-1', name: 'Sneakers Hero V2',     modelTag: 'Flux 2 Pro',        modelColor: '#ef4444', credits: '5 cr',   folder: 'Productos', thumbGradient: 'from-red-600 to-red-900' },
  { id: 'lib-2', name: 'Ad Black Friday',      modelTag: 'Recraft V3',        modelColor: '#f97316', credits: '4 cr',   folder: 'Anuncios',  thumbGradient: 'from-amber-700 to-amber-950' },
  { id: 'lib-3', name: 'UGC Crema Facial',     modelTag: 'Seedream 4.5',      modelColor: '#3b82f6', credits: '3 cr',   folder: 'UGC',       thumbGradient: 'from-pink-500 to-pink-900' },
  { id: 'lib-4', name: 'Spot Cinemático Café', modelTag: 'Veo 3.1',           modelColor: '#a855f7', credits: '300 cr', folder: 'Branding',  thumbGradient: 'from-violet-600 to-violet-950' },
  { id: 'lib-5', name: 'Reels Bebida',         modelTag: 'Seedance 1.5 Pro',  modelColor: '#22c55e', credits: '20 cr',  folder: 'UGC',       thumbGradient: 'from-rose-500 to-rose-900' },
  { id: 'lib-6', name: 'Mockup Packaging',     modelTag: 'Nano Banana Pro',   modelColor: '#22c55e', credits: '4 cr',   folder: 'Productos', thumbGradient: 'from-green-600 to-green-900' },
  { id: 'lib-7', name: 'Flat Lay Skincare',    modelTag: 'Flux 1.1 Pro',      modelColor: '#f97316', credits: '4 cr',   folder: 'Productos', thumbGradient: 'from-orange-500 to-orange-900' },
  { id: 'lib-8', name: 'Hero Landing',         modelTag: 'Flux 2 Pro',        modelColor: '#ef4444', credits: '3 cr',   folder: 'Anuncios',  thumbGradient: 'from-red-600 to-red-900' },
];

export const LIBRARY_FOLDERS: LibraryFolder[] = [
  { id: 'all',       label: 'Todos',     icon: '📁' },
  { id: 'Productos', label: 'Productos', icon: '📁' },
  { id: 'Anuncios',  label: 'Anuncios',  icon: '📁' },
  { id: 'UGC',       label: 'UGC',       icon: '📁' },
  { id: 'Branding',  label: 'Branding',  icon: '📁' },
];

// ─── Plantillas Demo ──────────────────────────────────────

export const DEMO_TEMPLATES: TemplateItem[] = [
  {
    id: 'tpl-1',
    name: 'Lanzamiento Producto',
    description: 'Set completo: hero, banner, real...',
    category: 'E-commerce',
    uses: 1240,
    imageDesc: 'Zapatilla deportiva roja en pose dinámica, fondo rojo vibrante, estilo publicitario premium',
    thumbGradient: 'from-red-600 to-red-900',
  },
  {
    id: 'tpl-2',
    name: 'Black Friday Pack',
    description: 'Anuncios listos con CTA.',
    category: 'Anuncios',
    uses: 890,
    imageDesc: 'Pareja joven sentada en sofá mirando ofertas en portátil, ambiente cálido hogareño',
    thumbGradient: 'from-amber-700 to-amber-950',
  },
  {
    id: 'tpl-3',
    name: 'Skincare Routine',
    description: 'Plantilla beauty UGC.',
    category: 'UGC',
    uses: 854,
    imageDesc: 'Mujer joven con gafas de sol estilo retro posando al aire libre, estilo UGC natural',
    thumbGradient: 'from-sky-500 to-sky-900',
  },
  {
    id: 'tpl-4',
    name: 'Restaurante Premium',
    description: 'Spots cinematográficos de comida.',
    category: 'Cinemático',
    uses: 412,
    imageDesc: 'Claqueta de cine amarilla sobre fondo de set de filmación, estilo Hollywood',
    thumbGradient: 'from-yellow-600 to-yellow-900',
  },
  {
    id: 'tpl-5',
    name: 'Fashion Drop',
    description: 'Outfit swap + reels verticales.',
    category: 'Branding',
    uses: 333,
    imageDesc: 'Mujer joven posando con ropa de moda urbana, fondo colorido, estilo editorial',
    thumbGradient: 'from-pink-500 to-pink-900',
  },
];
