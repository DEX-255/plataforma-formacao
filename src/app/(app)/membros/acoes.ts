"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";
import { lerEmailsColados, normalizar } from "@/dominio/membros";
import type { Papel } from "@/dominio/tipos";

/**
 * Ações da tela de membros.
 *
 * Toda ação chama `exigirMentor()` antes de qualquer coisa. A RLS já negaria a
 * escrita de um participante, mas depender só dela deixaria o erro chegar como
 * falha genérica do banco em vez de recusa clara — e uma ação de servidor é
 * alcançável por quem souber o endereço, não só por quem vê o botão.
 */

export type ResultadoDaAdicao = {
  ok: boolean;
  adicionados: number;
  jaExistiam: string[];
  invalidos: string[];
  erro?: string;
};

export async function adicionarMembros(
  _anterior: ResultadoDaAdicao | null,
  formData: FormData,
): Promise<ResultadoDaAdicao> {
  await exigirMentor();

  const texto = String(formData.get("emails") ?? "");
  const papel = String(formData.get("papel") ?? "participante") as Papel;
  const edicaoId = String(formData.get("edicao") ?? "");

  if (papel !== "participante" && papel !== "mentor") {
    return { ok: false, adicionados: 0, jaExistiam: [], invalidos: [], erro: "Papel inválido." };
  }
  if (!edicaoId) {
    return { ok: false, adicionados: 0, jaExistiam: [], invalidos: [], erro: "Nenhuma edição ativa." };
  }

  const supabase = await clienteServidor();

  const { data: existentes } = await supabase
    .from("email_autorizado")
    .select("email");

  const leitura = lerEmailsColados(
    texto,
    (existentes ?? []).map((e) => e.email),
  );

  if (leitura.validos.length === 0) {
    return {
      ok: leitura.invalidos.length === 0,
      adicionados: 0,
      jaExistiam: leitura.jaExistiam,
      invalidos: leitura.invalidos,
      erro:
        leitura.invalidos.length > 0
          ? "Nenhum e-mail válido no que você colou."
          : "Nada para adicionar.",
    };
  }

  const { error } = await supabase.from("email_autorizado").insert(
    leitura.validos.map((email) => ({
      email,
      papel,
      edicao_id: edicaoId,
    })),
  );

  if (error) {
    return {
      ok: false,
      adicionados: 0,
      jaExistiam: leitura.jaExistiam,
      invalidos: leitura.invalidos,
      erro: error.message,
    };
  }

  revalidatePath("/membros");

  return {
    ok: true,
    adicionados: leitura.validos.length,
    jaExistiam: leitura.jaExistiam,
    invalidos: leitura.invalidos,
  };
}

/**
 * `RF-A2` — remover bloqueia o acesso imediato **sem apagar** o que a pessoa já
 * produziu ou recebeu.
 *
 * Só a autorização sai. `usuario`, `participacao` e todo o feedback continuam
 * onde estavam: `RN-18` diz que nada é apagado, e o documento final precisa
 * continuar reproduzível mesmo para quem foi desligado no meio.
 */
export async function removerMembro(formData: FormData): Promise<void> {
  await exigirMentor();

  const email = normalizar(String(formData.get("email") ?? ""));
  if (!email) return;

  const supabase = await clienteServidor();
  await supabase.from("email_autorizado").delete().eq("email", email);

  revalidatePath("/membros");
}
