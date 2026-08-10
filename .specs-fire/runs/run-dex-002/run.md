---
id: run-dex-002
scope: single
work_items:
  - id: auth-login-google
    intent: plataforma-formacao-dex
    mode: confirm
    status: completed
    current_phase: review
    checkpoint_state: approved
    current_checkpoint: plan
current_item: null
status: completed
started: 2026-08-08T17:17:02.969Z
completed: 2026-08-08T17:24:20.754Z
---

# Run: run-dex-002

## Scope
single (1 work item)

## Work Items
1. **auth-login-google** (confirm) — completed


## Current Item
(all completed)

## Files Created
- `src/lib/supabase/servidor.ts`: Cliente de servidor (D-02)
- `src/lib/supabase/navegador.ts`: Cliente de navegador, so para login e sair
- `src/lib/auth.ts`: Sessao e papel lido da tabela a cada requisicao (D-01)
- `src/dominio/acesso.ts`: Decisao de quem entra, isolada de Supabase e HTTP
- `src/app/(publico)/entrar/page.tsx`: Tela de login, direcao 3e
- `src/app/auth/retorno/route.ts`: Retorno do OAuth
- `supabase/migrations/20260808180000_provisionamento.sql`: provisionar_acesso: RN-11 e RN-13 no banco
- `testes/acesso.test.ts`: 13 testes da decisao de acesso
- `testes/provisionamento.test.ts`: 15 testes contra o banco real

## Files Modified
(none)

## Decisions
- **Decisao de acesso no banco, nao no handler**: funcao security definer (Usar service_role no login violaria D-07; e no banco a regra vale para qualquer caminho que crie sessao)
- **Rota desconhecida negada por padrao**: deny by default (Esquecer de declarar quem acessa uma tela nova resulta em porta fechada, nao aberta)
- **Ordem das recusas**: nao-autorizado tem precedencia (Dizer que a edicao encerrou ja entrega que existe uma edicao — quem esta de fora nao precisa saber)


## Summary

- Work items completed: 1
- Files created: 9
- Files modified: 0
- Tests added: 28
- Coverage: 0%
- Completed: 2026-08-08T17:24:20.754Z
