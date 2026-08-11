import type { StatusPresenca } from "./tipos";
import { ausenciaExplicaFaltaDeFeedback } from "./presenca";
import { eixosDe, type Framework } from "./frameworks";

/**
 * Turma e cobertura — `RF-G1` e `RF-G2`.
 *
 * Esta é a **defesa contra o terceiro problema do produto** (`specs/01`): como
 * todo mentor pode observar qualquer participante, alguns recebem quinze
 * observações e outros duas — e a diferença não é mérito, é acaso. Sem esta
 * conta, o corte do PS premia quem por acaso recebeu mais atenção.
 */

export type NotaDeEixo = {
  eixo: string;
  /** `null` quando o mentor marcou "não observado" (`RN-07`). */
  nota: number | null;
  /** Para ordenar a evolução: número do encontro. */
  encontro: number;
};

export type LinhaDaCobertura = {
  participacaoId: string;
  nome: string;
  /** Feedbacks recebidos na edição inteira. */
  feedbacks: number;
  encontrosComFeedback: number;
  encontrosSemFeedback: number;
  presencas: number;
  faltas: number;
  notas: readonly NotaDeEixo[];
};

// ── Média por eixo ─────────────────────────────────────────────────────────

/**
 * `RN-07` — "não observado" **não é zero e não desaparece**.
 *
 * Este é o detalhe que faz a média mentir ou não. Tratar "não observado" como
 * zero derruba a média de quem simplesmente não foi observado naquele eixo;
 * fingir que a linha não existe esconde que houve um encontro sem observação.
 *
 * A saída honesta é a terceira: a média usa só as notas de verdade, e o número
 * de não observados viaja junto para a tela poder dizer.
 */
export type MediaDeEixo = {
  eixo: string;
  /** `null` quando nenhuma nota real foi dada — não é zero. */
  media: number | null;
  avaliacoes: number;
  naoObservados: number;
};

export function mediaPorEixo(
  notas: readonly NotaDeEixo[],
): Map<string, MediaDeEixo> {
  const porEixo = new Map<string, MediaDeEixo>();

  for (const n of notas) {
    const atual = porEixo.get(n.eixo) ?? {
      eixo: n.eixo,
      media: null,
      avaliacoes: 0,
      naoObservados: 0,
    };

    if (n.nota === null) {
      atual.naoObservados += 1;
    } else {
      const soma = (atual.media ?? 0) * atual.avaliacoes + n.nota;
      atual.avaliacoes += 1;
      atual.media = soma / atual.avaliacoes;
    }

    porEixo.set(n.eixo, atual);
  }

  return porEixo;
}

// ── Quem está descoberto ───────────────────────────────────────────────────

export function mediana(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 0
    ? ((ordenados[meio - 1] ?? 0) + (ordenados[meio] ?? 0)) / 2
    : (ordenados[meio] ?? 0);
}

/**
 * `RF-G1` — destaque para quem está **abaixo da cobertura da turma**.
 *
 * O critério é *menos da metade da mediana*, e a escolha é deliberada.
 * "Abaixo da mediana" marcaria metade da turma por definição, toda semana — e
 * a lição já aprendida neste projeto é que tudo destacado é nada destacado.
 * Metade da mediana pega quem está de fato para trás e cala quando a
 * distribuição é uniforme.
 *
 * No começo da formação a mediana é 0 ou 1 e ninguém é marcado. Está certo: se
 * ninguém tem feedback ainda, ninguém está sendo esquecido *em relação aos
 * outros*, que é o que esta tela mede.
 */
export function limiteDeCobertura(linhas: readonly LinhaDaCobertura[]): number {
  return mediana(linhas.map((l) => l.feedbacks)) / 2;
}

export function estaDescoberto(
  linha: LinhaDaCobertura,
  limite: number,
): boolean {
  return limite > 0 && linha.feedbacks < limite;
}

/**
 * Quem tem menos vem primeiro — o mesmo mecanismo do painel do encontro, pela
 * mesma razão: a tela empurra para a cobertura em vez de deixar isso por conta
 * da boa vontade.
 */
export function ordenarPorCobertura(
  linhas: readonly LinhaDaCobertura[],
): LinhaDaCobertura[] {
  return [...linhas].sort(
    (a, b) =>
      a.feedbacks - b.feedbacks || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export type ResumoDaTurma = {
  total: number;
  mediana: number;
  descobertos: number;
  semNenhum: number;
};

export function resumoDaTurma(
  linhas: readonly LinhaDaCobertura[],
): ResumoDaTurma {
  const limite = limiteDeCobertura(linhas);
  return {
    total: linhas.length,
    mediana: mediana(linhas.map((l) => l.feedbacks)),
    descobertos: linhas.filter((l) => estaDescoberto(l, limite)).length,
    semNenhum: linhas.filter((l) => l.feedbacks === 0).length,
  };
}

// ── A série da evolução — RF-G2 ────────────────────────────────────────────

export type PontoDaSerie = {
  encontro: number;
  /** `null` marca **descontinuidade**, nunca zero (`RN-07`). */
  nota: number | null;
};

export type SerieDeEixo = {
  eixo: string;
  pontos: readonly PontoDaSerie[];
};

/**
 * `RN-07` no gráfico — o detalhe que decide se ele mente.
 *
 * Se um encontro em que o mentor não teve como observar virar um ponto baixo na
 * linha, o gráfico inventa uma queda que não existiu. E esse gráfico vai para o
 * documento final da pessoa, que vai lê-lo achando que piorou.
 *
 * Aqui "não observado" vira `nota: null` e permanece na série, na posição do
 * encontro. A tela desenha isso como buraco marcado, não como zero e não como
 * ausência.
 */
export function seriesPorEixo(
  framework: Framework,
  notas: readonly NotaDeEixo[],
): SerieDeEixo[] {
  const porEixo = new Map<string, PontoDaSerie[]>();

  for (const n of notas) {
    const pontos = porEixo.get(n.eixo) ?? [];
    pontos.push({ encontro: n.encontro, nota: n.nota });
    porEixo.set(n.eixo, pontos);
  }

  /**
   * **A ordem é a do framework, nunca a de chegada do banco.**
   *
   * A primeira versão devolvia na ordem em que as linhas vinham da consulta, e
   * o gráfico pintava a série pela posição no vetor. O efeito apareceu na tela:
   * a legenda saiu "Presença, Fala, Mensagem", e uma consulta que devolvesse
   * outra ordem trocaria as cores.
   *
   * Isso não é detalhe estético. A cor tem de seguir **a identidade do eixo**,
   * não a posição: Fala é a mesma cor na formação inteira, em todas as pessoas,
   * e no documento final. Duas pessoas com Fala de cores diferentes tornam os
   * documentos incomparáveis, que é justamente o que a nota existe para dar.
   */
  const ordem = eixosDe(framework).map((e) => e.id);

  return [...porEixo.entries()]
    .map(([eixo, pontos]) => ({
      eixo,
      pontos: [...pontos].sort((a, b) => a.encontro - b.encontro),
    }))
    .sort((a, b) => {
      const ia = ordem.indexOf(a.eixo);
      const ib = ordem.indexOf(b.eixo);
      // Eixo fora do framework (dado antigo) vai para o fim, sem sumir.
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

/**
 * O canal de cor de um eixo — **pela identidade dele, não pela posição**.
 *
 * Um eixo sem feedback nenhum não aparece no gráfico, e sem esta função a
 * ausência dele deslocaria a cor de todos os outros.
 */
export function canalDoEixo(framework: Framework, eixo: string): number {
  const i = eixosDe(framework).findIndex((e) => e.id === eixo);
  return i === -1 ? 0 : i;
}

/**
 * Segmentos contínuos de uma série — o que de fato vira linha desenhada.
 *
 * Um "não observado" no meio quebra a linha em duas. Ligar por cima dele
 * desenharia uma evolução que ninguém observou.
 */
export function segmentosContinuos(
  pontos: readonly PontoDaSerie[],
): PontoDaSerie[][] {
  const segmentos: PontoDaSerie[][] = [];
  let atual: PontoDaSerie[] = [];

  for (const p of pontos) {
    if (p.nota === null) {
      if (atual.length > 0) segmentos.push(atual);
      atual = [];
    } else {
      atual.push(p);
    }
  }
  if (atual.length > 0) segmentos.push(atual);

  return segmentos;
}

// ── Presença na cobertura ──────────────────────────────────────────────────

/** `RF-C2` — quem faltou aparece como falta, não como buraco de atenção. */
export function encontrosQueContam(
  presencas: readonly (StatusPresenca | null)[],
): number {
  return presencas.filter((p) => !ausenciaExplicaFaltaDeFeedback(p)).length;
}
