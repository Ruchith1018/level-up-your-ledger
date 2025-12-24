-- =============================================================================
-- MANUAL EMAIL CONFIRMATION
-- Run this script in standard Supabase SQL Editor to verify a user if emails are not arriving.
-- =============================================================================

-- REPLACE 'your_email@example.com' WITH THE ACTUAL EMAIL YOU SIGNED UP WITH
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'your_email@example.com';

-- Verify the update
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'your_email@example.com';
