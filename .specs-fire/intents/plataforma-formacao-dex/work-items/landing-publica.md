---
id: landing-publica
title: Landing pública
intent: plataforma-formacao-dex
complexity: low
mode: autopilot
status: completed
depends_on:
  - fundacao-projeto
created: 2026-08-06T00:26:01Z
run_id: run-dex-003
completed_at: 2026-08-08T21:06:25.390Z
---

# Work Item: Landing pública

## Description

`RF-I1`. A página única na frente do produto: o que é a DEX, o que ela faz, link para o
Instagram, botão de entrar. Direção **4b**.

**Sem formulário de inscrição, sem captação.** Não é o trabalho deste site.

## Status: bloqueado

Depende da pendência do **SVG do símbolo** (`pendencias.md`). Diferente das telas
internas, aqui o logo não pode ser placeholder: é a página que alguém que não conhece a
DEX vai ver primeiro, e o gesto visual é o assunto dela.

Também depende de uma decisão de design em aberto: **a transição 4b → 3e**. A home é
escura e monumental, o login é claro e lúdico, o app é escuro de novo — o login fica
sendo a única tela clara do caminho.

## Acceptance Criteria

- [ ] Fundo preto quente com halftone, DEX em roxo gigante (`clamp(88px, 22vw, 300px)`,
      Bricolage 800), "De pessoas. Para pessoas." circulado em Young Serif
- [ ] Header com A DEX · Impacto · Entrar
- [ ] Link para o Instagram
- [ ] Nenhum formulário
- [ ] No celular, o DEX gigante escala por `clamp()` e continua sendo o gesto principal;
      a navegação vira menu
- [ ] Não rola na horizontal em nenhuma largura
- [ ] Contraste conforme a regra do roxo — o roxo gigante passa, texto pequeno em roxo não

## Technical Notes

**Confirmar se o "DEX" gigante é tipográfico.** Ele é Bricolage Grotesque 800, um desenho
diferente do wordmark oficial. A divisão é legítima — gesto tipográfico no hero, logo
oficial no header e na sidebar — mas as duas versões aparecem na mesma tela, então
precisa ser escolha consciente e não acidente.

É `P3`: pode entrar a qualquer momento e não bloqueia a formação começar.

## Dependencies

- fundacao-projeto
