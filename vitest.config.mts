import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./testes/setup.ts"],
    include: ["testes/**/*.test.{ts,tsx}"],
    // Os testes de banco compartilham o mesmo Postgres local e limpam as
    // tabelas no setup. Em paralelo, um apaga os dados do outro e as falhas
    // aparecem em lugares que não têm nada a ver com a causa.
    fileParallelism: false,
    // Os testes apagam as contas de desenvolvimento junto com os dados deles.
    // Este passo devolve o seed para o login local continuar funcionando.
    globalSetup: ["./testes/reseed.ts"],
  },
});
