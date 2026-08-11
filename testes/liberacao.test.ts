import { describe, it, expect } from "vitest";
import {
  montarPrevia,
  avisoDeCobertura,
  encontroPodeSerLiberado,
  CONSEQUENCIAS_DA_LIBERACAO,
  LIBERACAO_E_IRREVERSIVEL,
} from "@/dominio/liberacao";

/** `RF-B4` — o ritual semanal. */

describe("a prévia — o que a tela mostra antes de confirmar", () => {
  it("conta quem não vai receber nada", () => {
    const p = montarPrevia({
      participacoes: 12,
      participacoesComFeedback: 5,
      feedbacks: 9,
      mensagens: 4,
    });

    expect(p).toEqual({
      turma: 12,
      comFeedback: 5,
      semNenhum: 7,
      feedbacks: 9,
      mensagens: 4,
    });
  });

  it("turma inteira coberta dá zero descoberto", () => {
    const p = montarPrevia({
      participacoes: 8,
      participacoesComFeedback: 8,
      feedbacks: 20,
      mensagens: 3,
    });
    expect(p.semNenhum).toBe(0);
  });

  it("encontro sem feedback nenhum: todo mundo descoberto", () => {
    const p = montarPrevia({
      participacoes: 12,
      participacoesComFeedback: 0,
      feedbacks: 0,
      mensagens: 0,
    });
    expect(p.semNenhum).toBe(12);
  });

  it("turma vazia não quebra a conta", () => {
    const p = montarPrevia({
      participacoes: 0,
      participacoesComFeedback: 0,
      feedbacks: 0,
      mensagens: 0,
    });
    expect(p.semNenhum).toBe(0);
  });
});

describe("o aviso de cobertura — para incomodar em português", () => {
  const previa = (semNenhum: number) =>
    montarPrevia({
      participacoes: 12,
      participacoesComFeedback: 12 - semNenhum,
      feedbacks: 0,
      mensagens: 0,
    });

  it("não avisa quando todo mundo recebeu", () => {
    expect(avisoDeCobertura(previa(0))).toBeNull();
  });

  it("concorda em singular", () => {
    expect(avisoDeCobertura(previa(1))).toBe(
      "1 pessoa não vai receber nenhum feedback deste encontro.",
    );
  });

  it("concorda em plural", () => {
    expect(avisoDeCobertura(previa(7))).toContain("7 pessoas não vão receber");
  });

  it("diz o número, não uma vaguidão", () => {
    const aviso = avisoDeCobertura(previa(7)) ?? "";
    expect(aviso).toMatch(/\d/);
    for (const vago of ["algumas", "algumas pessoas", "parte da turma"]) {
      expect(aviso.toLowerCase()).not.toContain(vago);
    }
  });
});

describe("a confirmação diz o que vai acontecer", () => {
  it("nomeia as três consequências simultâneas", () => {
    const texto = CONSEQUENCIAS_DA_LIBERACAO.join(" ").toLowerCase();

    expect(texto).toContain("participantes");
    expect(texto).toContain("caixa anônima fecha");
    expect(texto).toContain("mentores");
  });

  it("diz que é irreversível", () => {
    expect(LIBERACAO_E_IRREVERSIVEL.toLowerCase()).toContain("não há como voltar");
  });
});

describe("só encontro aberto é liberável", () => {
  it("aberto sim", () => {
    expect(encontroPodeSerLiberado({ status: "aberto" })).toBe(true);
  });

  it("rascunho não — pularia a etapa em que os mentores escrevem", () => {
    expect(encontroPodeSerLiberado({ status: "rascunho" })).toBe(false);
  });

  it("liberado não — não existe liberar duas vezes", () => {
    expect(encontroPodeSerLiberado({ status: "liberado" })).toBe(false);
  });
});
