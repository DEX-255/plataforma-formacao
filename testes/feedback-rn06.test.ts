import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "pg";

/**
 * `RN-06` contra o banco de verdade.
 *
 * A regra tem consequência visível para quem está do outro lado: a
 * participante leu uma sugestão na semana passada, e reescrevê-la depois faria
 * a versão que ela guardou deixar de existir no sistema, sem rastro.
 *
 * A ação de servidor confere isso para dar mensagem boa. Este arquivo testa a
 * camada que **garante**: sem o gatilho, um `update` cru com o token da sessão
 * do próprio mentor reescreve o texto liberado e a RLS aplaude — a política
 * sabe *quem* escreve, não *quando* nem *o quê*.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

const MENTOR = "cccccccc-1111-4111-8111-cccccccccccc";
const OUTRO_MENTOR = "cccccccc-2222-4222-8222-cccccccccccc";
const PARTICIPANTE = "dddddddd-1111-4111-8111-dddddddddddd";

let edicao: string;
let participacao: string;

async function comoUsuario<T>(
  usuario: string,
  consulta: string,
  params: unknown[] = [],
): Promise<T[]> {
  await db.query("begin");
  try {
    await db.query("select set_config('role', 'authenticated', true)");
    await db.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: usuario, role: "authenticated" }),
    ]);
    const r = await db.query(consulta, params);
    return r.rows as T[];
  } finally {
    await db.query("rollback");
  }
}

async function erroDe(
  usuario: string,
  consulta: string,
  params: unknown[] = [],
): Promise<string | null> {
  try {
    await comoUsuario(usuario, consulta, params);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

/**
 * Limpeza entre testes, com os gatilhos desligados.
 *
 * Não é contorno da regra: `RN-06` e `RN-18` proíbem apagar feedback já
 * liberado **no produto**, e é isso que os testes abaixo verificam. Arrumar a
 * bancada é outra coisa — e ter que desligar o gatilho aqui é a prova de que
 * ele pega até quem tem acesso direto ao banco.
 */
async function limpar(tabelas: string[]): Promise<void> {
  await db.query("set session_replication_role = replica");
  try {
    for (const t of tabelas) await db.query(`delete from ${t}`);
  } finally {
    await db.query("set session_replication_role = origin");
  }
}

let numero = 50;

/** Encontro no estado pedido, com um feedback do MENTOR já escrito. */
async function cenario(
  status: "aberto" | "liberado",
): Promise<{ encontro: string; feedback: string }> {
  numero += 1;

  // Nasce aberto e só depois é liberado: o gatilho de transição recusa criar
  // já em `liberado` vindo de outro estado, e ir pelo caminho certo é também
  // o que garante que `liberado_em` existe.
  const encontro = (
    await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1, $2, 'Tema', current_date, 'oratoria', 'aberto') returning id`,
      [edicao, numero],
    )
  ).rows[0].id;

  const feedback = (
    await db.query(
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
                             situacao, ponto, sugestao, nota, observacao_interna)
       values ($1, $2, $3, 'fala', 'Na apresentação', 'Muletas sonoras',
               'Grave dois minutos e conte', 2, 'interno original')
       returning id`,
      [encontro, participacao, MENTOR],
    )
  ).rows[0].id;

  if (status === "liberado") {
    await db.query(
      `update encontro set status = 'liberado' where id = $1`,
      [encontro],
    );
  }

  return { encontro, feedback };
}

beforeAll(async () => {
  db = new Client({ connectionString: URL_BANCO });
  await db.connect();

  await limpar([
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
  ]);
  await db.query("delete from auth.users");

  for (const [id, email] of [
    [MENTOR, "m1@rn06.test"],
    [OUTRO_MENTOR, "m2@rn06.test"],
    [PARTICIPANTE, "p@rn06.test"],
  ]) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2)`,
      [id, email],
    );
  }

  await db.query(
    `insert into usuario (id, email, nome, papel) values
       ($1,'m1@rn06.test','Mentor Um','mentor'),
       ($2,'m2@rn06.test','Mentor Dois','mentor'),
       ($3,'p@rn06.test','Participante','participante')`,
    [MENTOR, OUTRO_MENTOR, PARTICIPANTE],
  );

  edicao = (
    await db.query(`insert into edicao (nome) values ('rn06') returning id`)
  ).rows[0].id;

  participacao = (
    await db.query(
      `insert into participacao (usuario_id, edicao_id) values ($1,$2) returning id`,
      [PARTICIPANTE, edicao],
    )
  ).rows[0].id;
});

beforeEach(async () => {
  await limpar(["feedback", "encontro"]);
});

afterAll(async () => {
  await db.end();
});

describe("antes da liberação o mentor edita livremente", () => {
  it("muda a sugestão do próprio feedback", async () => {
    const { feedback } = await cenario("aberto");

    const linhas = await comoUsuario<{ sugestao: string }>(
      MENTOR,
      `update feedback set sugestao = 'outra sugestão' where id = $1 returning sugestao`,
      [feedback],
    );

    expect(linhas[0]?.sugestao).toBe("outra sugestão");
  });

  it("apaga o próprio feedback", async () => {
    const { feedback } = await cenario("aberto");

    await comoUsuario(MENTOR, `delete from feedback where id = $1`, [feedback]);

    // Dentro da transação revertida não dá para conferir o efeito, então o que
    // importa aqui é não ter levantado exceção.
    const erro = await erroDe(MENTOR, `delete from feedback where id = $1`, [
      feedback,
    ]);
    expect(erro).toBeNull();
  });
});

describe("depois da liberação o bloco visível trava", () => {
  it("a sugestão que a pessoa leu não é reescrita", async () => {
    const { feedback } = await cenario("liberado");

    const erro = await erroDe(
      MENTOR,
      `update feedback set sugestao = 'reescrita depois de lida' where id = $1`,
      [feedback],
    );

    expect(erro).toMatch(/RN-06/);
  });

  it("o ponto não é reescrito", async () => {
    const { feedback } = await cenario("liberado");
    const erro = await erroDe(
      MENTOR,
      `update feedback set ponto = 'outro ponto' where id = $1`,
      [feedback],
    );
    expect(erro).toMatch(/RN-06/);
  });

  it("a situação não é reescrita", async () => {
    const { feedback } = await cenario("liberado");
    const erro = await erroDe(
      MENTOR,
      `update feedback set situacao = 'outra situação' where id = $1`,
      [feedback],
    );
    expect(erro).toMatch(/RN-06/);
  });

  it("o eixo não muda — mudaria o canal sob o texto assinado", async () => {
    const { feedback } = await cenario("liberado");
    const erro = await erroDe(
      MENTOR,
      `update feedback set eixo = 'mensagem' where id = $1`,
      [feedback],
    );
    expect(erro).toMatch(/RN-06/);
  });

  it("feedback liberado não é apagado (RN-18)", async () => {
    const { feedback } = await cenario("liberado");
    const erro = await erroDe(MENTOR, `delete from feedback where id = $1`, [
      feedback,
    ]);
    expect(erro).toMatch(/RN-06|RN-18/);
  });
});

describe("o bloco interno continua editável depois da liberação", () => {
  it("a nota muda — ninguém de fora a leu", async () => {
    const { feedback } = await cenario("liberado");

    const linhas = await comoUsuario<{ nota: number }>(
      MENTOR,
      `update feedback set nota = 4 where id = $1 returning nota`,
      [feedback],
    );

    expect(linhas[0]?.nota).toBe(4);
  });

  it("a observação interna muda", async () => {
    const { feedback } = await cenario("liberado");

    const linhas = await comoUsuario<{ observacao_interna: string }>(
      MENTOR,
      `update feedback set observacao_interna = 'revisto na banca' where id = $1
       returning observacao_interna`,
      [feedback],
    );

    expect(linhas[0]?.observacao_interna).toBe("revisto na banca");
  });

  it("passar para “não observado” continua possível (RN-07)", async () => {
    const { feedback } = await cenario("liberado");

    const linhas = await comoUsuario<{ nao_observado: boolean }>(
      MENTOR,
      `update feedback set nota = null, nao_observado = true where id = $1
       returning nao_observado`,
      [feedback],
    );

    expect(linhas[0]?.nao_observado).toBe(true);
  });
});

describe("ninguém edita feedback de outro mentor", () => {
  it("outro mentor não altera, nem com o encontro aberto", async () => {
    const { feedback } = await cenario("aberto");

    // A RLS não devolve a linha para o update: passa sem erro e sem efeito.
    await comoUsuario(
      OUTRO_MENTOR,
      `update feedback set sugestao = 'invadido' where id = $1`,
      [feedback],
    );

    const { rows } = await db.query(
      `select sugestao from feedback where id = $1`,
      [feedback],
    );
    expect(rows[0].sugestao).toBe("Grave dois minutos e conte");
  });

  it("outro mentor não apaga", async () => {
    const { feedback } = await cenario("aberto");

    await comoUsuario(OUTRO_MENTOR, `delete from feedback where id = $1`, [
      feedback,
    ]);

    const { rows } = await db.query(
      `select count(*)::int as n from feedback where id = $1`,
      [feedback],
    );
    expect(rows[0].n).toBe(1);
  });
});
