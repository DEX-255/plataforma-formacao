import { Client } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { limparTabelas, exigirBancoLocal } from "./bancada";

/**
 * Restaura o seed de desenvolvimento depois da suíte.
 *
 * Os testes de banco precisam de mesa limpa e apagam tudo, inclusive as contas
 * de `supabase/seed.sql` que existem para abrir as telas localmente. Sem isto,
 * rodar `npm test` deixava o login local quebrado — e o sintoma aparecia muito
 * depois da causa, na próxima vez que alguém tentasse abrir uma tela.
 *
 * Limpa antes de reaplicar: os testes também DEIXAM dados para trás — edições,
 * encontros e usuários inventados por eles. Sem a limpeza, a tela local passa a
 * mostrar a edição de um teste em vez da de desenvolvimento, e o estado depois
 * de `npm test` vira imprevisível.
 *
 * O seed é idempotente (`on conflict do nothing`), então reaplicar é seguro.
 */
const restaurarSeed = () => {
  return async () => {
    // A mesma trava do `setup.ts`: este arquivo também apaga tudo.
    exigirBancoLocal();

    const url =
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

    const db = new Client({ connectionString: url });

    try {
      await db.connect();
    } catch {
      // Banco local desligado: os testes de banco também não rodaram.
      return;
    }

    try {
      await limparTabelas(db);
      await db.query("delete from auth.users");

      const seed = readFileSync(
        join(import.meta.dirname, "..", "supabase", "seed.sql"),
        "utf8",
      );
      await db.query(seed);
    } finally {
      await db.end();
    }
  };
};

export default restaurarSeed;
