---
id: caixa-anonima
title: Caixa de mensagem anônima
intent: plataforma-formacao-dex
complexity: high
mode: validate
status: pending
depends_on: [liberacao-do-encontro]
created: 2026-08-06T00:26:01Z
---

# Work Item: Caixa de mensagem anônima

## Description

`RF-F1` e `RF-F2`. O canal de volta: o participante escreve, opcionalmente, sobre os
mentores do dia e a formação.

**É a única parte do sistema em que uma falha destrói a confiança de forma
irreversível.** Alguém critica um mentor, é identificado, e nunca mais ninguém escreve
nada — nem naquela edição, nem nas seguintes, porque a história circula.

É `high` por isso, e não pelo tamanho: em linhas de código é o menor item da fase 2.

## Acceptance Criteria

**Enviar (`RF-F1`)**

- [ ] Um campo de texto, opcional, enquanto o encontro está aberto
- [ ] A tela afirma o anonimato e **explica como ele é garantido** — que não existe
      vínculo guardado, que a ordem é embaralhada. Promessa de anonimato sem explicação
      não é acreditada, e caixa em que ninguém acredita fica vazia
- [ ] Uma mensagem por participante por encontro (`RN-09`), controlada por
      `mensagem_enviada`
- [ ] Fecha na liberação, e o participante vê quanto tempo resta
- [ ] Estados: aberta · já enviei (confirmação, **sem mostrar o que escrevi**) · fechada

**Ler (`RF-F2`)**

- [ ] Só depois da liberação, e todas juntas
- [ ] Sem autor, sem horário, em **ordem aleatória fixa** (`RN-10`)
- [ ] Sem responder, sem reagir, sem marcar como lida — não é canal de conversa

**Anonimato, verificado**

- [ ] `mensagem_anonima` e `mensagem_enviada` escritas na mesma transação, sem se
      referenciarem
- [ ] **Teste de reidentificação com acesso total ao banco.** Se for possível ligar
      mensagem a autor, é defeito de severidade máxima e o item não está pronto
- [ ] Nenhum log, métrica ou trilha de auditoria registra autoria de mensagem
- [ ] Sem contador em tempo real de mensagens recebidas

## Technical Notes

**O design doc precisa procurar o vazamento nos lugares que não são o esquema.** O
esquema já está desenhado para não permitir a junção. O risco real está em volta dele:

- log de requisição com corpo e usuário na mesma linha;
- ordem de inserção correlacionada com ordem de `mensagem_enviada`;
- contador aparecendo em tempo real depois de uma dinâmica de quatro pessoas — isso
  identifica o autor sem precisar de nome nenhum;
- qualquer *analytics* que registre "usuário X enviou mensagem".

**"Já enviei" não pode mostrar o que a pessoa escreveu.** Poder recuperar o próprio texto
implica que o vínculo existe em algum lugar. A confirmação é só que a mensagem chegou.

## Dependencies

- liberacao-do-encontro
