import type { Encontro, MensagemAnonima } from "./tipos";
import { ordenarMensagens } from "./regras";

/**
 * A caixa anônima — `RF-F1` e `RF-F2`.
 *
 * **É a única parte do sistema em que uma falha destrói a confiança de forma
 * irreversível.** Alguém critica um mentor, é identificado, e nunca mais
 * ninguém escreve nada — nem naquela edição, nem nas seguintes, porque a
 * história circula.
 */

export type EstadoDaCaixa =
  | { tipo: "aberta" }
  | { tipo: "ja-enviei" }
  | { tipo: "fechada"; motivo: "liberado" | "rascunho" };

export function estadoDaCaixa(
  encontro: Pick<Encontro, "status">,
  jaEnviou: boolean,
): EstadoDaCaixa {
  // A caixa fecha na liberação, e é proposital: o participante escreve antes de
  // ler o próprio feedback. Senão a caixa vira canal de resposta ao feedback
  // recebido, que é o que a diretriz 3 evita.
  if (encontro.status === "liberado") {
    return { tipo: "fechada", motivo: "liberado" };
  }
  if (encontro.status === "rascunho") {
    return { tipo: "fechada", motivo: "rascunho" };
  }
  return jaEnviou ? { tipo: "ja-enviei" } : { tipo: "aberta" };
}

/**
 * `RF-F1` — a tela **explica como** o anonimato é garantido, não só promete.
 *
 * A razão está na spec e decide o tom: *promessa de anonimato sem explicação
 * não é acreditada, e caixa em que ninguém acredita fica vazia.* Um estudante
 * que vai criticar um mentor está calculando risco, e "confie em nós" não é
 * argumento — o que convence é saber o que o sistema faz.
 *
 * Cada linha aqui é verdade verificável no código, e há teste amarrando as
 * duas coisas. Se alguma deixar de ser verdade, é a frase que sai, não a
 * garantia que afrouxa.
 */
export const COMO_O_ANONIMATO_FUNCIONA = [
  "Não existe nenhuma ligação guardada entre você e o que você escrever. Não é uma configuração que alguém possa mudar depois: a coluna não existe.",
  "Fica guardado apenas que você enviou, separado do texto, para você não conseguir enviar duas vezes. Ninguém consegue ler essa marca — nem os mentores.",
  "Os mentores leem todas as mensagens juntas, embaralhadas, depois que o encontro é liberado. Sem nome, sem horário, sem ordem de chegada.",
  "Nem quem tem acesso direto ao banco consegue refazer o par. Isso é testado a cada mudança no sistema.",
] as const;

export const AVISO_SEM_RECUPERAR =
  "Depois de enviar, nem você consegue ver o que escreveu de novo — se desse para recuperar, o vínculo existiria em algum lugar.";

/**
 * `RF-F2` — como o mentor lê.
 *
 * `ordenarMensagens` (RN-10) já existe em `regras.ts`; esta função existe para
 * a tela não ter escolha. Ordenar por qualquer outra coisa aqui — inclusive
 * "como veio do banco" — reintroduz a correlação que o `CLUSTER` destrói.
 */
export function mensagensParaLeitura(
  mensagens: readonly MensagemAnonima[],
): MensagemAnonima[] {
  return ordenarMensagens(mensagens);
}

export const NAO_E_CANAL_DE_CONVERSA =
  "Não há como responder, reagir ou marcar como lida. A caixa é um canal de mão única, de propósito: qualquer marca por mensagem viraria um dado a mais para cruzar.";
