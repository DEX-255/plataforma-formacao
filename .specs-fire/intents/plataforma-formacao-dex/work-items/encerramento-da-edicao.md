---
id: encerramento-da-edicao
title: Encerramento da edição
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: pending
depends_on: [turma-e-cobertura]
created: 2026-08-06T00:26:01Z
---

# Work Item: Encerramento da edição

## Description

`RF-A4`. A transição `ativa → encerrada`: o PS acabou, o acesso dos participantes é
revogado, e os dados permanecem para que os documentos possam ser gerados de novo anos
depois.

## Acceptance Criteria

- [ ] Confirmação que **nomeia a consequência**: os participantes perdem o acesso
- [ ] Depois de encerrada, login de participante daquela edição é recusado com mensagem
      de encerramento e o caminho para receber o documento (`RN-13`)
- [ ] Mentor continua acessando tudo em **modo arquivo**
- [ ] `RN-13` aplicada na política do banco, não só na tela
- [ ] **Nada é apagado** (`RN-18`) — encerrar arquiva
- [ ] Tela de encerramento informa por quanto tempo os dados ficam guardados
- [ ] Teste de ciclo de vida: edição encerrada derruba acesso de participante, incluindo
      sessão já aberta

## Technical Notes

**Aprovados e não aprovados perdem o acesso igualmente.** O que sobra para todos é o
documento final — e isso é decisão de produto, não limitação: manter aprovado dentro e
não aprovado fora transformaria a plataforma em placar.

**A retenção é escolha, não inércia.** Os dados sobrevivem porque o documento precisa ser
reproduzível (`RN-18`), e a tela diz isso em vez de deixar implícito.

Existe também um **direito de saída**: o participante pode pedir exclusão dos dados dele.
Não há tela para isso na v1 — é procedimento manual documentado, e o texto de
transparência informa para quem pedir.

## Dependencies

- turma-e-cobertura
