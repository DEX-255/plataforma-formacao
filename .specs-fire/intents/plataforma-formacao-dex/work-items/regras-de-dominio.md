---
id: regras-de-dominio
title: Regras de domínio e frameworks de avaliação
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: completed
depends_on:
  - fundacao-projeto
created: 2026-08-06T00:26:01Z
run_id: run-dex-001
completed_at: 2026-08-08T17:16:39.964Z
---

# Work Item: Regras de domínio e frameworks de avaliação

## Description

Escrever `dominio/regras.ts`, `dominio/frameworks.ts` e `dominio/tipos.ts` — a camada que
todas as telas consultam e nenhuma reimplementa.

É **medium** e não **high** porque o desenho já existe: `specs/02` traz as dezoito regras
enunciadas uma a uma, e `dominio/rubrica-notas-oratoria.md` traz os quinze descritores já
revisados pelo Fred. Um design doc aqui reescreveria pior o que já foi decidido.

## Acceptance Criteria

- [ ] Uma função por regra, de `RN-01` a `RN-18`, em `dominio/regras.ts`, nomeada pela
      regra e com o código no comentário
- [ ] **Um teste por `RN-xx`**, citando o código da regra no nome do teste
- [ ] `dominio/frameworks.ts` declarativo: eixos, perguntas-âncora e descritores 1–5,
      para `oratoria`, `bomba`, `negociacao` e `nenhum`
- [ ] Pergunta-âncora de cada canal da oratória presente e usada como texto de interface:
      Mensagem *"isso sobreviveria à transcrição?"*, Fala *"de olhos fechados, o que eu
      ouço?"*, Presença *"para onde aponta a atenção do palestrante?"*
- [ ] Os quinze descritores da rubrica de oratória fielmente transcritos de
      `dominio/rubrica-notas-oratoria.md`
- [ ] A assimetria da escala (`RN-16`) é dado consultável, não texto solto na tela
- [ ] Tipos do banco **gerados** do esquema, nunca escritos à mão
- [ ] Acrescentar um framework novo é acrescentar uma entrada — nenhuma tela muda

## Technical Notes

**Os descritores da bomba e da negociação ainda não existem.** Os eixos estão definidos
em `dominio/frameworks-dinamicas.md` (papéis `manual` e `executor`; eixos `numeros`,
`leitura`, `conducao`), mas os níveis 1–5 são pendência de conteúdo.

A estrutura precisa aceitar **eixo sem descritor** e cair para a lista de "o que
observar" do framework, como `RF-D3` já prevê. Modelar isso como caso normal, não como
`undefined` tratado na tela — senão a formação de Liderança chega e a tela quebra.

**`RN-15` e `RN-16` são as regras que o código não consegue impor sozinho.** Nota mede
estado, não esforço; e começar em 1–2 é o esperado. O que o código pode fazer é
apresentar o descritor no momento de pontuar. É `RF-D3`, e é a diferença entre uma escala
comparável e cinco mentores calibrando por conta própria.

## Dependencies

- fundacao-projeto
