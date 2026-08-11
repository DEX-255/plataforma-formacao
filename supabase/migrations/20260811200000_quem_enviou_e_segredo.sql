-- ═══════════════════════════════════════════════════════════════════════════
-- RN-08 — a lista de quem enviou não é consultável.
--
-- A política `enviada_mentor_le` dava a qualquer mentor leitura irrestrita de
-- `mensagem_enviada`, e essa tabela tem `participacao_id`. Com a sessão de um
-- mentor comum, sem acesso privilegiado nenhum, e com o encontro ainda aberto:
--
--     select u.nome from mensagem_enviada me
--       join participacao p on p.id = me.participacao_id
--       join usuario u on u.id = p.usuario_id;
--     -->  Ana Beatriz Rocha
--
-- Com uma mensagem no encontro, a identificação é completa: o mentor sabe que
-- só a Ana escreveu, e depois da liberação lê a única mensagem que existe. Com
-- duas, é cara ou coroa.
--
-- A proteção do esquema — não existir coluna ligando mensagem a autor — **supõe
-- que a lista de quem enviou seja secreta**. Ela não estava. Isso derruba
-- RN-08 na letra: "nem um mentor com acesso ao banco consegue descobrir quem
-- escreveu".
--
-- O teste de reidentificação existente atacava pelo lado difícil (ctid, junção
-- entre as tabelas) e passava — não é preciso reidentificar nada quando a
-- tabela entrega a lista pronta.
--
-- `mensagem_enviada` existe para RN-09, uma por participante por encontro. É
-- uma trava, não uma consulta. Ninguém precisa lê-la linha a linha, e o
-- participante continua lendo a própria marca para a tela saber dizer
-- "você já enviou".
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists enviada_mentor_le on public.mensagem_enviada;

-- ── O que o mentor pode saber: quantas, nunca quem ────────────────────────
--
-- `RF-B4` exige mostrar quantas mensagens serão reveladas antes de confirmar a
-- liberação. O número não nomeia ninguém; a lista nomeava. A função devolve só
-- o inteiro, e não existe caminho dela para `participacao_id`.

create or replace function public.contar_mensagens_do_encontro(p_encontro uuid)
returns integer
language sql stable security definer
set search_path = public, pg_temp
as $$
  select case
    when app.e_mentor()
    then (select count(*)::int from public.mensagem_enviada
           where encontro_id = p_encontro)
    else 0
  end;
$$;

revoke all on function public.contar_mensagens_do_encontro(uuid) from public, anon;
grant execute on function public.contar_mensagens_do_encontro(uuid) to authenticated;

comment on function public.contar_mensagens_do_encontro(uuid) is
  'RF-B4. Quantas mensagens anônimas existem no encontro. Devolve inteiro e '
  'nada mais — a lista de quem enviou não é consultável por ninguém (RN-08).';

comment on table public.mensagem_enviada is
  'RN-09: marca que a pessoa enviou, sem apontar para o que escreveu. É trava, '
  'não consulta. Mentor NÃO lê estas linhas — ver migração 20260811200000.';
