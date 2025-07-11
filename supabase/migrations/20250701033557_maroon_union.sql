/*
  # Fix token validation tables and functions

  1. Tables
    - Ensure password_reset_tokens and user_invitations tables exist with correct structure
    - Add proper indexes and constraints
    
  2. Functions
    - Fix token validation functions to work properly
    - Ensure proper error handling
*/

-- Ensure password_reset_tokens table exists with correct structure
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure user_invitations table exists with correct structure
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at ON user_invitations(expires_at);

-- Drop existing policies
DROP POLICY IF EXISTS "password_reset_tokens_allow_all" ON password_reset_tokens;
DROP POLICY IF EXISTS "user_invitations_allow_all" ON user_invitations;

-- RLS Policies
CREATE POLICY "password_reset_tokens_allow_all" ON password_reset_tokens
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "user_invitations_allow_all" ON user_invitations
  FOR ALL TO public USING (true) WITH CHECK (true);

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Function to create password reset token
CREATE OR REPLACE FUNCTION create_password_reset_token(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  -- Generate token
  v_token := generate_secure_token();

  -- Insert token (delete any existing tokens for this email first)
  DELETE FROM password_reset_tokens WHERE email = p_email;
  
  INSERT INTO password_reset_tokens (email, token)
  VALUES (p_email, v_token);

  RETURN v_token;
END;
$$;

-- Function to create user invitation
CREATE OR REPLACE FUNCTION create_user_invitation(
  p_email text,
  p_full_name text,
  p_role user_role,
  p_created_by uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;

  -- Generate token
  v_token := generate_secure_token();

  -- Delete any existing invitations for this email
  DELETE FROM user_invitations WHERE email = p_email;

  -- Insert invitation
  INSERT INTO user_invitations (email, full_name, role, token, created_by)
  VALUES (p_email, p_full_name, p_role, v_token, p_created_by);

  RETURN v_token;
END;
$$;

-- Function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(p_email text, p_new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_salt text;
  v_password_hash text;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = p_email) THEN
    RETURN false;
  END IF;

  -- Generate new salt and hash
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_password_hash := encode(digest(v_salt || p_new_password || v_salt, 'sha256'), 'hex');

  -- Update user password (create user record if it doesn't exist)
  INSERT INTO users (email, password_hash, salt, profile_id)
  SELECT p_email, v_password_hash, v_salt, p.id
  FROM profiles p
  WHERE p.email = p_email
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    updated_at = now();

  RETURN FOUND;
END;
$$;

-- Function to create user from invitation
CREATE OR REPLACE FUNCTION create_user_from_invitation(
  p_email text,
  p_full_name text,
  p_role user_role,
  p_password text
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
  v_password_hash := encode(digest(v_salt || p_password || v_salt, 'sha256'), 'hex');

  -- Create profile first (or get existing one)
  INSERT INTO profiles (email, full_name, role)
  VALUES (p_email, p_full_name, p_role)
  ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING id INTO v_profile_id;

  -- Create user with reference to profile
  INSERT INTO users (email, password_hash, salt, profile_id)
  VALUES (p_email, v_password_hash, v_salt, v_profile_id)
  ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    salt = EXCLUDED.salt,
    profile_id = EXCLUDED.profile_id,
    updated_at = now()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$;

-- Clean up expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_tokens WHERE expires_at < now() OR used = true;
  DELETE FROM user_invitations WHERE expires_at < now() OR used = true;
END;
$$;