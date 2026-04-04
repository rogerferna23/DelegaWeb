-- Script de Migración: Preferencias de Usuario (Modelo de IA)
-- Ejecutar en el SQL Editor de Supabase en producción

-- 1. Crear la tabla de preferencias
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_claude_model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas
CREATE POLICY "Users can view their own preferences" 
    ON public.user_preferences FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
    ON public.user_preferences FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
    ON public.user_preferences FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 4. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_timestamp') THEN
        CREATE TRIGGER update_user_preferences_timestamp
            BEFORE UPDATE ON public.user_preferences
            FOR EACH ROW
            EXECUTE PROCEDURE update_user_preferences_updated_at();
    END IF;
END $$;
