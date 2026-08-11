-- ═══════════════════════════════════════════════════════════════════════════
-- Ciclo de vida do encontro — specs/02, seção "Ciclo de vida do encontro"
--
--   rascunho ──────► aberto ──────► liberado
--
-- A política `encontro_mentor` permite ao mentor escrever em `encontro`, e é
-- assim que tem que ser: ele cria, edita tema e abre. O que ela não sabe dizer
-- é **para onde** o estado pode ir.
--
-- Sem esta guarda, um `update` direto levaria `liberado` de volta para
-- `aberto`. A tela nunca ofereceria isso, mas "a tela não oferece" não é uma
-- garantia: ação de servidor é alcançável por quem souber o endereço, e a API
-- REST do PostgREST está exposta com o mesmo token. Voltar de `liberado` é
-- irreparável — o feedback já foi lido e a caixa anônima já fechou.
--
-- Gatilho e não `check`: a restrição é sobre a transição, e um `check` só
-- enxerga a linha nova.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function app.transicao_de_encontro()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    if not (
      (old.status = 'rascunho' and new.status = 'aberto') or
      (old.status = 'aberto'   and new.status = 'liberado')
    ) then
      raise exception
        'transição de encontro inválida: % → %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;

  -- `liberado_em` é o carimbo de quando os participantes passaram a ler.
  -- `liberar_encontro()` já o preenche; aqui ele é garantido para qualquer
  -- caminho, porque a trajetória e o documento final leem esta coluna e uma
  -- liberação sem data seria um encontro liberado que nunca aconteceu.
  if new.status = 'liberado' and new.liberado_em is null then
    new.liberado_em := now();
  end if;

  -- RN-17 — todo dado pertence a uma edição, e mover um encontro de edição
  -- levaria junto feedback, presença e mensagens anônimas de outra turma.
  if new.edicao_id is distinct from old.edicao_id then
    raise exception 'encontro não muda de edição'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists encontro_transicao on public.encontro;

create trigger encontro_transicao
  before update on public.encontro
  for each row execute function app.transicao_de_encontro();
