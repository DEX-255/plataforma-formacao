import type { Encontro } from "./tipos";
import { podeLiberar } from "./encontros";

/**
 * A liberação semanal — `RF-B4`.
 *
 * `specs/02`: no instante da liberação, três coisas acontecem ao mesmo tempo —
 * os feedbacks aparecem, a caixa anônima fecha, e as mensagens ficam visíveis
 * aos mentores.
 *
 * **A simultaneidade é proposital.** O participante escreve a mensagem anônima
 * *antes* de ler o feedback dele; senão a caixa vira canal de resposta ao
 * feedback recebido, que é exatamente o que a diretriz 3 evita ("não dê
 * feedback para quem está te dando feedback").
 */

export type PreviaDaLiberacao = {
  /** Participantes ativos na edição. */
  turma: number;
  /** Vão receber pelo menos um feedback. */
  comFeedback: number;
  /** **Não vão receber nada.** O número que importa. */
  semNenhum: number;
  /** Mensagens anônimas que ficam visíveis aos mentores. */
  mensagens: number;
  /** Total de feedbacks que passam a ser lidos. */
  feedbacks: number;
};

export function montarPrevia(entrada: {
  participacoes: number;
  participacoesComFeedback: number;
  feedbacks: number;
  mensagens: number;
}): PreviaDaLiberacao {
  return {
    turma: entrada.participacoes,
    comFeedback: entrada.participacoesComFeedback,
    semNenhum: entrada.participacoes - entrada.participacoesComFeedback,
    mensagens: entrada.mensagens,
    feedbacks: entrada.feedbacks,
  };
}

/**
 * `RF-B4` — "quantos não vão receber nenhum" é **o ponto do requisito**.
 *
 * É o último momento em que dá para consertar a desigualdade de atenção antes
 * que ela vire fato consumado para aquela semana. Um número grande ali é para
 * incomodar, e a frase existe para que ele incomode em português, não como
 * estatística.
 *
 * Não bloqueia. `specs/01` diz que a plataforma registra o que aconteceu
 * presencialmente; se ninguém falou com aquelas pessoas, liberar não piora nada
 * — o que a tela pode fazer é dizer isso a tempo de alguém agir.
 */
export function avisoDeCobertura(previa: PreviaDaLiberacao): string | null {
  if (previa.semNenhum === 0) return null;

  if (previa.semNenhum === 1) {
    return "1 pessoa não vai receber nenhum feedback deste encontro.";
  }

  return `${previa.semNenhum} pessoas não vão receber nenhum feedback deste encontro.`;
}

/** O que muda no instante do clique, escrito para ser lido antes dele. */
export const CONSEQUENCIAS_DA_LIBERACAO = [
  "Os feedbacks deste encontro passam a ser lidos pelos participantes.",
  "A caixa anônima fecha — ninguém mais envia mensagem deste encontro.",
  "As mensagens anônimas já enviadas ficam visíveis para os mentores.",
] as const;

export const LIBERACAO_E_IRREVERSIVEL =
  "Não há como voltar atrás. Depois de liberado, o texto que a pessoa leu é o que fica.";

export function encontroPodeSerLiberado(
  encontro: Pick<Encontro, "status">,
): boolean {
  return podeLiberar(encontro);
}
