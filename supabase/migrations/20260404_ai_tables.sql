-- Script de Migración: Tablas para IA (Chat y Consumo)
-- Ejecutar este script en el SQL Editor de Supabase en producción

-- 1. Tabla para Historial del Chat
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    context JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para ai_chat_messages
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat history" 
    ON public.ai_chat_messages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
    ON public.ai_chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 2. Tabla para Log de Consumo (Tokens)
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS para ai_usage_log
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs" 
    ON public.ai_usage_log FOR SELECT 
    USING (auth.uid() = user_id);

-- 3. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS ai_chat_user_id_idx ON public.ai_chat_messages (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_user_id_idx ON public.ai_usage_log (user_id);
