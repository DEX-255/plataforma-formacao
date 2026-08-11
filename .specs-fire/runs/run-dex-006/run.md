---
id: run-dex-006
scope: single
work_items:
  - id: registrar-feedback
    intent: plataforma-formacao-dex
    mode: validate
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-11T13:48:18.223Z
completed: 2026-08-11T14:18:54.131Z
---

# Run: run-dex-006

## Scope
single (1 work item)

## Work Items
1. **registrar-feedback** (validate) — completed


## Current Item
(all completed)

## Files Created
- `.specs-fire/intents/plataforma-formacao-dex/work-items/registrar-feedback-design.md`: Design doc — a tensão dos dois blocos
- `src/dominio/painel.ts`: Ordenação por cobertura e busca da turma
- `src/lib/rascunho.ts`: D-03 — rascunho local
- `src/componentes/ui/SeletorDeNota.tsx`: RF-D3, RN-07, RN-16
- `src/app/(app)/encontros/[id]/ListaDaTurma.tsx`: RF-D5
- `src/app/(app)/encontros/[id]/feedback/acoes.ts`: Gravar e apagar feedback
- `src/app/(app)/encontros/[id]/feedback/[participacao]/page.tsx`: RF-D2 no servidor
- `src/app/(app)/encontros/[id]/feedback/[participacao]/Formulario.tsx`: RF-D1
- `supabase/migrations/20260811160000_bloco_visivel_trava.sql`: RN-06 no banco
- `testes/painel.test.ts`: Ordenação e busca
- `testes/feedback-rn06.test.ts`: RN-06 contra o banco
- `testes/guardas-bloco-interno.test.ts`: Bloco interno não vai ao cliente
- `testes/bancada.ts`: Limpeza dos testes com gatilhos desligados

## Files Modified
(none)

## Decisions
- **Separação dos dois blocos**: Um scroll, rótulo por quem lê, com o nome real da pessoa (Não se escreve avaliação crua sob um título que diz O que a Ana vai ler; duas etapas custariam um toque por pessoa vezes quarenta)
- **Onde RN-06 é garantido**: Gatilho no banco, além da ação de servidor (A política sabe quem escreve, não quando nem o quê; reescrever texto já lido apagaria a versão que a participante guardou)
- **Otimismo do salvar**: Otimista quanto à rede, nunca quanto à validação (Navegar antes de conferir RN-01 faria a recusa chegar quando a tela que a mostraria já não existe)
- **Validação nativa do formulário**: noValidate, com a mensagem da DEX (O balão do navegador é o campo obrigatório seco que RN-01 recusa)
- **Orçamento de 120 KB de JS**: Não cumprido; devolvido como decisão de produto (O piso do React 19 + Next 16 é 134 KB — nenhuma rota do projeto cumpre, e esta custa só 9 KB acima do piso)


## Summary

- Work items completed: 1
- Files created: 13
- Files modified: 0
- Tests added: 34
- Coverage: 0%
- Completed: 2026-08-11T14:18:54.131Z
