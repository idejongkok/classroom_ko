/*
  # Manual Insert Test Users

  1. Clean up existing data
  2. Insert profiles manually
  3. Insert users manually
  4. Create authentication functions
*/

-- Clean up existing data
DELETE FROM user_sessions;
DELETE FROM users;

-- Insert profiles manually with explicit UUIDs
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@kelasotomesyen.com', 'Administrator', 'admin', now(), now()),
('22222222-2222-2222-2222-222222222222', 'instructor@kelasotomesyen.com', 'Tim Kelas Otomesyen', 'instructor', now(), now()),
('33333333-3333-3333-3333-333333333333', 'student@kelasotomesyen.com', 'Student Demo', 'student', now(), now());

-- Function to hash passwords (simple version)
CREATE OR REPLACE FUNCTION hash_password(password text, salt text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(digest(salt || password || salt, 'sha256'), 'hex');
END;
$$;

-- Insert users manually with hashed passwords
INSERT INTO users (id, email, password_hash, salt, profile_id, is_active, created_at, updated_at) VALUES
(
  gen_random_uuid(),
  'admin@kelasotomesyen.com',
  hash_password('admin123', 'salt_admin'),
  'salt_admin',
  '11111111-1111-1111-1111-111111111111',
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'instructor@kelasotomesyen.com',
  hash_password('instructor123', 'salt_instructor'),
  'salt_instructor',
  '22222222-2222-2222-2222-222222222222',
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'student@kelasotomesyen.com',
  hash_password('student123', 'salt_student'),
  'salt_student',
  '33333333-3333-3333-3333-333333333333',
  true,
  now(),
  now()
);

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