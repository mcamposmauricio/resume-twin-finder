-- Add referral columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

-- Create invites table
CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invites
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- RLS policies for invites
CREATE POLICY "Users can view their own invites" 
ON public.invites 
FOR SELECT 
USING (auth.uid() = inviter_user_id);

CREATE POLICY "Users can create invites" 
ON public.invites 
FOR INSERT 
WITH CHECK (auth.uid() = inviter_user_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to set referral code for new users
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  -- Generate unique code
  LOOP
    new_code := generate_referral_code();
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  NEW.referral_code := new_code;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code
CREATE TRIGGER set_profile_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.set_referral_code();

-- Function to reward referrer when new user signs up with their code
CREATE OR REPLACE FUNCTION public.reward_referrer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE profiles 
    SET total_resumes = total_resumes + 10
    WHERE referral_code = NEW.referred_by_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to reward referrer
CREATE TRIGGER reward_referrer_on_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.referred_by_code IS NOT NULL)
EXECUTE FUNCTION public.reward_referrer();

-- Generate referral codes for existing users who don't have one
UPDATE public.profiles 
SET referral_code = generate_referral_code() 
WHERE referral_code IS NULL;