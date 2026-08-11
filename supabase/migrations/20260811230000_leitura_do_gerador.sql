-- ═══════════════════════════════════════════════════════════════════════════
-- D-07 — o gerador do documento final consegue ler.
--
-- `service_role` ignora RLS, mas **não** dispensa privilégio de tabela. A
-- migração de RLS concedeu acesso a `authenticated` e a mais ninguém, então o
-- gerador — que roda como script, sem sessão — batia em `permission denied for
-- table edicao` e não lia nada.
--
-- Descoberto rodando o gerador pela primeira vez, não em revisão: `D-07` estava
-- escrito na arquitetura desde o começo e nunca tinha sido exercitado.
--
-- ── Só leitura, de propósito ──────────────────────────────────────────────
--
-- O gerador lê para montar o documento e não escreve nada. Conceder escrita
-- daria à chave que ignora RLS um poder que nenhum caminho do produto usa — e
-- chave com poder sobrando é chave que um dia é usada para outra coisa.
--
-- `RN-18` também depende disso: se o gerador não pode apagar, um engano no
-- script não leva o arquivo da formação junto.
-- ═══════════════════════════════════════════════════════════════════════════

grant usage on schema public to service_role;

grant select on all tables in schema public to service_role;

-- Tabela criada depois desta migração já nasce legível para o gerador; sem
-- isto, acrescentar uma tabela quebraria o documento só no fim do semestre,
-- quando ele roda.
alter default privileges in schema public
  grant select on tables to service_role;

comment on schema public is
  'D-07: service_role tem SELECT e nada mais. A chave que ignora RLS existe só '
  'para o gerador do documento final, que lê e não escreve.';
