---
id: membros-e-acesso
title: Membros e lista de e-mails autorizados
intent: plataforma-formacao-dex
complexity: low
mode: autopilot
status: completed
depends_on:
  - auth-login-google
created: 2026-08-06T00:26:01Z
run_id: run-dex-004
completed_at: 2026-08-08T21:43:09.669Z
---

# Work Item: Membros e lista de e-mails autorizados

## Description

A tela `/membros` (`RF-A2`): onde o mentor decide quem entra. É simples de construir e
existe cedo por um motivo operacional — sem ela, ninguém consegue usar o sistema.

## Acceptance Criteria

- [ ] Adicionar um ou vários e-mails de uma vez, colando uma lista
- [ ] Cada entrada tem papel (`participante` ou `mentor`) e edição
- [ ] Remover um e-mail bloqueia o acesso imediato **sem apagar** o que a pessoa já
      produziu ou recebeu (`RN-18`)
- [ ] A tela mostra quem já entrou e quem ainda não — é o que permite cobrar quem não
      acessou
- [ ] Só mentor acessa, verificado no servidor

## Technical Notes

Colar lista é o caminho real: os e-mails chegam de uma planilha do formulário da fase 1
do PS. Aceitar separação por vírgula, ponto e vírgula e quebra de linha, e ignorar
duplicata em silêncio em vez de recusar o lote inteiro por causa de uma repetição.

## Dependencies

- auth-login-google
