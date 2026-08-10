-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — specs/06, seção RLS · design em .specs-fire/.../esquema-e-rls-design.md
--
-- Estas políticas são a última linha de defesa das regras de privacidade.
-- Funcionam mesmo que uma tela erre, e continuam de pé quando a renderização
-- no servidor falha. RN-03 é a regra que não pode falhar.
-- ═══════════════════════════════════════════════════════════════════════════

create schema if not exists app;

-- ── Funções auxiliares ─────────────────────────────────────────────────────
-- Todas com search_path fixo: função security definer com search_path mutável
-- é escada de privilégio.

-- D-01 — o papel vem da tabela, verificado a cada requisição. Papel em claim
-- de JWT fica velho quando alguém é removido, e RN-11 exige que remover da
-- lista derrube o acesso na requisição seguinte.
create or replace function app.papel_atual()
returns papel
language sql stable security definer
set search_path = public, pg_temp
as $$
  select u.papel from public.usuario u where u.id = auth.uid();
$$;

create or replace function app.e_mentor()
returns boolean
language sql stable security definer
set search_path = public, pg_temp
as $$
  select coalesce(app.papel_atual() = 'mentor', false);
$$;

-- RN-13 — edição encerrada não devolve participação nenhuma, e com isso todo
-- acesso de participante cai junto.
create or replace function app.minhas_participacoes()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.id
  from public.participacao p
  join public.edicao e on e.id = p.edicao_id
  where p.usuario_id = auth.uid()
    and e.status = 'ativa';
$$;

create or replace function app.minhas_edicoes()
returns setof uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select p.edicao_id
  from public.participacao p
  join public.edicao e on e.id = p.edicao_id
  where p.usuario_id = auth.uid()
    and e.status = 'ativa';
$$;

-- ── Privilégios ────────────────────────────────────────────────────────────

revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
grant usage on schema app to authenticated;

-- O privilégio de tabela é aberto de propósito: quem filtra é a RLS, linha a
-- linha, e não o GRANT. Fechar por GRANT esconderia erro de política — uma
-- consulta barrada por falta de permissão passaria no teste sem provar nada
-- sobre a policy. Aberto aqui, a policy é a única coisa entre o participante
-- e a nota, e é ela que os testes exercitam.
grant select, insert, update, delete
  on all tables in schema public to authenticated;

alter table edicao            enable row level security;
alter table usuario           enable row level security;
alter table email_autorizado  enable row level security;
alter table participacao      enable row level security;
alter table encontro          enable row level security;
alter table atribuicao_eixo   enable row level security;
alter table presenca          enable row level security;
alter table feedback          enable row level security;
alter table mensagem_anonima  enable row level security;
alter table mensagem_enviada  enable row level security;

-- ── Edição ─────────────────────────────────────────────────────────────────

create policy edicao_mentor on edicao
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

create policy edicao_participante on edicao
  for select to authenticated
  using (id in (select app.minhas_edicoes()));

-- ── Usuário ────────────────────────────────────────────────────────────────
-- O participante lê a si mesmo e aos mentores: RN-04 exige que o feedback
-- visível seja assinado, e assinatura sem nome não é assinatura.

create policy usuario_mentor on usuario
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

create policy usuario_participante on usuario
  for select to authenticated
  using (id = auth.uid() or papel = 'mentor');

-- ── Lista de acesso — só mentor ────────────────────────────────────────────

create policy email_autorizado_mentor on email_autorizado
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

-- ── Participação ───────────────────────────────────────────────────────────
-- RN-12: participante só enxerga a si mesmo. Nunca a turma, nunca a cobertura.

create policy participacao_mentor on participacao
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

create policy participacao_propria on participacao
  for select to authenticated
  using (id in (select app.minhas_participacoes()));

-- ── Encontro ───────────────────────────────────────────────────────────────
-- Rascunho é invisível para participante (specs/02, ciclo de vida).

create policy encontro_mentor on encontro
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

create policy encontro_participante on encontro
  for select to authenticated
  using (
    edicao_id in (select app.minhas_edicoes())
    and status <> 'rascunho'
  );

-- ── Atribuição de eixo — só mentor ─────────────────────────────────────────

create policy atribuicao_mentor on atribuicao_eixo
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

-- ── Presença ───────────────────────────────────────────────────────────────

create policy presenca_mentor on presenca
  for all to authenticated
  using (app.e_mentor()) with check (app.e_mentor());

create policy presenca_propria on presenca
  for select to authenticated
  using (participacao_id in (select app.minhas_participacoes()));

-- ── Feedback ───────────────────────────────────────────────────────────────
-- RN-03. O participante NÃO tem policy nenhuma aqui: RLS nega por padrão, e
-- ele lê exclusivamente pela view feedback_visivel, que não tem as colunas do
-- bloco interno. RLS do Postgres é por linha, não por coluna — é por isso que
-- a view existe em vez de uma policy mais esperta.

create policy feedback_mentor_le on feedback
  for select to authenticated
  using (app.e_mentor());

-- RN-06: ninguém edita feedback de outro mentor.
create policy feedback_mentor_escreve on feedback
  for insert to authenticated
  with check (app.e_mentor() and mentor_id = auth.uid());

create policy feedback_mentor_atualiza on feedback
  for update to authenticated
  using (app.e_mentor() and mentor_id = auth.uid())
  with check (app.e_mentor() and mentor_id = auth.uid());

create policy feedback_mentor_apaga on feedback
  for delete to authenticated
  using (app.e_mentor() and mentor_id = auth.uid());

-- A view atravessa a policy da tabela base de propósito. O `where` daqui É a
-- fronteira de segurança do participante — por isso ele é testado contra dois
-- participantes reais, um tentando ler o outro.
create view feedback_visivel
with (security_invoker = false) as
  select
    f.id,
    f.encontro_id,
    f.participacao_id,
    f.mentor_id,
    f.eixo,
    f.situacao,
    f.ponto,
    f.sugestao
  from feedback f
  join encontro e on e.id = f.encontro_id
  where e.status = 'liberado'                                    -- RN-05
    and f.participacao_id in (select app.minhas_participacoes()); -- RN-12, RN-13

grant select on feedback_visivel to authenticated;

-- ── Mensagem anônima ───────────────────────────────────────────────────────
-- RN-08. Nenhum insert direto: só a RPC escreve, e ela não devolve o id —
-- devolver criaria no cliente exatamente o vínculo que o esquema evita.

create policy mensagem_mentor_le on mensagem_anonima
  for select to authenticated
  using (
    app.e_mentor()
    and exists (
      select 1 from encontro e
      where e.id = encontro_id and e.status = 'liberado'
    )
  );

create policy enviada_mentor_le on mensagem_enviada
  for select to authenticated
  using (app.e_mentor());

-- O participante lê só a própria marca, para a tela saber dizer "você já
-- enviou" sem mostrar o que ele escreveu.
create policy enviada_propria on mensagem_enviada
  for select to authenticated
  using (participacao_id in (select app.minhas_participacoes()));

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
  where p.usuario_id = auth.uid()
    and e.status = 'aberto';   -- a caixa fecha na liberação

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

-- ── Liberação ──────────────────────────────────────────────────────────────
-- specs/02: três coisas ao mesmo tempo — feedbacks aparecem, caixa fecha,
-- mensagens ficam visíveis aos mentores. A simultaneidade é proposital.

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
end;
$$;

revoke all on function public.liberar_encontro(uuid) from public, anon;
grant execute on function public.liberar_encontro(uuid) to authenticated;

-- Reordenação física das mensagens. Ver o design doc: a ausência de coluna não
-- basta, porque a ordem física das linhas (ctid) das duas tabelas é a mesma
-- ordem de inserção, e mensagem_enviada TEM o participacao_id. Rodar depois de
-- liberar, antes de qualquer mentor ler.
-- Fora de transação de propósito: CLUSTER não roda dentro de função.
comment on index mensagem_anonima_ordem_idx is
  'Usado por: CLUSTER mensagem_anonima USING mensagem_anonima_ordem_idx';
