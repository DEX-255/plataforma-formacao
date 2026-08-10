import next from "eslint-config-next";
import typescript from "eslint-config-next/typescript";

/**
 * ESLint — o que o compilador não pega.
 *
 * As regras de verdade deste projeto (RN-01…RN-18, a regra do roxo, o hex
 * literal) não cabem em lint: elas vivem em src/dominio/regras.ts e em
 * testes/guardas.test.ts. Aqui fica só a higiene de linguagem.
 */
const config = [
  ...next,
  ...typescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "documento/saida/**",
      "supabase/.temp/**",
    ],
  },
  {
    rules: {
      // `any` desliga a checagem justamente onde ela protege — o bloco interno
      // do feedback trafega como objeto tipado, e um `any` no meio do caminho
      // é como nota vaza sem ninguém perceber.
      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
