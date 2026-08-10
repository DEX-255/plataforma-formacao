---
id: liberacao-do-encontro
title: Liberação semanal do encontro
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: pending
depends_on: [trajetoria-do-participante]
created: 2026-08-06T00:26:01Z
---

# Work Item: Liberação semanal do encontro

## Description

`RF-B4`. A transição `aberto → liberado` — **o ritual semanal do produto**.

No instante da liberação, três coisas acontecem ao mesmo tempo: os feedbacks visíveis
aparecem para os participantes, a caixa anônima **fecha**, e as mensagens anônimas ficam
visíveis aos mentores.

Essa simultaneidade é proposital. O participante escreve a mensagem anônima **antes** de
ler o próprio feedback — senão a caixa vira canal de resposta ao feedback recebido, que é
exatamente o que a diretriz 3 evita ("não dê feedback para quem está te dando feedback").

## Acceptance Criteria

- [ ] Antes de confirmar, a tela mostra o que vai acontecer: quantos participantes vão
      receber feedback, **quantos não vão receber nenhum**, e quantas mensagens anônimas
      serão reveladas
- [ ] Ao confirmar, as três coisas acontecem **atomicamente**
- [ ] Irreversível, e a confirmação diz isso — `liberado` não volta para `aberto`
- [ ] Feedback registrado num encontro já liberado aparece de imediato (`RN-05`)
- [ ] Depois da liberação, o bloco visível trava; o interno continua editável (`RN-06`)
- [ ] Teste de ciclo de vida: transições inválidas recusadas no servidor

## Technical Notes

**A contagem de "quantos não vão receber nenhum" é o ponto do requisito.** É o último
momento em que dá para consertar a desigualdade de atenção antes que ela vire fato
consumado para aquela semana. Um número grande ali é para incomodar.

**A primeira liberação define a expectativa da turma inteira.** É risco identificado em
`specs/07`, e a mitigação não é técnica: vale revisar os feedbacks do encontro 2 com
cuidado extra antes de apertar o botão. Se a tela puder tornar essa revisão fácil, ela
está fazendo mais do que mudar um estado.

**Sem notificação** (`D-04`). O aviso de liberação sai pelo grupo de WhatsApp, como já
acontece.

## Dependencies

- trajetoria-do-participante
