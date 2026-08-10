---
id: documento-final
title: Documento final individual
intent: plataforma-formacao-dex
complexity: high
mode: validate
status: pending
depends_on: [encerramento-da-edicao]
created: 2026-08-06T00:26:01Z
---

# Work Item: Documento final individual

## Description

`RF-H1`, `RF-H2` e `RF-H3`. A peça que cada participante leva no encerramento — a única
coisa que sobra depois que o acesso acaba.

**É o momento em que a nota interna deixa de ser interna.** Durante toda a formação
`RN-03` manteve a nota escondida; aqui ela aparece, e para muita gente vai ser a primeira
vez que ela vê um número associado ao próprio desempenho — inclusive quem não passou.

## Acceptance Criteria

- [ ] Um documento por participante, **para todos, aprovados e não aprovados, com o mesmo
      conteúdo**
- [ ] Conteúdo: identificação e edição, trajetória encontro a encontro, todos os
      feedbacks visíveis **com autoria**, gráfico de evolução da oratória (até 5 pontos
      por canal), retratos das dinâmicas, presença
- [ ] `RF-H2`: **a legenda da escala vem antes do gráfico** — explica que começar em 1–2 é
      o esperado, 4 é evolução grande, 5 é fora da curva (`RN-16`). **Este requisito é
      condição para o `RF-H1` existir**
- [ ] Com a cara da DEX: é peça de design, não relatório
- [ ] HTML + CSS de impressão, PDF por Chrome headless
- [ ] Exportação em lote: todos de uma vez, um arquivo por pessoa, nomeado por
      participante
- [ ] **Reprodutível**: rodar de novo anos depois, a partir dos dados arquivados, produz o
      mesmo documento
- [ ] A `service_role` existe só em variável de ambiente de servidor e é usada **só
      aqui** — nenhum componente de cliente, nenhuma rota pública, nenhum arquivo
      versionado (`D-07`)
- [ ] Prévia de um documento antes de gerar todos
- [ ] **Lido impresso, em papel**, antes de enviar para qualquer pessoa

## Technical Notes

**O design doc precisa tratar o documento como o que ele é: uma peça entregue a alguém
que talvez tenha sido reprovado.** Ordem de leitura, tom e o que vem antes do gráfico não
são detalhe de formatação — são a diferença entre um fechamento que ajuda e um que
machuca. `RF-H2` existe porque quem lê "2 de 5" sem contexto lê reprovação.

**Retratos das dinâmicas ⏳.** Os descritores dos eixos da bomba e da negociação ainda não
existem (`pendencias.md`). O documento precisa funcionar mostrando o bloco visível dessas
dinâmicas mesmo sem escala numérica.

**Roda uma vez por semestre, local.** Não precisa ser rápido nem estar hospedado. Isso
libera orçamento para qualidade tipográfica que numa tela não caberia.

## Dependencies

- encerramento-da-edicao
