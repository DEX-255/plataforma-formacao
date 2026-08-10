/**
 * O único lugar do TypeScript onde cor em hexadecimal pode aparecer.
 *
 * Algumas APIs não aceitam variável CSS e exigem a cor literal: `themeColor`
 * do navegador, o fundo do PDF do documento final, o `<meta>` de pré-visualização.
 * Para essas, o valor precisa existir em JavaScript.
 *
 * Isso cria uma cópia — e cópia de token é como design system começa a
 * divergir. Por isso `testes/guardas.test.ts` compara cada valor daqui com o
 * `globals.css` e falha se os dois discordarem. A duplicação existe, mas não
 * pode envelhecer em silêncio.
 */

export const CORES_LITERAIS = {
  "--color-preto": "#14110f",
  "--color-papel": "#f3f0e8",
  "--color-roxo": "#8c52ff",
} as const;

/** Fundo do app e da home. Vai no `themeColor` da barra do navegador. */
export const PRETO = CORES_LITERAIS["--color-preto"];
