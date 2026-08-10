import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "pg";

/**
 * `provisionar_acesso` — a função que decide quem entra, testada contra o
 * banco de verdade.
 *
 * É o coração do `RF-A1`. O handshake com o Google não dá para exercitar sem
 * as credenciais do Google Cloud, mas **o handshake não é a parte que decide
 * nada**: ele só prova que a pessoa é dona daquele e-mail. Quem entra, com que
 * papel, e quem é recusado — isso acontece aqui, e isso está testado.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

const CONVIDADA = "aa111111-1111-4111-8111-111111111111";
const ESTRANHO = "bb222222-2222-4222-8222-222222222222";
const MENTORA = "cc333333-3333-4333-8333-333333333333";

let edicao: string;

type Decisao = {
  resultado: string;
  papel?: string | null;
  edicao_id?: string | null;
};

async function provisionar(
  usuario: string,
  nome = "Nome do Google",
  avatar: string | null = "https://exemplo/foto.jpg",
): Promise<Decisao> {
  await db.query("begin");
  try {
    await db.query("select set_config('role','authenticated',true)");
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: usuario, role: "authenticated" }),
    ]);
    const r = await db.query<{ d: Decisao }>(
      "select public.provisionar_acesso($1,$2) as d",
      [nome, avatar],
    );
    await db.query("commit");
    return r.rows[0]!.d;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

beforeAll(async () => {
  db = new Client({ connectionString: URL_BANCO });
  await db.connect();
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  for (const t of [
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
  ]) {
    await db.query(`delete from ${t}`);
  }
  await db.query("delete from auth.users");

  for (const [id, email] of [
    [CONVIDADA, "convidada@ufg.br"],
    [ESTRANHO, "estranho@gmail.com"],
    [MENTORA, "mentora@ufg.br"],
  ]) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2)`,
      [id, email],
    );
  }

  edicao = (
    await db.query("insert into edicao (nome) values ('2026.2') returning id")
  ).rows[0].id;

  await db.query(
    `insert into email_autorizado (email, papel, edicao_id) values
       ($1,'participante',$3), ($2,'mentor',$3)`,
    ["convidada@ufg.br", "mentora@ufg.br", edicao],
  );
});

describe("RN-11 — autenticar no Google não autoriza nada", () => {
  it("quem está na lista entra com o papel da lista", async () => {
    const d = await provisionar(CONVIDADA);
    expect(d.resultado).toBe("entra");
    expect(d.papel).toBe("participante");
    expect(d.edicao_id).toBe(edicao);
  });

  it("quem não está na lista é recusado", async () => {
    const d = await provisionar(ESTRANHO);
    expect(d.resultado).toBe("nao-autorizado");
  });

  it("recusado NÃO cria conta órfã", async () => {
    await provisionar(ESTRANHO);
    const linhas = await db.query("select * from usuario where id=$1", [
      ESTRANHO,
    ]);
    expect(
      linhas.rows,
      "Sobrou registro de alguém que nunca deveria ter entrado.",
    ).toHaveLength(0);
  });

  it("o papel vem da lista, não do que o cliente mandou", async () => {
    // O parâmetro é só nome e avatar. Não existe caminho para o cliente
    // pedir para ser mentor — a assinatura da função não aceita papel.
    const assinatura = await db.query<{ args: string }>(
      `select pg_get_function_arguments(p.oid) as args
         from pg_proc p join pg_namespace n on n.oid=p.pronamespace
        where n.nspname='public' and p.proname='provisionar_acesso'`,
    );
    expect(assinatura.rows[0]?.args).not.toContain("papel");
  });
});

describe("RF-A1 — nome e foto vêm do Google, sem formulário", () => {
  it("preenche no primeiro acesso", async () => {
    await provisionar(CONVIDADA, "Ana Souza", "https://exemplo/ana.jpg");
    const u = await db.query<{ nome: string; avatar_url: string }>(
      "select nome, avatar_url from usuario where id=$1",
      [CONVIDADA],
    );
    expect(u.rows[0]?.nome).toBe("Ana Souza");
    expect(u.rows[0]?.avatar_url).toBe("https://exemplo/ana.jpg");
  });

  it("atualiza no acesso seguinte, se a pessoa trocou a foto", async () => {
    await provisionar(CONVIDADA, "Ana Souza", "https://exemplo/velha.jpg");
    await provisionar(CONVIDADA, "Ana S. Lima", "https://exemplo/nova.jpg");

    const u = await db.query<{ nome: string; avatar_url: string }>(
      "select nome, avatar_url from usuario where id=$1",
      [CONVIDADA],
    );
    expect(u.rows[0]?.nome).toBe("Ana S. Lima");
    expect(u.rows[0]?.avatar_url).toBe("https://exemplo/nova.jpg");
  });

  it("nome vazio cai para o e-mail em vez de gravar string vazia", async () => {
    await provisionar(CONVIDADA, "   ", null);
    const u = await db.query<{ nome: string }>(
      "select nome from usuario where id=$1",
      [CONVIDADA],
    );
    expect(u.rows[0]?.nome).toBe("convidada@ufg.br");
  });

  it("participante ganha participação na edição; mentor não", async () => {
    await provisionar(CONVIDADA);
    await provisionar(MENTORA);

    const p = await db.query("select * from participacao");
    expect(p.rows).toHaveLength(1);
  });

  it("entrar duas vezes não duplica a participação", async () => {
    await provisionar(CONVIDADA);
    await provisionar(CONVIDADA);
    const p = await db.query("select * from participacao");
    expect(p.rows).toHaveLength(1);
  });
});

describe("RN-13 — edição encerrada", () => {
  beforeEach(async () => {
    await db.query("update edicao set status='encerrada' where id=$1", [edicao]);
  });

  it("participante é recusado com o motivo do encerramento", async () => {
    const d = await provisionar(CONVIDADA);
    expect(d.resultado).toBe("edicao-encerrada");
  });

  it("mentor continua entrando, em modo arquivo", async () => {
    const d = await provisionar(MENTORA);
    expect(d.resultado).toBe("entra");
    expect(d.papel).toBe("mentor");
  });

  it("a recusa por encerramento também não cria conta", async () => {
    await provisionar(CONVIDADA);
    const u = await db.query("select * from usuario where id=$1", [CONVIDADA]);
    expect(u.rows).toHaveLength(0);
  });
});

describe("a recusa não vaza informação para quem está de fora", () => {
  it("estranho ouve 'não autorizado' mesmo com a edição encerrada", async () => {
    await db.query("update edicao set status='encerrada' where id=$1", [edicao]);
    const d = await provisionar(ESTRANHO);
    expect(d.resultado).toBe("nao-autorizado");
  });
});

describe("RN-11 — remover da lista derruba o acesso", () => {
  it("removido da lista perde o papel na entrada seguinte", async () => {
    await provisionar(CONVIDADA);
    await db.query("delete from email_autorizado where email=$1", [
      "convidada@ufg.br",
    ]);

    const d = await provisionar(CONVIDADA);
    expect(d.resultado).toBe("nao-autorizado");
  });
});

describe("bootstrap — a porta de entrada de um banco vazio", () => {
  /**
   * A lista é fechada por padrão e só mentor escreve nela; mentor só existe se
   * estiver na lista. Num banco novo isso é um ciclo fechado, e ninguém entra —
   * nem quem criou o projeto. `supabase/bootstrap.sql` abre a porta uma vez.
   *
   * Este teste percorre o caminho inteiro: banco vazio → bootstrap → o primeiro
   * mentor entra → ele cadastra o resto do time.
   */
  it("do zero até o primeiro mentor conseguir cadastrar os outros", async () => {
    await db.query("delete from participacao");
    await db.query("delete from email_autorizado");
    await db.query("delete from usuario");
    await db.query("delete from edicao");

    // Antes do bootstrap: ninguém entra, nem o dono do projeto.
    expect((await provisionar(MENTORA)).resultado).toBe("nao-autorizado");

    // O que bootstrap.sql faz: cria a edição e autoriza o primeiro mentor.
    const ed = (
      await db.query("insert into edicao (nome) values ('2026.2') returning id")
    ).rows[0].id;
    await db.query(
      `insert into email_autorizado (email, papel, edicao_id)
       values ('mentora@ufg.br','mentor',$1)`,
      [ed],
    );

    // Agora ele entra.
    const d = await provisionar(MENTORA, "Mentora Chefe");
    expect(d.resultado).toBe("entra");
    expect(d.papel).toBe("mentor");

    // E consegue cadastrar o time — pela política, como um mentor de verdade,
    // sem service_role e sem SQL manual.
    await db.query("begin");
    await db.query("select set_config('role','authenticated',true)");
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: MENTORA, role: "authenticated" }),
    ]);
    const inseridos = await db.query(
      `insert into email_autorizado (email, papel, edicao_id)
       values ('convidada@ufg.br','participante',$1) returning email`,
      [ed],
    );
    await db.query("commit");

    expect(
      inseridos.rows,
      "O primeiro mentor não conseguiu cadastrar ninguém — o ciclo continua fechado.",
    ).toHaveLength(1);

    // E a pessoa cadastrada por ele entra.
    expect((await provisionar(CONVIDADA)).resultado).toBe("entra");
  });

  it("um participante NÃO consegue cadastrar ninguém", async () => {
    await provisionar(CONVIDADA);

    let bloqueou = false;
    await db.query("begin");
    try {
      await db.query("select set_config('role','authenticated',true)");
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ sub: CONVIDADA, role: "authenticated" }),
      ]);
      await db.query(
        `insert into email_autorizado (email, papel, edicao_id)
         values ('amigo@qualquer.com','mentor',$1)`,
        [edicao],
      );
    } catch {
      bloqueou = true;
    }
    await db.query("rollback");

    expect(
      bloqueou,
      "Um participante conseguiu se promover a mentor cadastrando um e-mail.",
    ).toBe(true);
  });
});

describe("e-mail com maiúscula e espaço", () => {
  it("casa com a lista mesmo assim", async () => {
    await db.query("delete from email_autorizado");
    await db.query(
      `insert into email_autorizado (email, papel, edicao_id)
       values ('  CONVIDADA@UFG.BR ', 'participante', $1)`,
      [edicao],
    );

    const d = await provisionar(CONVIDADA);
    expect(d.resultado).toBe("entra");
  });
});
