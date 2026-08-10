import { describe, it, expect } from "vitest";
import {
  contarPendentes,
  lerEmailsColados,
  normalizar,
  ordenarMembros,
  type Membro,
} from "@/dominio/membros";

/**
 * `RF-A2`. O caminho real é copiar uma coluna da planilha do formulário e
 * colar — e às vezes fazer isso com trinta pessoas esperando na sala.
 */

describe("colar uma lista", () => {
  it("aceita quebra de linha, vírgula, ponto e vírgula e tabulação", () => {
    const r = lerEmailsColados(
      "ana@ufg.br\nbruno@ufg.br, carla@ufg.br; davi@ufg.br\telena@ufg.br",
    );
    expect(r.validos).toEqual([
      "ana@ufg.br",
      "bruno@ufg.br",
      "carla@ufg.br",
      "davi@ufg.br",
      "elena@ufg.br",
    ]);
  });

  it("normaliza maiúscula e espaço — a lista é comparada assim no login", () => {
    const r = lerEmailsColados("  ANA@UFG.BR  ");
    expect(r.validos).toEqual(["ana@ufg.br"]);
  });

  it("repetição não recusa o lote — é ignorada em silêncio", () => {
    const r = lerEmailsColados("ana@ufg.br\nana@ufg.br\nbruno@ufg.br");
    expect(r.validos).toEqual(["ana@ufg.br", "bruno@ufg.br"]);
    expect(r.repetidos).toEqual(["ana@ufg.br"]);
  });

  it("quem já estava na lista é separado, não duplicado", () => {
    const r = lerEmailsColados("ana@ufg.br\nnovo@ufg.br", ["ANA@ufg.br"]);
    expect(r.validos).toEqual(["novo@ufg.br"]);
    expect(r.jaExistiam).toEqual(["ana@ufg.br"]);
  });

  it("o que não parece e-mail é mostrado, nunca descartado em silêncio", () => {
    // Cabeçalho de planilha e célula com nome são o erro de colagem típico.
    const r = lerEmailsColados("E-mail\nAna Souza\nana@ufg.br");
    expect(r.validos).toEqual(["ana@ufg.br"]);
    expect(r.invalidos).toEqual(["E-mail", "Ana", "Souza"]);
  });

  it("texto vazio não quebra nem inventa entrada", () => {
    const r = lerEmailsColados("   \n\n  ");
    expect(r.validos).toEqual([]);
    expect(r.invalidos).toEqual([]);
  });

  it("um e-mail sozinho funciona — é o caso da correção na hora", () => {
    const r = lerEmailsColados("atrasada@discente.ufg.br");
    expect(r.validos).toEqual(["atrasada@discente.ufg.br"]);
  });

  it("normalizar bate com o que o banco faz na comparação", () => {
    expect(normalizar("  Ana@UFG.br ")).toBe("ana@ufg.br");
  });
});

describe("ordem da lista", () => {
  const membros: Membro[] = [
    { email: "zeca@ufg.br", papel: "participante", entrou: { nome: "Zeca", avatar_url: null } },
    { email: "bruno@ufg.br", papel: "participante", entrou: null },
    { email: "ana@ufg.br", papel: "mentor", entrou: { nome: "Ana", avatar_url: null } },
    { email: "carla@ufg.br", papel: "participante", entrou: null },
  ];

  it("quem ainda não entrou vem primeiro", () => {
    // A tela serve para cadastrar e para cobrar quem não acessou. Ver primeiro
    // quem falta é o que torna a segunda coisa possível sem caçar na lista.
    const ordenados = ordenarMembros(membros);
    expect(ordenados.slice(0, 2).map((m) => m.email)).toEqual([
      "bruno@ufg.br",
      "carla@ufg.br",
    ]);
  });

  it("dentro de cada grupo, ordem alfabética", () => {
    const ordenados = ordenarMembros(membros);
    expect(ordenados.slice(2).map((m) => m.email)).toEqual([
      "ana@ufg.br",
      "zeca@ufg.br",
    ]);
  });

  it("não altera o array recebido", () => {
    ordenarMembros(membros);
    expect(membros[0]?.email).toBe("zeca@ufg.br");
  });

  it("conta quantos ainda não entraram", () => {
    expect(contarPendentes(membros)).toBe(2);
  });
});
