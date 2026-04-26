-- =====================================================================
-- Tablas para el módulo de Creativos IA
-- Crea: creative_requests, generated_images, generated_videos, creative_library
-- =====================================================================

-- 1. Registro de solicitudes de generación
CREATE TABLE IF NOT EXISTS public.creative_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_type  TEXT        NOT NULL CHECK (creative_type IN ('image', 'video')),
  prompt         TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  result_id      UUID,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.creative_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_requests: owner read"
  ON public.creative_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "creative_requests: owner insert"
  ON public.creative_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creative_requests: owner update"
  ON public.creative_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS creative_requests_user_id_idx
  ON public.creative_requests (user_id, created_at DESC);

-- 2. Imágenes generadas
CREATE TABLE IF NOT EXISTS public.generated_images (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id       UUID        REFERENCES public.creative_requests(id) ON DELETE SET NULL,
  image_url        TEXT        NOT NULL,
  dalle_request_id TEXT,
  prompt           TEXT        NOT NULL,
  dimensions       TEXT        NOT NULL DEFAULT '1024x1024' CHECK (dimensions IN ('512x512', '1024x1024', '1792x1024')),
  quality          TEXT        NOT NULL DEFAULT 'hd' CHECK (quality IN ('standard', 'hd')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_images: owner read"
  ON public.generated_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "generated_images: owner insert"
  ON public.generated_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_images: owner delete"
  ON public.generated_images FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS generated_images_user_id_idx
  ON public.generated_images (user_id, created_at DESC);

-- 3. Videos generados
CREATE TABLE IF NOT EXISTS public.generated_videos (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id         UUID        REFERENCES public.creative_requests(id) ON DELETE SET NULL,
  runway_project_id  TEXT        NOT NULL,
  video_url          TEXT,
  prompt             TEXT        NOT NULL,
  duration_seconds   INTEGER,
  status             TEXT        NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  progress_percent   INTEGER     DEFAULT 0,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "generated_videos: owner read"
  ON public.generated_videos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "generated_videos: owner insert"
  ON public.generated_videos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_videos: owner update"
  ON public.generated_videos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "generated_videos: owner delete"
  ON public.generated_videos FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS generated_videos_user_id_idx
  ON public.generated_videos (user_id, created_at DESC);

-- 4. Biblioteca personal (creativos guardados)
CREATE TABLE IF NOT EXISTS public.creative_library (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creative_id    UUID        NOT NULL,
  creative_type  TEXT        NOT NULL CHECK (creative_type IN ('image', 'video')),
  name           TEXT        NOT NULL,
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, creative_id, creative_type)
);

ALTER TABLE public.creative_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creative_library: owner read"
  ON public.creative_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "creative_library: owner insert"
  ON public.creative_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creative_library: owner delete"
  ON public.creative_library FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS creative_library_user_id_idx
  ON public.creative_library (user_id, saved_at DESC);
