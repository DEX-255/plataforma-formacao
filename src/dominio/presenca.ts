import type { Encontro, StatusPresenca } from "./tipos";

/**
 * Presença por encontro — `RF-C1` e `RF-C2`.
 *
 * Simples de construir, com uma consequência que não é óbvia: **sem presença, a
 * tela de cobertura vira alarme falso toda semana**, apontando como "buraco de
 * atenção" quem simplesmente faltou. Um alarme que dispara sem motivo é um
 * alarme que passa a ser ignorado — inclusive quando estiver certo.
 */

export const ESTADOS_DE_PRESENCA: readonly StatusPresenca[] = [
  "presente",
  "ausente",
  "justificado",
] as const;

export const ROTULO_DE_PRESENCA: Record<StatusPresenca, string> = {
  presente: "presente",
  ausente: "ausente",
  justificado: "falta justificada",
};

/** Rótulo curto, para caber ao lado do nome numa lista de celular. */
export const ROTULO_CURTO: Record<StatusPresenca, string> = {
  presente: "veio",
  ausente: "faltou",
  justificado: "justificada",
};

export type MarcacaoDePresenca = {
  participacaoId: string;
  nome: string;
  status: StatusPresenca | null;
};

/**
 * `RF-C1` — editável enquanto o encontro não estiver liberado.
 *
 * Depois da liberação a presença faz parte do registro que a pessoa já leu na
 * trajetória dela, e do que vai para o documento final.
 */
export function podeMarcarPresenca(
  encontro: Pick<Encontro, "status">,
): boolean {
  return encontro.status !== "liberado";
}

/**
 * "Todos presentes" e depois só corrige as exceções — **que é como isso
 * funciona na prática.**
 *
 * O caminho real é o mentor abrir a lista no fim do encontro e desmarcar três
 * pessoas. Construir "marcar um por um" como fluxo principal transforma trinta
 * segundos em três minutos, e o mentor para de marcar — e aí a cobertura volta
 * a mentir, que é o problema que a presença existe para resolver.
 */
export function marcarTodosPresentes(
  linhas: readonly MarcacaoDePresenca[],
): MarcacaoDePresenca[] {
  return linhas.map((l) => ({ ...l, status: "presente" }));
}

export function alternarStatus(
  linhas: readonly MarcacaoDePresenca[],
  participacaoId: string,
  status: StatusPresenca,
): MarcacaoDePresenca[] {
  return linhas.map((l) =>
    l.participacaoId === participacaoId ? { ...l, status } : l,
  );
}

export type ResumoDePresenca = {
  total: number;
  presentes: number;
  ausentes: number;
  justificados: number;
  semMarcar: number;
};

export function resumoDePresenca(
  linhas: readonly MarcacaoDePresenca[],
): ResumoDePresenca {
  return {
    total: linhas.length,
    presentes: linhas.filter((l) => l.status === "presente").length,
    ausentes: linhas.filter((l) => l.status === "ausente").length,
    justificados: linhas.filter((l) => l.status === "justificado").length,
    semMarcar: linhas.filter((l) => l.status === null).length,
  };
}

/**
 * `RF-C2` — quem faltou aparece como falta, não como buraco de atenção.
 *
 * Esta é a função que impede o alarme falso. Ela responde: **esta pessoa sem
 * feedback é um problema?** Só é se ela veio. Quem faltou não tinha como ser
 * observado, e cobrar isso do mentor é cobrar o impossível.
 *
 * Quem ainda não foi marcado conta como problema — é o caso em que ninguém
 * sabe, e não saber é motivo para olhar, não para relaxar.
 */
export function ausenciaExplicaFaltaDeFeedback(
  status: StatusPresenca | null,
): boolean {
  return status === "ausente" || status === "justificado";
}
