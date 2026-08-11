"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";
import { podeEncerrar, confirmacaoConfere } from "@/dominio/encerramento";

/**
 * `RF-A4` — encerrar a edição.
 *
 * A verificação de estado aqui é para a mensagem; a garantia é o gatilho
 * `edicao_transicao` no banco, que recusa qualquer transição que não seja
 * `ativa → encerrada`.
 */

export type ResultadoDoEncerramento = {
  ok: boolean;
  erro?: string;
};

export async function encerrarEdicao(
  _anterior: ResultadoDoEncerramento | null,
  formData: FormData,
): Promise<ResultadoDoEncerramento> {
  await exigirMentor();

  const edicaoId = String(formData.get("edicao") ?? "");
  if (!edicaoId) return { ok: false, erro: "Edição não informada." };

  if (!confirmacaoConfere(String(formData.get("confirmacao") ?? ""))) {
    return { ok: false, erro: "Escreva ENCERRAR no campo para confirmar." };
  }

  const supabase = await clienteServidor();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, status")
    .eq("id", edicaoId)
    .maybeSingle();

  if (!edicao) return { ok: false, erro: "Edição não encontrada." };
  if (!podeEncerrar(edicao)) {
    return { ok: false, erro: "Esta edição já está encerrada." };
  }

  const { error } = await supabase
    .from("edicao")
    .update({ status: "encerrada" })
    .eq("id", edicaoId);

  if (error) return { ok: false, erro: error.message };

  // Tudo muda de uma vez para o participante; revalidar o que o mentor vê
  // evita ele continuar olhando uma tela que já não descreve o sistema.
  revalidatePath("/encerrar");
  revalidatePath("/encontros");
  revalidatePath("/turma");
  redirect("/encerrar");
}
