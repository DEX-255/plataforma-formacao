import { describe, it, expect } from "vitest";
import {
  podeMarcarPresenca,
  marcarTodosPresentes,
  alternarStatus,
  resumoDePresenca,
  ausenciaExplicaFaltaDeFeedback,
  ESTADOS_DE_PRESENCA,
  ROTULO_DE_PRESENCA,
  ROTULO_CURTO,
  type MarcacaoDePresenca,
} from "@/dominio/presenca";

/** `RF-C1` e `RF-C2` — presença por encontro. */

const p = (
  nome: string,
  status: MarcacaoDePresenca["status"] = null,
): MarcacaoDePresenca => ({
  participacaoId: nome.toLowerCase(),
  nome,
  status,
});

describe("os três estados existem e têm nome", () => {
  it("presente, ausente, justificado", () => {
    expect(ESTADOS_DE_PRESENCA).toEqual(["presente", "ausente", "justificado"]);
  });

  it("todo estado tem rótulo longo e curto", () => {
    for (const e of ESTADOS_DE_PRESENCA) {
      expect(ROTULO_DE_PRESENCA[e]?.length).toBeGreaterThan(0);
      expect(ROTULO_CURTO[e]?.length).toBeGreaterThan(0);
    }
  });

  it("o rótulo curto cabe ao lado do nome no celular", () => {
    for (const e of ESTADOS_DE_PRESENCA) {
      expect(ROTULO_CURTO[e].length).toBeLessThanOrEqual(11);
    }
  });
});

describe("editável até a liberação", () => {
  it("rascunho e aberto aceitam marcação", () => {
    expect(podeMarcarPresenca({ status: "rascunho" })).toBe(true);
    expect(podeMarcarPresenca({ status: "aberto" })).toBe(true);
  });

  it("liberado não — já faz parte do que a pessoa leu", () => {
    expect(podeMarcarPresenca({ status: "liberado" })).toBe(false);
  });
});

describe("marcação em massa — o fluxo principal", () => {
  it("todos presentes marca a lista inteira", () => {
    const turma = [p("Ana"), p("Bruno", "ausente"), p("Carla")];
    const marcada = marcarTodosPresentes(turma);

    expect(marcada.every((l) => l.status === "presente")).toBe(true);
  });

  it("sobrescreve marcação anterior — é 'todos', não 'os que faltam'", () => {
    const turma = [p("Ana", "ausente")];
    expect(marcarTodosPresentes(turma)[0]?.status).toBe("presente");
  });

  it("não muda a lista original", () => {
    const turma = [p("Ana")];
    marcarTodosPresentes(turma);
    expect(turma[0]?.status).toBeNull();
  });

  it("depois de marcar todos, dá para corrigir uma exceção", () => {
    // O caminho real: toca em "todos presentes", desmarca três pessoas.
    const turma = marcarTodosPresentes([p("Ana"), p("Bruno"), p("Carla")]);
    const corrigida = alternarStatus(turma, "bruno", "ausente");

    expect(corrigida.map((l) => l.status)).toEqual([
      "presente",
      "ausente",
      "presente",
    ]);
  });

  it("alternar não afeta as outras linhas", () => {
    const turma = [p("Ana", "presente"), p("Bruno", "presente")];
    const nova = alternarStatus(turma, "ana", "justificado");

    expect(nova[0]?.status).toBe("justificado");
    expect(nova[1]?.status).toBe("presente");
  });
});

describe("resumo", () => {
  it("conta cada estado, e quem falta marcar", () => {
    const turma = [
      p("Ana", "presente"),
      p("Bruno", "ausente"),
      p("Carla", "justificado"),
      p("Daniel"),
    ];

    expect(resumoDePresenca(turma)).toEqual({
      total: 4,
      presentes: 1,
      ausentes: 1,
      justificados: 1,
      semMarcar: 1,
    });
  });

  it("lista vazia não quebra", () => {
    expect(resumoDePresenca([]).total).toBe(0);
  });
});

describe("RF-C2 — a ausência explica a falta de feedback", () => {
  it("ausente e justificado explicam", () => {
    expect(ausenciaExplicaFaltaDeFeedback("ausente")).toBe(true);
    expect(ausenciaExplicaFaltaDeFeedback("justificado")).toBe(true);
  });

  it("presente não explica — veio e ninguém escreveu é problema", () => {
    expect(ausenciaExplicaFaltaDeFeedback("presente")).toBe(false);
  });

  it("não marcado não explica — não saber não é desculpa", () => {
    expect(ausenciaExplicaFaltaDeFeedback(null)).toBe(false);
  });
});
