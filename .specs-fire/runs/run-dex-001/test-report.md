---
run: run-dex-001
work_item: fundacao-projeto
intent: plataforma-formacao-dex
generated: 2026-08-07T21:45:00Z
status: passed
---

# Test Report: Fundação do projeto e design system em código

## Summary

| Categoria | Passou | Falhou | Pulou |
|---|---|---|---|
| Guardas do design system | 44 | 0 | 0 |
| Componentes | 7 | 0 | 0 |
| **Total** | **51** | **0** | **0** |

Lint: limpo · TypeScript: sem erro · Build de produção: `✓ Compiled successfully`

## Acceptance Criteria Validation

- ✅ **Next.js App Router + TypeScript com `strict: true`** — build de produção passa; `strict`, `noUncheckedIndexedAccess` e `noImplicitOverride` ligados
- ✅ **Tokens de `specs/05` na config** — 34 tokens verificados um a um por teste
- ✅ **Nenhum hex fora da config** — teste varre `src/` inteiro e falha se escapar
- ✅ **Fontes pelo próprio domínio, só os pesos usados, `font-display: swap`** — `next/font/google` baixa no build; Bricolage 600/800, Space Grotesk 400/500/700, Space Mono 400/700
- ✅ **Estrutura de pastas de `specs/06`** — sob `src/`, conforme decidido no checkpoint
- ✅ **Cinco componentes de UI, botão que afunda** — hover 2px/sombra 4px, active 6px/sombra 0
- ✅ **Grão e halftone em CSS, sem imagem externa** — ruído SVG em `data:`, pontos em `radial-gradient`
- ✅ **`lang="pt-BR"` e `prefers-reduced-motion`** — no layout raiz e no `globals.css`
- ✅ **Campo nunca abaixo de 16px** — `font-size: max(16px, 1em)` na base, mais teste
- ✅ **Regra do roxo verificável** — deixou de ser documento e virou teste

## O que os testes cobrem

`testes/guardas.test.ts` — o design system não pode ser desobedecido em silêncio:

- nenhuma cor literal fora de `globals.css` e da cópia autorizada;
- a cópia literal (`cores-literais.ts`) tem que **bater com a fonte**, senão falha;
- `text-roxo` só junto de `text-display` ou `text-titulo-tela`;
- os 34 tokens de `specs/05` existem;
- nenhum gradiente.

`testes/ui.test.tsx` — a ergonomia do mentor em pé no corredor:

- botão com alvo de toque de 44px e `type="button"` por padrão;
- campo com rótulo associado, erro anunciado por `role="alert"` e ligado por `aria-describedby`;
- chip sempre com palavra escrita — estado nunca é só cor;
- símbolo decorativo por padrão, com `viewBox` e `currentColor`.

## Test Commands

```
npm test          # vitest run
npm run lint      # eslint
npm run build     # next build (inclui checagem de tipos)
```

## Dois defeitos encontrados pelos próprios testes

**1. `--erro` é ilegível no app.** A medição de contraste deu **2,88:1** sobre
`--preto` — reprova para texto pequeno. E é justamente a cor da mensagem que precisa ser
lida quando algo dá errado. Entrou `--erro-claro` (`#EC5F5F`, 5,70:1) para o fundo
escuro, ficando `--erro` para login e documento final, que são claros. `specs/05` foi
atualizado com a tabela medida.

**2. Hex solto no `layout.tsx`.** O `themeColor` do navegador não aceita variável CSS.
Em vez de abrir exceção na regra, criei `cores-literais.ts` — a única cópia autorizada —
com um teste que falha se ela divergir de `globals.css`.

O segundo caso é o que dá confiança no primeiro: a guarda pegou uma violação escrita por
mim, minutos depois de eu mesmo ter escrito a regra.
