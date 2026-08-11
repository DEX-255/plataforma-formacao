import { describe, it, expect } from "vitest";
import {
  ordenarTrajetoria,
  estadoNaTrajetoria,
  agruparPorEixo,
  TRAJETORIA_VAZIA,
} from "@/dominio/trajetoria";
import type { FeedbackVisivel } from "@/dominio/tipos";

/** `RF-E1`, `RF-E2`, `RF-E3` — o lado do participante. */

const fb = (eixo: string, id = eixo): FeedbackVisivel => ({
  id,
  encontro_id: "e1",
  participacao_id: "p1",
  mentor_id: "m1",
  eixo,
  situacao: "Na apresentação",
  ponto: "Ponto observado",
  sugestao: "O que fazer a seguir",
});

describe("ordem da linha do tempo", () => {
  it("mais recente primeiro", () => {
    const itens = [{ numero: 1 }, { numero: 3 }, { numero: 2 }];
    expect(ordenarTrajetoria(itens).map((i) => i.numero)).toEqual([3, 2, 1]);
  });

  it("não muda a lista original", () => {
    const itens = [{ numero: 1 }, { numero: 2 }];
    ordenarTrajetoria(itens);
    expect(itens.map((i) => i.numero)).toEqual([1, 2]);
  });
});

describe("nenhum estado é um vazio ambíguo", () => {
  const casos = [
    { status: "aberto", framework: "oratoria", feedbacks: 0 },
    { status: "liberado", framework: "oratoria", feedbacks: 0 },
    { status: "liberado", framework: "oratoria", feedbacks: 2 },
    { status: "aberto", framework: "nenhum", feedbacks: 0 },
    { status: "liberado", framework: "nenhum", feedbacks: 0 },
  ] as const;

  it("todo estado tem rótulo escrito", () => {
    for (const c of casos) {
      const e = estadoNaTrajetoria(c, c.feedbacks);
      expect(e.rotulo.trim().length, JSON.stringify(c)).toBeGreaterThan(0);
    }
  });

  it("todo estado sem conteúdo explica por quê", () => {
    for (const c of casos) {
      const e = estadoNaTrajetoria(c, c.feedbacks);
      if (!e.temConteudo) {
        expect(
          e.explicacao.length,
          `vazio sem explicação: ${JSON.stringify(c)}`,
        ).toBeGreaterThan(30);
      }
    }
  });
});

describe("encontro aguardando liberação — RN-05", () => {
  it("diz que ainda não foram liberados, e não que não existem", () => {
    const e = estadoNaTrajetoria(
      { status: "aberto", framework: "oratoria" },
      0,
    );

    expect(e.explicacao).toContain("ainda não foram liberados");
    expect(e.temConteudo).toBe(false);
  });
});

describe("encontro sem avaliação — RN-14 / RF-B5", () => {
  it("lê como cumprido e não sugere que faltou algo", () => {
    for (const status of ["aberto", "liberado"] as const) {
      const e = estadoNaTrajetoria({ status, framework: "nenhum" }, 0);
      expect(e.rotulo).toContain("cumprido");

      const texto = `${e.rotulo} ${e.explicacao}`.toLowerCase();
      for (const palavra of ["aguardando", "pendente", "faltou", "esquec"]) {
        expect(texto, `não pode sugerir pendência: "${palavra}"`).not.toContain(
          palavra,
        );
      }
    }
  });
});

describe("liberado sem nenhum registro — a plataforma registra, não produz", () => {
  const e = estadoNaTrajetoria({ status: "liberado", framework: "oratoria" }, 0);

  /**
   * `specs/01` — tudo aqui foi dito presencialmente. Ausência de registro é
   * ausência de conversa, e isso é normal. Uma versão anterior tratava isso
   * como lacuna de cobertura a explicar, e a premissa estava errada.
   */
  it("lembra que esta tela guarda o que foi dito presencialmente", () => {
    expect(e.explicacao.toLowerCase()).toContain("presencialmente");
  });

  it("não pede desculpa nem inventa explicação para a ausência", () => {
    for (const desculpa of [
      "acontece",
      "infelizmente",
      "não foi possível",
      "cada mentor",
      "parte da turma",
    ]) {
      expect(
        e.explicacao.toLowerCase(),
        `a ausência não precisa ser justificada: "${desculpa}"`,
      ).not.toContain(desculpa);
    }
  });

  it("não promete que virá depois — o encontro já foi liberado", () => {
    for (const promessa of ["em breve", "aguarde", "ainda vai", "próxima"]) {
      expect(e.explicacao.toLowerCase()).not.toContain(promessa);
    }
  });

  it("não culpa a pessoa", () => {
    for (const palavra of ["você não", "sua falta", "porque você"]) {
      expect(e.explicacao.toLowerCase()).not.toContain(palavra);
    }
  });
});

describe("contagem de feedbacks", () => {
  it("concorda em singular e plural", () => {
    expect(
      estadoNaTrajetoria({ status: "liberado", framework: "oratoria" }, 1).rotulo,
    ).toBe("1 feedback");
    expect(
      estadoNaTrajetoria({ status: "liberado", framework: "oratoria" }, 3).rotulo,
    ).toBe("3 feedbacks");
  });
});

describe("agrupamento por eixo — RF-E2", () => {
  it("segue a ordem do framework, não a de chegada", () => {
    const grupos = agruparPorEixo("oratoria", [
      fb("presenca"),
      fb("mensagem"),
      fb("fala"),
    ]);

    expect(grupos.map((g) => g.eixoId)).toEqual([
      "mensagem",
      "fala",
      "presenca",
    ]);
  });

  it("junta dois mentores do mesmo eixo num grupo só", () => {
    const grupos = agruparPorEixo("oratoria", [
      fb("fala", "a"),
      fb("fala", "b"),
    ]);

    expect(grupos).toHaveLength(1);
    expect(grupos[0]?.feedbacks).toHaveLength(2);
  });

  it("não cria grupo para eixo sem feedback", () => {
    const grupos = agruparPorEixo("oratoria", [fb("fala")]);
    expect(grupos.map((g) => g.eixoId)).toEqual(["fala"]);
  });

  it("traz a pergunta-âncora junto — é ela que ensina o modelo", () => {
    const grupos = agruparPorEixo("oratoria", [fb("fala")]);
    expect(grupos[0]?.eixo?.perguntaAncora).toBe(
      "De olhos fechados, o que eu ouço?",
    );
  });

  it("feedback de eixo que saiu do framework não some da tela", () => {
    // A pessoa leu aquilo. Sumir seria reescrever a história dela.
    const grupos = agruparPorEixo("oratoria", [fb("fala"), fb("eixo-antigo")]);

    expect(grupos.map((g) => g.eixoId)).toContain("eixo-antigo");
    expect(grupos.find((g) => g.eixoId === "eixo-antigo")?.eixo).toBeNull();
  });

  it("lista vazia devolve nenhum grupo", () => {
    expect(agruparPorEixo("oratoria", [])).toEqual([]);
  });
});

describe("RF-E3 — o vazio explicativo", () => {
  const texto = TRAJETORIA_VAZIA.linhas.join(" ").toLowerCase();

  it("diz o que vai aparecer e quando", () => {
    expect(texto).toContain("mentor");
    expect(texto).toContain("liberados");
  });

  it("avisa que não é nota nem classificação", () => {
    expect(texto).toContain("nota");
  });

  it("explica o modelo: é registro do presencial, não um canal à parte", () => {
    expect(texto).toContain("presencialmente");
  });

  it("não promete feedback a cada encontro", () => {
    // A plataforma registra o que foi dito. Prometer "a cada encontro" criaria
    // uma expectativa que a formação não garante, e transformaria o normal em
    // decepção.
    expect(texto).not.toContain("a cada encontro");
    expect(texto).not.toContain("toda semana você");
  });
});

describe("RN-03 pelo formato do tipo", () => {
  it("FeedbackVisivel não tem as colunas do bloco interno", () => {
    const f = fb("fala");
    expect(Object.keys(f)).not.toContain("nota");
    expect(Object.keys(f)).not.toContain("observacao_interna");
    expect(Object.keys(f)).not.toContain("nao_observado");
  });
});
