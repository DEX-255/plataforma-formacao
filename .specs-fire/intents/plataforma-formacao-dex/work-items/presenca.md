---
id: presenca
title: Presença por encontro
intent: plataforma-formacao-dex
complexity: low
mode: autopilot
status: completed
depends_on:
  - edicao-e-encontros
created: 2026-08-06T00:26:01Z
run_id: run-dex-010
completed_at: 2026-08-11T21:04:28.324Z
---

# Work Item: Presença por encontro

## Description

`RF-C1` e `RF-C2`. Simples de construir, mas com uma consequência que não é óbvia: sem
presença, a tela de cobertura vira alarme falso toda semana, apontando como "buraco de
atenção" quem simplesmente faltou.

## Acceptance Criteria

- [ ] Lista da turma com três estados: presente, ausente, justificado
- [ ] **Marcação em massa**: "todos presentes" e depois só corrigir as exceções — que é
      como isso funciona na prática
- [ ] Editável enquanto o encontro não estiver liberado
- [ ] Onde a cobertura for exibida, quem faltou aparece **como falta, não como buraco**
      (`RF-C2`)
- [ ] Presença aparece na trajetória do participante

## Technical Notes

O caminho real é o mentor abrir a lista no fim do encontro e desmarcar três pessoas.
Construir "marcar um por um" como fluxo principal transforma trinta segundos em três
minutos, e o mentor para de marcar.

## Dependencies

- edicao-e-encontros
