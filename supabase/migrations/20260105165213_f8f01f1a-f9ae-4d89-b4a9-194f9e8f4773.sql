-- Add lead_source column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS lead_source text;