-- ═══════════════════════════════════════════════════════════════════════════
-- Encerramento da edição — RF-A4, RN-13, RN-18.
--
--   ativa ──────► encerrada
--
-- `RN-13` já vale na leitura: `app.minhas_participacoes()` só devolve
-- participação de edição **ativa**, e com isso todo o acesso do participante cai
-- — feedback, encontro, presença, caixa. Isso está testado.
--
-- Faltavam duas coisas.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. A transição é de mão única ─────────────────────────────────────────
--
-- Reabrir uma edição devolveria acesso a quem já foi avisado de que acabou, e
-- faria a plataforma desmentir o que disse. Se um dia for mesmo necessário, é
-- operação manual e consciente no banco — não um clique.

create or replace function app.transicao_de_edicao()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status
     and not (old.status = 'ativa' and new.status = 'encerrada')
  then
    raise exception 'transição de edição inválida: % → %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists edicao_transicao on public.edicao;

create trigger edicao_transicao
  before update on public.edicao
  for each row execute function app.transicao_de_edicao();

-- ── 2. A tela precisa distinguir "acabou" de "nunca entrou" ───────────────
--
-- `RN-13` derruba a leitura, e é isso que se quer. O efeito colateral é que a
-- tela do participante não consegue mais dizer **por quê**: sem participação
-- visível, "a edição encerrou" e "você nunca esteve numa" ficam idênticos, e a
-- pessoa que terminou a formação veria uma mensagem de cadastro incompleto.
--
-- A diferença importa justamente aqui: quem encerrou precisa da instrução de
-- como receber o documento final, que é o que sobra para ela.
--
-- Devolve só o rótulo da situação — nenhuma linha, nenhum id.

create or replace function public.situacao_do_participante()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select case when e.status = 'ativa' then 'ativa' else 'encerrada' end
       from public.participacao p
       join public.edicao e on e.id = p.edicao_id
      where p.usuario_id = auth.uid()
      order by (e.status = 'ativa') desc, e.nome desc
      limit 1),
    'sem-participacao'
  );
$$;

revoke all on function public.situacao_do_participante() from public, anon;
grant execute on function public.situacao_do_participante() to authenticated;

comment on function public.situacao_do_participante() is
  'RN-13. Distingue "a edição encerrou" de "não há participação nenhuma", que a '
  'RLS torna indistinguíveis para a tela — sem devolver dado de participação.';

-- ── 3. RN-13 vale também dentro do `security definer` ─────────────────────
--
-- `enviar_mensagem_anonima` roda como dona da função e **passa por cima da
-- RLS** — é o que a torna capaz de escrever nas duas tabelas de uma vez. O
-- efeito colateral é que `app.minhas_participacoes()`, que é onde RN-13 mora,
-- nunca foi consultada por ela: a função lê `participacao` direto e só exigia
-- que o encontro estivesse aberto.
--
-- Na prática: encerrar a edição com um encontro ainda aberto deixava o
-- participante continuar escrevendo na caixa, depois de a plataforma ter
-- avisado que o acesso dele acabou.
--
-- Encontrado por um teste de encerramento, não por revisão. É a armadilha
-- clássica do `security definer`: quem pula a RLS herda a obrigação de repetir
-- as regras que ela aplicava.

create or replace function public.enviar_mensagem_anonima(
  p_encontro uuid,
  p_texto    text
)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_participacao uuid;
begin
  if btrim(coalesce(p_texto, '')) = '' then
    raise exception 'mensagem vazia';
  end if;

  select p.id into v_participacao
  from public.participacao p
  join public.encontro e on e.id = p_encontro and e.edicao_id = p.edicao_id
  join public.edicao ed on ed.id = p.edicao_id
  where p.usuario_id = auth.uid()
    and e.status = 'aberto'      -- a caixa fecha na liberação
    and ed.status = 'ativa';     -- RN-13: e some junto com o acesso

  if v_participacao is null then
    raise exception 'sem participação ativa neste encontro aberto';
  end if;

  -- RN-09: uma por participante por encontro. A marca vai primeiro: se ela
  -- falhar por duplicidade, a mensagem não chega a existir.
  insert into public.mensagem_enviada (encontro_id, participacao_id)
  values (p_encontro, v_participacao);

  insert into public.mensagem_anonima (encontro_id, texto)
  values (p_encontro, p_texto);
end;
$$;

revoke all on function public.enviar_mensagem_anonima(uuid, text) from public, anon;
grant execute on function public.enviar_mensagem_anonima(uuid, text) to authenticated;
