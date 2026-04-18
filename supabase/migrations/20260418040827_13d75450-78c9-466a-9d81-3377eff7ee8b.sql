DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'admin@admin.com';

  IF v_existing IS NOT NULL THEN
    -- Atualiza senha do usuário existente
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_existing;
    v_user_id := v_existing;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@admin.com', 'email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  -- Garante perfil aprovado
  INSERT INTO public.profiles (id, full_name, is_approved, approved_at)
  VALUES (v_user_id, 'Administrador', true, now())
  ON CONFLICT (id) DO UPDATE
    SET is_approved = true, approved_at = COALESCE(public.profiles.approved_at, now());

  -- Garante role admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;