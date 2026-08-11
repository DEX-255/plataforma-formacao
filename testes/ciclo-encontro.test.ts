import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "pg";
import { limparTabelas } from "./bancada";

/**
 * O ciclo de vida do encontro, contra o banco de verdade.
 *
 * `edicao-e-encontros` pede que transições inválidas sejam "recusadas no
 * servidor, não só escondidas na tela". Testar isso pela interface provaria
 * apenas que o botão não aparece — e o botão não é a barreira. Quem tiver o
 * token da sessão fala com o PostgREST direto.
 *
 * Aqui não há interface nenhuma: é `update` cru, com o papel trocado para
 * `authenticated` e o `sub` do JWT apontando para um mentor de verdade. Se o
 * gatilho não estiver lá, estes testes passam a deixar `liberado` voltar para
 * `aberto`.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

const MENTOR = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const PARTICIPANTE = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";

let edicao: string;
let outraEdicao: string;

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
 * A única linha que a consulta devolveu.
 *
 * Explodir aqui importa: um `update` que não casou linha nenhuma devolve lista
 * vazia, e `linhas[0]?.status` em cima disso passaria calado — o teste diria
 * que a transição funcionou quando ela nem aconteceu.
 */
function unica<T>(linhas: T[]): T {
  const [primeira] = linhas;
  if (!primeira) throw new Error("a consulta não devolveu linha nenhuma");
  return primeira;
}

/** Cria um encontro já no estado pedido, fora de qualquer transação de teste. */
async function encontroEm(
  status: "rascunho" | "aberto" | "liberado",
  numero: number,
  framework = "oratoria",
): Promise<string> {
  const { rows } = await db.query(
    `insert into encontro (edicao_id, numero, tema, data, framework, status, liberado_em)
     values ($1, $2, 'Tema', current_date, $3::framework, $4::status_enc,
             case when $4 = 'liberado' then now() end)
     returning id`,
    [edicao, numero, framework, status],
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = new Client({ connectionString: URL_BANCO });
  await db.connect();

  await limparTabelas(db);
  await db.query("delete from auth.users");

  for (const [id, email] of [
    [MENTOR, "mentor@ciclo.test"],
    [PARTICIPANTE, "part@ciclo.test"],
  ]) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2)`,
      [id, email],
    );
  }

  await db.query(
    `insert into usuario (id, email, nome, papel) values
       ($1, 'mentor@ciclo.test', 'Mentora', 'mentor'),
       ($2, 'part@ciclo.test',   'Participante', 'participante')`,
    [MENTOR, PARTICIPANTE],
  );

  edicao = (
    await db.query(`insert into edicao (nome) values ('ciclo-1') returning id`)
  ).rows[0].id;

  outraEdicao = (
    await db.query(`insert into edicao (nome) values ('ciclo-2') returning id`)
  ).rows[0].id;

  await db.query(
    `insert into participacao (usuario_id, edicao_id) values ($1, $2)`,
    [PARTICIPANTE, edicao],
  );
});

beforeEach(async () => {
  await db.query("delete from atribuicao_eixo");
  await db.query("delete from encontro");
});

afterAll(async () => {
  await db.end();
});

describe("transições recusadas pelo banco", () => {
  it("liberado não volta para aberto", async () => {
    const id = await encontroEm("liberado", 1);

    const erro = await erroDe(
      MENTOR,
      `update encontro set status = 'aberto' where id = $1`,
      [id],
    );

    expect(erro).toMatch(/transição de encontro inválida/);
  });

  it("liberado não volta para rascunho", async () => {
    const id = await encontroEm("liberado", 1);
    const erro = await erroDe(
      MENTOR,
      `update encontro set status = 'rascunho' where id = $1`,
      [id],
    );
    expect(erro).toMatch(/transição de encontro inválida/);
  });

  it("aberto não volta para rascunho", async () => {
    const id = await encontroEm("aberto", 1);
    const erro = await erroDe(
      MENTOR,
      `update encontro set status = 'rascunho' where id = $1`,
      [id],
    );
    expect(erro).toMatch(/transição de encontro inválida/);
  });

  it("rascunho não pula direto para liberado", async () => {
    const id = await encontroEm("rascunho", 1);
    const erro = await erroDe(
      MENTOR,
      `update encontro set status = 'liberado' where id = $1`,
      [id],
    );
    expect(erro).toMatch(/transição de encontro inválida/);
  });
});

describe("transições aceitas", () => {
  it("rascunho abre", async () => {
    const id = await encontroEm("rascunho", 1);

    const linhas = await comoUsuario<{ status: string }>(
      MENTOR,
      `update encontro set status = 'aberto' where id = $1 returning status`,
      [id],
    );

    expect(unica(linhas).status).toBe("aberto");
  });

  it("aberto libera, e o carimbo de liberação é preenchido sozinho", async () => {
    const id = await encontroEm("aberto", 1);

    const linhas = await comoUsuario<{ status: string; liberado_em: Date | null }>(
      MENTOR,
      `update encontro set status = 'liberado' where id = $1
       returning status, liberado_em`,
      [id],
    );

    expect(unica(linhas).status).toBe("liberado");
    expect(unica(linhas).liberado_em).not.toBeNull();
  });

  it("editar tema sem mexer no estado continua permitido", async () => {
    const id = await encontroEm("aberto", 1);

    const linhas = await comoUsuario<{ tema: string }>(
      MENTOR,
      `update encontro set tema = 'Outro tema' where id = $1 returning tema`,
      [id],
    );

    expect(unica(linhas).tema).toBe("Outro tema");
  });
});

describe("a guarda não é a tela", () => {
  it("participante não abre encontro nem com o update na mão", async () => {
    const id = await encontroEm("rascunho", 1);

    // Rascunho é invisível para participante, então a RLS nem encontra a linha:
    // o update passa sem erro e sem efeito. O que importa é o encontro não abrir.
    await comoUsuario(
      PARTICIPANTE,
      `update encontro set status = 'aberto' where id = $1`,
      [id],
    );

    const { rows } = await db.query(`select status from encontro where id = $1`, [id]);
    expect(rows[0].status).toBe("rascunho");
  });

  it("participante não libera encontro aberto", async () => {
    const id = await encontroEm("aberto", 1);

    await comoUsuario(
      PARTICIPANTE,
      `update encontro set status = 'liberado' where id = $1`,
      [id],
    );

    const { rows } = await db.query(`select status from encontro where id = $1`, [id]);
    expect(rows[0].status).toBe("aberto");
  });
});

describe("RN-17 — o encontro não muda de edição", () => {
  it("mover encontro para outra edição é recusado", async () => {
    const id = await encontroEm("aberto", 1);

    const erro = await erroDe(
      MENTOR,
      `update encontro set edicao_id = $2 where id = $1`,
      [id, outraEdicao],
    );

    expect(erro).toMatch(/não muda de edição/);
  });
});

describe("liberar_encontro — a função do ritual semanal", () => {
  it("participante não chama", async () => {
    const id = await encontroEm("aberto", 1);
    const erro = await erroDe(PARTICIPANTE, `select liberar_encontro($1)`, [id]);
    expect(erro).toMatch(/só mentor libera/);
  });

  it("recusa encontro que não está aberto", async () => {
    const id = await encontroEm("rascunho", 1);
    const erro = await erroDe(MENTOR, `select liberar_encontro($1)`, [id]);
    expect(erro).toMatch(/não está aberto/);
  });
});
