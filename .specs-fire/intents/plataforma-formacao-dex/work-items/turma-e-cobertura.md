---
id: turma-e-cobertura
title: Turma e cobertura de feedback
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: completed
depends_on:
  - registrar-feedback
  - presenca
created: 2026-08-06T00:26:01Z
run_id: run-dex-011
completed_at: 2026-08-11T21:19:27.112Z
---

# Work Item: Turma e cobertura de feedback

## Description

`RF-G1` e `RF-G2`. A visão de turma e o perfil do participante pelos olhos do mentor.

Esta é a **defesa contra o terceiro problema do produto**: como todo mentor pode observar
qualquer participante, alguns recebem quinze observações e outros duas — e a diferença
não é mérito, é acaso. Sem esta tela, o corte do PS premia quem por acaso recebeu mais
atenção.

## Acceptance Criteria

- [ ] Lista dos participantes com total de feedbacks, encontros com e sem feedback,
      presenças e média por eixo
- [ ] **Destaque para quem está abaixo da cobertura da turma** — quem tem menos registros
      que o restante
- [ ] Quem faltou aparece como falta, não como buraco de atenção (`RF-C2`)
- [ ] Perfil do participante com tudo: bloco visível **e** interno, notas, presença,
      evolução por eixo
- [ ] Gráfico de evolução em **SVG à mão**, sem biblioteca — três linhas, até cinco
      pontos por canal
- [ ] `RN-07` respeitado no gráfico: "não observado" não vira zero nem some da série
- [ ] No celular, cartões empilhados — **a turma não é planilha**
- [ ] Só mentor acessa, verificado no servidor

## Technical Notes

**"Não observado" é o detalhe que faz o gráfico mentir ou não.** Se um encontro em que o
mentor não teve como observar virar um ponto baixo na linha, o gráfico inventa uma queda
que não existiu — e esse gráfico vai para o documento final da pessoa. Tratar como
descontinuidade da série, visualmente marcada.

**O perfil do participante é a tela consultada na decisão do corte.** Ela precisa
suportar leitura demorada, lado a lado com outra pessoa, provavelmente no computador. É a
única tela do mentor que não é desenhada primeiro no celular.

## Dependencies

- registrar-feedback
- presenca
