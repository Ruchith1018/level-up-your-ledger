
-- Add reply_to_id column to family_chats
ALTER TABLE public.family_chats 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.family_chats(id) ON DELETE SET NULL;
