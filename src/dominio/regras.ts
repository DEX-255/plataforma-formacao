import type {
  AtribuicaoEixo,
  Edicao,
  Encontro,
  Feedback,
  FeedbackVisivel,
  MensagemAnonima,
  Papel,
} from "./tipos";
import { EXPECTATIVA_DA_ESCALA, type Framework, type Nivel } from "./frameworks";

/**
 * As regras invariantes de `specs/02-dominio.md`, uma função por regra.
 *
 * **Este é o único lugar do projeto onde uma regra de negócio mora.** Nenhum
 * componente decide sozinho se um feedback pode ser editado: a tela pergunta,
 * a regra responde. É o que impede a mesma regra de existir em três lugares
 * com três comportamentos.
 *
 * Algumas destas regras são garantidas pelo banco (`check`, ausência de coluna,
 * política de RLS) e testadas em `testes/rls.test.ts`. As funções daqui existem
 * para a interface poder **antecipar** a recusa com uma mensagem decente, nunca
 * para substituir a garantia. A regra do servidor não confia na do cliente.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Feedback
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RN-01 — Sugestão é obrigatória.
 *
 * Tradução direta da diretriz 6 da DEX: apontar problema sem indicar caminho
 * não ajuda quem recebe. Garantido também pelo banco.
 */
export function sugestaoPreenchida(sugestao: string | null | undefined): boolean {
  return (sugestao ?? "").trim().length > 0;
}

export const MOTIVO_SUGESTAO_OBRIGATORIA =
  "A sugestão é obrigatória. É a diretriz 6 da DEX: apontar o problema sem " +
  "indicar um caminho não ajuda quem recebe.";

/**
 * RN-02 — Um mentor, um eixo.
 *
 * No encontro, o mentor só registra no eixo atribuído a ele. Ele pode ver o
 * que os outros escreveram e usar isso para formar o veredito dele, mas não
 * escreve fora do próprio canal.
 */
export function eixoDoMentorNoEncontro(
  atribuicoes: readonly AtribuicaoEixo[],
  encontroId: string,
  mentorId: string,
): string | null {
  return (
    atribuicoes.find(
      (a) => a.encontro_id === encontroId && a.mentor_id === mentorId,
    )?.eixo ?? null
  );
}

export function mentorPodeEscreverNoEixo(
  atribuicoes: readonly AtribuicaoEixo[],
  encontroId: string,
  mentorId: string,
  eixo: string,
): boolean {
  return eixoDoMentorNoEncontro(atribuicoes, encontroId, mentorId) === eixo;
}

/**
 * RN-03 — O participante nunca vê o bloco interno durante a formação.
 *
 * Esta função é a última barreira do lado do código: recebe um feedback
 * completo e devolve só o que pode sair. Se algum caminho servir dado a
 * participante sem passar por aqui, é defeito — mesmo que a tela pareça certa.
 *
 * A primeira barreira é a renderização no servidor; a segunda é a view
 * `feedback_visivel`, que nem tem as colunas.
 */
export function apenasBlocoVisivel(feedback: Feedback): FeedbackVisivel {
  return {
    id: feedback.id,
    encontro_id: feedback.encontro_id,
    participacao_id: feedback.participacao_id,
    mentor_id: feedback.mentor_id,
    eixo: feedback.eixo,
    situacao: feedback.situacao,
    ponto: feedback.ponto,
    sugestao: feedback.sugestao,
  };
}

/** RN-04 — Feedback visível é sempre assinado. Não existe visível anônimo. */
export function feedbackEstaAssinado(
  feedback: Pick<Feedback, "mentor_id">,
): boolean {
  return Boolean(feedback.mentor_id);
}

/** RN-05 — Feedback só aparece depois da liberação do encontro. */
export function feedbackVisivelParaParticipante(
  encontro: Pick<Encontro, "status">,
): boolean {
  return encontro.status === "liberado";
}

/**
 * RN-06 — Depois da liberação, o bloco visível não é editado.
 *
 * Antes, o mentor edita livremente. Depois, o que a pessoa leu é o que ficou.
 * O bloco interno continua editável: ninguém de fora o leu.
 */
export function podeEditarBlocoVisivel(
  encontro: Pick<Encontro, "status">,
  mentorIdDoFeedback: string,
  mentorAtual: string,
): boolean {
  if (mentorIdDoFeedback !== mentorAtual) return false;
  return encontro.status !== "liberado";
}

export function podeEditarBlocoInterno(
  mentorIdDoFeedback: string,
  mentorAtual: string,
): boolean {
  return mentorIdDoFeedback === mentorAtual;
}

/**
 * RN-07 — "Não observado" é um valor de nota, não a ausência dela.
 *
 * Distinguir "o mentor viu e avaliou 3" de "o mentor não teve como observar" é
 * o que impede o gráfico de mentir. Um feedback pode ter bloco visível e nota
 * "não observado". Garantido também pelo `check` do banco.
 */
export function notaCoerente(
  nota: number | null,
  naoObservado: boolean,
): boolean {
  return naoObservado === (nota === null);
}

export function notaValida(nota: number | null): boolean {
  return nota === null || (Number.isInteger(nota) && nota >= 1 && nota <= 5);
}

// ═══════════════════════════════════════════════════════════════════════════
// Anonimato
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RN-08 — A mensagem anônima não guarda vínculo com o autor.
 *
 * Não é anonimato de interface, é anonimato de esquema: a tabela não tem
 * coluna de autor. Esta função existe como guarda em tempo de execução para o
 * caso de alguém acrescentar a coluna sem perceber o que está fazendo — o
 * teste correspondente falha antes, mas em produção isto recusa a exibição.
 */
const CAMPOS_QUE_DENUNCIAM = [
  "participacao_id",
  "usuario_id",
  "autor_id",
  "autor",
  "criado_em",
  "email",
];

export function mensagemEstaLimpa(mensagem: MensagemAnonima): boolean {
  return !CAMPOS_QUE_DENUNCIAM.some((campo) => campo in mensagem);
}

/** RN-09 — Uma mensagem por participante por encontro. */
export function podeEnviarMensagem(
  encontro: Pick<Encontro, "status">,
  jaEnviou: boolean,
): boolean {
  return encontro.status === "aberto" && !jaEnviou;
}

/**
 * RN-10 — Mensagens são exibidas em ordem aleatória fixa.
 *
 * Sem horário e sem ordem de chegada. Ordem de inserção correlacionada com o
 * registro de envio reidentificaria o autor — e é por isso que a ordenação
 * acontece por `ordem_aleatoria`, gravada uma vez, e nunca por `id`.
 */
export function ordenarMensagens(
  mensagens: readonly MensagemAnonima[],
): MensagemAnonima[] {
  return [...mensagens].sort((a, b) => a.ordem_aleatoria - b.ordem_aleatoria);
}

export function mensagensVisiveisParaMentor(
  encontro: Pick<Encontro, "status">,
): boolean {
  return encontro.status === "liberado";
}

// ═══════════════════════════════════════════════════════════════════════════
// Acesso
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RN-11 — Só entra quem está na lista.
 *
 * Autenticar no Google não basta. Quem não está recebe recusa, não uma conta
 * vazia — conta órfã é dado de pessoa que nunca deveria ter existido.
 */
export function emailAutorizado(
  email: string,
  autorizados: readonly { email: string }[],
): boolean {
  const normal = email.trim().toLowerCase();
  return autorizados.some((a) => a.email.trim().toLowerCase() === normal);
}

/** RN-12 — Participante só enxerga a si mesmo. */
export function participantePodeVer(
  minhasParticipacoes: readonly string[],
  participacaoAlvo: string,
): boolean {
  return minhasParticipacoes.includes(participacaoAlvo);
}

/** RN-13 — Ao encerrar a edição, o acesso dos participantes é revogado. */
export function participanteTemAcesso(
  edicao: Pick<Edicao, "status">,
  papel: Papel,
): boolean {
  if (papel === "mentor") return true; // mentor continua em modo arquivo
  return edicao.status === "ativa";
}

// ═══════════════════════════════════════════════════════════════════════════
// Avaliação
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RN-14 — Um encontro pode não ter avaliação.
 *
 * É estado normal, não erro. Forçar registro onde não houve observação produz
 * enchimento, e enchimento destrói a credibilidade da nota.
 */
export function encontroTemAvaliacao(framework: Framework): boolean {
  return framework !== "nenhum";
}

export function encontroAceitaFeedback(
  encontro: Pick<Encontro, "status" | "framework">,
): boolean {
  return (
    encontroTemAvaliacao(encontro.framework) &&
    (encontro.status === "aberto" || encontro.status === "liberado")
  );
}

/**
 * RN-15 — A nota mede estado, não esforço.
 *
 * Quem evoluiu muito e ainda está em 2 recebe 2. O reconhecimento do avanço
 * vive no texto do feedback.
 *
 * Nenhuma função impõe isso — é regra de julgamento humano. O que o código faz
 * é não oferecer nenhum mecanismo de "bônus por evolução": não existe campo de
 * ajuste, não existe nota composta, e o gráfico plota a nota crua. A ausência
 * de recurso É a implementação da regra.
 */
export const NOTA_MEDE_ESTADO =
  "A nota descreve o estado de hoje, não o quanto a pessoa evoluiu. " +
  "O avanço é reconhecido no texto do feedback.";

/**
 * RN-16 — A escala é assimétrica por desenho.
 *
 * A expectativa é que a turma comece em 1 e 2. Chegar a 4 significa evolução
 * grande; 5 é fora da curva. A interface do mentor precisa comunicar isso no
 * momento de pontuar, senão cada mentor calibra por conta própria e a nota
 * perde comparabilidade.
 */
export function expectativaDoNivel(nivel: Nivel): string {
  return EXPECTATIVA_DA_ESCALA[nivel];
}

export function nivelEhEsperadoNoInicio(nivel: Nivel): boolean {
  return nivel <= 2;
}

export function nivelEhForaDaCurva(nivel: Nivel): boolean {
  return nivel === 5;
}

// ═══════════════════════════════════════════════════════════════════════════
// Estrutura
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RN-17 — Todo dado pertence a uma edição.
 *
 * Nenhuma consulta atravessa edições sem pedir explicitamente. É o que permite
 * alguém tentar o PS duas vezes sem que a segunda tentativa carregue a
 * primeira.
 */
export function mesmaEdicao(
  a: { edicao_id: string },
  b: { edicao_id: string },
): boolean {
  return a.edicao_id === b.edicao_id;
}

/**
 * RN-18 — Nada é apagado, tudo é arquivado.
 *
 * Encerrar edição não deleta: os documentos precisam ser reproduzíveis anos
 * depois. Como em RN-15, a implementação é a ausência — não existe função de
 * exclusão de edição, participação ou feedback liberado neste módulo, e o
 * esquema não tem exclusão em cascata em lugar nenhum.
 */
export function encerrarEdicao(edicao: Edicao): Edicao {
  return { ...edicao, status: "encerrada" };
}

export function podeApagarFeedback(
  encontro: Pick<Encontro, "status">,
  mentorIdDoFeedback: string,
  mentorAtual: string,
): boolean {
  // Antes da liberação o mentor apaga o que ele mesmo escreveu (RF-D4).
  // Depois, o participante já leu — e o que foi lido não desaparece.
  return (
    mentorIdDoFeedback === mentorAtual && encontro.status !== "liberado"
  );
}
