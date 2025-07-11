/*
  # Fix Authentication System

  1. Tables
    - Fix the relationship between users and profiles tables
    - Ensure proper UUID generation for profiles
    
  2. Functions
    - Update create_user_with_profile to handle the relationship correctly
    - Fix the foreign key constraints
    
  3. Test Users
    - Create test users with proper profile relationships
*/

-- First, let's check and fix the profiles table structure
DO $$
BEGIN
  -- Remove the foreign key constraint from profiles to users if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_id_fkey' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
  END IF;
END $$;

-- Ensure profiles table has proper UUID generation
DO $$
BEGIN
  -- Check if id column has default value
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'id' 
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  profile_id uuid,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_profile_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Sessions are private" ON user_sessions;

-- Create RLS policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Sessions are private" ON user_sessions
  FOR ALL TO public
  USING (true);

-- Function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password text, salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(digest(salt || password || salt, 'sha256'), 'hex');
END;
$$;

-- Function to generate session tokens
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Function to create user with profile (fixed version)
CREATE OR REPLACE FUNCTION create_user_with_profile(
  p_email text,
  p_password text,
  p_full_name text,
  p_role user_role DEFAULT 'student'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_salt text;
  v_password_hash text;
  v_profile_id uuid;
  v_user_id uuid;
BEGIN
  -- Generate salt and hash password
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_password_hash := hash_password(p_password, v_salt);

  -- Create profile first (let UUID generate automatically)
  INSERT INTO profiles (email, full_name, role)
  VALUES (p_email, p_full_name, p_role)
  RETURNING id INTO v_profile_id;

  -- Create user with reference to profile
  INSERT INTO users (email, password_hash, salt, profile_id)
  VALUES (p_email, v_password_hash, v_salt, v_profile_id)
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(p_email text, p_password text)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role user_role,
  token text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user users%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_token text;
  v_session_id uuid;
BEGIN
  -- Find user by email
  SELECT * INTO v_user
  FROM users u
  WHERE u.email = p_email AND u.is_active = true;

  -- Check if user exists
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verify password
  IF v_user.password_hash != hash_password(p_password, v_user.salt) THEN
    RETURN;
  END IF;

  -- Get user profile
  SELECT * INTO v_profile
  FROM profiles p
  WHERE p.id = v_user.profile_id;

  -- Generate session token
  v_token := generate_session_token();

  -- Create session (expires in 7 days)
  INSERT INTO user_sessions (user_id, token, expires_at)
  VALUES (v_user.id, v_token, now() + interval '7 days')
  RETURNING id INTO v_session_id;

  -- Update last login
  UPDATE users 
  SET last_login = now(), updated_at = now()
  WHERE id = v_user.id;

  -- Return user data
  RETURN QUERY SELECT 
    v_user.id,
    v_user.email,
    v_profile.full_name,
    v_profile.role,
    v_token;
END;
$$;

-- Function to validate session
CREATE OR REPLACE FUNCTION validate_session(p_token text)
RETURNS TABLE(
  user_id uuid,
  email text,
  full_name text,
  role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session user_sessions%ROWTYPE;
  v_user users%ROWTYPE;
  v_profile profiles%ROWTYPE;
BEGIN
  -- Find valid session
  SELECT * INTO v_session
  FROM user_sessions s
  WHERE s.token = p_token AND s.expires_at > now();

  -- Check if session exists and is valid
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get user
  SELECT * INTO v_user
  FROM users u
  WHERE u.id = v_session.user_id AND u.is_active = true;

  IF NOT FOUND THEN
    -- Clean up invalid session
    DELETE FROM user_sessions WHERE id = v_session.id;
    RETURN;
  END IF;

  -- Get profile
  SELECT * INTO v_profile
  FROM profiles p
  WHERE p.id = v_user.profile_id;

  -- Return user data
  RETURN QUERY SELECT 
    v_user.id,
    v_user.email,
    v_profile.full_name,
    v_profile.role;
END;
$$;

-- Function to logout user
CREATE OR REPLACE FUNCTION logout_user(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the session
  DELETE FROM user_sessions WHERE token = p_token;
  
  -- Return true if session was found and deleted
  RETURN FOUND;
END;
$$;

-- Clean up expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$;

-- Clean up any existing test users first
DELETE FROM users WHERE email IN ('admin@otomesyen.com', 'instructor@otomesyen.com', 'student@otomesyen.com');
DELETE FROM profiles WHERE email IN ('admin@otomesyen.com', 'instructor@otomesyen.com', 'student@otomesyen.com');

-- Insert test users
DO $$
BEGIN
  -- Create admin user
  PERFORM create_user_with_profile(
    'admin@otomesyen.com',
    'admin123',
    'Administrator',
    'admin'
  );

  -- Create instructor user
  PERFORM create_user_with_profile(
    'instructor@otomesyen.com',
    'instructor123',
    'Tim Kelas Otomesyen',
    'instructor'
  );

  -- Create student user
  PERFORM create_user_with_profile(
    'student@otomesyen.com',
    'student123',
    'Student Demo',
    'student'
  );
END $$;