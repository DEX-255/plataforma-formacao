import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Client } from "pg";
import { limparTabelas } from "./bancada";

/**
 * A liberação contra o banco de verdade — `RF-B4`, `RN-05`, `RN-08`.
 *
 * O que este arquivo prova e nenhuma tela provaria: que as três consequências
 * da liberação acontecem **juntas**, e que a reordenação física das mensagens
 * anônimas acontece **na mesma transação** que muda o status.
 *
 * A ordem física não é uma coluna e não aparece em nenhuma consulta normal.
 * É por isso que ela só pode ser verificada aqui, com `ctid` na mão.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

const MENTOR = "eeeeeeee-1111-4111-8111-eeeeeeeeeeee";
const PARTICIPANTES = [
  "ffffffff-0001-4111-8111-ffffffffffff",
  "ffffffff-0002-4111-8111-ffffffffffff",
  "ffffffff-0003-4111-8111-ffffffffffff",
  "ffffffff-0004-4111-8111-ffffffffffff",
  "ffffffff-0005-4111-8111-ffffffffffff",
  "ffffffff-0006-4111-8111-ffffffffffff",
];

let edicao: string;
let participacoes: string[] = [];
let numero = 70;

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

/** Fora de transação — a liberação precisa commitar para ser observável. */
async function comoUsuarioCommit(usuario: string, consulta: string, params: unknown[] = []) {
  await db.query("begin");
  try {
    await db.query("select set_config('role','authenticated',true)");
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: usuario, role: "authenticated" }),
    ]);
    await db.query(consulta, params);
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

async function encontroAberto(): Promise<string> {
  numero += 1;
  const { rows } = await db.query(
    `insert into encontro (edicao_id, numero, tema, data, framework, status)
     values ($1,$2,'Tema',current_date,'oratoria','aberto') returning id`,
    [edicao, numero],
  );
  return rows[0].id;
}

beforeAll(async () => {
  db = new Client({ connectionString: URL_BANCO });
  await db.connect();

  await limparTabelas(db);
  await db.query("delete from auth.users");

  for (const [i, id] of [MENTOR, ...PARTICIPANTES].entries()) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2)`,
      [id, `u${i}@lib.test`],
    );
  }

  await db.query(
    `insert into usuario (id, email, nome, papel) values ($1,'u0@lib.test','Mentor','mentor')`,
    [MENTOR],
  );

  edicao = (
    await db.query(`insert into edicao (nome) values ('lib') returning id`)
  ).rows[0].id;

  participacoes = [];
  for (const [i, id] of PARTICIPANTES.entries()) {
    await db.query(
      `insert into usuario (id, email, nome, papel)
       values ($1,$2,$3,'participante')`,
      [id, `u${i + 1}@lib.test`, `P${i + 1}`],
    );
    const { rows } = await db.query(
      `insert into participacao (usuario_id, edicao_id) values ($1,$2) returning id`,
      [id, edicao],
    );
    participacoes.push(rows[0].id);
  }
});

beforeEach(async () => {
  await limparTabelas(db, [
    "mensagem_enviada",
    "mensagem_anonima",
    "feedback",
    "presenca",
    "atribuicao_eixo",
    "encontro",
  ]);
});

afterAll(async () => {
  await db.end();
});

describe("as três consequências acontecem juntas", () => {
  it("antes de liberar: participante não lê feedback, caixa aberta, mentor não lê mensagem", async () => {
    const encontro = await encontroAberto();

    await db.query(
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
                             situacao, ponto, sugestao, nota)
       values ($1,$2,$3,'fala','S','P','Sugestão',3)`,
      [encontro, participacoes[0], MENTOR],
    );

    await comoUsuarioCommit(
      PARTICIPANTES[0]!,
      `select enviar_mensagem_anonima($1,'antes da liberação')`,
      [encontro],
    );

    const feedbackDoParticipante = await comoUsuario(
      PARTICIPANTES[0]!,
      "select * from feedback_visivel",
    );
    const mensagensDoMentor = await comoUsuario(
      MENTOR,
      "select * from mensagem_anonima",
    );

    expect(feedbackDoParticipante, "RN-05 furou antes da liberação").toHaveLength(0);
    expect(mensagensDoMentor, "mentor leu mensagem antes da liberação").toHaveLength(0);
  });

  it("depois de liberar: as três mudam de estado no mesmo instante", async () => {
    const encontro = await encontroAberto();

    await db.query(
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
                             situacao, ponto, sugestao, nota)
       values ($1,$2,$3,'fala','S','P','Sugestão',3)`,
      [encontro, participacoes[0], MENTOR],
    );
    await comoUsuarioCommit(
      PARTICIPANTES[0]!,
      `select enviar_mensagem_anonima($1,'antes da liberação')`,
      [encontro],
    );

    await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);

    const feedbackDoParticipante = await comoUsuario(
      PARTICIPANTES[0]!,
      "select * from feedback_visivel",
    );
    const mensagensDoMentor = await comoUsuario(
      MENTOR,
      "select * from mensagem_anonima",
    );
    const caixaAindaAceita = await (async () => {
      try {
        await comoUsuarioCommit(
          PARTICIPANTES[1]!,
          `select enviar_mensagem_anonima($1,'depois da liberação')`,
          [encontro],
        );
        return true;
      } catch {
        return false;
      }
    })();

    expect(feedbackDoParticipante).toHaveLength(1);
    expect(mensagensDoMentor).toHaveLength(1);
    expect(caixaAindaAceita, "a caixa continuou aceitando depois de liberar").toBe(
      false,
    );
  });
});

describe("RN-05 — feedback escrito depois da liberação aparece de imediato", () => {
  it("sem esperar nova liberação", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);

    await db.query(
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
                             situacao, ponto, sugestao, nota)
       values ($1,$2,$3,'fala','S','P','Escrito depois',4)`,
      [encontro, participacoes[0], MENTOR],
    );

    const linhas = await comoUsuario<{ sugestao: string }>(
      PARTICIPANTES[0]!,
      "select sugestao from feedback_visivel",
    );

    expect(linhas[0]?.sugestao).toBe("Escrito depois");
  });
});

describe("RN-08 — a reordenação física acontece na liberação", () => {
  /**
   * O vazamento: as duas tabelas são escritas na mesma transação, uma linha em
   * cada. Sem reordenar, a n-ésima linha física de `mensagem_anonima`
   * corresponde à n-ésima de `mensagem_enviada` — e essa tem o
   * `participacao_id`. Um zíper entre as duas reidentifica a turma inteira.
   */
  async function enviarSeisMensagens(encontro: string) {
    for (const [i, p] of PARTICIPANTES.entries()) {
      await comoUsuarioCommit(p, `select enviar_mensagem_anonima($1,$2)`, [
        encontro,
        `mensagem ${i + 1}`,
      ]);
    }
  }

  it("antes de liberar, a ordem física É a de inserção — o vazamento existe", async () => {
    const encontro = await encontroAberto();
    await enviarSeisMensagens(encontro);

    const { rows } = await db.query<{ texto: string }>(
      `select texto from mensagem_anonima where encontro_id = $1 order by ctid`,
      [encontro],
    );

    // Confirma a premissa da mitigação. Se isto passar a falhar sozinho, o
    // teste seguinte deixou de provar qualquer coisa.
    expect(rows.map((r) => r.texto)).toEqual([
      "mensagem 1",
      "mensagem 2",
      "mensagem 3",
      "mensagem 4",
      "mensagem 5",
      "mensagem 6",
    ]);
  });

  it("depois de liberar, a ordem física segue ordem_aleatoria", async () => {
    const encontro = await encontroAberto();
    await enviarSeisMensagens(encontro);
    await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);

    const porFisica = await db.query<{ ordem_aleatoria: number }>(
      `select ordem_aleatoria from mensagem_anonima where encontro_id=$1 order by ctid`,
      [encontro],
    );

    const valores = porFisica.rows.map((r) => Number(r.ordem_aleatoria));
    const crescente = [...valores].sort((a, b) => a - b);

    expect(
      valores,
      "a ordem física não seguiu ordem_aleatoria — o CLUSTER não rodou",
    ).toEqual(crescente);
  });

  it("o zíper entre as duas tabelas não reidentifica ninguém", async () => {
    const encontro = await encontroAberto();
    await enviarSeisMensagens(encontro);
    await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);

    // O ataque: parear a n-ésima linha física de cada tabela.
    const { rows } = await db.query<{ texto: string; participacao_id: string }>(
      `with a as (
         select texto, row_number() over (order by ctid) n
           from mensagem_anonima where encontro_id = $1
       ), e as (
         select participacao_id, row_number() over (order by ctid) n
           from mensagem_enviada where encontro_id = $1
       )
       select a.texto, e.participacao_id from a join e using (n)`,
      [encontro],
    );

    // Cada mensagem "mensagem N" foi enviada por PARTICIPANTES[N-1]. Se o
    // zíper acertasse todas, a reidentificação seria completa.
    const corretos = rows.filter((r) => {
      const i = Number(r.texto.replace("mensagem ", "")) - 1;
      return r.participacao_id === participacoes[i];
    }).length;

    expect(rows).toHaveLength(6);
    expect(
      corretos,
      `o zíper acertou ${corretos} de 6 autores. Com o CLUSTER rodando, acertar tudo é impossível.`,
    ).toBeLessThan(6);
  });
});

describe("a prévia consegue contar antes de liberar", () => {
  /**
   * O defeito que este teste fixa: a tela contava por `mensagem_anonima`, que a
   * política só devolve depois da liberação. Dizia "0 mensagens" com mensagens
   * no banco — e a consulta não estava errada, estava obedecendo.
   */
  it("mentor NÃO lê mensagem_anonima de encontro aberto — a política está certa", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(PARTICIPANTES[0]!, `select enviar_mensagem_anonima($1,'oi')`, [
      encontro,
    ]);

    const linhas = await comoUsuario(
      MENTOR,
      `select * from mensagem_anonima where encontro_id = '${encontro}'`,
    );
    expect(linhas).toHaveLength(0);
  });

  it("conta pela função, que devolve só o inteiro", async () => {
    const encontro = await encontroAberto();
    for (const p of PARTICIPANTES.slice(0, 3)) {
      await comoUsuarioCommit(p, `select enviar_mensagem_anonima($1,'oi')`, [encontro]);
    }

    const linhas = await comoUsuario<{ n: number }>(
      MENTOR,
      `select contar_mensagens_do_encontro('${encontro}') as n`,
    );

    expect(Number(linhas[0]?.n)).toBe(3);
  });

  /**
   * O vazamento que este bloco fecha, encontrado ao desenhar `caixa-anonima`.
   *
   * A política `enviada_mentor_le` dava leitura irrestrita de
   * `mensagem_enviada`, que tem `participacao_id`. Com uma mensagem no
   * encontro, o mentor sabia de quem era — sem reidentificar nada, porque a
   * tabela entregava a lista pronta. O teste de reidentificação existente
   * passava porque atacava pelo lado difícil.
   */
  it("RN-08 — o mentor NÃO lista quem enviou", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(
      PARTICIPANTES[0]!,
      `select enviar_mensagem_anonima($1,'critiquei um mentor')`,
      [encontro],
    );

    const linhas = await comoUsuario(
      MENTOR,
      `select * from mensagem_enviada where encontro_id = '${encontro}'`,
    );

    expect(
      linhas,
      "O mentor leu a lista de quem enviou. Com uma mensagem no encontro, isso é o nome do autor.",
    ).toHaveLength(0);
  });

  it("RN-08 — nem pela junção com participacao e usuario", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(PARTICIPANTES[0]!, `select enviar_mensagem_anonima($1,'oi')`, [
      encontro,
    ]);

    const linhas = await comoUsuario(
      MENTOR,
      `select u.nome from mensagem_enviada me
         join participacao p on p.id = me.participacao_id
         join usuario u on u.id = p.usuario_id
        where me.encontro_id = '${encontro}'`,
    );

    expect(linhas).toHaveLength(0);
  });

  it("o participante continua vendo a própria marca — a tela precisa dizer “já enviei”", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(PARTICIPANTES[0]!, `select enviar_mensagem_anonima($1,'oi')`, [
      encontro,
    ]);

    const minhas = await comoUsuario(
      PARTICIPANTES[0]!,
      `select * from mensagem_enviada where encontro_id = '${encontro}'`,
    );
    const deOutro = await comoUsuario(
      PARTICIPANTES[1]!,
      `select * from mensagem_enviada where encontro_id = '${encontro}'`,
    );

    expect(minhas).toHaveLength(1);
    expect(deOutro, "um participante viu que o outro enviou").toHaveLength(0);
  });

  it("a contagem só responde a mentor", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(PARTICIPANTES[0]!, `select enviar_mensagem_anonima($1,'oi')`, [
      encontro,
    ]);

    const linhas = await comoUsuario<{ n: number }>(
      PARTICIPANTES[1]!,
      `select contar_mensagens_do_encontro('${encontro}') as n`,
    );

    expect(Number(linhas[0]?.n)).toBe(0);
  });

  it("a marca não diz o que a pessoa escreveu — só que escreveu", async () => {
    const colunas = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
        where table_name = 'mensagem_enviada'`,
    );
    const nomes = colunas.rows.map((c) => c.column_name);

    expect(nomes).toContain("participacao_id");
    expect(nomes).not.toContain("texto");
    expect(nomes).not.toContain("mensagem_id");
    // Sem horário: cruzar horário de envio com ordem de inserção reidentifica.
    expect(nomes).not.toContain("criado_em");
  });
});

describe("quem pode liberar", () => {
  it("participante não libera", async () => {
    const encontro = await encontroAberto();

    let erro: string | null = null;
    try {
      await comoUsuarioCommit(PARTICIPANTES[0]!, `select liberar_encontro($1)`, [
        encontro,
      ]);
    } catch (e) {
      erro = (e as Error).message;
    }

    expect(erro).toMatch(/só mentor libera/);
  });

  it("liberar duas vezes é recusado", async () => {
    const encontro = await encontroAberto();
    await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);

    let erro: string | null = null;
    try {
      await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [encontro]);
    } catch (e) {
      erro = (e as Error).message;
    }

    expect(erro).toMatch(/não está aberto/);
  });

  it("liberar encontro em rascunho é recusado", async () => {
    numero += 1;
    const { rows } = await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1,$2,'Tema',current_date,'oratoria','rascunho') returning id`,
      [edicao, numero],
    );

    let erro: string | null = null;
    try {
      await comoUsuarioCommit(MENTOR, `select liberar_encontro($1)`, [rows[0].id]);
    } catch (e) {
      erro = (e as Error).message;
    }

    expect(erro).toMatch(/não está aberto/);
  });
});
