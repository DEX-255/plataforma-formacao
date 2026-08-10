---
id: auth-login-google
title: Login com Google, sessão e proteção de rota
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: completed
depends_on:
  - esquema-e-rls
  - regras-de-dominio
created: 2026-08-06T00:26:01Z
run_id: run-dex-002
completed_at: 2026-08-08T17:24:20.754Z
---

# Work Item: Login com Google, sessão e proteção de rota

## Description

A porta de entrada: `RF-A1`, `RF-A3` e `RF-I2`. Login exclusivamente com Google, sem
senha, sem cadastro, sem recuperação. Autenticar no Google **não autoriza nada** — o
e-mail precisa estar na lista (`RN-11`).

## Acceptance Criteria

- [ ] Tela `/entrar` na direção **3e**: fundo papel, card de borda dura com sombra
      sólida, selo rotacionado, um botão do Google no lugar dos campos do mock
- [ ] Uma linha explicando que o acesso é restrito aos membros da formação — para quem
      chegou por curiosidade não tentar e achar que quebrou
- [ ] E-mail na lista entra e cai na tela inicial **do papel dele**
- [ ] E-mail fora da lista recebe recusa explicativa com contato, e **não cria conta
      órfã**
- [ ] Primeiro acesso preenche nome e foto do perfil Google, sem formulário
- [ ] Papel lido do banco **a cada requisição**, nunca de claim de JWT (`D-01`)
- [ ] Remover um e-mail da lista derruba o acesso **na requisição seguinte**, sem esperar
      a sessão expirar
- [ ] Sessão persiste entre visitas — o mentor não faz login toda semana no corredor
- [ ] Proteção de rota por papel, no servidor: participante em rota de mentor recebe
      recusa clara, não tela vazia
- [ ] Quatro estados na tela: padrão · autenticando · e-mail não autorizado · edição
      encerrada (com o caminho para receber o documento)
- [ ] Teste: participante tentando abrir rota de mentor, pela aplicação **e** direto
      contra a API

## Technical Notes

**A recusa é tela de produto, não erro de sistema.** Quem cai nela é um estudante que
tentou entrar e não pôde — provavelmente alguém que não passou nas duas primeiras fases
do PS, ou digitou a conta errada. O texto precisa ser gentil e dizer com quem falar.

**Contas ainda não criadas:** Supabase e o projeto no Google Cloud para o OAuth. É
pré-requisito operacional deste item, e `pendencias.md` pede que fiquem no nome de
alguém que continue na DEX.

## Dependencies

- esquema-e-rls
- regras-de-dominio
