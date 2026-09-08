import { describe, it, expect } from "vitest";
import {
  mediaPorEixo,
  mediana,
  limiteDeCobertura,
  estaDescoberto,
  ordenarPorCobertura,
  resumoDaTurma,
  seriesPorEixo,
  gradeDeNotas,
  segmentosContinuos,
  encontrosQueContam,
  canalDoEixo,
  type LinhaDaCobertura,
  type NotaDeEixo,
} from "@/dominio/cobertura";

/** `RF-G1` e `RF-G2` — turma e cobertura. */

const nota = (eixo: string, n: number | null, encontro: number): NotaDeEixo => ({
  eixo,
  nota: n,
  encontro,
});

const pessoa = (nome: string, feedbacks: number): LinhaDaCobertura => ({
  participacaoId: nome.toLowerCase(),
  nome,
  feedbacks,
  encontrosComFeedback: 0,
  encontrosSemFeedback: 0,
  presencas: 0,
  faltas: 0,
  notas: [],
});

describe("RN-07 na média — não observado não é zero e não some", () => {
  it("a média ignora o não observado em vez de contá-lo como zero", () => {
    const m = mediaPorEixo([
      nota("fala", 4, 1),
      nota("fala", null, 2),
      nota("fala", 2, 3),
    ]);

    // Com zero seria 2. Ignorando de verdade, é 3.
    expect(m.get("fala")?.media).toBe(3);
    expect(m.get("fala")?.avaliacoes).toBe(2);
  });

  it("mas o não observado é contado à parte, não desaparece", () => {
    const m = mediaPorEixo([nota("fala", 4, 1), nota("fala", null, 2)]);
    expect(m.get("fala")?.naoObservados).toBe(1);
  });

  it("só não observados dá média nula, não zero", () => {
    const m = mediaPorEixo([nota("fala", null, 1), nota("fala", null, 2)]);

    expect(m.get("fala")?.media, "média virou zero — RN-07 furou").toBeNull();
    expect(m.get("fala")?.naoObservados).toBe(2);
  });

  it("separa por eixo", () => {
    const m = mediaPorEixo([nota("fala", 4, 1), nota("mensagem", 2, 1)]);
    expect(m.get("fala")?.media).toBe(4);
    expect(m.get("mensagem")?.media).toBe(2);
  });

  it("lista vazia devolve mapa vazio", () => {
    expect(mediaPorEixo([]).size).toBe(0);
  });
});

describe("mediana", () => {
  it("ímpar pega o do meio", () => {
    expect(mediana([1, 5, 3])).toBe(3);
  });
  it("par tira a média dos dois do meio", () => {
    expect(mediana([1, 2, 4, 5])).toBe(3);
  });
  it("vazio é zero", () => {
    expect(mediana([])).toBe(0);
  });
});

describe("quem está abaixo da cobertura da turma", () => {
  /**
   * O critério é metade da mediana, e não "abaixo da mediana". Este bloco
   * existe para travar isso: "abaixo da mediana" marcaria metade da turma por
   * definição, toda semana — e tudo destacado é nada destacado.
   */
  it("não marca metade da turma quando a distribuição é uniforme", () => {
    const turma = [
      pessoa("A", 5),
      pessoa("B", 6),
      pessoa("C", 6),
      pessoa("D", 7),
    ];
    const limite = limiteDeCobertura(turma);

    expect(turma.filter((l) => estaDescoberto(l, limite))).toHaveLength(0);
  });

  it("marca quem está de fato para trás", () => {
    const turma = [
      pessoa("A", 0),
      pessoa("B", 1),
      pessoa("C", 6),
      pessoa("D", 8),
    ];
    const limite = limiteDeCobertura(turma);

    const marcados = turma.filter((l) => estaDescoberto(l, limite)).map((l) => l.nome);
    expect(marcados).toEqual(["A", "B"]);
  });

  it("no começo da formação ninguém é marcado", () => {
    // Se ninguém tem feedback, ninguém está sendo esquecido em relação aos
    // outros — que é o que esta tela mede.
    const turma = [pessoa("A", 0), pessoa("B", 0), pessoa("C", 1)];
    const limite = limiteDeCobertura(turma);

    expect(turma.filter((l) => estaDescoberto(l, limite))).toHaveLength(0);
  });

  it("turma vazia não quebra", () => {
    expect(limiteDeCobertura([])).toBe(0);
    expect(resumoDaTurma([])).toEqual({
      total: 0,
      mediana: 0,
      descobertos: 0,
      semNenhum: 0,
    });
  });

  it("o resumo conta descobertos e quem não tem nada", () => {
    const turma = [pessoa("A", 0), pessoa("B", 1), pessoa("C", 6), pessoa("D", 8)];
    const r = resumoDaTurma(turma);

    expect(r.total).toBe(4);
    expect(r.semNenhum).toBe(1);
    expect(r.descobertos).toBe(2);
  });
});

describe("ordem — quem tem menos vem primeiro", () => {
  it("ordena crescente por feedbacks", () => {
    const turma = [pessoa("C", 8), pessoa("A", 0), pessoa("B", 3)];
    expect(ordenarPorCobertura(turma).map((l) => l.nome)).toEqual(["A", "B", "C"]);
  });

  it("empate resolve por nome — a lista não pode dançar", () => {
    const turma = [pessoa("C", 2), pessoa("A", 2), pessoa("B", 2)];
    expect(ordenarPorCobertura(turma).map((l) => l.nome)).toEqual(["A", "B", "C"]);
  });
});

describe("a grade da tabela — toda linha do mesmo comprimento", () => {
  // Encontrado vendo rodar: `fala` e `presenca` sem registro no encontro 4
  // saíam com uma célula a menos, e a média escorregava para a coluna do
  // encontro. A tabela dizia "Fala 3.0 no encontro 4" sobre alguém que não
  // recebeu nota nenhuma de Fala ali.
  const series = seriesPorEixo("oratoria", [
    nota("mensagem", 3, 1),
    nota("mensagem", 4, 4),
    nota("fala", 2, 1),
    nota("fala", null, 4),
    nota("presenca", 5, 1),
  ]);

  it("todas as linhas têm uma célula por encontro, mesmo sem registro", () => {
    const grade = gradeDeNotas(series);
    expect(grade.encontros).toEqual([1, 4]);
    for (const linha of grade.linhas) {
      expect(linha.celulas).toHaveLength(grade.encontros.length);
    }
  });

  it("cada célula fica na coluna do seu próprio encontro", () => {
    const grade = gradeDeNotas(series);
    for (const linha of grade.linhas) {
      expect(linha.celulas.map((c) => c.encontro)).toEqual([...grade.encontros]);
    }
  });

  it('"sem registro" não se confunde com "não observado"', () => {
    const grade = gradeDeNotas(series);
    const porEixo = new Map(grade.linhas.map((l) => [l.eixo, l.celulas]));

    // `fala` no encontro 4: o mentor olhou e não teve como observar.
    expect(porEixo.get("fala")?.[1]?.estado).toBe("nao-observado");
    // `presenca` no encontro 4: ninguém registrou. Ausência de mentor.
    expect(porEixo.get("presenca")?.[1]?.estado).toBe("sem-registro");
  });

  it("a grade sem série nenhuma não quebra", () => {
    expect(gradeDeNotas([])).toEqual({ encontros: [], linhas: [] });
  });
});

describe("RN-07 no gráfico — o ponto que faria o gráfico mentir", () => {
  it("não observado permanece na série, como null", () => {
    const series = seriesPorEixo("oratoria", [
      nota("fala", 4, 1),
      nota("fala", null, 2),
      nota("fala", 5, 3),
    ]);

    expect(series[0]?.pontos.map((p) => p.nota)).toEqual([4, null, 5]);
  });

  it("os pontos ficam em ordem de encontro, não de chegada", () => {
    const series = seriesPorEixo("oratoria", [nota("fala", 5, 3), nota("fala", 4, 1)]);
    expect(series[0]?.pontos.map((p) => p.encontro)).toEqual([1, 3]);
  });

  it("um não observado no meio quebra a linha em dois segmentos", () => {
    // Ligar por cima dele desenharia uma evolução que ninguém observou.
    const segmentos = segmentosContinuos([
      { encontro: 1, nota: 4 },
      { encontro: 2, nota: null },
      { encontro: 3, nota: 5 },
    ]);

    expect(segmentos).toHaveLength(2);
    expect(segmentos[0]?.[0]?.nota).toBe(4);
    expect(segmentos[1]?.[0]?.nota).toBe(5);
  });

  it("série contínua vira um segmento só", () => {
    const segmentos = segmentosContinuos([
      { encontro: 1, nota: 2 },
      { encontro: 2, nota: 3 },
    ]);
    expect(segmentos).toHaveLength(1);
  });

  it("série só de não observados não vira segmento nenhum", () => {
    expect(
      segmentosContinuos([
        { encontro: 1, nota: null },
        { encontro: 2, nota: null },
      ]),
    ).toHaveLength(0);
  });

  it("não observado no fim não cria segmento vazio", () => {
    const segmentos = segmentosContinuos([
      { encontro: 1, nota: 3 },
      { encontro: 2, nota: null },
    ]);
    expect(segmentos).toHaveLength(1);
    expect(segmentos[0]).toHaveLength(1);
  });
});

/**
 * O defeito que este bloco impede voltar: a série vinha na ordem da consulta e
 * o gráfico pintava pela posição no vetor. A legenda saiu "Presença, Fala,
 * Mensagem" e uma consulta com outra ordem trocaria as cores.
 *
 * A cor tem de seguir **a identidade do eixo**. Fala é a mesma cor na formação
 * inteira, em todas as pessoas, e no documento final — senão os documentos
 * ficam incomparáveis, que é justamente o que a nota existe para dar.
 */
describe("a cor segue o eixo, não a posição", () => {
  it("as séries saem na ordem do framework, não na de chegada", () => {
    const series = seriesPorEixo("oratoria", [
      nota("presenca", 3, 1),
      nota("fala", 2, 1),
      nota("mensagem", 4, 1),
    ]);

    expect(series.map((s) => s.eixo)).toEqual(["mensagem", "fala", "presenca"]);
  });

  it("o canal de cor é fixo por eixo", () => {
    expect(canalDoEixo("oratoria", "mensagem")).toBe(0);
    expect(canalDoEixo("oratoria", "fala")).toBe(1);
    expect(canalDoEixo("oratoria", "presenca")).toBe(2);
  });

  it("um eixo sem dado não desloca a cor dos outros", () => {
    // Se Mensagem não tiver feedback nenhum, Fala continua sendo o canal 1.
    const series = seriesPorEixo("oratoria", [
      nota("fala", 2, 1),
      nota("presenca", 3, 1),
    ]);

    expect(series.map((s) => canalDoEixo("oratoria", s.eixo))).toEqual([1, 2]);
  });

  it("eixo fora do framework não some — vai para o fim", () => {
    const series = seriesPorEixo("oratoria", [
      nota("eixo-antigo", 3, 1),
      nota("mensagem", 4, 1),
    ]);

    expect(series.map((s) => s.eixo)).toEqual(["mensagem", "eixo-antigo"]);
  });
});

describe("RF-C2 na cobertura", () => {
  it("encontros em que a pessoa faltou não contam", () => {
    expect(
      encontrosQueContam(["presente", "ausente", "justificado", "presente"]),
    ).toBe(2);
  });

  it("não marcado conta — não saber não é desculpa", () => {
    expect(encontrosQueContam([null, "presente"])).toBe(2);
  });
});
