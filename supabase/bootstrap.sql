-- ═══════════════════════════════════════════════════════════════════════════
-- BOOTSTRAP — rodar UMA VEZ, à mão, no projeto de produção.
--
-- Por que este arquivo existe:
--
-- A lista de autorizados é fechada por padrão (RN-11), e só mentor escreve nela.
-- Mas mentor só existe se estiver na lista. É um ciclo fechado: num banco novo,
-- ninguém consegue entrar — nem quem criou o projeto.
--
-- Este script abre a porta uma vez. Depois dele, tudo acontece pela tela
-- `/membros`, e este arquivo não é usado nunca mais.
--
-- COMO RODAR
--   Supabase → SQL Editor → cole, troque os dois valores abaixo, execute.
--
-- Rodar de novo não quebra nada: é idempotente.
-- ═══════════════════════════════════════════════════════════════════════════

do $$
declare
  -- ⬇️ TROQUE ESTES DOIS VALORES ⬇️
  v_edicao text := '2026.2';
  v_email  text := 'troque-pelo-seu-email@gmail.com';

  v_edicao_id uuid;
begin
  if v_email like 'troque-pelo-seu-email%' then
    raise exception
      'Troque v_email pelo e-mail da SUA CONTA GOOGLE antes de rodar. '
      'Precisa ser a conta com que você vai clicar em "entrar com Google" — '
      'se você usa o gmail pessoal no navegador, é ele, não o institucional.';
  end if;

  select id into v_edicao_id from public.edicao where nome = v_edicao;

  if v_edicao_id is null then
    insert into public.edicao (nome) values (v_edicao) returning id into v_edicao_id;
    raise notice 'Edição % criada.', v_edicao;
  else
    raise notice 'Edição % já existia.', v_edicao;
  end if;

  insert into public.email_autorizado (email, papel, edicao_id)
  values (lower(btrim(v_email)), 'mentor', v_edicao_id)
  on conflict (email) do update set papel = 'mentor', edicao_id = excluded.edicao_id;

  raise notice 'Pronto. Entre em /entrar com % e cadastre o resto do time em /membros.', v_email;
end $$;
