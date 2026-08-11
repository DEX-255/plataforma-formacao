---
id: trajetoria-do-participante
title: Trajetória do participante
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: completed
depends_on:
  - registrar-feedback
created: 2026-08-06T00:26:01Z
run_id: run-dex-007
completed_at: 2026-08-11T16:30:56.739Z
---

# Work Item: Trajetória do participante

## Description

O lado do participante: `RF-E1`, `RF-E2` e `RF-E3`. A linha do tempo dos encontros e o
encontro em detalhe.

O ritmo aqui é o **oposto** do da tela do mentor. Lá é sequência e velocidade; aqui é
para ser lido devagar — densidade baixa, tipografia grande, sugestão com peso visual
próprio. É o que a pessoa leva para a semana seguinte.

## Acceptance Criteria

- [ ] Linha do tempo vertical dos encontros, do mais recente para trás
- [ ] Cada item: número, tema, data, presença e o estado do feedback
- [ ] Encontro liberado mostra os feedbacks com **nome do mentor** e eixo (`RN-04`)
- [ ] Encontro aberto aparece como *"os feedbacks deste encontro ainda não foram
      liberados"* — nunca como vazio ambíguo
- [ ] Encontro sem avaliação aparece como **cumprido**, sem sugerir que faltou algo
- [ ] Detalhe do encontro agrupa os feedbacks **por eixo**
- [ ] Situação, ponto e sugestão visualmente distintos, com a **sugestão carregando o
      maior peso** — é a única parte acionável
- [ ] O cabeçalho do eixo traz a pergunta-âncora, que ensina o modelo sem precisar
      explicar
- [ ] `RF-E3`: antes do primeiro feedback, a trajetória explica o que vai aparecer ali e
      quando
- [ ] **Nunca** mostra nota, observação interna, ou qualquer coisa de outro participante
      (`RN-03`, `RN-12`)
- [ ] Sem sidebar — header simples com logo, nome e sair
- [ ] Teste direto contra a API: participante pedindo `feedback` cru ou dado de outro
      participante recebe recusa ou vazio

## Technical Notes

**Ver o eixo é o que ensina o modelo.** Sem ele, a pessoa lê três feedbacks como três
opiniões concorrentes e fica confusa sobre em qual acreditar. Com ele, entende que cada
mentor olhou uma coisa diferente — que é exatamente o desenho de avaliação da DEX.

**`RF-E3` não é enfeite.** Perfil vazio sem explicação, na primeira semana, faz a pessoa
achar que o sistema quebrou ou que ela foi esquecida. É a primeira impressão que a turma
inteira vai ter do produto.

**Esta tela é a prova prática de `RN-03`.** Toda leitura acontece pela view
`feedback_visivel`, no servidor. Se em algum momento o objeto completo de feedback chegar
ao navegador para "renderizar só uma parte", a regra já foi violada — mesmo que a tela
pareça certa.

## Dependencies

- registrar-feedback
