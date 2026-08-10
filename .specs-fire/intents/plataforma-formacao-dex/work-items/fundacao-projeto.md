---
id: fundacao-projeto
title: Fundação do projeto e design system em código
intent: plataforma-formacao-dex
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-08-06T00:26:01Z
run_id: run-dex-001
completed_at: 2026-08-07T21:46:01.047Z
---

# Work Item: Fundação do projeto e design system em código

## Description

Levantar o projeto Next.js e transformar `specs/05-design-system.md` de documento em
configuração. Este item não entrega tela de usuário — entrega o vocabulário visual que
todas as outras usam. Feito errado, cada tela seguinte reinventa espaçamento e cor, e o
resultado é a colcha de retalhos que a especificação existe para evitar.

## Acceptance Criteria

- [ ] Projeto Next.js (App Router) + TypeScript com `strict: true` roda local
- [ ] Tokens de cor, tipografia, forma e espaçamento de `specs/05` na config do Tailwind
- [ ] Nenhum hex literal fora da config — cor no `className` só por token
- [ ] Bricolage Grotesque, Space Grotesk e Space Mono servidas pelo próprio domínio, só
      os pesos usados, com `font-display: swap` (`D-05`)
- [ ] Estrutura de pastas de `specs/06` criada: `app/`, `componentes/`, `dominio/`,
      `lib/`, `supabase/`, `documento/`
- [ ] `componentes/ui/` com botão, cartão, campo, selo e chip — o botão afunda de verdade
      (translada 2px no hover, 6px no active, sombra some)
- [ ] Grão e halftone em CSS puro, sem imagem externa
- [ ] `lang="pt-BR"` e `prefers-reduced-motion: reduce` desligando tudo que não seja
      opacidade
- [ ] Campo de formulário com no mínimo 16px, verificado no iOS (abaixo disso ele dá zoom
      sozinho ao focar)

## Technical Notes

**A regra do roxo precisa sobreviver ao esquecimento.** `--roxo` reprova contraste para
texto pequeno em qualquer fundo da paleta (4,27:1 sobre preto). Não basta estar escrito
na spec: ou os tokens de texto pequeno em roxo simplesmente não existem na config, ou há
lint pegando o uso. Prefira a primeira — o token que não existe não é usado por engano.

**O logo entra como placeholder.** O símbolo definitivo depende da pendência do SVG
(`pendencias.md`). Isolar em um componente `<Simbolo />` para a troca ser de um arquivo
só.

## Dependencies

(none)
