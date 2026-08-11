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

-- ═══════════════════════════════════════════════════════════════════════════
-- Uma turma com tamanho de verdade.
--
-- Com um participante só, a lista da turma não mostra rolagem, nem busca, nem
-- a ordenação por cobertura — e é exatamente isso que precisa ser medido a
-- 390px antes de dar a tela por pronta. Doze pessoas é o piso realista de uma
-- turma da formação.
--
-- Elas entram já provisionadas (autorizadas + `usuario` + `participacao`),
-- porque é o estado em que a turma está durante a formação. Todas com a mesma
-- senha `dex-local`, então dá para entrar como qualquer uma e ver o lado do
-- participante.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  edicao constant uuid := '00000000-0000-4000-8000-000000000001';
  turma  constant text[][] := array[
    ['00000000-0000-4000-8000-0000000000b1', 'Ana Beatriz Rocha',   'ana@dex.local'],
    ['00000000-0000-4000-8000-0000000000b2', 'Bruno Salgado',       'bruno@dex.local'],
    ['00000000-0000-4000-8000-0000000000b3', 'Carla Nogueira',      'carla@dex.local'],
    ['00000000-0000-4000-8000-0000000000b4', 'Daniel Prado',        'daniel@dex.local'],
    ['00000000-0000-4000-8000-0000000000b5', 'Elisa Fontenele',     'elisa@dex.local'],
    ['00000000-0000-4000-8000-0000000000b6', 'Felipe Andrade',      'felipe@dex.local'],
    ['00000000-0000-4000-8000-0000000000b7', 'Gabriela Siqueira',   'gabriela@dex.local'],
    ['00000000-0000-4000-8000-0000000000b8', 'Henrique Vasconcelos','henrique@dex.local'],
    ['00000000-0000-4000-8000-0000000000b9', 'Isadora Lemos',       'isadora@dex.local'],
    ['00000000-0000-4000-8000-0000000000ba', 'João Pedro Marinho',  'joao@dex.local'],
    ['00000000-0000-4000-8000-0000000000bb', 'Karina D''Ávila',     'karina@dex.local'],
    ['00000000-0000-4000-8000-0000000000bc', 'Lucas Ferrareze',     'lucas@dex.local']
  ];
  p     text[];
  conta uuid;
begin
  foreach p slice 1 in array turma loop
    conta := p[1]::uuid;

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      conta, '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated', p[3],
      crypt('dex-local', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', p[2]),
      now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, created_at, updated_at
    ) values (
      gen_random_uuid(), conta, conta::text, 'email',
      jsonb_build_object('sub', conta::text, 'email', p[3], 'email_verified', true),
      now(), now()
    ) on conflict do nothing;

    insert into public.email_autorizado (email, papel, edicao_id)
    values (p[3], 'participante', edicao) on conflict (email) do nothing;

    insert into public.usuario (id, email, nome, papel)
    values (conta, p[3], p[2], 'participante') on conflict (id) do nothing;

    insert into public.participacao (usuario_id, edicao_id)
    values (conta, edicao) on conflict (usuario_id, edicao_id) do nothing;
  end loop;
end $$;
