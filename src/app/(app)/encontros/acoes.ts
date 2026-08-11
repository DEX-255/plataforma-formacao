"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";
import { podeAbrir } from "@/dominio/encontros";
import { eixoPertenceAoFramework, type Framework } from "@/dominio/frameworks";
import { FRAMEWORKS } from "@/dominio/frameworks";

/**
 * Ações de `/encontros` — `RF-B1`, `RF-B2`, `RF-B3`.
 *
 * Toda ação chama `exigirMentor()` primeiro, como em `/membros`: a RLS negaria
 * a escrita de um participante, mas o erro chegaria como falha genérica do
 * banco em vez de recusa clara.
 *
 * A checagem de estado aqui **não é a garantia** — é a mensagem. A garantia é
 * o gatilho `encontro_transicao` no banco, que vale para qualquer caminho,
 * inclusive um `PATCH` direto no PostgREST com o token da sessão.
 */

export type ResultadoCriacao = {
  ok: boolean;
  erro?: string;
  /**
   * O framework do que acabou de ser criado.
   *
   * Volta porque a confirmação depende dele: mandar "atribua os eixos" num
   * encontro `nenhum` sugere que faltou uma etapa que não existe, e `RN-14`
   * diz justamente que esse encontro está completo.
   */
  framework?: Framework;
};

function frameworkValido(v: string): v is Framework {
  return v in FRAMEWORKS;
}

export async function criarEncontro(
  _anterior: ResultadoCriacao | null,
  formData: FormData,
): Promise<ResultadoCriacao> {
  await exigirMentor();

  const edicaoId = String(formData.get("edicao") ?? "");
  const numero = Number(formData.get("numero"));
  const tema = String(formData.get("tema") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const framework = String(formData.get("framework") ?? "");

  if (!edicaoId) return { ok: false, erro: "Nenhuma edição ativa." };
  if (!Number.isInteger(numero) || numero < 1) {
    return { ok: false, erro: "O número do encontro precisa ser inteiro e positivo." };
  }
  if (!tema) return { ok: false, erro: "O tema não pode ficar vazio." };
  if (!data) return { ok: false, erro: "Escolha a data em que o encontro aconteceu." };
  if (!frameworkValido(framework)) {
    return { ok: false, erro: "Framework desconhecido." };
  }

  const supabase = await clienteServidor();

  const { error } = await supabase.from("encontro").insert({
    edicao_id: edicaoId,
    numero,
    tema,
    data,
    framework,
  });

  if (error) {
    // `unique (edicao_id, numero)` — dois mentores criando o mesmo encontro na
    // mesma noite é cenário real, e "23505" não diz nada a quem está na tela.
    if (error.code === "23505") {
      return {
        ok: false,
        erro: `Já existe o encontro ${numero} nesta edição. Talvez outro mentor tenha criado agora.`,
      };
    }
    return { ok: false, erro: error.message };
  }

  revalidatePath("/encontros");
  return { ok: true, framework };
}

/** `RF-B3` — `rascunho → aberto`. */
export async function abrirEncontro(formData: FormData): Promise<void> {
  await exigirMentor();

  const id = String(formData.get("encontro") ?? "");
  if (!id) return;

  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (!encontro || !podeAbrir(encontro)) return;

  await supabase.from("encontro").update({ status: "aberto" }).eq("id", id);

  revalidatePath("/encontros");
  revalidatePath(`/encontros/${id}`);
}

export type ResultadoEixos = {
  ok: boolean;
  erro?: string;
};

/**
 * `RF-B2` — a atribuição do encontro, gravada de uma vez.
 *
 * Apaga e reescreve em vez de calcular o diferencial: a atribuição é pequena,
 * cabe numa tela, e é sempre enviada inteira. Diferencial aqui seria
 * complexidade sem ganho — e um bug de diferencial deixaria mentor escrevendo
 * num eixo que ele não tem mais, que é `RN-02` furada.
 *
 * **Sem eixo é escolha válida** e vem como string vazia: o mentor que não vai
 * observar naquele encontro simplesmente não recebe canal.
 */
export async function salvarEixos(
  _anterior: ResultadoEixos | null,
  formData: FormData,
): Promise<ResultadoEixos> {
  await exigirMentor();

  const encontroId = String(formData.get("encontro") ?? "");
  if (!encontroId) return { ok: false, erro: "Encontro não informado." };

  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, framework, status")
    .eq("id", encontroId)
    .maybeSingle();

  if (!encontro) return { ok: false, erro: "Encontro não encontrado." };

  if (encontro.status === "liberado") {
    return {
      ok: false,
      erro: "O encontro já foi liberado. A atribuição de eixos não muda depois disso.",
    };
  }

  const atribuicoes: { encontro_id: string; mentor_id: string; eixo: string }[] = [];

  for (const [chave, valor] of formData.entries()) {
    if (!chave.startsWith("eixo:")) continue;

    const mentorId = chave.slice("eixo:".length);
    const eixo = String(valor);
    if (!eixo) continue;

    if (!eixoPertenceAoFramework(encontro.framework, eixo)) {
      return {
        ok: false,
        erro: `O eixo "${eixo}" não pertence ao framework deste encontro.`,
      };
    }

    atribuicoes.push({ encontro_id: encontroId, mentor_id: mentorId, eixo });
  }

  const { error: erroApagar } = await supabase
    .from("atribuicao_eixo")
    .delete()
    .eq("encontro_id", encontroId);

  if (erroApagar) return { ok: false, erro: erroApagar.message };

  if (atribuicoes.length > 0) {
    const { error } = await supabase.from("atribuicao_eixo").insert(atribuicoes);
    if (error) return { ok: false, erro: error.message };
  }

  revalidatePath(`/encontros/${encontroId}`);
  revalidatePath(`/encontros/${encontroId}/eixos`);
  redirect(`/encontros/${encontroId}`);
}
