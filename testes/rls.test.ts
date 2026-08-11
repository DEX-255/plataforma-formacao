import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { limparTabelas } from "./bancada";

/**
 * As regras invariantes, testadas contra o banco de verdade.
 *
 * specs/07: "Testar só pela interface não prova que a política está certa."
 * Aqui não existe interface nenhuma — é SQL cru, com o papel do Postgres
 * trocado para `authenticated` e o `sub` do JWT apontando para cada usuário.
 * É exatamente o que um participante mal-intencionado conseguiria fazer
 * chamando a API direto do console do navegador.
 */

const URL_BANCO =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

let db: Client;

/** IDs fixos para o teste ser legível quando falhar. */
const MENTOR = "11111111-1111-4111-8111-111111111111";
const ANA = "22222222-2222-4222-8222-222222222222";
const BRUNO = "33333333-3333-4333-8333-333333333333";

let edicao: string;
let encontro: string;
let partAna: string;
let partBruno: string;

/** Executa como um usuário autenticado específico, como a API faria. */
async function comoUsuario<T>(
  usuario: string,
  consulta: string,
  params: unknown[] = [],
): Promise<T[]> {
  await db.query("begin");
  try {
    await db.query("select set_config('role', 'authenticated', true)");
    await db.query(
      "select set_config('request.jwt.claims', $1, true)",
      [JSON.stringify({ sub: usuario, role: "authenticated" })],
    );
    const r = await db.query(consulta, params);
    return r.rows as T[];
  } finally {
    await db.query("rollback");
  }
}

/**
 * Um encontro novo, já aberto, para os testes da caixa anônima.
 *
 * Antes isto era `update encontro set status='aberto'` no encontro
 * compartilhado, que a essa altura já tinha sido liberado. O gatilho
 * `encontro_transicao` passou a recusar essa volta — e com razão: é justamente
 * a transição que o produto promete não existir. O teste não pode furar a
 * regra que ele existe para verificar.
 */
let numeroDeApoio = 10;

async function encontroAbertoNovo(): Promise<string> {
  numeroDeApoio += 1;
  const { rows } = await db.query(
    `insert into encontro (edicao_id, numero, tema, data, framework, status)
     values ($1, $2, 'Encontro de apoio', current_date, 'oratoria', 'aberto')
     returning id`,
    [edicao, numeroDeApoio],
  );
  return rows[0].id;
}

async function esperaErro(
  usuario: string,
  consulta: string,
): Promise<string | null> {
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

  // Limpeza — o teste é reexecutável.
  await limparTabelas(db);
  await db.query("delete from auth.users");

  for (const [id, email] of [
    [MENTOR, "mentor@dex.test"],
    [ANA, "ana@dex.test"],
    [BRUNO, "bruno@dex.test"],
  ]) {
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2)`,
      [id, email],
    );
  }

  await db.query(
    `insert into usuario (id, email, nome, papel) values
      ($1,'mentor@dex.test','Mentora',   'mentor'),
      ($2,'ana@dex.test',   'Ana',       'participante'),
      ($3,'bruno@dex.test', 'Bruno',     'participante')`,
    [MENTOR, ANA, BRUNO],
  );

  edicao = (
    await db.query(
      `insert into edicao (nome) values ('2026.2-teste') returning id`,
    )
  ).rows[0].id;

  partAna = (
    await db.query(
      `insert into participacao (usuario_id, edicao_id) values ($1,$2) returning id`,
      [ANA, edicao],
    )
  ).rows[0].id;

  partBruno = (
    await db.query(
      `insert into participacao (usuario_id, edicao_id) values ($1,$2) returning id`,
      [BRUNO, edicao],
    )
  ).rows[0].id;

  encontro = (
    await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1, 2, 'Modelos de Negócio', current_date, 'oratoria', 'aberto')
       returning id`,
      [edicao],
    )
  ).rows[0].id;

  // Um feedback para cada, com nota — o dado que RN-03 protege.
  for (const [part, nome] of [
    [partAna, "Ana"],
    [partBruno, "Bruno"],
  ]) {
    await db.query(
      `insert into feedback
         (encontro_id, participacao_id, mentor_id, eixo,
          situacao, ponto, sugestao, nota, observacao_interna)
       values ($1,$2,$3,'fala',
          'Na apresentação de ${nome}', 'Muletas sonoras frequentes',
          'Grave dois minutos e conte os "hã"', 2,
          'Interno: ainda muito travado, mas melhorou do encontro 1')`,
      [encontro, part, MENTOR],
    );
  }
});

afterAll(async () => {
  await db.end();
});

// ═══════════════════════════════════════════════════════════════════════════

describe("RN-03 — o participante nunca vê o bloco interno", () => {
  it("a tabela feedback é negada ao participante", async () => {
    const linhas = await comoUsuario(ANA, "select * from feedback");
    expect(
      linhas,
      "Participante leu a tabela feedback crua. É por ali que nota e observação interna vazam.",
    ).toHaveLength(0);
  });

  it("a view feedback_visivel não tem as colunas do bloco interno", async () => {
    const colunas = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name = 'feedback_visivel'`,
    );
    const nomes = colunas.rows.map((c) => c.column_name);

    expect(nomes).not.toContain("nota");
    expect(nomes).not.toContain("observacao_interna");
    expect(nomes).not.toContain("nao_observado");
    expect(nomes).toContain("sugestao");
  });

  it("o mentor vê a nota — a assimetria é o produto", async () => {
    const linhas = await comoUsuario<{ nota: number }>(
      MENTOR,
      "select nota from feedback order by nota",
    );
    expect(linhas).toHaveLength(2);
    expect(linhas[0]?.nota).toBe(2);
  });
});

describe("RN-05 — feedback só aparece depois da liberação", () => {
  it("com o encontro aberto, a view não devolve nada", async () => {
    const linhas = await comoUsuario(ANA, "select * from feedback_visivel");
    expect(linhas).toHaveLength(0);
  });

  it("depois de liberado, Ana vê o dela", async () => {
    await db.query(
      "update encontro set status='liberado', liberado_em=now() where id=$1",
      [encontro],
    );

    const linhas = await comoUsuario<{ sugestao: string }>(
      ANA,
      "select * from feedback_visivel",
    );
    expect(linhas).toHaveLength(1);
    expect(linhas[0]?.sugestao).toContain("Grave dois minutos");
  });
});

describe("RN-12 — participante só enxerga a si mesmo", () => {
  it("Ana não alcança o feedback de Bruno nem pedindo explicitamente", async () => {
    const linhas = await comoUsuario(
      ANA,
      `select * from feedback_visivel where participacao_id = '${partBruno}'`,
    );
    expect(
      linhas,
      "Ana leu o feedback de Bruno. O `where` da view é a fronteira, e ela furou.",
    ).toHaveLength(0);
  });

  it("Ana não lista a turma", async () => {
    const linhas = await comoUsuario(ANA, "select * from participacao");
    expect(linhas).toHaveLength(1);
  });

  it("Ana não lê presença de outro", async () => {
    await db.query(
      `insert into presenca (encontro_id, participacao_id, status, marcado_por)
       values ($1,$2,'presente',$3), ($1,$4,'ausente',$3)`,
      [encontro, partAna, MENTOR, partBruno],
    );
    const linhas = await comoUsuario(ANA, "select * from presenca");
    expect(linhas).toHaveLength(1);
  });
});

/**
 * A trajetória é a primeira tela que faz o participante ler `usuario`: `RN-04`
 * exige o nome do mentor, porque assinatura sem nome não é assinatura.
 *
 * Essa permissão é estreita de propósito, e é fácil de escrever errado —
 * `usando (true)` funcionaria igual na tela e entregaria a lista da turma
 * inteira a qualquer participante com o console aberto.
 */
describe("RN-04 com RN-12 — o nome do mentor sim, a turma não", () => {
  it("Ana lê o nome dos mentores", async () => {
    const linhas = await comoUsuario<{ nome: string }>(
      ANA,
      "select nome from usuario where papel = 'mentor'",
    );
    expect(linhas.map((l) => l.nome)).toContain("Mentora");
  });

  it("Ana lê a si mesma", async () => {
    const linhas = await comoUsuario(
      ANA,
      `select * from usuario where id = '${ANA}'`,
    );
    expect(linhas).toHaveLength(1);
  });

  it("Ana NÃO lê Bruno, nem pedindo pelo id", async () => {
    const linhas = await comoUsuario(
      ANA,
      `select * from usuario where id = '${BRUNO}'`,
    );
    expect(
      linhas,
      "Ana leu o cadastro de outro participante. É a lista da turma vazando pelo nome do mentor.",
    ).toHaveLength(0);
  });

  it("varrer a tabela devolve só Ana e os mentores", async () => {
    const linhas = await comoUsuario<{ papel: string; nome: string }>(
      ANA,
      "select papel, nome from usuario",
    );

    const participantes = linhas.filter((l) => l.papel === "participante");
    expect(participantes.map((p) => p.nome)).toEqual(["Ana"]);
  });

  it("Ana não escreve em usuario — nem no próprio nome", async () => {
    // Trocar o próprio nome parece inofensivo, mas o nome é o que aparece
    // assinando presença e no documento final: é registro, não perfil.
    await comoUsuario(
      ANA,
      `update usuario set nome = 'Outro Nome' where id = '${ANA}'`,
    );

    const { rows } = await db.query(`select nome from usuario where id = $1`, [
      ANA,
    ]);
    expect(rows[0].nome).toBe("Ana");
  });
});

describe("o que a trajetória enxerga de encontro", () => {
  it("rascunho é invisível para o participante", async () => {
    const { rows } = await db.query(
      `insert into encontro (edicao_id, numero, tema, data, framework, status)
       values ($1, 90, 'Ainda em rascunho', current_date, 'oratoria', 'rascunho')
       returning id`,
      [edicao],
    );

    const linhas = await comoUsuario<{ id: string }>(
      ANA,
      "select id from encontro",
    );

    expect(linhas.map((l) => l.id)).not.toContain(rows[0].id);
  });

  it("encontro de outra edição é invisível", async () => {
    const outra = (
      await db.query(`insert into edicao (nome) values ('outra') returning id`)
    ).rows[0].id;

    const alheio = (
      await db.query(
        `insert into encontro (edicao_id, numero, tema, data, framework, status)
         values ($1, 1, 'De outra turma', current_date, 'oratoria', 'aberto')
         returning id`,
        [outra],
      )
    ).rows[0].id;

    const linhas = await comoUsuario<{ id: string }>(
      ANA,
      "select id from encontro",
    );

    expect(linhas.map((l) => l.id)).not.toContain(alheio);
  });

  it("participante não cria nem altera encontro", async () => {
    const erro = await esperaErro(
      ANA,
      `insert into encontro (edicao_id, numero, tema, data, framework)
       values ('${edicao}', 91, 'Inventado', current_date, 'oratoria')`,
    );
    expect(erro).toMatch(/row-level security|policy|permission/i);
  });
});

describe("RN-13 — encerrar a edição derruba o acesso", () => {
  it("edição encerrada zera a leitura do participante", async () => {
    await db.query("update edicao set status='encerrada' where id=$1", [edicao]);

    const feedbacks = await comoUsuario(ANA, "select * from feedback_visivel");
    const participacoes = await comoUsuario(ANA, "select * from participacao");

    expect(feedbacks).toHaveLength(0);
    expect(participacoes).toHaveLength(0);

    await db.query("update edicao set status='ativa' where id=$1", [edicao]);
  });

  it("o mentor continua acessando em modo arquivo", async () => {
    await db.query("update edicao set status='encerrada' where id=$1", [edicao]);
    const linhas = await comoUsuario(MENTOR, "select * from feedback");
    expect(linhas).toHaveLength(2);
    await db.query("update edicao set status='ativa' where id=$1", [edicao]);
  });
});

describe("RN-01 — sugestão é obrigatória, garantido pelo banco", () => {
  it("sugestão em branco não entra nem por SQL direto", async () => {
    const erro = await esperaErro(
      MENTOR,
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
         situacao, ponto, sugestao)
       values ('${encontro}','${partAna}','${MENTOR}','mensagem','x','y','   ')`,
    );
    expect(erro).toMatch(/sugestao|check/i);
  });
});

describe("RN-07 — 'não observado' é valor de nota, não ausência", () => {
  it("nota e não-observado ao mesmo tempo é estado impossível", async () => {
    const erro = await esperaErro(
      MENTOR,
      `insert into feedback (encontro_id, participacao_id, mentor_id, eixo,
         situacao, ponto, sugestao, nota, nao_observado)
       values ('${encontro}','${partAna}','${MENTOR}','presenca','x','y','z', 3, true)`,
    );
    expect(erro).toMatch(/check|nao_observado/i);
  });
});

describe("RN-06 — ninguém edita feedback de outro mentor", () => {
  it("um segundo mentor não altera o registro do primeiro", async () => {
    const OUTRO = "44444444-4444-4444-8444-444444444444";
    await db.query(
      `insert into auth.users (id, instance_id, aud, role, email)
       values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','outro@dex.test')
       on conflict do nothing`,
      [OUTRO],
    );
    await db.query(
      `insert into usuario (id,email,nome,papel)
       values ($1,'outro@dex.test','Outro','mentor') on conflict do nothing`,
      [OUTRO],
    );

    const linhas = await comoUsuario(
      OUTRO,
      `update feedback set sugestao = 'reescrito' where mentor_id = '${MENTOR}' returning id`,
    );
    expect(linhas).toHaveLength(0);
  });
});

describe("RN-08 / RN-09 / RN-10 — anonimato", () => {
  it("nenhuma coluna liga mensagem a participante", async () => {
    const colunas = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name = 'mensagem_anonima'`,
    );
    const nomes = colunas.rows.map((c) => c.column_name);

    expect(nomes).not.toContain("participacao_id");
    expect(nomes).not.toContain("usuario_id");
    expect(nomes).not.toContain("autor_id");
    expect(nomes).not.toContain("criado_em");
  });

  it("mensagem_enviada não guarda horário", async () => {
    const colunas = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns
       where table_name = 'mensagem_enviada'`,
    );
    expect(colunas.rows.map((c) => c.column_name).sort()).toEqual([
      "encontro_id",
      "participacao_id",
    ]);
  });

  it("não existe FK possível entre as duas tabelas", async () => {
    const fks = await db.query(
      `select 1
         from information_schema.table_constraints tc
         join information_schema.constraint_column_usage ccu
           on ccu.constraint_name = tc.constraint_name
        where tc.table_name = 'mensagem_anonima'
          and tc.constraint_type = 'FOREIGN KEY'
          and ccu.table_name in ('participacao','usuario','mensagem_enviada')`,
    );
    expect(fks.rows).toHaveLength(0);
  });

  it("o participante não consegue inserir mensagem direto — só a RPC escreve", async () => {
    const aberto = await encontroAbertoNovo();

    const erro = await esperaErro(
      ANA,
      `insert into mensagem_anonima (encontro_id, texto)
       values ('${aberto}', 'burlando a rpc')`,
    );
    expect(erro).toMatch(/row-level security|permission|policy/i);
  });

  it("a RPC não devolve o id da mensagem", async () => {
    const fn = await db.query<{ tipo: string }>(
      `select pg_get_function_result(p.oid) as tipo
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.proname='enviar_mensagem_anonima'`,
    );
    expect(fn.rows[0]?.tipo).toBe("void");
  });

  it("RN-09 — a segunda mensagem do mesmo participante é recusada", async () => {
    const aberto = await encontroAbertoNovo();

    await db.query("begin");
    await db.query("select set_config('role','authenticated',true)");
    await db.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({ sub: ANA, role: "authenticated" }),
    ]);
    await db.query("select public.enviar_mensagem_anonima($1,$2)", [
      aberto,
      "primeira",
    ]);

    let bloqueou = false;
    try {
      await db.query("select public.enviar_mensagem_anonima($1,$2)", [
        aberto,
        "segunda",
      ]);
    } catch {
      bloqueou = true;
    }
    await db.query("rollback");

    expect(bloqueou, "RN-09 permitiu duas mensagens do mesmo participante").toBe(
      true,
    );
  });

  it("o participante nunca lê as mensagens, nem as próprias", async () => {
    const linhas = await comoUsuario(ANA, "select * from mensagem_anonima");
    expect(linhas).toHaveLength(0);
  });
});

describe("reidentificação — o teste que specs/07 chama de severidade máxima", () => {
  it("com acesso total ao banco, não existe junção que ligue autor e mensagem", async () => {
    const aberto = await encontroAbertoNovo();
    await db.query("delete from mensagem_anonima");
    await db.query("delete from mensagem_enviada");

    for (const [usuario, texto] of [
      [ANA, "a mentoria da fala foi dura mas justa"],
      [BRUNO, "senti que ninguém olhou pra mim hoje"],
    ]) {
      await db.query("begin");
      await db.query("select set_config('role','authenticated',true)");
      await db.query("select set_config('request.jwt.claims',$1,true)", [
        JSON.stringify({ sub: usuario, role: "authenticated" }),
      ]);
      await db.query("select public.enviar_mensagem_anonima($1,$2)", [
        aberto,
        texto,
      ]);
      await db.query("commit");
    }

    // Como superusuário: existe alguma coluna em comum além do encontro?
    const comuns = await db.query<{ column_name: string }>(
      `select a.column_name
         from information_schema.columns a
         join information_schema.columns b
           on a.column_name = b.column_name
        where a.table_name='mensagem_anonima'
          and b.table_name='mensagem_enviada'
          and a.column_name <> 'encontro_id'`,
    );
    expect(
      comuns.rows,
      "Existe coluna em comum entre as duas tabelas — é por ali que o autor sai.",
    ).toHaveLength(0);

    // E o dado em si: duas mensagens, duas marcas, nenhuma correspondência.
    const msgs = await db.query("select * from mensagem_anonima");
    const marcas = await db.query("select * from mensagem_enviada");
    expect(msgs.rows).toHaveLength(2);
    expect(marcas.rows).toHaveLength(2);
  });

  it("a ordem física deixa de correlacionar depois do CLUSTER", async () => {
    // Ver o design doc: ctid é a fresta que a ausência de coluna não fecha.
    // Rodar CLUSTER embaralha fisicamente antes de qualquer mentor ler.
    await db.query(
      "cluster mensagem_anonima using mensagem_anonima_ordem_idx",
    );

    const ordenado = await db.query<{ ok: boolean }>(
      `select bool_and(a <= b) as ok from (
         select ordem_aleatoria a,
                lead(ordem_aleatoria) over (order by ctid) b
           from mensagem_anonima
       ) t where b is not null`,
    );

    expect(
      ordenado.rows[0]?.ok,
      "Depois do CLUSTER a ordem física segue ordem_aleatoria, não a de chegada.",
    ).not.toBe(false);
  });
});
