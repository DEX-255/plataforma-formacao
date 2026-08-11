import { describe, it, expect } from "vitest";
import {
  SECOES,
  posicaoDaSecao,
  legendaVemAntesDoGrafico,
  nomeDoArquivo,
  temEscalaNumerica,
  LEGENDA_DA_ESCALA,
  O_QUE_ESTE_DOCUMENTO_E,
  FECHAMENTO,
  POR_QUE_SEM_NOTA_NAS_DINAMICAS,
} from "@/dominio/documento";
import { EXPECTATIVA_DA_ESCALA } from "@/dominio/frameworks";

/** `RF-H1`, `RF-H2`, `RF-H3` — o documento final. */

describe("RF-H2 — a legenda vem antes do número", () => {
  /**
   * Este é o teste que sustenta o requisito. `RF-H2` diz que a legenda da
   * escala é **condição para o `RF-H1` existir**: quem lê "2 de 5" sem contexto
   * lê reprovação, e entregar isso a quem não passou faz mais mal que bem.
   */
  it("a seção da escala precede a do gráfico", () => {
    expect(legendaVemAntesDoGrafico()).toBe(true);
  });

  it("e as palavras vêm antes das duas", () => {
    // Um documento que abre no gráfico entrega o número nos primeiros três
    // segundos, e as frases que os mentores escreveram viram legenda de uma
    // sentença já lida.
    expect(posicaoDaSecao("encontro-a-encontro")).toBeLessThan(
      posicaoDaSecao("como-ler-a-escala"),
    );
  });

  it("a ordem inteira é a do design doc", () => {
    expect([...SECOES]).toEqual([
      "capa",
      "o-que-e",
      "encontro-a-encontro",
      "como-ler-a-escala",
      "evolucao",
      "retratos",
      "presenca",
      "fechamento",
    ]);
  });
});

describe("a legenda explica a assimetria — RN-16", () => {
  it("traz os cinco níveis", () => {
    expect(LEGENDA_DA_ESCALA.niveis).toHaveLength(5);
  });

  it("cada nível usa o mesmo texto que o mentor leu ao pontuar", () => {
    // Divergir aqui faria o documento explicar uma escala que não é a que foi
    // usada para dar a nota.
    for (const { nivel, expectativa } of LEGENDA_DA_ESCALA.niveis) {
      expect(expectativa).toBe(EXPECTATIVA_DA_ESCALA[nivel]);
    }
  });

  it("diz que começar em 1–2 é esperado", () => {
    const texto = LEGENDA_DA_ESCALA.niveis
      .filter((n) => n.nivel <= 2)
      .map((n) => n.expectativa)
      .join(" ")
      .toLowerCase();

    expect(texto).toContain("esperado");
  });

  it("avisa que não é nota de prova", () => {
    expect(LEGENDA_DA_ESCALA.chamada.toLowerCase()).toContain("não é nota de prova");
  });
});

describe("o documento não carrega o veredito", () => {
  const texto = (
    O_QUE_ESTE_DOCUMENTO_E.join(" ") + FECHAMENTO.join(" ")
  ).toLowerCase();

  it("diz explicitamente que não é resultado", () => {
    expect(texto).toContain("não é um veredito");
  });

  it("não usa as palavras aprovado nem reprovado", () => {
    // Um PDF que carrega o resultado vira a coisa que a pessoa não quer abrir —
    // e aí ela também não lê o feedback, que é a única parte útil.
    for (const palavra of ["aprovado", "reprovado", "aprovada", "reprovada"]) {
      expect(texto, `o documento não decide nada: "${palavra}"`).not.toContain(
        palavra,
      );
    }
  });

  it("não compara com a turma", () => {
    for (const palavra of ["média da turma", "posição", "ranking", "colegas"]) {
      expect(texto).not.toContain(palavra);
    }
  });

  it("explica por que a nota estava escondida até aqui", () => {
    expect(texto).toContain("escondidas");
  });
});

describe("dinâmicas sem escala escrita", () => {
  it("só oratória tem número", () => {
    expect(temEscalaNumerica("oratoria")).toBe(true);
    expect(temEscalaNumerica("bomba")).toBe(false);
    expect(temEscalaNumerica("negociacao")).toBe(false);
  });

  it("e o documento explica a ausência em vez de inventar nota", () => {
    expect(POR_QUE_SEM_NOTA_NAS_DINAMICAS.toLowerCase()).toContain("régua");
  });
});

describe("RF-H3 — o nome do arquivo é estável", () => {
  it("mesmo nome e edição geram o mesmo arquivo", () => {
    expect(nomeDoArquivo("Ana Beatriz Rocha", "2026.2")).toBe(
      nomeDoArquivo("Ana Beatriz Rocha", "2026.2"),
    );
  });

  it("tira acento e pontuação", () => {
    expect(nomeDoArquivo("João Pedro D'Ávila", "2026.2")).toBe(
      "2026.2-joao-pedro-d-avila",
    );
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(nomeDoArquivo("  Ana  ", "2026.2")).toBe("2026.2-ana");
  });
});
