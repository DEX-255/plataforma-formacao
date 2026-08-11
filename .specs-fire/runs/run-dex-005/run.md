---
id: run-dex-005
scope: single
work_items:
  - id: edicao-e-encontros
    intent: plataforma-formacao-dex
    mode: confirm
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-11T11:40:06.684Z
completed: 2026-08-11T11:40:27.816Z
---

# Run: run-dex-005

## Scope
single (1 work item)

## Work Items
1. **edicao-e-encontros** (confirm) — completed


## Current Item
(all completed)

## Files Created
- `src/dominio/encontros.ts`: Ciclo de vida do encontro e conferência de atribuição de eixos
- `supabase/migrations/20260811150000_ciclo_do_encontro.sql`: Gatilho que recusa transição inválida no banco
- `src/componentes/nav/Navegacao.tsx`: Sidebar do mentor e barra inferior no celular
- `src/app/(app)/encontros/page.tsx`: Lista de encontros com o aberto em destaque
- `src/app/(app)/encontros/acoes.ts`: Criar, abrir e salvar eixos
- `src/app/(app)/encontros/FormularioCriar.tsx`: RF-B1
- `src/app/(app)/encontros/[id]/page.tsx`: Painel do encontro
- `src/app/(app)/encontros/[id]/eixos/page.tsx`: RF-B2
- `src/app/(app)/encontros/[id]/eixos/FormularioEixos.tsx`: Atribuição com aviso ao vivo
- `testes/encontros.test.ts`: Domínio do ciclo de vida
- `testes/ciclo-encontro.test.ts`: Transições contra o banco real

## Files Modified
- `src/app/(app)/layout.tsx`: Navegação por papel: sidebar para mentor, header para participante
- `src/componentes/ui/Campo.tsx`: Componente Selecao
- `specs/05-design-system.md`: Seleção especificada antes de virar código
- `testes/rls.test.ts`: Setup deixou de usar transição liberado→aberto, agora recusada pelo gatilho

## Decisions
- **Onde garantir as transições do encontro**: Gatilho no banco, não só checagem na ação de servidor (A tela e a ação são alcançáveis por quem tem o token; voltar de liberado é irreparável porque o feedback já foi lido)
- **Texto da confirmação de criação**: Função no domínio em vez de condicional na tela (A primeira versão mandava atribuir eixos num encontro nenhum, violando RN-14; regra decidida na tela é regra que ninguém testa)
- **Navegação no celular**: Barra inferior, conforme specs/04:136 (Sidebar fixa comeria a largura da lista de nomes no dispositivo principal do mentor)


## Summary

- Work items completed: 1
- Files created: 11
- Files modified: 4
- Tests added: 34
- Coverage: 0%
- Completed: 2026-08-11T11:40:27.816Z
