-- Remove email column from profiles table (security improvement)
-- The email is already stored in auth.users, no need to duplicate

-- First, update the trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_approved)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false
  );
  RETURN NEW;
END;
$$;

-- Now remove the email column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;