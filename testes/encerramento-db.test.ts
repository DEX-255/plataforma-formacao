import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "pg";
import { limparTabelas } from "./bancada";

/**
 * `RN-13` e `RN-18` contra o banco de verdade.
 *
 * A tela recusa o acesso, mas a tela não é a barreira. Aqui é `select` cru com
 * a sessão de um participante de edição encerrada — que é o que sobra para
 * alguém que ficou com a aba aberta quando o mentor apertou o botão.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

const MENTOR = "aaaa1111-1111-4111-8111-aaaa11111111";
const PARTICIPANTE = "bbbb2222-2222-4222-8222-bbbb22222222";

let edicao: string;
let participacao: string;
let encontro: string;

async function comoUsuario<T>(
  usuario: string,
  consulta: string,
  params: unknown[] = [],
): Promise<T[]> {
  await db.query("begin");
  try {
    await db.query("select set_config('role','authenticated',true)");
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: usuario, role: "authenticated" }),
    ]);
    const r = await db.query(consulta, params);
    return r.rows as T[];
  } finally {
    await db.query("rollback");
  }
}

async function erroDe(usuario: string, consulta: string): Promise<string | null> {
  try {
    await comoUsuario(usuario, consulta);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

beforeAll(async () => {
  db = new Client({ connectionString: URL_BANCO });
  await db.connect();

  await limparTabelas(db);
  await db.query("delete from auth.users");

  for (const [id, email] of [
    [MENTOR, "m@enc.test"],
    [PARTICIPANTE, "p@enc.test"],
  ]) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2)`,
      [id, email],
    );
  }

  await db.query(
    `insert into usuario (id, email, nome, papel) values
       ($1,'m@enc.test','Mentor','mentor'),
       ($2,'p@enc.test','Participante','participante')`,
    [MENTOR, PARTICIPANTE],
  );
});

beforeEach(async () => {
  await limparTabelas(db, [
    "mensagem_enviada",
    "mensagem_anonima",
    "feedback",
    "presenca",
    "atribuicao_eixo",
    "encontro",
    "participacao",
    "edicao",
  ]);

  edicao = (
    await db.query(`insert into edicao (nome) values ('2026.2') returning id`)
  ).rows[0].id;

  participacao = (
    await db.query(
      `insert into participacao (usuario_id, edicao_id) values ($1,$2) returning id`,
      [PARTICIPANTE, edicao],
    )
  ).rows[0].id;

  encontro = (
    await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1,1,'Tema',current_date,'oratoria','aberto') returning id`,
      [edicao],
    )
  ).rows[0].id;

  await db.query(
    `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
                           situacao, ponto, sugestao, nota)
     values ($1,$2,$3,'fala','S','P','Sugestão',3)`,
    [encontro, participacao, MENTOR],
  );

  await db.query(`update encontro set status='liberado' where id=$1`, [encontro]);
});

afterAll(async () => {
  await db.end();
});

async function encerrar() {
  await db.query(`update edicao set status='encerrada' where id=$1`, [edicao]);
}

describe("o ciclo de vida da edição", () => {
  it("ativa encerra", async () => {
    await encerrar();
    const { rows } = await db.query(`select status from edicao where id=$1`, [
      edicao,
    ]);
    expect(rows[0].status).toBe("encerrada");
  });

  it("encerrada NÃO reabre — nem com acesso direto ao banco", async () => {
    // Devolver acesso a quem já foi avisado faria a plataforma desmentir o que
    // disse. Se for mesmo necessário, é operação manual e consciente.
    await encerrar();

    let erro: string | null = null;
    try {
      await db.query(`update edicao set status='ativa' where id=$1`, [edicao]);
    } catch (e) {
      erro = (e as Error).message;
    }

    expect(erro).toMatch(/transição de edição inválida/);
  });
});

describe("RN-13 — o acesso do participante cai, na sessão já aberta", () => {
  it("antes de encerrar ele lê o próprio feedback", async () => {
    const linhas = await comoUsuario(PARTICIPANTE, "select * from feedback_visivel");
    expect(linhas).toHaveLength(1);
  });

  it("depois de encerrar, não lê mais nada", async () => {
    await encerrar();

    const feedbacks = await comoUsuario(PARTICIPANTE, "select * from feedback_visivel");
    const participacoes = await comoUsuario(PARTICIPANTE, "select * from participacao");
    const encontros = await comoUsuario(PARTICIPANTE, "select * from encontro");
    const presencas = await comoUsuario(PARTICIPANTE, "select * from presenca");

    expect(feedbacks, "leu feedback depois do encerramento").toHaveLength(0);
    expect(participacoes).toHaveLength(0);
    expect(encontros).toHaveLength(0);
    expect(presencas).toHaveLength(0);
  });

  it("a caixa anônima também fecha para ele", async () => {
    // Um encontro novo, aberto — reabrir o liberado é recusado pelo gatilho
    // `encontro_transicao`, e com razão: é a transição que não existe.
    const { rows } = await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1,2,'Ainda aberto',current_date,'oratoria','aberto') returning id`,
      [edicao],
    );
    const aberto = rows[0].id;
    await encerrar();

    const erro = await erroDe(
      PARTICIPANTE,
      `select enviar_mensagem_anonima('${aberto}','tentando depois do fim')`,
    );
    expect(erro).toMatch(/sem participação ativa/);
  });

  it("a tela consegue distinguir 'encerrou' de 'nunca entrou'", async () => {
    // Sem isto, quem terminou a formação veria uma mensagem de cadastro
    // incompleto no lugar da instrução de como receber o documento.
    const antes = await comoUsuario<{ s: string }>(
      PARTICIPANTE,
      "select situacao_do_participante() as s",
    );
    expect(antes[0]?.s).toBe("ativa");

    await encerrar();

    const depois = await comoUsuario<{ s: string }>(
      PARTICIPANTE,
      "select situacao_do_participante() as s",
    );
    expect(depois[0]?.s).toBe("encerrada");
  });

  it("quem nunca teve participação recebe outro rótulo", async () => {
    const linhas = await comoUsuario<{ s: string }>(
      MENTOR,
      "select situacao_do_participante() as s",
    );
    expect(linhas[0]?.s).toBe("sem-participacao");
  });
});

describe("RN-13 — o mentor continua em modo arquivo", () => {
  it("lê feedback, nota e observação depois do encerramento", async () => {
    await encerrar();

    const linhas = await comoUsuario<{ nota: number }>(
      MENTOR,
      "select nota from feedback",
    );

    expect(linhas).toHaveLength(1);
    expect(linhas[0]?.nota).toBe(3);
  });

  it("continua vendo encontros e turma", async () => {
    await encerrar();

    const encontros = await comoUsuario(MENTOR, "select * from encontro");
    const participacoes = await comoUsuario(MENTOR, "select * from participacao");

    expect(encontros).toHaveLength(1);
    expect(participacoes).toHaveLength(1);
  });
});

describe("RN-18 — encerrar arquiva, não apaga", () => {
  it("todo o dado continua no banco depois do encerramento", async () => {
    await encerrar();

    const { rows } = await db.query(`
      select
        (select count(*)::int from feedback)     as feedbacks,
        (select count(*)::int from participacao) as participacoes,
        (select count(*)::int from encontro)     as encontros
    `);

    expect(rows[0]).toEqual({ feedbacks: 1, participacoes: 1, encontros: 1 });
  });

  it("o documento final continua reproduzível: nota e texto intactos", async () => {
    await encerrar();

    const { rows } = await db.query(
      `select sugestao, nota, observacao_interna from feedback`,
    );

    expect(rows[0].sugestao).toBe("Sugestão");
    expect(rows[0].nota).toBe(3);
  });
});
