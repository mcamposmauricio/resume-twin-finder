-- Add column to control MarQ banner visibility per user
ALTER TABLE public.profiles 
ADD COLUMN show_marq_banner boolean NOT NULL DEFAULT false;