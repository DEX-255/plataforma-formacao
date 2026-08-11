-- ═══════════════════════════════════════════════════════════════════════════
-- RN-06 — depois da liberação, o bloco visível não é editado.
--
-- "Antes, o mentor edita livremente. Depois, o que a pessoa leu é o que ficou.
-- O bloco interno continua editável — ele não foi lido por ninguém de fora."
--
-- A política `feedback_mentor_atualiza` deixa o mentor escrever na própria
-- linha, e é assim que tem que ser. O que ela não sabe é **quando** e **qual
-- parte**. Sem esta guarda, um `PATCH` no PostgREST reescreveria a sugestão que
-- a participante já leu na semana passada — e a versão que ela guardou na
-- memória deixaria de existir no sistema, sem deixar rastro.
--
-- É a mesma decisão do gatilho `encontro_transicao`: a ação de servidor confere
-- para dar mensagem boa; o banco confere para a regra valer.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function app.trava_do_bloco_visivel()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  liberado boolean;
begin
  select e.status = 'liberado' into liberado
    from public.encontro e where e.id = new.encontro_id;

  if not coalesce(liberado, false) then
    return new;
  end if;

  if new.situacao is distinct from old.situacao
     or new.ponto  is distinct from old.ponto
     or new.sugestao is distinct from old.sugestao
     or new.eixo   is distinct from old.eixo
  then
    raise exception
      'RN-06: o encontro já foi liberado e o bloco visível não é mais editável'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_trava_visivel on public.feedback;

create trigger feedback_trava_visivel
  before update on public.feedback
  for each row execute function app.trava_do_bloco_visivel();

-- ── Apagar ────────────────────────────────────────────────────────────────
-- RN-18 diz que nada é apagado, tudo é arquivado. Antes da liberação, apagar
-- um feedback é corrigir um registro que ninguém leu; depois, seria remover o
-- que a pessoa já recebeu — e o documento final dela precisa continuar
-- reproduzível.

create or replace function app.trava_de_apagar_feedback()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  liberado boolean;
begin
  select e.status = 'liberado' into liberado
    from public.encontro e where e.id = old.encontro_id;

  if coalesce(liberado, false) then
    raise exception
      'RN-06/RN-18: feedback de encontro liberado não é apagado'
      using errcode = 'check_violation';
  end if;

  return old;
end;
$$;

drop trigger if exists feedback_trava_apagar on public.feedback;

create trigger feedback_trava_apagar
  before delete on public.feedback
  for each row execute function app.trava_de_apagar_feedback();
