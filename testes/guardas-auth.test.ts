import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * A entrada por senha existe para eu conseguir abrir as telas sem o OAuth do
 * Google. Ela é legítima — passa por `provisionar_acesso` e pela lista de
 * autorizados como qualquer outra sessão.
 *
 * O risco não é o que ela faz; é ela **continuar existindo depois**. Estes
 * testes são o que impede a conveniência de virar porta aberta em produção.
 */

const RAIZ = join(import.meta.dirname, "..");
const FLAG = "NEXT_PUBLIC_LOGIN_LOCAL";

describe("a entrada por senha não pode vazar para produção", () => {
  it("a tela só a renderiza quando a variável vale exatamente '1'", () => {
    const pagina = readFileSync(
      join(RAIZ, "src/app/(publico)/entrar/page.tsx"),
      "utf8",
    );

    expect(pagina).toContain(`process.env.${FLAG} === "1"`);

    // Nada de `!== undefined`, `Boolean(...)` ou truthiness: uma variável
    // definida como "0" ou "false" abriria a porta.
    expect(pagina).not.toMatch(
      new RegExp(`${FLAG}\\s*(!==|\\?\\?|\\|\\|)|Boolean\\(process\\.env\\.${FLAG}`),
    );
  });

  it("o .env.example não define a variável — só a documenta", () => {
    const exemplo = readFileSync(join(RAIZ, ".env.example"), "utf8");

    const linhasQueDefinem = exemplo
      .split("\n")
      .filter((l) => l.trimStart().startsWith(FLAG));

    expect(
      linhasQueDefinem,
      "Quem copiar o .env.example herdaria a porta aberta.",
    ).toEqual([]);
  });

  it("nenhum arquivo versionado liga a variável", () => {
    // `.env.local` fica de fora: é ignorado pelo git e é onde ela deve viver.
    for (const arquivo of [".env.example", "next.config.ts", "package.json"]) {
      const caminho = join(RAIZ, arquivo);
      if (!existsSync(caminho)) continue;

      const conteudo = readFileSync(caminho, "utf8");
      const liga = new RegExp(`^\\s*${FLAG}\\s*[=:]\\s*["']?1`, "m");

      expect(liga.test(conteudo), `${arquivo} liga a entrada por senha`).toBe(
        false,
      );
    }
  });

  it("o .env.local está no .gitignore", () => {
    const ignore = readFileSync(join(RAIZ, ".gitignore"), "utf8");
    expect(ignore).toMatch(/^\.env\.\*$/m);
    expect(ignore).toMatch(/^!\.env\.example$/m);
  });

  it("a entrada por senha passa pelo mesmo caminho do Google", () => {
    const local = readFileSync(
      join(RAIZ, "src/app/(publico)/entrar/LoginLocal.tsx"),
      "utf8",
    );

    // Se ela redirecionasse direto para /encontros, pularia a checagem da
    // lista de autorizados — e aí sim seria porta dos fundos.
    expect(local).toContain("/auth/retorno");
    expect(local).not.toMatch(/href\s*=\s*["']\/(encontros|trajetoria)/);
  });
});
