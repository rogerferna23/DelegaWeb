-- Script de Migración: Añadir campo de tipo a Perfiles de Negocio
-- Esto permite separar los perfiles de campañas de los de guiones IA

-- 1. Añadir la columna 'type' si no existe
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'campaign';

-- 2. Asegurar que los perfiles existentes tengan el tipo 'campaign'
UPDATE public.business_profiles 
SET type = 'campaign' 
WHERE type IS NULL;

-- 3. (Opcional) Añadir el campo 'resultado' que se usa en Guiones IA para persistirlo
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS target_result TEXT;

-- 4. Actualizar el índice de unicidad para permitir el mismo nombre en diferentes tipos (opcional)
-- DROP INDEX IF EXISTS business_profiles_user_company_idx;
-- CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_user_company_type_idx ON public.business_profiles (user_id, company_name, type);
