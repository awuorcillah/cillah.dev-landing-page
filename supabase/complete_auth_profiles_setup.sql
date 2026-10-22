-- ==============================================================================
-- CILLAH.DEV: COMPLETE AUTH & PROFILES REPAIR SCRIPT
-- Execute this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Project ID: hastygfosgyxrxzrzrur
-- ==============================================================================

-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_prefix VARCHAR(10) DEFAULT '+254',
    phone_number VARCHAR(100),
    phone VARCHAR(100),
    company_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'admin', 'client', 'user'
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'rejected', 'banned'
    client_type VARCHAR(50) DEFAULT 'consultation',
    avatar_url TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    county VARCHAR(100),
    post_code VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Kenya',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant role & email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role' OR auth.role() = 'anon');

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

-- 4. Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(50) := 'client';
    user_email TEXT := LOWER(NEW.email);
BEGIN
    -- Check if user email matches admin accounts
    IF user_email = 'awuorcillah@gmail.com' 
       OR user_email = 'atulah@cillah.dev'
       OR user_email = 'atulavernesa@gmail.com'
       OR user_email = 'cherrylatulah2000@gmail.com'
       OR user_email LIKE '%cillah%'
       OR user_email LIKE '%admin%' THEN
        user_role := 'admin';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        first_name,
        last_name,
        phone_number,
        phone_prefix,
        company_name,
        role,
        status,
        avatar_url,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_prefix', '+254'),
        COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'company', ''),
        user_role,
        'active',
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        role = CASE 
            WHEN public.profiles.role = 'admin' THEN 'admin'
            ELSE EXCLUDED.role 
        END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Backfill existing auth.users into profiles
INSERT INTO public.profiles (id, email, full_name, role, status, updated_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1)),
    CASE 
        WHEN LOWER(email) IN ('awuorcillah@gmail.com', 'atulah@cillah.dev', 'cherrylatulah2000@gmail.com') 
             OR LOWER(email) LIKE '%admin%' 
             OR LOWER(email) LIKE '%cillah%' THEN 'admin'
        ELSE 'client'
    END,
    'active',
    NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    updated_at = NOW();

-- 6. Set Super Admin Roles
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
    'awuorcillah@gmail.com',
    'atulah@cillah.dev',
    'cherrylatulah2000@gmail.com',
    'atulavernesa@gmail.com'
);
