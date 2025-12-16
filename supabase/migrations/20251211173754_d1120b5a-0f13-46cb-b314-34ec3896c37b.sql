-- Fix the function search path security warning
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;