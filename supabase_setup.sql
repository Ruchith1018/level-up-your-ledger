-- =============================================================================
-- SUPABASE MIGRATION SCRIPT
-- Application: Expense Tracker with Referral System
-- =============================================================================

-- 1. CLEANUP
-- Drop existing objects to ensure a clean slate (Order matters due to dependencies)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.delete_user();
drop table if exists public.profiles;
-- NOTE: We drop referral_tracking to ensure schema matches. 
-- BACKUP THIS TABLE IF YOU WANT TO KEEP HISTORY BEFORE RUNNING THIS SCRIPT.
drop table if exists public.referral_tracking;

-- 2. CREATE TABLES

-- A. Persistent Referral Tracking
-- Stores referral history permanently, even if the user deletes their account.
create table public.referral_tracking (
  email text primary key,
  referred_by text,
  referral_id text, -- The user's own referral ID (persisted)
  referral_status int default 0, -- 0 = Pending, 1 = Approved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- B. User Profiles
-- Active user data linked to auth.users. Deleted when user is deleted.
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  referral_id text unique,
  referred_by text,
  referral_status int default 0, -- 0 = Pending, 1 = Approved
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)

-- Profiles Policies
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." 
  on profiles for select 
  using ( true );

create policy "Users can update own profile." 
  on profiles for update 
  using ( auth.uid() = id );

-- Referral Tracking Policies
alter table public.referral_tracking enable row level security;

create policy "Enable read access for authenticated users"
  on public.referral_tracking
  for select
  to authenticated
  using ( true );

-- 4. AUTOMATION: Handle New User Registration
-- This function runs automatically when a new user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  used_referral text;
  is_already_referred boolean;
  existing_status int;
  original_referral_id text;
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
    into used_referral, existing_status, original_referral_id
    from public.referral_tracking 
    where email = new.email;
    
    -- 2. Restore their original Referral ID if it exists
    if original_referral_id is not null then
      new_referral_id := original_referral_id;
      
      -- CRITICAL: Update auth.users metadata so the client app sees the restored ID
      -- This requires the function to have 'security definer' privileges
      update auth.users 
      set raw_user_meta_data = 
        jsonb_set(
          coalesce(raw_user_meta_data, '{}'::jsonb), 
          '{referral_id}', 
          to_jsonb(original_referral_id)
        )
      where id = new.id;
    end if;

    -- 3. Auto-approve re-joining users (Set status to 1)
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

-- Trigger the function every time a new user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. FUNCTION: Delete Account
-- Allows users to securely delete their own account from the app
create or replace function delete_user()
returns void as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
