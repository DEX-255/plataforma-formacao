-- ═══════════════════════════════════════════════════════════════════════════
-- A liberação, inteira, numa transação só — RF-B4, RN-08.
--
-- `specs/02`: no instante da liberação, três coisas acontecem ao mesmo tempo.
-- Elas já eram atômicas por construção, e vale dizer por quê: nenhuma delas é
-- uma escrita separada. Todas as três leem `encontro.status`, então **um único
-- UPDATE as dispara juntas**:
--
--   feedback aparece      → a view `feedback_visivel` filtra status = 'liberado'
--   caixa anônima fecha   → `enviar_mensagem_anonima` exige status = 'aberto'
--   mensagens aos mentores → a policy `mensagem_mentor_le` exige 'liberado'
--
-- O que **não** estava aqui é a quarta coisa, e sem ela `RN-08` não vale.
--
-- ── A reordenação física ──────────────────────────────────────────────────
--
-- O design doc de `esquema-e-rls` identificou que a ausência de coluna não
-- basta: `mensagem_anonima` e `mensagem_enviada` são escritas na mesma
-- transação, uma linha em cada, então a n-ésima linha física de uma
-- corresponde à n-ésima da outra — e a outra TEM o `participacao_id`. Um
-- `select ctid, * from ...` nas duas tabelas reidentifica a turma inteira.
--
-- A mitigação prevista era `CLUSTER` na liberação, e o comentário daquela
-- migração dizia que ele teria de rodar **fora** de transação, porque não
-- rodaria dentro de função. **Isso está errado**, verificado neste Postgres:
-- `CLUSTER <tabela> USING <índice>` roda em transação e dentro de plpgsql.
--
-- A diferença não é de elegância. Fora da transação existiria uma janela entre
-- o commit do status e o CLUSTER em que as mensagens já estariam legíveis para
-- os mentores **na ordem de inserção** — exatamente o vazamento que a medida
-- existe para fechar, e no único instante em que alguém tem motivo para olhar.
-- Aqui dentro, não existe instante nenhum em que as duas coisas estejam
-- separadas.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.liberar_encontro(p_encontro uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if not app.e_mentor() then
    raise exception 'só mentor libera encontro';
  end if;

  update public.encontro
     set status = 'liberado', liberado_em = now()
   where id = p_encontro and status = 'aberto';

  if not found then
    raise exception 'encontro não está aberto';
  end if;

  -- RN-08 — não basta exibir embaralhado, precisa ESTAR embaralhado.
  --
  -- Reescreve a tabela na ordem de `(encontro_id, ordem_aleatoria)`, destruindo
  -- a correlação entre ordem física e ordem de inserção. São dezenas de linhas
  -- por encontro; o `access exclusive` dura o suficiente para ninguém notar.
  --
  -- Reordena a tabela inteira, não só este encontro — o índice cobre os dois
  -- casos e as mensagens de encontros ainda abertos voltam a ser embaralhadas
  -- quando chegar a vez deles.
  cluster public.mensagem_anonima using mensagem_anonima_ordem_idx;
end;
$$;

revoke all on function public.liberar_encontro(uuid) from public, anon;
grant execute on function public.liberar_encontro(uuid) to authenticated;

comment on function public.liberar_encontro(uuid) is
  'RF-B4. Libera o encontro e reordena fisicamente mensagem_anonima na mesma '
  'transação — sem isso, RN-08 cai por ctid. Irreversível: não há volta de '
  'liberado para aberto (gatilho encontro_transicao).';
