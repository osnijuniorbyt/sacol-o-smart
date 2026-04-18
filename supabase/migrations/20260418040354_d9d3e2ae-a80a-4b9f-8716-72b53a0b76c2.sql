-- Aprova todos os usuários existentes
UPDATE public.profiles
SET is_approved = true,
    approved_at = COALESCE(approved_at, now())
WHERE is_approved = false;

-- Atualiza trigger para auto-aprovar novos cadastros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_approved, approved_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    true,
    now()
  );
  RETURN NEW;
END;
$function$;