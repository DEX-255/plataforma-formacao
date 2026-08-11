---
id: run-dex-011
scope: single
work_items:
  - id: turma-e-cobertura
    intent: plataforma-formacao-dex
    mode: confirm
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-11T21:19:27.020Z
completed: 2026-08-11T21:19:27.112Z
---

# Run: run-dex-011

## Scope
single (1 work item)

## Work Items
1. **turma-e-cobertura** (confirm) — completed


## Current Item
(all completed)

## Files Created
- `src/dominio/cobertura.ts`: Média por eixo, cobertura e séries do gráfico
- `src/componentes/ui/GraficoDeEvolucao.tsx`: SVG à mão, RN-07 como faixa fora da escala
- `src/app/(app)/turma/page.tsx`: RF-G1
- `src/app/(app)/turma/[participacao]/page.tsx`: RF-G2
- `testes/cobertura.test.ts`: RN-07 na média e no gráfico, cor por identidade

## Files Modified
(none)

## Decisions
- **Cores da série**: Três tokens novos, validados contra a superfície do app (Rodados no validador: os candidatos óbvios reprovavam por luminosidade e por separação sob protanopia)
- **Canal de cor de cada eixo**: Índice do eixo no framework, não posição no vetor (Fala precisa ter a mesma cor em todos os documentos finais, senão eles ficam incomparáveis)
- **Marcador de não observado**: Faixa própria abaixo da escala (Dentro da escala ele lê como nota, que é o que RN-07 proíbe)
- **Critério de abaixo da cobertura**: Metade da mediana, mais o número absoluto de quem não tem nada (Abaixo da mediana marcaria metade da turma toda semana; o relativo cala quando todos estão em zero, e o absoluto não)


## Summary

- Work items completed: 1
- Files created: 5
- Files modified: 0
- Tests added: 30
- Coverage: 0%
- Completed: 2026-08-11T21:19:27.112Z
