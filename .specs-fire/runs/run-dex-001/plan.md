---
run: run-dex-001
work_item: fundacao-projeto
intent: plataforma-formacao-dex
mode: confirm
checkpoint: plan
approved_at: null
---

# Implementation Plan: Fundação do projeto e design system em código

## Approach

Levantar o projeto **sem `create-next-app`**. O scaffold automático escreveria um
`README.md` por cima do seu, e criaria uma estrutura de pastas diferente da que
`specs/06` especifica. Escrevo os arquivos de configuração à mão — são poucos, e o
controle vale mais que os dois minutos economizados.

O núcleo do item não é o Next.js, é **transformar `specs/05` em tokens**. Tailwind 4 usa
configuração em CSS (`@theme`), o que cai bem aqui: os tokens ficam em um arquivo só, com
os mesmos nomes da spec (`--roxo`, `--papel`, `--superficie-alta`), e o design system
deixa de ser documento para virar o que o código usa.

**Versões reais, verificadas no registro agora:** Next 16.3.0 · React 19.2.8 · Tailwind
4.3.3 · TypeScript 7.0.2 · vitest 4.1.10 · ESLint 10.8.1. Gerenciador: **npm** (pnpm não
está instalado).

### Decisão que precisa do seu aval: `src/`

`specs/06` diz que o código de domínio mora em `dominio/regras.ts`. Mas `dominio/` **já
existe na raiz** e é a pasta dos documentos institucionais da DEX — cultura de feedback,
rubrica, papéis de avaliação. A própria spec lista `dominio/` duas vezes, com dois
sentidos.

Proponho **todo o código da aplicação sob `src/`**:

```
dominio/          ← seus documentos, intocados
specs/  marca/    ← intocados
src/
  app/  componentes/  dominio/  lib/
supabase/  documento/
```

Assim `src/dominio/regras.ts` mantém a intenção da spec e a colisão some. Se aprovar,
atualizo a estrutura de pastas em `specs/06` junto — decisão nova volta para a spec antes
de virar arquivo.

### A regra do roxo vira teste, não lembrete

`--roxo` reprova contraste para texto pequeno (4,27:1 sobre preto). Documentar isso não
impede ninguém de escrever `text-roxo` num rótulo de 11px daqui a dois meses. Então
escrevo um teste que varre o código e falha quando:

- aparece cor em hexadecimal fora do arquivo de tokens;
- aparece `text-roxo` sem uma classe de tamanho grande junto.

É o único jeito de a regra sobreviver ao esquecimento.

## Files to Create

| File | Purpose |
|------|---------|
| `package.json` | Dependências e scripts (`dev`, `build`, `test`, `lint`) |
| `tsconfig.json` | TypeScript com `strict: true`, alias `@/*` → `src/*` |
| `next.config.ts` | Configuração mínima |
| `postcss.config.mjs` | Plugin do Tailwind 4 |
| `eslint.config.mjs` | ESLint 10 + `eslint-config-next`, proibindo `any` |
| `vitest.config.ts` | Ambiente de teste |
| `.gitignore` | `node_modules`, `.next`, `.env*` — **sem rodar `git init`** |
| `.env.example` | Nomes das variáveis, sem valor nenhum |
| `src/app/globals.css` | **Os tokens de `specs/05` em `@theme`** + grão e halftone |
| `src/app/layout.tsx` | `lang="pt-BR"`, fontes, fundo escuro |
| `src/app/tipografia.ts` | Bricolage, Space Grotesk e Space Mono via `next/font/google` |
| `src/app/(publico)/page.tsx` | Página provisória — a landing real é o item 15 |
| `src/componentes/ui/Botao.tsx` | Preenchimento roxo, borda dura, sombra 6px, afunda |
| `src/componentes/ui/Cartao.tsx` | Superfície, borda dura, sombra sólida 10px |
| `src/componentes/ui/Campo.tsx` | Borda 2px, raio 14px, **mínimo 16px** |
| `src/componentes/ui/Selo.tsx` | Pílula roxa rotacionada, Space Mono 700 |
| `src/componentes/ui/Chip.tsx` | Pílula com rótulo — base do chip de eixo |
| `src/componentes/marca/Simbolo.tsx` | **Placeholder isolado**, troca de um arquivo só |
| `testes/guardas.test.ts` | A regra do roxo e a proibição de hex literal, como teste |
| `testes/ui.test.tsx` | Alvo de toque, tamanho de campo, atributo `lang` |

## Files to Modify

| File | Changes |
|------|---------|
| `specs/06-arquitetura-e-dados.md` | Estrutura de pastas sob `src/`, resolvendo a colisão com `dominio/` |
| `README.md` | Uma linha sobre como rodar o projeto |

## Tests

| Test File | Coverage |
|-----------|----------|
| `testes/guardas.test.ts` | Nenhum hex fora dos tokens · `text-roxo` só com tipografia grande · todos os tokens de `specs/05` presentes |
| `testes/ui.test.tsx` | Botão ≥44px · campo ≥16px · `lang="pt-BR"` · foco visível |

## Technical Details

**Fontes.** `next/font/google` baixa e serve pelo próprio domínio no build — é exatamente
o que `D-05` pede, sem eu precisar dos arquivos `.ttf`. Só os pesos usados: Bricolage
800/600, Space Grotesk 400/500/700, Space Mono 400/700. `display: swap`.

**Grão e halftone em CSS puro**, sem imagem externa: ruído em SVG embutido como
`data:` e pontos em `radial-gradient`. Ficam desligados por padrão nas telas de trabalho
— textura atrapalha leitura de texto denso.

**Nenhuma dependência de UI.** Sem Radix, sem shadcn, sem biblioteca de componente. O
orçamento é 120 KB por rota e os componentes daqui são cinco.

**Não roda `git init`.** O `.gitignore` fica pronto para quando você quiser versionar.

**O que este item não entrega:** nenhuma tela de verdade, nenhum acesso a banco, nenhum
login. Ao fim dele o que existe é `npm run dev` abrindo uma página com a paleta e os
componentes aplicados — a base que os itens 2 e 3 usam.

---
*Plan approved at checkpoint. Execution follows.*
