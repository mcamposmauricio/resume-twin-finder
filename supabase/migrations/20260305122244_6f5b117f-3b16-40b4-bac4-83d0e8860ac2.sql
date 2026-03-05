ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS careers_show_hero_text boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS company_mission text,
  ADD COLUMN IF NOT EXISTS company_vision text,
  ADD COLUMN IF NOT EXISTS company_values text,
  ADD COLUMN IF NOT EXISTS careers_show_mission boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS careers_show_vision boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS careers_show_values boolean DEFAULT true;