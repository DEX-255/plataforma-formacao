-- Dados de desenvolvimento. Rodam a cada `supabase db reset`, só no banco
-- local — nunca em produção. Para produção existe `bootstrap.sql`.

insert into public.edicao (id, nome, status)
values ('00000000-0000-4000-8000-000000000001', '2026.2', 'ativa')
on conflict (id) do nothing;

insert into public.email_autorizado (email, papel, edicao_id) values
  ('mentor@dex.local',       'mentor',       '00000000-0000-4000-8000-000000000001'),
  ('participante@dex.local', 'participante', '00000000-0000-4000-8000-000000000001')
on conflict (email) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- Contas com senha, para abrir as telas localmente sem o OAuth do Google.
--
-- Isto NÃO é uma porta dos fundos: `provisionar_acesso` continua rodando e a
-- lista de autorizados continua valendo. Muda só como a sessão nasce.
--
-- Estas linhas vivem em seed.sql, que só roda no banco local. Em produção o
-- provedor de senha nem é habilitado — e `testes/guardas-auth.test.ts` falha se
-- alguém ligar a tela de login local fora do ambiente de desenvolvimento.
--
-- Senha das duas contas: dex-local
-- ═══════════════════════════════════════════════════════════════════════════

-- Os campos de token vão como string vazia, não NULL. O GoTrue lê essas
-- colunas como texto em Go e quebra com "Database error querying schema" se
-- encontrar NULL — erro que não diz nada sobre a causa real.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    '00000000-0000-4000-8000-0000000000a1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'mentor@dex.local',
    crypt('dex-local', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Mentora Local"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-4000-8000-0000000000a2',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'participante@dex.local',
    crypt('dex-local', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Participante Local"}'::jsonb,
    now(), now(), '', '', '', ''
  )
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at
) values
  (
    gen_random_uuid(), '00000000-0000-4000-8000-0000000000a1',
    '00000000-0000-4000-8000-0000000000a1', 'email',
    '{"sub":"00000000-0000-4000-8000-0000000000a1","email":"mentor@dex.local","email_verified":true}'::jsonb,
    now(), now()
  ),
  (
    gen_random_uuid(), '00000000-0000-4000-8000-0000000000a2',
    '00000000-0000-4000-8000-0000000000a2', 'email',
    '{"sub":"00000000-0000-4000-8000-0000000000a2","email":"participante@dex.local","email_verified":true}'::jsonb,
    now(), now()
  )
on conflict do nothing;
