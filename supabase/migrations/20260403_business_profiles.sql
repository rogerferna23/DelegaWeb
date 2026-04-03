-- Script de Migración: Perfiles de Negocio Multi-Empresa
-- Ejecutar este script en el SQL Editor de Supabase

-- 1. Crear la tabla de perfiles
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    offer TEXT NOT NULL,
    ideal_client TEXT NOT NULL,
    differentiator TEXT,
    price_range VARCHAR(100) NOT NULL,
    sales_method VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar que no haya duplicados de nombre para el mismo usuario
CREATE UNIQUE INDEX IF NOT EXISTS business_profiles_user_company_idx ON public.business_profiles (user_id, company_name);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso
CREATE POLICY "Users can manage their own business profiles" 
    ON public.business_profiles 
    FOR ALL 
    USING (auth.uid() = user_id);

-- 4. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_business_context_updated_at') THEN
        CREATE TRIGGER update_business_context_updated_at
            BEFORE UPDATE ON public.business_profiles
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;

-- 5. Insertar una columna en campaigns_cache para vincular el perfil (opcional para trazabilidad)
-- ALTER TABLE public.campaigns_cache ADD COLUMN IF NOT EXISTS business_profile_id UUID REFERENCES public.business_profiles(id);
