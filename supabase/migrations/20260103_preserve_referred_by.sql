-- =====================================================================
-- MIGRATION: Preserve referred_by for Returning Users (Anti-Fraud)
-- Date: 2026-01-03
-- Purpose: Prevent referral cheating by preserving original referred_by
--          when users re-register with the same email
-- =====================================================================

-- Drop and recreate the trigger function with enhanced logic
create or replace function public.handle_new_user()
returns trigger as $$
declare
  used_referral text;
  is_already_referred boolean;
  existing_status int;
  original_referral_id text;
  original_referred_by text;  -- NEW: Store original referred_by
  new_referral_id text;
begin
  -- Check if this email has already been referred in the past
  select exists(select 1 from public.referral_tracking where email = new.email) into is_already_referred;

  -- Get the referral ID sent by the client (randomly generated during sign up)
  new_referral_id := new.raw_user_meta_data->>'referral_id';

  if is_already_referred then
    -- RETURNING USER LOGIC:
    -- 1. Retrieve their original data from tracking
    select referred_by, referral_status, referral_id 
    into original_referred_by, existing_status, original_referral_id  -- MODIFIED: capture original referred_by
    from public.referral_tracking 
    where email = new.email;
    
    -- 2. Restore their original Referral ID if it exists
    if original_referral_id is not null then
      new_referral_id := original_referral_id;
      
      -- CRITICAL: Update auth.users metadata so the client app sees the restored ID
      update auth.users 
      set raw_user_meta_data = 
        jsonb_set(
          coalesce(raw_user_meta_data, '{}'::jsonb), 
          '{referral_id}', 
          to_jsonb(original_referral_id)
        )
      where id = new.id;
    end if;

    -- NEW: 3. Restore their original referred_by (ANTI-FRAUD)
    -- Always use the original referred_by, ignoring any new referral code
    used_referral := original_referred_by;
    
    -- NEW: Also update auth metadata to preserve referred_by
    if original_referred_by is not null then
      update auth.users 
      set raw_user_meta_data = 
        jsonb_set(
          coalesce(raw_user_meta_data, '{}'::jsonb), 
          '{referred_by}', 
          to_jsonb(original_referred_by)
        )
      where id = new.id;
    end if;

    -- 4. Auto-approve re-joining users (Set status to 1)
    existing_status := 1;
    update public.referral_tracking set referral_status = 1 where email = new.email;

  else
    -- NEW USER LOGIC:
    used_referral := new.raw_user_meta_data->>'referred_by';
    existing_status := 0; -- Default to Pending
    
    -- CHECK REFERRAL LIMIT (Max 5)
    if used_referral is not null then
      declare
        referral_count int;
      begin
        select count(*) into referral_count 
        from public.referral_tracking 
        where referred_by = used_referral;
        
        if referral_count >= 5 then
          used_referral := null; -- Ignore referral if limit reached
        end if;
      end;
    end if;
    
    -- Log this new user into the persistent tracking table
    insert into public.referral_tracking (email, referred_by, referral_status, referral_id)
    values (new.email, used_referral, 0, new_referral_id)
    on conflict (email) do nothing;
  end if;

  -- Finally, create the active profile
  insert into public.profiles (id, email, referral_id, referred_by, referral_status)
  values (
    new.id,
    new.email,
    new_referral_id,
    used_referral,
    existing_status
  );
  return new;
end;
$$ language plpgsql security definer;
