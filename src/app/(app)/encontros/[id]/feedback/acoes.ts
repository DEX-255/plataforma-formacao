"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";
import {
  sugestaoPreenchida,
  MOTIVO_SUGESTAO_OBRIGATORIA,
  notaCoerente,
  podeEditarBlocoVisivel,
  mentorPodeEscreverNoEixo,
  encontroAceitaFeedback,
  notaValida,
} from "@/dominio/regras";

/**
 * Gravar e apagar feedback — `RF-D1` e `RF-D4`.
 *
 * Estas ações escrevem o bloco interno, que é o dado mais sensível do sistema.
 * A RLS já garante que ninguém escreve no lugar de outro mentor
 * (`feedback_mentor_escreve`), mas as regras de conteúdo — sugestão
 * obrigatória, coerência da nota, eixo atribuído, bloco visível travado após a
 * liberação — vivem em `dominio/regras.ts` e são conferidas aqui.
 *
 * Nenhuma delas é conferida só na tela: ação de servidor é alcançável por quem
 * souber o endereço.
 */

export type ResultadoDoFeedback = {
  ok: boolean;
  erro?: string;
  /** Qual campo destacar. `null` quando o erro não é de um campo só. */
  campo?: "sugestao" | "nota" | null;
};

export async function salvarFeedback(
  _anterior: ResultadoDoFeedback | null,
  formData: FormData,
): Promise<ResultadoDoFeedback> {
  const sessao = await exigirMentor();

  const encontroId = String(formData.get("encontro") ?? "");
  const participacaoId = String(formData.get("participacao") ?? "");
  const eixo = String(formData.get("eixo") ?? "");

  const situacao = String(formData.get("situacao") ?? "").trim();
  const ponto = String(formData.get("ponto") ?? "").trim();
  const sugestao = String(formData.get("sugestao") ?? "").trim();

  const naoObservado = formData.get("nao_observado") === "1";
  const notaBruta = formData.get("nota");
  const nota = naoObservado || notaBruta === null || notaBruta === "" ? null : Number(notaBruta);

  // RN-01 — a diretriz 6 virou impossibilidade, e a mensagem diz por quê.
  if (!sugestaoPreenchida(sugestao)) {
    return { ok: false, erro: MOTIVO_SUGESTAO_OBRIGATORIA, campo: "sugestao" };
  }

  // RN-07 — nota e "não observado" são mutuamente exclusivos, e a coluna tem
  // `check` para isso. Conferir antes devolve mensagem em vez de erro do banco.
  if (!notaCoerente(nota, naoObservado) || !notaValida(nota)) {
    return {
      ok: false,
      erro: "Escolha uma nota de 1 a 5 ou marque “não observado”.",
      campo: "nota",
    };
  }

  const supabase = await clienteServidor();

  const [{ data: encontro }, { data: atribuicoes }] = await Promise.all([
    supabase
      .from("encontro")
      .select("id, status, framework")
      .eq("id", encontroId)
      .maybeSingle(),
    supabase.from("atribuicao_eixo").select("*").eq("encontro_id", encontroId),
  ]);

  if (!encontro) return { ok: false, erro: "Encontro não encontrado." };

  if (!encontroAceitaFeedback(encontro)) {
    return {
      ok: false,
      erro: "Este encontro não aceita feedback. Abra-o antes de registrar.",
    };
  }

  // RN-02 — o mentor só escreve no canal dele. A tela já vem com o eixo
  // preenchido; isto recusa quem montar a requisição na mão.
  if (
    !mentorPodeEscreverNoEixo(
      atribuicoes ?? [],
      encontroId,
      sessao.usuario.id,
      eixo,
    )
  ) {
    return {
      ok: false,
      erro: "Você não tem este eixo atribuído neste encontro.",
    };
  }

  const { data: existente } = await supabase
    .from("feedback")
    .select("id, mentor_id")
    .eq("encontro_id", encontroId)
    .eq("participacao_id", participacaoId)
    .eq("mentor_id", sessao.usuario.id)
    .eq("eixo", eixo)
    .maybeSingle();

  const blocoInterno = {
    nota,
    nao_observado: naoObservado,
    observacao_interna: String(formData.get("observacao_interna") ?? "").trim() || null,
  };

  if (existente) {
    // RN-06 — depois da liberação, o que a pessoa leu é o que ficou. Só o
    // bloco interno continua editável; ele não foi lido por ninguém de fora.
    const visivelEditavel = podeEditarBlocoVisivel(
      encontro,
      existente.mentor_id,
      sessao.usuario.id,
    );

    const { error } = await supabase
      .from("feedback")
      .update(
        visivelEditavel
          ? { situacao, ponto, sugestao, ...blocoInterno, atualizado_em: new Date().toISOString() }
          : { ...blocoInterno, atualizado_em: new Date().toISOString() },
      )
      .eq("id", existente.id);

    if (error) return { ok: false, erro: error.message };
  } else {
    const { error } = await supabase.from("feedback").insert({
      encontro_id: encontroId,
      participacao_id: participacaoId,
      mentor_id: sessao.usuario.id,
      eixo,
      situacao,
      ponto,
      sugestao,
      ...blocoInterno,
    });

    if (error) return { ok: false, erro: error.message };
  }

  revalidatePath(`/encontros/${encontroId}`);
  return { ok: true };
}

/** `RF-D4` — apagar o que eu mesmo escrevi, antes da liberação. */
export async function apagarFeedback(formData: FormData): Promise<void> {
  const sessao = await exigirMentor();

  const id = String(formData.get("feedback") ?? "");
  const encontroId = String(formData.get("encontro") ?? "");
  if (!id) return;

  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("status")
    .eq("id", encontroId)
    .maybeSingle();

  // Depois da liberação nada é apagado: a pessoa já leu, e RN-18 diz que nada
  // é apagado, tudo é arquivado.
  if (!encontro || encontro.status === "liberado") return;

  await supabase
    .from("feedback")
    .delete()
    .eq("id", id)
    .eq("mentor_id", sessao.usuario.id);

  revalidatePath(`/encontros/${encontroId}`);
}
