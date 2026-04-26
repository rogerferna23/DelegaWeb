-- Migración: añadir soporte para FAL.ai en generated_videos
-- Reutilizamos `runway_project_id` para guardar el request_id de FAL
-- (mantiene compatibilidad con datos antiguos) y añadimos `model_id` para
-- saber a qué modelo de FAL volver al hacer polling.

alter table public.generated_videos
  add column if not exists model_id text;

-- También añadimos model_id en generated_images para tener trazabilidad real
-- del modelo usado en cada generación (no solo en dalle_request_id).
alter table public.generated_images
  add column if not exists model_id text;
