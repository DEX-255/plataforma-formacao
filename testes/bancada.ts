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
