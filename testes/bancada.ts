import type { Client } from "pg";

/**
 * Arrumar a bancada dos testes de banco.
 *
 * Existe porque o produto **impede** apagar certas coisas, e com razão:
 * `RN-06` e `RN-18` recusam apagar feedback de encontro já liberado, e o
 * gatilho `feedback_trava_apagar` pega isso até com acesso direto ao banco.
 *
 * Isso é o comportamento certo — e é justamente o que quebra a limpeza entre
 * testes, que não é uma operação do produto. Daí a limpeza desligar os gatilhos
 * por uma sessão: **não é contornar a regra, é reconhecer que ela vale mesmo
 * para quem tem a chave do banco.** Se um dia esta função deixar de ser
 * necessária, é porque a regra parou de valer.
 *
 * `session_replication_role = replica` é o interruptor do Postgres para
 * réplicas e carga em massa: suspende gatilhos de usuário só nesta conexão.
 */
/**
 * A trava que impede a suíte de rodar contra um banco que não seja o local.
 *
 * **Esta suíte apaga todas as tabelas, com os gatilhos desligados.** É o que ela
 * precisa fazer para testar as regras contra o banco de verdade — e é também a
 * coisa mais destrutiva do repositório. Sete arquivos leem `DATABASE_URL` com
 * `?? localhost`, então basta essa variável estar exportada na sessão por outro
 * motivo para um `npm test` distraído levar a formação inteira junto.
 *
 * Não é hipótese remota: durante o desenvolvimento a variável foi exportada
 * várias vezes para gerar documento e conferir dado.
 *
 * A trava é boba de propósito. Se um dia for preciso rodar contra outro banco,
 * que seja uma decisão explícita de quem edita esta função — não um efeito
 * colateral de um `export` esquecido no terminal.
 */
const HOSTS_LOCAIS = ["localhost", "127.0.0.1", "::1", "db", "supabase_db_dex"];

export function exigirBancoLocal(url = process.env.DATABASE_URL): void {
  if (!url) return; // sem variável, os testes usam o localhost embutido

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error(`DATABASE_URL não é uma URL válida: ${url}`);
  }

  if (!HOSTS_LOCAIS.includes(host)) {
    throw new Error(
      `Recusando rodar os testes contra "${host}".\n\n` +
        "A suíte APAGA todas as tabelas, com os gatilhos desligados. Contra um " +
        "banco de produção isso levaria os feedbacks, as notas e as presenças " +
        "da formação — e nada disso é reproduzível a partir de outro lugar.\n\n" +
        "Se a intenção era mesmo essa, edite `exigirBancoLocal` em " +
        "testes/bancada.ts e assuma a decisão por escrito.",
    );
  }
}

export const TABELAS_DO_DOMINIO = [
  "mensagem_enviada",
  "mensagem_anonima",
  "feedback",
  "presenca",
  "atribuicao_eixo",
  "encontro",
  "participacao",
  "email_autorizado",
  "usuario",
  "edicao",
] as const;

export async function limparTabelas(
  db: Client,
  tabelas: readonly string[] = TABELAS_DO_DOMINIO,
): Promise<void> {
  await semGatilhos(db, async () => {
    for (const tabela of tabelas) {
      await db.query(`delete from ${tabela}`);
    }
  });
}

/**
 * Desfazer um estado que o produto **não** desfaz.
 *
 * Encerrar edição e liberar encontro são de mão única, garantidos por gatilho.
 * Um teste que precise voltar ao estado anterior — para exercitar outra coisa,
 * não para burlar a regra — usa isto e diz por quê na chamada.
 *
 * Vale a mesma observação de `limparTabelas`: precisar disto é a prova de que a
 * trava funciona até para quem tem a chave do banco.
 */
export async function semGatilhos(
  db: Client,
  acao: () => Promise<void>,
): Promise<void> {
  await db.query("set session_replication_role = replica");
  try {
    await acao();
  } finally {
    await db.query("set session_replication_role = origin");
  }
}
