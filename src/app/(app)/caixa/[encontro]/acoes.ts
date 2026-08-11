"use server";

import { revalidatePath } from "next/cache";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirParticipante } from "@/lib/auth";

/**
 * Enviar mensagem anônima — `RF-F1`.
 *
 * **Nada aqui pode registrar o texto junto de quem enviou.** Sem `console`, sem
 * mensagem de erro que ecoe o conteúdo, sem retorno que identifique a linha
 * criada. A escrita inteira acontece dentro de `enviar_mensagem_anonima()`, que
 * grava nas duas tabelas na mesma transação e **não devolve o id** — devolver
 * criaria, no cliente, exatamente o vínculo que o esquema evita.
 *
 * A requisição é autenticada por necessidade: `RN-09` exige saber quem enviou
 * para impedir a segunda mensagem. O que o sistema garante é que essa
 * informação morre aqui — vira uma linha em `mensagem_enviada`, sem ponteiro
 * para o texto, e ninguém consegue lê-la.
 */

export type ResultadoDoEnvio = {
  ok: boolean;
  erro?: string;
};

export async function enviarMensagem(
  _anterior: ResultadoDoEnvio | null,
  formData: FormData,
): Promise<ResultadoDoEnvio> {
  await exigirParticipante();

  const encontroId = String(formData.get("encontro") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();

  if (!encontroId) return { ok: false, erro: "Encontro não informado." };
  if (!texto) {
    return { ok: false, erro: "Escreva alguma coisa antes de enviar." };
  }

  const supabase = await clienteServidor();
  const { error } = await supabase.rpc("enviar_mensagem_anonima", {
    p_encontro: encontroId,
    p_texto: texto,
  });

  if (error) {
    /**
     * A mensagem de erro do banco é devolvida traduzida, **nunca com o texto**.
     * Um erro que ecoasse o conteúdo poderia acabar num log de servidor ao lado
     * do usuário autenticado — e é assim que o anonimato vaza sem ninguém
     * escrever uma linha errada de SQL.
     */
    const duplicada = error.message.includes("duplicate key");
    return {
      ok: false,
      erro: duplicada
        ? "Você já enviou uma mensagem neste encontro."
        : "Não foi possível enviar agora. Tente de novo em instantes.",
    };
  }

  revalidatePath(`/caixa/${encontroId}`);
  revalidatePath("/trajetoria");
  return { ok: true };
}
