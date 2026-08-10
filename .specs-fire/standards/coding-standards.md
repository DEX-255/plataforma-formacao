# Coding Standards

> Único standard **sem** contrapartida em `specs/` — aqui é a fonte de verdade.
> Ele existe para que o código saia com uma cara só, e não vire o "monte de código
> espaguete" que a especificação foi escrita para evitar.

## Língua

**O domínio é escrito em português.** Tabelas, tipos, funções, rotas e pastas usam o
vocabulário do glossário de [`specs/02-dominio.md`](../../specs/02-dominio.md):
`encontro`, `participacao`, `feedback`, `eixo`, `liberacao`, `mensagem_anonima`.

Não se traduz meio termo. `encontro` nunca vira `meeting`, `Encontro` nunca vira
`MeetingEntity`. O motivo é prático: quem mantiver isso depois lê a spec em português e
precisa achar a mesma palavra no código.

Idiomas do framework ficam em inglês porque não são domínio: `page.tsx`, `layout.tsx`,
`useState`, `props`.

**Todo texto de interface em português**, sem rótulo em inglês vazando do framework.
`lang="pt-BR"`.

## TypeScript

- `strict: true`. Sem exceção e sem `// @ts-ignore`.
- **`any` é proibido.** Não sabendo o tipo, é `unknown` com narrowing explícito.
- Tipos do banco **gerados** do esquema, nunca escritos à mão — esquema e tipo
  divergindo silenciosamente é como `RN-03` vaza.
- Tipos de domínio em `dominio/tipos.ts`, montados sobre os gerados.
- `type` para forma de dado, `interface` só quando precisa de extensão.

## Regras de negócio

**`dominio/regras.ts` é a única casa das regras.** Uma função por `RN`, nomeada pela
regra e com o código no comentário:

```ts
/** RN-06 — Depois da liberação, o bloco visível não é editado. */
export function podeEditarBlocoVisivel(fb: Feedback, enc: Encontro): boolean
```

Três consequências, e nenhuma é negociável:

- **Nenhum componente decide sozinho.** A tela pergunta, a regra responde. Ver um `if`
  com lógica de permissão dentro de um `.tsx` é defeito.
- **Toda função de regra tem teste**, e o teste cita a `RN`. Ver `testing-standards.md`.
- **A regra do servidor não confia na do cliente.** Mesma função, chamada nas duas
  pontas — a do cliente é conveniência, a do servidor é a que vale.

`dominio/frameworks.ts` é **dado declarativo**: eixos, perguntas-âncora e descritores da
rubrica numa estrutura, não espalhados em `switch`. Acrescentar framework é acrescentar
entrada.

## Servidor e cliente

**Servidor é o padrão** (`D-02`). `'use client'` é exceção e precisa de motivo: há
interação de verdade — formulário, busca, seletor de nota.

Duas proibições absolutas:

- **Nenhum dado de bloco interno (`nota`, `observacao_interna`) atravessa para
  componente de cliente**, nem como prop, nem dentro de um objeto maior "que não vai ser
  usado". Passar o objeto inteiro e renderizar só parte dele **é** o vazamento.
- **O cliente de navegador do Supabase nunca lê dado sensível.** `lib/supabase/` separa
  os dois clientes; usar o errado é defeito de segurança, não estilo.

## Estilo e Tailwind

- **Só tokens.** Nada de hex literal nem de valor arbitrário de cor no `className`. Os
  tokens de [`specs/05-design-system.md`](../../specs/05-design-system.md) vivem na
  config do Tailwind, e o design system deixa de ser documento para virar o que o código
  usa.
- **A regra do roxo é regra de código.** `--roxo` em texto só ≥24px, ou 18px bold. Texto
  pequeno em roxo sobre escuro usa `--roxo-claro`. Texto dentro de preenchimento roxo é
  `--papel`, nunca abaixo de 16px bold.
- **Espaçamento em múltiplos de 4.** Escala: 4, 8, 12, 16, 24, 32, 48, 64.
- **Campo de formulário nunca abaixo de 16px** — abaixo disso o iOS dá zoom sozinho ao
  focar, e o mentor perde o contexto no meio do preenchimento.
- **Estado nunca só por cor.** Rótulo ou ícone sempre junto.
- Sombra sólida, nunca difusa. Zero gradiente.

## Componentes

- Componente que busca dado não é o mesmo que desenha. Servidor busca, apresentação
  recebe.
- `componentes/ui/` não conhece domínio. Um `Botao` não sabe o que é feedback.
- **Toda tela entrega quatro estados**: vazio (explicando o que vai aparecer ali e
  quando), carregando (esqueleto com a forma do conteúdo, não spinner), erro (o que
  aconteceu e o que fazer), sem permissão (recusa clara, não tela em branco). Área em
  branco sem explicação é o que faz o produto parecer quebrado.
- Erro de rede ao salvar feedback **não pode perder o texto digitado** (`D-03`).

## Mobile primeiro, de verdade

`/encontros/[id]` e a tela de registrar feedback são escritas primeiro no celular e
depois expandidas — não o contrário. Alvo de toque ≥44×44px, 56px em lista percorrida em
sequência. Uma coluna. Tabela vira cartão empilhado. Nenhuma tela rola na horizontal.

## Banco

- Migração é arquivo em `supabase/migrations` (`D-06`). **Nunca clique no painel.**
- Política de RLS é arquivo versionado em `supabase/politicas/`.
- Nada de exclusão em cascata (`RN-18`).

## Comentário

Comentário explica **por quê**, nunca o quê. O quê está no código; o porquê está na
spec, e o comentário é a ponte — daí a convenção de citar `RN-xx` e `RF-xx` em cima da
função que os implementa. Um `// RN-08` num lugar inesperado é o aviso para o próximo
não "simplificar" removendo a proteção.

---
*Generated by specs.md - fabriqa.ai FIRE Flow*
