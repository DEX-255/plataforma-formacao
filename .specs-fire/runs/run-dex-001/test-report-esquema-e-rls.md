---
run: run-dex-001
work_item: esquema-e-rls
intent: plataforma-formacao-dex
generated: 2026-08-07T21:57:00Z
status: passed
---

# Test Report: Esquema do banco e políticas de RLS

## Summary

| Categoria | Passou | Falhou |
|---|---|---|
| RLS contra o banco real | 22 | 0 |
| **Total acumulado do run** | **73** | **0** |

Os testes rodam contra o Postgres de verdade, com o papel trocado para
`authenticated` e o `sub` do JWT apontando para cada usuário — **sem passar pela
interface**. É exatamente o que um participante conseguiria fazer chamando a API do
console do navegador.

## Regras provadas

| Regra | Como foi provada |
|---|---|
| `RN-01` | `insert` com sugestão em branco recusado pelo banco, via SQL direto |
| `RN-03` | Participante lendo `feedback` cru recebe **0 linhas**; a view não tem as colunas `nota`, `observacao_interna`, `nao_observado` |
| `RN-05` | Com encontro `aberto`, a view devolve vazio; depois de `liberado`, devolve o feedback |
| `RN-06` | Segundo mentor tentando `update` no registro do primeiro afeta 0 linhas |
| `RN-07` | `nota` e `nao_observado` juntos violam o `check` |
| `RN-08` | Nenhuma coluna em comum entre `mensagem_anonima` e `mensagem_enviada` além de `encontro_id`; nenhuma FK possível |
| `RN-09` | Segunda mensagem do mesmo participante recusada |
| `RN-10` | `mensagem_enviada` só tem `encontro_id` e `participacao_id` — sem horário |
| `RN-12` | Ana pedindo explicitamente o feedback de Bruno recebe 0 linhas |
| `RN-13` | Edição encerrada zera feedback e participação do participante; mentor continua lendo |

## Um vazamento que o esquema da spec não cobria

`specs/06` garante que **nenhuma coluna** liga a mensagem ao autor. Mas o Postgres guarda
uma coisa que não é coluna: a **ordem física das linhas** (`ctid`).

As duas tabelas são escritas na mesma transação, uma linha em cada. A n-ésima linha
física de `mensagem_anonima` correspondia à n-ésima de `mensagem_enviada` — que tem o
`participacao_id`. Um `select ctid, *` nas duas e um zíper entre elas reidentificaria a
turma inteira, sob exatamente o modelo de ameaça que `specs/07` manda testar: *"tentando
reidentificar o autor tendo acesso total ao banco"*.

**Corrigido:** `CLUSTER mensagem_anonima USING mensagem_anonima_ordem_idx` reescreve a
tabela na ordem de `ordem_aleatoria` antes de qualquer mentor ler. Há teste verificando
que a ordem física passa a seguir a coluna aleatória, e não a de chegada.

A regra da spec dizia "exibir em ordem aleatória". Não bastava: precisava **estar** em
ordem aleatória.

## Descoberta sobre o método de teste

A primeira rodada teve 10 falhas com `permission denied` — as tabelas nunca tinham
recebido `GRANT` para o papel `authenticated`. O detalhe importante é o que isso
significava: **a RLS não estava sendo exercida em nenhum dos testes**. Eles teriam
passado por falta de privilégio, sem provar nada sobre as políticas.

O `GRANT` foi aberto de propósito, com comentário na migração: quem filtra é a policy,
linha a linha. Fechar por `GRANT` seria uma segunda camada que esconde erro na primeira.

## Comandos

```
npx supabase start          # sobe o Postgres local
npx supabase db reset       # reaplica as migrações do zero
npm test                    # roda tudo, inclusive os testes de RLS
```
