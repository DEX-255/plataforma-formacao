---
id: run-dex-012
scope: single
work_items:
  - id: encerramento-da-edicao
    intent: plataforma-formacao-dex
    mode: confirm
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-11T21:28:20.278Z
completed: 2026-08-11T21:28:20.368Z
---

# Run: run-dex-012

## Scope
single (1 work item)

## Work Items
1. **encerramento-da-edicao** (confirm) — completed


## Current Item
(all completed)

## Files Created
- `supabase/migrations/20260811220000_encerramento.sql`: Gatilho de edição, situacao_do_participante e correção de RN-13 na RPC
- `src/dominio/encerramento.ts`: RF-A4 e os textos que nomeiam a consequência
- `src/app/(app)/encerrar/page.tsx`: RF-A4
- `testes/encerramento.test.ts`: Textos e transição
- `testes/encerramento-db.test.ts`: RN-13 e RN-18 contra o banco

## Files Modified
(none)

## Decisions
- **Reabrir edição**: Proibido por gatilho (Devolver acesso a quem já foi avisado faria a plataforma desmentir o que disse)
- **Distinguir encerrada de sem-participação**: Função security definer devolvendo só o rótulo (A RLS torna as duas indistinguíveis, e quem terminou a formação veria mensagem de cadastro incompleto)
- **RN-13 dentro do security definer**: A RPC da caixa passou a exigir edição ativa (Ela pula a RLS por desenho; quem pula herda a obrigação de repetir a regra)


## Summary

- Work items completed: 1
- Files created: 5
- Files modified: 0
- Tests added: 24
- Coverage: 0%
- Completed: 2026-08-11T21:28:20.368Z
