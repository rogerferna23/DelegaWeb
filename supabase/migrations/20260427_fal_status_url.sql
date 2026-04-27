-- Guardamos el status_url exacto que FAL.ai devuelve al encolar el video.
-- Antes intentábamos reconstruirlo desde el model path, pero FAL acorta
-- las URLs de status (no usa el subpath completo del modelo) y eso causaba
-- 500 en el polling para modelos con paths multinivel como
-- fal-ai/bytedance/seedance/v1/lite/text-to-video.

alter table public.generated_videos
  add column if not exists fal_status_url text;
