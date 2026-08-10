---
id: esquema-e-rls
title: Esquema do banco e políticas de RLS
intent: plataforma-formacao-dex
complexity: high
mode: validate
status: completed
depends_on:
  - fundacao-projeto
created: 2026-08-06T00:26:01Z
run_id: run-dex-001
completed_at: 2026-08-07T21:56:47.832Z
---

# Work Item: Esquema do banco e políticas de RLS

## Description

Criar o esquema de `specs/06` como migração versionada e escrever as políticas de RLS.

**É o item mais perigoso do projeto.** Aqui moram `RN-03` e `RN-08` — as duas regras
cuja violação é irreversível: nota vazada não desvaza, e autor de mensagem anônima
identificado uma vez destrói a caixa para sempre. Tudo o que vem depois presume que esta
camada está correta.

O esquema SQL já está escrito em `specs/06`. As **políticas não** — a spec traz a tabela
de quem lê o quê, mas a forma concreta delas é a decisão deste item.

## Acceptance Criteria

- [ ] Enums e tabelas de `specs/06` em migração versionada em `supabase/migrations`
- [ ] `check (length(btrim(sugestao)) > 0)` presente → `RN-01` garantido pelo banco
- [ ] `check (nao_observado = (nota is null))` presente → `RN-07`
- [ ] `unique (encontro_id, participacao_id, mentor_id, eixo)` presente
- [ ] `mensagem_anonima` **sem nenhuma coluna** que aponte para autor → `RN-08`
- [ ] `mensagem_enviada` **sem coluna de horário** → `RN-10`
- [ ] Nenhuma FK com `on delete cascade` em lugar nenhum → `RN-18`
- [ ] View `feedback_visivel` **sem as colunas `nota` e `observacao_interna`**, expondo
      só a própria participação e só com encontro `liberado`
- [ ] Tabela `feedback` **negada** ao papel participante por política
- [ ] Políticas versionadas em `supabase/politicas/`, não clicadas no painel (`D-06`)
- [ ] Edição `encerrada` derruba toda leitura de participante → `RN-13`
- [ ] **Teste direto contra a API**, com token de participante real, sem passar pela
      interface: pedir `feedback` cru e pedir dado de outro participante retornam recusa
      ou vazio
- [ ] Teste de reidentificação: com acesso total ao banco, não é possível ligar uma
      mensagem anônima ao autor

## Technical Notes

O design doc precisa resolver três coisas antes de escrever SQL:

1. **Como a política lê o papel.** `D-01` diz papel no banco, não em claim de JWT,
   porque remover alguém da lista tem que derrubar o acesso na hora (`RN-11`). Isso
   provavelmente pede uma função `security definer` — decidir a forma e o custo por
   consulta.
2. **Como o estado da edição entra na política.** `RN-13` é condição de acesso, não
   verificação de tela. Ela precisa estar dentro da policy.
3. **Se `mensagem_anonima` e `mensagem_enviada` são escritas na mesma transação** e como
   garantir isso sem criar, no caminho, qualquer artefato que correlacione as duas.

Escrever a migração antes de aprovar esse desenho é o jeito mais provável de acabar com
uma política que parece certa e vaza.

## Dependencies

- fundacao-projeto
