import type { Framework, Nivel } from "./frameworks";
import { EXPECTATIVA_DA_ESCALA } from "./frameworks";

/**
 * O documento final — `RF-H1`, `RF-H2`, `RF-H3`.
 *
 * **É o momento em que a nota interna deixa de ser interna.** Durante toda a
 * formação `RN-03` a manteve escondida; aqui ela aparece, e para muita gente vai
 * ser a primeira vez que vê um número associado ao próprio desempenho —
 * inclusive quem não passou.
 *
 * Este arquivo guarda a **ordem** e os **textos**, que aqui são regra e não
 * formatação. A ordem errada entrega o número antes das palavras, e quem tirou
 * 2 lê "reprovado" nos primeiros três segundos, sem chegar no resto.
 */

/**
 * `RF-H2` — **condição para o `RF-H1` existir**.
 *
 * Quem lê "2 de 5" sem contexto lê reprovação. A escala da DEX é assimétrica por
 * desenho: a expectativa é que a turma comece em 1 e 2, chegar a 4 é evolução
 * grande, 5 é fora da curva (`RN-16`). Sem essa legenda, entregar o gráfico a
 * quem não passou faz mais mal que bem.
 *
 * O texto é derivado de `EXPECTATIVA_DA_ESCALA`, a mesma fonte que o mentor lê
 * ao pontuar. Se as duas divergirem, o documento explica uma escala que não é a
 * que foi usada.
 */
export const LEGENDA_DA_ESCALA = {
  titulo: "Antes do gráfico: o que estes números querem dizer",
  chamada:
    "A escala da DEX vai de 1 a 5 e é assimétrica de propósito. Ela não é nota de prova, e comparar com a escala da faculdade leva à leitura errada.",
  niveis: ([1, 2, 3, 4, 5] as Nivel[]).map((n) => ({
    nivel: n,
    expectativa: EXPECTATIVA_DA_ESCALA[n],
  })),
  fecho:
    "Um 2 no começo da formação é o ponto de partida esperado, não um problema. O que interessa é o movimento entre um encontro e outro — e é isso que o gráfico mostra.",
} as const;

/**
 * O que o documento é, dito uma vez, no começo.
 *
 * Existe porque a peça chega a alguém que talvez tenha sido reprovado, e a
 * primeira coisa que essa pessoa precisa saber é que **não é aqui que está a
 * resposta** — o resultado do PS foi comunicado em outro canal, por gente.
 */
export const O_QUE_ESTE_DOCUMENTO_E = [
  "Este é o registro do que os mentores observaram sobre você ao longo da formação. Cada feedback aqui foi escrito por uma pessoa, logo depois de uma dinâmica, e está assinado.",
  "Não é um veredito nem um resultado. O que ficou decidido sobre o processo seletivo foi falado com você em outro lugar — aqui é o que aconteceu no caminho.",
  "As notas ficaram escondidas durante a formação de propósito, para que o feedback fosse lido como orientação e não como placar. Elas aparecem agora, com a explicação de como lê-las.",
] as const;

/**
 * O fechamento. Curto: o documento já disse o que tinha a dizer.
 */
export const FECHAMENTO = [
  "O que sobra deste processo é o que você faz com ele. As sugestões estão todas aqui, e nenhuma delas depende de estar na DEX para valer.",
  "Guarde este arquivo. Se precisar de outra via, um mentor consegue gerar de novo — os registros ficam.",
] as const;

/**
 * As seções, na ordem em que são lidas.
 *
 * A ordem é a decisão central do design doc e mora aqui para poder ser testada:
 * **a legenda da escala vem antes de qualquer número.** Uma refatoração que
 * troque a posição das seções quebra o teste, não a confiança de quem lê.
 */
export const SECOES = [
  "capa",
  "o-que-e",
  "encontro-a-encontro",
  "como-ler-a-escala",
  "evolucao",
  "retratos",
  "presenca",
  "fechamento",
] as const;

export type Secao = (typeof SECOES)[number];

export function posicaoDaSecao(secao: Secao): number {
  return SECOES.indexOf(secao);
}

/** `RF-H2` como invariante, não como intenção. */
export function legendaVemAntesDoGrafico(): boolean {
  return posicaoDaSecao("como-ler-a-escala") < posicaoDaSecao("evolucao");
}

/**
 * `RF-H3` — reprodutibilidade.
 *
 * O nome do arquivo entra no teste porque ele também precisa ser estável: gerar
 * de novo tem de sobrescrever o mesmo arquivo, não criar um irmão.
 */
export function nomeDoArquivo(nome: string, edicao: string): string {
  const limpo = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${edicao}-${limpo}`;
}

/**
 * Dinâmicas sem escala numérica — bomba e negociação.
 *
 * Os descritores dos eixos delas ainda não foram escritos (`pendencias.md`), e o
 * documento **não inventa número**: mostra o que o mentor escreveu e diz por que
 * não há nota. Um número sem rubrica por trás seria pior que a ausência dele,
 * porque pareceria comparável e não seria.
 */
export function temEscalaNumerica(framework: Framework): boolean {
  return framework === "oratoria";
}

export const POR_QUE_SEM_NOTA_NAS_DINAMICAS =
  "Estas dinâmicas acontecem uma vez e são avaliadas em texto, não em escala. " +
  "O que vale nelas é o retrato do que aconteceu — e um número sem uma régua " +
  "escrita por trás pareceria comparável sem ser.";
