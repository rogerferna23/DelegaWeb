CREATE TABLE IF NOT EXISTS public.guiones_historial (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  tipo text NOT NULL,
  estructura text NOT NULL,
  tono text NOT NULL,
  negocio_nombre text,
  servicio text,
  cliente_ideal text,
  problema text,
  resultado text,
  guion_json jsonb NOT NULL,
  gancho_preview text,
  es_optimizado boolean DEFAULT false,
  guion_original text,
  favorito boolean DEFAULT false
);

ALTER TABLE public.guiones_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own guiones"
ON public.guiones_historial FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can select their own guiones"
ON public.guiones_historial FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own guiones"
ON public.guiones_historial FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guiones"
ON public.guiones_historial FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
