"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirMentor } from "@/lib/auth";
import { podeMarcarPresenca } from "@/dominio/presenca";
import type { StatusPresenca } from "@/dominio/tipos";

/**
 * Marcar presença — `RF-C1`.
 *
 * A lista inteira é enviada de uma vez, e gravada de uma vez. É o desenho certo
 * para o caminho real: o mentor abre a tela no fim do encontro, toca em "todos
 * presentes", desmarca três pessoas e salva. Gravar a cada toque faria trinta
 * requisições no 4G do corredor para um trabalho que cabe numa.
 */

export type ResultadoDaPresenca = {
  ok: boolean;
  erro?: string;
};

const VALIDOS: readonly string[] = ["presente", "ausente", "justificado"];

export async function salvarPresenca(
  _anterior: ResultadoDaPresenca | null,
  formData: FormData,
): Promise<ResultadoDaPresenca> {
  const sessao = await exigirMentor();

  const encontroId = String(formData.get("encontro") ?? "");
  if (!encontroId) return { ok: false, erro: "Encontro não informado." };

  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, status")
    .eq("id", encontroId)
    .maybeSingle();

  if (!encontro) return { ok: false, erro: "Encontro não encontrado." };

  // Depois da liberação a presença já faz parte do que a pessoa leu na
  // trajetória dela. A tela não oferece o caminho; isto fecha a ação.
  if (!podeMarcarPresenca(encontro)) {
    return {
      ok: false,
      erro: "O encontro já foi liberado. A presença não muda mais.",
    };
  }

  const marcacoes: {
    encontro_id: string;
    participacao_id: string;
    status: StatusPresenca;
    marcado_por: string;
  }[] = [];

  for (const [chave, valor] of formData.entries()) {
    if (!chave.startsWith("presenca:")) continue;

    const participacaoId = chave.slice("presenca:".length);
    const status = String(valor);

    // Vazio é "ainda não marquei" e não vira linha: não saber que a pessoa
    // veio é diferente de saber que ela faltou, e `RF-C2` depende dessa
    // diferença para não transformar desconhecimento em falta.
    if (!status) continue;

    if (!VALIDOS.includes(status)) {
      return { ok: false, erro: `Estado de presença desconhecido: ${status}.` };
    }

    marcacoes.push({
      encontro_id: encontroId,
      participacao_id: participacaoId,
      status: status as StatusPresenca,
      marcado_por: sessao.usuario.id,
    });
  }

  // Quem ficou sem marcação nesta rodada perde a linha: o mentor pode ter
  // desmarcado de propósito, e manter o valor antigo seria a tela mentir sobre
  // o que ele acabou de decidir.
  const { error: erroApagar } = await supabase
    .from("presenca")
    .delete()
    .eq("encontro_id", encontroId);

  if (erroApagar) return { ok: false, erro: erroApagar.message };

  if (marcacoes.length > 0) {
    const { error } = await supabase.from("presenca").insert(marcacoes);
    if (error) return { ok: false, erro: error.message };
  }

  revalidatePath(`/encontros/${encontroId}`);
  revalidatePath("/trajetoria");
  redirect(`/encontros/${encontroId}`);
}
