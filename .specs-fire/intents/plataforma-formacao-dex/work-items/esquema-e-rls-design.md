---
id: esquema-e-rls-design
work_item: esquema-e-rls
intent: plataforma-formacao-dex
run: run-dex-001
created: 2026-08-07T21:50:00Z
---

# Design: Esquema do banco e políticas de RLS

`specs/06` já traz o SQL das tabelas. O que **não** existe escrito são as políticas — e é
nelas que `RN-03` e `RN-08` vivem ou morrem. Este documento resolve as quatro decisões
que o SQL não pode tomar sozinho.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Como a política lê o papel | Função `stable security definer` lendo a tabela `usuario` | `D-01` — papel em claim de JWT fica velho, e `RN-11` exige que remover da lista derrube o acesso na requisição seguinte |
| Onde entra "edição encerrada" | Dentro da própria policy | `RN-13` é condição de acesso, não verificação de tela |
| Como o participante lê feedback | View `security definer` com filtro embutido; tabela `feedback` negada a ele | RLS do Postgres é por linha, não por coluna. Coluna que não existe na view não vaza nem por consulta mal escrita |
| Como a mensagem anônima é gravada | Função RPC que escreve nas duas tabelas numa transação e **não devolve o id** | Devolver o id criaria, no cliente, exatamente o vínculo que o esquema evita |

## O vazamento que o esquema da spec não cobre

`specs/06` garante que nenhuma **coluna** liga `mensagem_anonima` ao autor. Mas o
Postgres guarda uma coisa que não é coluna: a **ordem física das linhas** (`ctid`).

As duas tabelas são escritas na mesma transação, uma linha em cada, por participante. Ou
seja: a n-ésima linha física de `mensagem_anonima` corresponde à n-ésima linha física de
`mensagem_enviada` — que **tem** o `participacao_id`. Quem tiver acesso direto ao banco
reidentifica todo mundo com um `select ctid, * from ...` nas duas tabelas e um zíper
entre elas.

Isso derruba `RN-08` sob exatamente o modelo de ameaça que `specs/07` manda testar:
*"tentar reidentificar o autor tendo acesso total ao banco"*. A ausência de coluna não
basta; a ausência precisa valer também para a ordem.

**Mitigação:** no momento da liberação, `CLUSTER mensagem_anonima USING
mensagem_anonima_ordem_idx` reescreve fisicamente a tabela na ordem de
`ordem_aleatoria`. A correlação entre ordem física e ordem de inserção deixa de existir
antes de qualquer mentor poder ler as mensagens. São dezenas de linhas por encontro —
custo desprezível.

É a mesma ideia do `ordem_aleatoria` da spec, levada até onde ela precisava ir: não basta
**exibir** embaralhado, precisa **estar** embaralhado.

> **Correção, na implementação de `liberacao-do-encontro`.** Este documento dizia que o
> `CLUSTER` teria de rodar **fora** de transação, "porque não roda dentro de função", e o
> comentário na migração de RLS repetia isso. Está errado, verificado neste Postgres:
> `CLUSTER <tabela> USING <índice>` roda em transação e dentro de plpgsql — o que não roda
> é o `CLUSTER` sem argumentos.
>
> A diferença não é de elegância. Fora da transação existiria uma janela entre o commit do
> status e o `CLUSTER` em que as mensagens já estariam legíveis para os mentores **na ordem
> de inserção** — exatamente o vazamento que a medida fecha, e no único instante em que
> alguém teria motivo para olhar. O `CLUSTER` agora vive dentro de `liberar_encontro()`.

## Camadas, e o que cada uma cobre

```
participante ──► view feedback_visivel   (sem as colunas de nota)
             ──► tabela feedback         ACESSO NEGADO por policy

mentor       ──► tabela feedback         leitura completa da edição
                                          escrita só das próprias linhas
```

A view é `security definer` de propósito: ela **atravessa** a policy da tabela base. Isso
significa que o `where` dentro da view **é** a fronteira de segurança, e é por isso que
ele é testado contra um participante real e contra um segundo participante.

## Funções auxiliares

| Função | Retorna | Uso |
|---|---|---|
| `app.papel_atual()` | `papel` | Papel do usuário autenticado, lido da tabela |
| `app.e_mentor()` | `boolean` | Açúcar sobre a anterior |
| `app.minha_participacao(edicao)` | `uuid` | Participação do usuário, só em edição `ativa` |
| `app.enviar_mensagem_anonima(encontro, texto)` | `void` | Escreve nas duas tabelas, sem devolver id |

Todas `security definer` com `search_path` fixo — função `security definer` com
`search_path` mutável é escada de privilégio.

## Riscos

| Risco | Mitigação |
|---|---|
| `where` da view errado vaza feedback de outro participante | Teste com dois participantes reais, um lendo o outro |
| View passa a expor coluna de nota numa alteração futura | Teste que lista as colunas da view e falha se `nota` aparecer |
| Alguém insere em `mensagem_anonima` direto, sem marcar `mensagem_enviada` | `insert` negado na tabela; só a RPC escreve |
| Ordem física reidentifica autor | `CLUSTER` na liberação, mais teste de reidentificação |
| Edição encerrada continua servindo dados | Condição dentro da policy, mais teste |

## Checklist

- [ ] Migração com enums, tabelas, índices e `check`s de `specs/06`
- [ ] Funções auxiliares em `security definer` com `search_path` fixo
- [ ] RLS ligada em **todas** as tabelas, com `revoke` do padrão
- [ ] View `feedback_visivel` sem as colunas do bloco interno
- [ ] RPC de mensagem anônima, sem retorno
- [ ] `CLUSTER` na liberação
- [ ] Suíte de testes contra o banco de verdade, com dois participantes e um mentor
