---
id: run-dex-013
scope: single
work_items:
  - id: documento-final
    intent: plataforma-formacao-dex
    mode: validate
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-11T22:38:08.128Z
completed: 2026-08-11T22:38:08.235Z
---

# Run: run-dex-013

## Scope
single (1 work item)

## Work Items
1. **documento-final** (validate) — completed


## Current Item
(all completed)

## Files Created
- `.specs-fire/.../documento-final-design.md`: Design doc — a ordem de leitura
- `src/dominio/documento.ts`: Ordem das seções e os textos de RF-H2
- `documento/dados.ts`: D-07 — a única casa da service_role
- `documento/gerar.ts`: HTML + CSS de impressão
- `documento/cli.ts`: RF-H3 — prévia e lote
- `supabase/migrations/20260811230000_leitura_do_gerador.sql`: D-07 — o grant que faltava
- `testes/documento.test.ts`: A ordem como invariante
- `testes/documento-gerado.test.ts`: Reprodutibilidade e guarda de D-07

## Files Modified
(none)

## Decisions
- **Ordem de leitura**: Palavras antes de números; legenda antes do gráfico (Quem lê 2 de 5 sem contexto lê reprovação, e não chega no resto)
- **Resultado do PS**: Fora do documento (Um PDF que carrega veredito é um PDF que não se abre — e aí a pessoa também não lê o feedback)
- **Comparação com a turma**: Nenhuma (Devolver comparação a quem recebe transforma acompanhamento em placar)
- **Privilégio da service_role**: Só SELECT (Chave com poder sobrando é chave que um dia é usada para outra coisa)


## Summary

- Work items completed: 1
- Files created: 8
- Files modified: 0
- Tests added: 35
- Coverage: 0%
- Completed: 2026-08-11T22:38:08.235Z
