---
id: edicao-e-encontros
title: Edição, encontros e atribuição de eixos
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: pending
depends_on: [auth-login-google]
created: 2026-08-06T00:26:01Z
---

# Work Item: Edição, encontros e atribuição de eixos

## Description

O ciclo de vida do encontro — `rascunho → aberto` — e a atribuição semanal de eixos.
Cobre `RF-B1`, `RF-B2`, `RF-B3` e `RF-B5`, mais a lista `/encontros`.

A atribuição de eixos é o que torna `RN-02` operável: cada mentor é dono de um canal
naquele encontro e só escreve sobre ele.

## Acceptance Criteria

- [ ] Criar encontro com número, tema, data e framework; nasce em `rascunho`
- [ ] **Não depende de cronograma pré-cadastrado** — as datas da formação ainda não
      existem, e o encontro é criado quando acontece
- [ ] Atribuir um eixo a cada mentor, válido só para aquele encontro
- [ ] Aviso — **não bloqueio** — quando um eixo fica sem mentor ou um mentor sem eixo
- [ ] Encontro com framework `nenhum` pula a etapa de eixos
- [ ] Abrir o encontro disponibiliza os formulários, abre a caixa anônima e faz o
      encontro aparecer na trajetória dos participantes sem feedback
- [ ] Framework `nenhum` é caminho de primeira classe (`RN-14`): entra na trajetória,
      aceita presença, não abre formulário, e **não sugere que faltou algo**
- [ ] `/encontros` lista todos com o estado de cada um; havendo encontro aberto, ele
      aparece no topo com destaque
- [ ] Transições inválidas recusadas no servidor, não só escondidas na tela

## Technical Notes

**O encontro 1 é `nenhum`.** Perfil Empreendedor não tem avaliação individual — o
objetivo é reflexão pessoal, e o encontro serve para apresentar o processo. Se a tela do
participante mostrar isso como "nenhum feedback ainda", ela mente sobre a dinâmica. Tem
que ler como encontro cumprido.

**A atribuição muda toda semana**, e é por encontro, não por edição. Modelar como estado
do mentor na edição seria mais simples e estaria errado.

## Dependencies

- auth-login-google
