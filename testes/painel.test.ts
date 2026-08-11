import { describe, it, expect } from "vitest";
import {
  ordenarTurma,
  filtrarPorNome,
  normalizarBusca,
  coberturaDaTurma,
  type LinhaDaTurma,
} from "@/dominio/painel";

/** `RF-D5` — o painel do encontro. */

const pessoa = (
  nome: string,
  recebidos: number,
  euEscrevi = false,
  presenca: LinhaDaTurma["presenca"] = null,
): LinhaDaTurma => ({
  participacaoId: nome.toLowerCase(),
  nome,
  avatarUrl: null,
  recebidos,
  euEscrevi,
  presenca,
});

describe("ordenação — RF-D5", () => {
  it("quem não recebeu nada de ninguém vem primeiro", () => {
    const turma = [
      pessoa("Daniel", 3),
      pessoa("Ana", 0),
      pessoa("Carla", 1),
    ];

    expect(ordenarTurma(turma).map((l) => l.nome)).toEqual([
      "Ana",
      "Carla",
      "Daniel",
    ]);
  });

  it("o total vence a fila pessoal do mentor", () => {
    // Bruno já recebeu de outro mentor; Ana não recebeu de ninguém. Mesmo eu
    // tendo escrito para o Bruno, é a Ana que precisa de atenção primeiro.
    const turma = [pessoa("Bruno", 2, false), pessoa("Ana", 0, true)];

    expect(ordenarTurma(turma).map((l) => l.nome)).toEqual(["Ana", "Bruno"]);
  });

  it("empatando no total, quem eu ainda não escrevi vem antes", () => {
    const turma = [pessoa("Bruno", 1, true), pessoa("Ana", 1, false)];

    expect(ordenarTurma(turma).map((l) => l.nome)).toEqual(["Ana", "Bruno"]);
  });

  it("empatando em tudo, ordena por nome — a lista não pode dançar", () => {
    const turma = [pessoa("Carla", 1), pessoa("Ana", 1), pessoa("Bruno", 1)];
    const uma = ordenarTurma(turma).map((l) => l.nome);
    const outra = ordenarTurma([...turma].reverse()).map((l) => l.nome);

    expect(uma).toEqual(["Ana", "Bruno", "Carla"]);
    expect(uma).toEqual(outra);
  });

  it("respeita a ordem alfabética do português", () => {
    const turma = [pessoa("Ângela", 0), pessoa("Amanda", 0), pessoa("Zuleica", 0)];
    expect(ordenarTurma(turma).map((l) => l.nome)).toEqual([
      "Amanda",
      "Ângela",
      "Zuleica",
    ]);
  });

  it("não muda a lista original", () => {
    const turma = [pessoa("Bruno", 3), pessoa("Ana", 0)];
    ordenarTurma(turma);
    expect(turma.map((l) => l.nome)).toEqual(["Bruno", "Ana"]);
  });
});

describe("busca — a turma tem 20 a 50 pessoas", () => {
  const turma = [
    pessoa("Gabriela Siqueira", 0),
    pessoa("João Pedro Marinho", 0),
    pessoa("Karina D'Ávila", 0),
    pessoa("Ana Beatriz Rocha", 0),
  ];

  it("acha sem acento — ninguém digita acento com o polegar", () => {
    expect(filtrarPorNome(turma, "joao").map((l) => l.nome)).toEqual([
      "João Pedro Marinho",
    ]);
    expect(filtrarPorNome(turma, "davila").map((l) => l.nome)).toEqual([
      "Karina D'Ávila",
    ]);
  });

  it("acha com acento também", () => {
    expect(filtrarPorNome(turma, "João")).toHaveLength(1);
  });

  it("ignora caixa e espaço em volta", () => {
    expect(filtrarPorNome(turma, "  GABRIELA ")).toHaveLength(1);
  });

  it("acha por sobrenome, não só pelo começo", () => {
    expect(filtrarPorNome(turma, "rocha").map((l) => l.nome)).toEqual([
      "Ana Beatriz Rocha",
    ]);
  });

  it("busca vazia devolve a turma inteira", () => {
    expect(filtrarPorNome(turma, "")).toHaveLength(4);
    expect(filtrarPorNome(turma, "   ")).toHaveLength(4);
  });

  it("sem resultado devolve lista vazia, não a turma toda", () => {
    expect(filtrarPorNome(turma, "zzz")).toHaveLength(0);
  });

  it("normalizarBusca tira acento e caixa", () => {
    expect(normalizarBusca("ÁVILA")).toBe("avila");
    expect(normalizarBusca("  José  ")).toBe("jose");
  });
});

describe("cobertura — o número que incomoda", () => {
  it("conta quem não recebeu de ninguém", () => {
    const turma = [
      pessoa("Ana", 0),
      pessoa("Bruno", 0),
      pessoa("Carla", 2, true),
      pessoa("Daniel", 1),
    ];

    expect(coberturaDaTurma(turma)).toEqual({
      total: 4,
      semNenhum: 2,
      faltaram: 0,
      euEscrevi: 1,
    });
  });

  it("turma inteira coberta dá zero descoberto", () => {
    const turma = [pessoa("Ana", 1), pessoa("Bruno", 3)];
    expect(coberturaDaTurma(turma).semNenhum).toBe(0);
  });

  it("turma vazia não quebra", () => {
    expect(coberturaDaTurma([])).toEqual({
      total: 0,
      semNenhum: 0,
      faltaram: 0,
      euEscrevi: 0,
    });
  });
});

/**
 * `RF-C2` — sem isto, a tela de cobertura vira alarme falso toda semana. Um
 * alarme que dispara sem motivo passa a ser ignorado, inclusive quando estiver
 * certo.
 */
describe("RF-C2 — quem faltou não é buraco de atenção", () => {
  it("ausente sem feedback sai da conta que incomoda", () => {
    const turma = [
      pessoa("Ana", 0, false, "ausente"),
      pessoa("Bruno", 0, false, "presente"),
    ];

    const c = coberturaDaTurma(turma);
    expect(c.semNenhum, "quem faltou entrou no alarme").toBe(1);
    expect(c.faltaram).toBe(1);
  });

  it("falta justificada também sai", () => {
    const turma = [pessoa("Ana", 0, false, "justificado")];
    expect(coberturaDaTurma(turma).semNenhum).toBe(0);
    expect(coberturaDaTurma(turma).faltaram).toBe(1);
  });

  it("quem ainda não foi marcado CONTINUA na conta", () => {
    // Não saber se a pessoa veio é motivo para olhar, não para relaxar.
    const turma = [pessoa("Ana", 0, false, null)];
    expect(coberturaDaTurma(turma).semNenhum).toBe(1);
    expect(coberturaDaTurma(turma).faltaram).toBe(0);
  });

  it("quem faltou vai para o fim da lista, não para o topo", () => {
    // Sem isto ela subiria justamente por não ter feedback, e a lista mandaria
    // o mentor escrever sobre quem ele não teve como observar.
    const turma = [
      pessoa("Ana", 0, false, "ausente"),
      pessoa("Bruno", 2, false, "presente"),
      pessoa("Carla", 0, false, "presente"),
    ];

    expect(ordenarTurma(turma).map((l) => l.nome)).toEqual([
      "Carla",
      "Bruno",
      "Ana",
    ]);
  });

  it("turma inteira ausente não dispara alarme nenhum", () => {
    const turma = [
      pessoa("Ana", 0, false, "ausente"),
      pessoa("Bruno", 0, false, "ausente"),
    ];
    expect(coberturaDaTurma(turma).semNenhum).toBe(0);
  });
});
