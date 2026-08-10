-- ═══════════════════════════════════════════════════════════════════════════
-- Provisionamento de acesso — RF-A1, RN-11, RN-13
--
-- O problema que esta função resolve: no retorno do Google, a pessoa está
-- autenticada mas ainda não existe em `usuario`. Sem linha em `usuario`,
-- `app.papel_atual()` devolve nulo, e a RLS nega a leitura de
-- `email_autorizado` — que é justamente a tabela que decide se ela entra.
--
-- A saída óbvia seria usar a `service_role` no retorno do login. Ela violaria
-- `D-07`: aquela chave ignora RLS por inteiro e existe só para o gerador do
-- documento final. Uma função `security definer` faz o mínimo necessário e
-- nada além.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.provisionar_acesso(
  p_nome   text,
  p_avatar text default null
)
-- Devolve jsonb, e não uma tabela com colunas nomeadas, por um motivo prático:
-- parâmetro de saída chamado `edicao_id` ou `papel` entra no escopo do plpgsql
-- e passa a colidir com as colunas de mesmo nome dentro dos INSERTs. O erro
-- aparece só em tempo de execução, num caminho que é o de login.
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_auth   record;
  v_status status_ed;
begin
  if v_uid is null then
    raise exception 'sem sessão';
  end if;

  select u.email into v_email from auth.users u where u.id = v_uid;

  -- RN-11: autenticar no Google não autoriza nada.
  select ea.* into v_auth
    from public.email_autorizado ea
   where lower(btrim(ea.email)) = lower(btrim(v_email));

  if not found then
    return jsonb_build_object('resultado', 'nao-autorizado');
  end if;

  select e.status into v_status from public.edicao e where e.id = v_auth.edicao_id;

  -- RN-13: encerrada revoga o participante e mantém o mentor em modo arquivo.
  if v_status = 'encerrada' and v_auth.papel = 'participante' then
    return jsonb_build_object('resultado', 'edicao-encerrada');
  end if;

  -- Nome e foto vêm do perfil Google, sem formulário (RF-A1). O papel vem da
  -- lista, nunca do que o cliente mandou.
  insert into public.usuario (id, email, nome, avatar_url, papel)
  values (v_uid, v_email, coalesce(nullif(btrim(p_nome), ''), v_email), p_avatar, v_auth.papel)
  on conflict (id) do update
     set nome       = excluded.nome,
         avatar_url = excluded.avatar_url,
         papel      = excluded.papel;

  if v_auth.papel = 'participante' then
    insert into public.participacao (usuario_id, edicao_id)
    values (v_uid, v_auth.edicao_id)
    on conflict (usuario_id, edicao_id) do nothing;
  end if;

  return jsonb_build_object(
    'resultado', 'entra',
    'papel',     v_auth.papel,
    'edicao_id', v_auth.edicao_id
  );
end;
$$;

revoke all on function public.provisionar_acesso(text, text) from public, anon;
grant execute on function public.provisionar_acesso(text, text) to authenticated;
