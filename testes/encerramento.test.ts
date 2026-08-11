import { describe, it, expect } from "vitest";
import {
  podeEncerrar,
  confirmacaoConfere,
  CONSEQUENCIAS_DO_ENCERRAMENTO,
  POR_QUE_TODOS_IGUALMENTE,
  O_QUE_ACONTECE_COM_OS_DADOS,
  ENCERRAMENTO_E_IRREVERSIVEL,
} from "@/dominio/encerramento";

/** `RF-A4`, `RN-13`, `RN-18` — encerramento da edição. */

describe("só edição ativa encerra", () => {
  it("ativa sim", () => {
    expect(podeEncerrar({ status: "ativa" })).toBe(true);
  });
  it("encerrada não — não existe encerrar duas vezes", () => {
    expect(podeEncerrar({ status: "encerrada" })).toBe(false);
  });
});

describe("a confirmação digitada", () => {
  it("aceita a palavra, com ou sem caixa", () => {
    expect(confirmacaoConfere("ENCERRAR")).toBe(true);
    expect(confirmacaoConfere("encerrar")).toBe(true);
    expect(confirmacaoConfere("  Encerrar  ")).toBe(true);
  });

  it("recusa qualquer outra coisa", () => {
    expect(confirmacaoConfere("")).toBe(false);
    expect(confirmacaoConfere("sim")).toBe(false);
    expect(confirmacaoConfere("encerra")).toBe(false);
  });
});

describe("RF-A4 — a confirmação nomeia a consequência", () => {
  const texto = CONSEQUENCIAS_DO_ENCERRAMENTO.join(" ").toLowerCase();

  it("diz que os participantes perdem o acesso", () => {
    expect(texto).toContain("perdem o acesso");
  });

  it("diz que o mentor continua entrando", () => {
    expect(texto).toContain("arquivo");
  });

  it("não se resume a perguntar se tem certeza", () => {
    // "Tem certeza?" não é confirmação: não diz o que acontece, e quem lê
    // responde sim por reflexo.
    expect(texto).not.toContain("tem certeza");
  });

  it("avisa que não há volta", () => {
    expect(ENCERRAMENTO_E_IRREVERSIVEL.toLowerCase()).toContain("reabrir");
  });
});

describe("todo mundo sai junto, e a tela explica por quê", () => {
  it("nomeia aprovados e não aprovados", () => {
    const t = (
      CONSEQUENCIAS_DO_ENCERRAMENTO.join(" ") + POR_QUE_TODOS_IGUALMENTE
    ).toLowerCase();
    expect(t).toContain("aprovados");
  });

  it("dá a razão: a plataforma não pode virar placar", () => {
    expect(POR_QUE_TODOS_IGUALMENTE.toLowerCase()).toContain("placar");
  });
});

describe("RN-18 — encerrar arquiva, não apaga", () => {
  const texto = O_QUE_ACONTECE_COM_OS_DADOS.join(" ").toLowerCase();

  it("diz que nada é apagado", () => {
    expect(texto).toContain("nada é apagado");
  });

  it("diz por que os dados ficam", () => {
    expect(texto).toContain("documento final");
  });

  it("informa o direito de saída", () => {
    // Não há tela para isso na v1; é procedimento manual, e o texto informa
    // para quem pedir em vez de deixar a pessoa sem caminho.
    expect(texto).toContain("exclusão");
  });
});
