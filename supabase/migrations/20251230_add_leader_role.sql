-- Migration to add 'leader' role to family_members table

-- 1. Drop existing check constraint if it exists
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'family_members_role_check') THEN 
        ALTER TABLE family_members DROP CONSTRAINT family_members_role_check;
    END IF;
END $$;

-- 2. Add new check constraint including 'leader'
ALTER TABLE family_members 
ADD CONSTRAINT family_members_role_check 
CHECK (role IN ('admin', 'leader', 'member', 'viewer'));
