"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";

/**
 * `RF-B4` — o ritual semanal.
 *
 * A ação não decide nada: quem decide é `liberar_encontro()`, que confere o
 * papel, exige que o encontro esteja aberto, muda o estado e reordena
 * fisicamente as mensagens anônimas — **tudo na mesma transação**.
 *
 * Fazer as verificações aqui e o `update` direto na tabela funcionaria na tela
 * e deixaria a reordenação de fora, que é como `RN-08` cairia sem ninguém
 * perceber: nada quebra, nada aparece diferente, e a ordem física passa a
 * entregar quem escreveu o quê.
 */

export type ResultadoDaLiberacao = {
  ok: boolean;
  erro?: string;
};

export async function liberarEncontro(
  _anterior: ResultadoDaLiberacao | null,
  formData: FormData,
): Promise<ResultadoDaLiberacao> {
  await exigirMentor();

  const id = String(formData.get("encontro") ?? "");
  if (!id) return { ok: false, erro: "Encontro não informado." };

  // A confirmação digitada existe para separar "cliquei sem ler" de "eu quis".
  // É irreversível e revela texto para a turma inteira de uma vez.
  const confirmacao = String(formData.get("confirmacao") ?? "").trim();
  if (confirmacao.toLocaleUpperCase("pt-BR") !== "LIBERAR") {
    return {
      ok: false,
      erro: 'Escreva LIBERAR no campo para confirmar.',
    };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.rpc("liberar_encontro", { p_encontro: id });

  if (error) {
    // As mensagens da função são curtas e em português; passar adiante é mais
    // útil que traduzir de novo aqui.
    return { ok: false, erro: error.message };
  }

  revalidatePath("/encontros");
  revalidatePath(`/encontros/${id}`);
  redirect(`/encontros/${id}`);
}
