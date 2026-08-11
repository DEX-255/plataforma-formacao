import type { Edicao } from "./tipos";

/**
 * Encerramento da edição — `RF-A4`, `RN-13`, `RN-18`.
 *
 * A transição `ativa → encerrada`: o PS acabou, o acesso dos participantes é
 * revogado, e os dados permanecem para que os documentos possam ser gerados de
 * novo anos depois.
 */

export function podeEncerrar(edicao: Pick<Edicao, "status">): boolean {
  return edicao.status === "ativa";
}

/**
 * `RF-A4` — a confirmação **nomeia a consequência**.
 *
 * "Tem certeza?" não é confirmação: não diz o que acontece, e quem lê responde
 * sim por reflexo. Aqui cada linha é uma coisa que muda no mundo no instante do
 * clique.
 */
export const CONSEQUENCIAS_DO_ENCERRAMENTO = [
  "Todos os participantes perdem o acesso — aprovados e não aprovados igualmente.",
  "A trajetória deles deixa de abrir, e a caixa anônima também.",
  "Os mentores continuam acessando tudo, em modo arquivo.",
] as const;

/**
 * **Aprovados e não aprovados perdem o acesso igualmente**, e isso é decisão de
 * produto, não limitação técnica.
 *
 * Manter aprovado dentro e não aprovado fora transformaria a plataforma em
 * placar: quem continua entrando saberia que passou, e quem perdeu o acesso
 * descobriria o resultado pela porta fechada. O que sobra para todos é o mesmo
 * documento.
 */
export const POR_QUE_TODOS_IGUALMENTE =
  "Todo mundo sai junto, aprovado ou não. Se só quem passasse continuasse entrando, " +
  "a plataforma viraria placar — e a pessoa descobriria o resultado pela porta fechada.";

/**
 * `RN-18` — encerrar arquiva, não apaga. A tela diz isso em vez de deixar
 * implícito: a retenção é escolha, e quem lê tem direito de saber por quê e
 * por quanto tempo.
 */
export const O_QUE_ACONTECE_COM_OS_DADOS = [
  "Nada é apagado. Os feedbacks, as notas e as presenças continuam guardados.",
  "Eles ficam porque o documento final precisa poder ser gerado de novo — inclusive anos depois, se alguém pedir a segunda via.",
  "Quem quiser a exclusão dos próprios dados pode pedir a um mentor. Não há tela para isso; é procedimento manual, feito a pedido.",
] as const;

export const ENCERRAMENTO_E_IRREVERSIVEL =
  "Não há botão para reabrir. Devolver o acesso depois de avisar que acabou faria a plataforma desmentir o que disse.";

/** A palavra que a pessoa digita para confirmar. */
export const PALAVRA_DE_CONFIRMACAO = "ENCERRAR";

export function confirmacaoConfere(digitado: string): boolean {
  return digitado.trim().toLocaleUpperCase("pt-BR") === PALAVRA_DE_CONFIRMACAO;
}
