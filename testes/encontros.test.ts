import { describe, it, expect } from "vitest";
import {
  transicaoValida,
  podeAbrir,
  podeLiberar,
  precisaAtribuirEixos,
  conferirAtribuicoes,
  atribuicaoEstaCompleta,
  proximoNumero,
  ordenarEncontros,
  encontroAberto,
  estadoDoEncontro,
  confirmacaoDeCriacao,
} from "@/dominio/encontros";
import type { AtribuicaoEixo, StatusEncontro, Usuario } from "@/dominio/tipos";

/** Ciclo de vida do encontro e atribuição de eixos — `RF-B1`…`RF-B5`. */

const mentor = (id: string, nome: string): Usuario => ({
  id,
  nome,
  email: `${id}@dex.test`,
  papel: "mentor",
  avatar_url: null,
});

const atribuir = (mentor_id: string, eixo: string, encontro_id = "e1"): AtribuicaoEixo => ({
  encontro_id,
  mentor_id,
  eixo,
});

const TODOS: StatusEncontro[] = ["rascunho", "aberto", "liberado"];

describe("transições — specs/02", () => {
  it("aceita rascunho → aberto e aberto → liberado, e mais nada", () => {
    const aceitas = new Set(["rascunho→aberto", "aberto→liberado"]);

    for (const de of TODOS) {
      for (const para of TODOS) {
        expect(
          transicaoValida(de, para),
          `${de} → ${para}`,
        ).toBe(aceitas.has(`${de}→${para}`));
      }
    }
  });

  it("não volta de liberado para aberto", () => {
    expect(transicaoValida("liberado", "aberto")).toBe(false);
  });

  it("não pula rascunho direto para liberado", () => {
    expect(transicaoValida("rascunho", "liberado")).toBe(false);
  });

  it("só abre o que está em rascunho", () => {
    expect(podeAbrir({ status: "rascunho" })).toBe(true);
    expect(podeAbrir({ status: "aberto" })).toBe(false);
    expect(podeAbrir({ status: "liberado" })).toBe(false);
  });

  it("só libera o que está aberto", () => {
    expect(podeLiberar({ status: "aberto" })).toBe(true);
    expect(podeLiberar({ status: "rascunho" })).toBe(false);
    expect(podeLiberar({ status: "liberado" })).toBe(false);
  });
});

describe("atribuição de eixos — RF-B2", () => {
  const ana = mentor("m1", "Ana");
  const beto = mentor("m2", "Beto");
  const cida = mentor("m3", "Cida");

  it("encontro sem avaliação pula a etapa (RN-14)", () => {
    expect(precisaAtribuirEixos("nenhum")).toBe(false);
    expect(precisaAtribuirEixos("oratoria")).toBe(true);

    const c = conferirAtribuicoes("nenhum", [ana, beto], []);
    expect(c.eixosSemMentor).toHaveLength(0);
    expect(c.mentoresSemEixo).toHaveLength(0);
  });

  it("aponta o eixo que ninguém vai observar", () => {
    const c = conferirAtribuicoes("oratoria", [ana, beto], [
      atribuir("m1", "mensagem"),
      atribuir("m2", "fala"),
    ]);

    expect(c.eixosSemMentor.map((e) => e.id)).toEqual(["presenca"]);
    expect(atribuicaoEstaCompleta(c)).toBe(false);
  });

  it("aponta o mentor que ficou sem eixo", () => {
    const c = conferirAtribuicoes("oratoria", [ana, beto, cida], [
      atribuir("m1", "mensagem"),
      atribuir("m2", "fala"),
      atribuir("m3", "presenca"),
    ]);

    expect(c.mentoresSemEixo).toHaveLength(0);

    const comQuarto = conferirAtribuicoes(
      "oratoria",
      [ana, beto, cida, mentor("m4", "Davi")],
      [atribuir("m1", "mensagem"), atribuir("m2", "fala"), atribuir("m3", "presenca")],
    );
    expect(comQuarto.mentoresSemEixo.map((m) => m.nome)).toEqual(["Davi"]);
  });

  it("mentor sem eixo não torna a atribuição incompleta — ele só não escreve", () => {
    const c = conferirAtribuicoes("oratoria", [ana, beto, cida, mentor("m4", "Davi")], [
      atribuir("m1", "mensagem"),
      atribuir("m2", "fala"),
      atribuir("m3", "presenca"),
    ]);

    expect(c.mentoresSemEixo).toHaveLength(1);
    expect(atribuicaoEstaCompleta(c)).toBe(true);
  });

  it("pega eixo que não pertence ao framework do encontro", () => {
    const c = conferirAtribuicoes("oratoria", [ana], [atribuir("m1", "numeros")]);

    expect(c.eixosForaDoFramework).toHaveLength(1);
    expect(atribuicaoEstaCompleta(c)).toBe(false);
  });

  it("dois mentores no mesmo eixo é permitido, e cobre o eixo", () => {
    const c = conferirAtribuicoes("bomba", [ana, beto], [
      atribuir("m1", "manual"),
      atribuir("m2", "manual"),
    ]);

    expect(c.eixosSemMentor.map((e) => e.id)).toEqual(["executor"]);
    expect(c.mentoresSemEixo).toHaveLength(0);
  });
});

describe("lista de encontros", () => {
  it("sugere o número seguinte, e começa em 1", () => {
    expect(proximoNumero([])).toBe(1);
    expect(proximoNumero([{ numero: 1 }, { numero: 2 }])).toBe(3);
  });

  it("sugere a partir do maior, não da contagem", () => {
    expect(proximoNumero([{ numero: 1 }, { numero: 5 }])).toBe(6);
  });

  it("põe o encontro aberto no topo e o resto decrescente", () => {
    const lista = [
      { numero: 1, status: "liberado" as const },
      { numero: 2, status: "liberado" as const },
      { numero: 3, status: "aberto" as const },
      { numero: 4, status: "rascunho" as const },
    ];

    expect(ordenarEncontros(lista).map((e) => e.numero)).toEqual([3, 4, 2, 1]);
  });

  it("não muda a lista original", () => {
    const lista = [
      { numero: 1, status: "liberado" as const },
      { numero: 2, status: "aberto" as const },
    ];
    ordenarEncontros(lista);
    expect(lista.map((e) => e.numero)).toEqual([1, 2]);
  });

  it("acha o encontro aberto, ou nenhum", () => {
    expect(encontroAberto([{ status: "liberado" }, { status: "aberto" }])).toEqual({
      status: "aberto",
    });
    expect(encontroAberto([{ status: "liberado" }])).toBeNull();
  });
});

describe("como o estado é dito — RN-14 / RF-B5", () => {
  it("encontro sem avaliação lê como cumprido, nunca como pendência", () => {
    for (const status of ["aberto", "liberado"] as const) {
      const e = estadoDoEncontro({ status, framework: "nenhum" });

      expect(e.rotulo).toBe("sem avaliação");
      expect(e.detalhe).toContain("cumprido");

      // O que a regra proíbe: qualquer palavra que sugira que faltou algo.
      const texto = `${e.rotulo} ${e.detalhe}`.toLowerCase();
      for (const palavra of [
        "aguardando",
        "pendente",
        "faltando",
        "nenhum feedback",
        "0 de",
        "incompleto",
      ]) {
        expect(texto, `não pode sugerir pendência: "${palavra}"`).not.toContain(palavra);
      }
    }
  });

  it("a confirmação de criação não manda atribuir eixo onde não há eixo", () => {
    // O defeito que este teste existe para impedir: a primeira versão mandava
    // "atribua os eixos antes de abrir" também no encontro `nenhum`.
    const semAvaliacao = confirmacaoDeCriacao("nenhum").toLowerCase();
    expect(semAvaliacao).not.toContain("atribua");
    expect(semAvaliacao).not.toContain("antes de abrir");

    for (const framework of ["oratoria", "bomba", "negociacao"] as const) {
      expect(confirmacaoDeCriacao(framework).toLowerCase()).toContain("atribua");
    }
  });

  it("rascunho sem avaliação ainda é rascunho — invisível para o participante", () => {
    const e = estadoDoEncontro({ status: "rascunho", framework: "nenhum" });
    expect(e.rotulo).toBe("rascunho");
  });

  it("cada estado tem palavra escrita, não só cor (specs/05)", () => {
    for (const framework of ["oratoria", "nenhum"] as const) {
      for (const status of TODOS) {
        const e = estadoDoEncontro({ status, framework });
        expect(e.rotulo.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("aberto avisa que a caixa anônima está aberta", () => {
    const e = estadoDoEncontro({ status: "aberto", framework: "oratoria" });
    expect(e.detalhe.toLowerCase()).toContain("anônima");
  });
});
