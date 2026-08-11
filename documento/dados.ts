import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/dominio/banco";

/**
 * Leitura dos dados do documento final — `RF-H1`, `RF-H3`, `D-07`.
 *
 * **Este é o único lugar do projeto que usa a `service_role`**, e há teste de
 * guarda garantindo isso.
 *
 * O gerador roda como script, sem sessão de ninguém. Sem a chave que ignora a
 * RLS ele não leria nada, porque toda política depende de `auth.uid()`. O que
 * torna isso aceitável aqui e em nenhum outro lugar:
 *
 * - roda **fora do servidor web** — não existe rota que alcance este código;
 * - lê da variável de ambiente e o processo termina;
 * - nada aqui é importado por componente de tela.
 *
 * **Toda consulta ordena por chave estável.** `RF-H3` exige que rodar de novo
 * anos depois produza o mesmo documento, e ordem indefinida de `select` é a
 * forma mais silenciosa de quebrar isso: o arquivo sai diferente sem ninguém
 * mudar uma linha.
 */

export type DadosDoParticipante = {
  nome: string;
  email: string;
  participacaoId: string;
  encontros: {
    id: string;
    numero: number;
    tema: string;
    data: string;
    framework: Database["public"]["Enums"]["framework"];
    presenca: Database["public"]["Enums"]["presenca_st"] | null;
    feedbacks: {
      id: string;
      eixo: string;
      mentor: string;
      situacao: string;
      ponto: string;
      sugestao: string;
      nota: number | null;
      naoObservado: boolean;
    }[];
  }[];
};

export type DadosDaEdicao = {
  nome: string;
  encerradaEm: string | null;
  participantes: DadosDoParticipante[];
};

function cliente() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente. " +
        "A chave de serviço não vive no repositório (D-07) — exporte-a na sessão " +
        "em que for gerar os documentos.",
    );
  }

  return createClient<Database>(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function lerEdicao(nomeDaEdicao?: string): Promise<DadosDaEdicao> {
  const db = cliente();

  const consultaEdicao = db
    .from("edicao")
    .select("id, nome, status")
    .order("nome", { ascending: false })
    .limit(1);

  const { data: edicao, error: erroEdicao } = nomeDaEdicao
    ? await db
        .from("edicao")
        .select("id, nome, status")
        .eq("nome", nomeDaEdicao)
        .maybeSingle()
    : await consultaEdicao.maybeSingle();

  // Engolir o erro aqui faria "não achei a edição" e "não consegui falar com o
  // banco" virarem a mesma mensagem — e a segunda é a que acontece de verdade
  // quando a chave está errada.
  if (erroEdicao) {
    throw new Error(`Falha ao ler a edição: ${erroEdicao.message}`);
  }

  if (!edicao) {
    throw new Error(
      nomeDaEdicao
        ? `Não existe edição chamada "${nomeDaEdicao}".`
        : "Nenhuma edição no banco.",
    );
  }

  const [participacoes, encontros, feedbacks, presencas, mentores] =
    await Promise.all([
      db
        .from("participacao")
        .select("id, usuario:usuario_id (nome, email)")
        .eq("edicao_id", edicao.id)
        .order("id"),
      db
        .from("encontro")
        .select("id, numero, tema, data, framework, status")
        .eq("edicao_id", edicao.id)
        .neq("status", "rascunho")
        .order("numero"),
      db
        .from("feedback")
        .select("*")
        .order("encontro_id")
        .order("eixo")
        .order("id"),
      db.from("presenca").select("encontro_id, participacao_id, status"),
      db.from("usuario").select("id, nome").eq("papel", "mentor").order("id"),
    ]);

  const nomeDoMentor = new Map(
    (mentores.data ?? []).map((m) => [m.id, m.nome]),
  );

  const participantes: DadosDoParticipante[] = (participacoes.data ?? [])
    .filter((p) => p.usuario)
    .map((p) => ({
      nome: p.usuario!.nome,
      email: p.usuario!.email,
      participacaoId: p.id,
      encontros: (encontros.data ?? []).map((e) => ({
        id: e.id,
        numero: e.numero,
        tema: e.tema,
        data: e.data,
        framework: e.framework,
        presenca:
          (presencas.data ?? []).find(
            (x) => x.encontro_id === e.id && x.participacao_id === p.id,
          )?.status ?? null,
        feedbacks: (feedbacks.data ?? [])
          .filter((f) => f.encontro_id === e.id && f.participacao_id === p.id)
          .map((f) => ({
            id: f.id,
            eixo: f.eixo,
            mentor: nomeDoMentor.get(f.mentor_id) ?? "Mentor",
            situacao: f.situacao,
            ponto: f.ponto,
            sugestao: f.sugestao,
            nota: f.nota,
            naoObservado: f.nao_observado,
          })),
      })),
    }))
    // Ordem estável por nome: o lote sai sempre na mesma sequência.
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    nome: edicao.nome,
    // A data que aparece no documento é a do encerramento, que está no banco —
    // nunca `new Date()`, que faria cada execução gerar um arquivo diferente.
    encerradaEm: edicao.status === "encerrada" ? edicao.nome : null,
    participantes,
  };
}
