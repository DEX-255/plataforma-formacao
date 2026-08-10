import { describe, it, expect } from "vitest";
import {
  decidirLogin,
  papelPodeAcessar,
  rotaEhPublica,
  telaInicialDoPapel,
  type Autorizacao,
} from "@/dominio/acesso";
import type { StatusEdicao } from "@/dominio/tipos";

const EDICAO = "ed-2026-2";

const autorizados: Autorizacao[] = [
  { email: "Ana@ufg.br", papel: "participante", edicao_id: EDICAO },
  { email: "mentora@ufg.br", papel: "mentor", edicao_id: EDICAO },
];

const ativa = () => "ativa" as StatusEdicao;
const encerrada = () => "encerrada" as StatusEdicao;

describe("RF-A1 / RN-11 — só entra quem está na lista", () => {
  it("e-mail autorizado entra com o papel dele", () => {
    expect(decidirLogin("ana@ufg.br", autorizados, ativa)).toEqual({
      tipo: "entra",
      papel: "participante",
      edicaoId: EDICAO,
    });
  });

  it("maiúscula e espaço não impedem a entrada", () => {
    expect(decidirLogin("  ANA@ufg.br  ", autorizados, ativa).tipo).toBe("entra");
  });

  it("e-mail fora da lista é recusado — sem criar conta órfã", () => {
    expect(decidirLogin("carla@ufg.br", autorizados, ativa)).toEqual({
      tipo: "nao-autorizado",
    });
  });
});

describe("RN-13 — edição encerrada", () => {
  it("participante cai com mensagem de encerramento", () => {
    expect(decidirLogin("ana@ufg.br", autorizados, encerrada)).toEqual({
      tipo: "edicao-encerrada",
    });
  });

  it("mentor continua entrando, em modo arquivo", () => {
    expect(decidirLogin("mentora@ufg.br", autorizados, encerrada).tipo).toBe(
      "entra",
    );
  });
});

describe("a ordem das recusas não vaza informação", () => {
  it("quem não está na lista ouve 'não autorizado', nunca 'edição encerrada'", () => {
    // Dizer que a edição terminou já entrega que existe uma edição e que ela
    // terminou. Quem está de fora não precisa saber nem uma coisa nem outra.
    expect(decidirLogin("estranho@ufg.br", autorizados, encerrada)).toEqual({
      tipo: "nao-autorizado",
    });
  });

  it("edição inexistente também é apenas 'não autorizado'", () => {
    expect(
      decidirLogin("ana@ufg.br", autorizados, () => undefined).tipo,
    ).toBe("nao-autorizado");
  });
});

describe("RF-A1 — cada papel cai na própria tela inicial", () => {
  it("mentor vai para encontros, participante para trajetória", () => {
    expect(telaInicialDoPapel("mentor")).toBe("/encontros");
    expect(telaInicialDoPapel("participante")).toBe("/trajetoria");
  });
});

describe("RF-A3 — proteção de rota decidida no servidor", () => {
  it("participante não alcança rota de mentor nem digitando a URL", () => {
    expect(papelPodeAcessar("participante", "/turma")).toBe(false);
    expect(papelPodeAcessar("participante", "/turma/ana")).toBe(false);
    expect(papelPodeAcessar("participante", "/membros")).toBe(false);
    expect(papelPodeAcessar("participante", "/encerrar")).toBe(false);
  });

  it("mentor não usa as telas de participante", () => {
    expect(papelPodeAcessar("mentor", "/trajetoria")).toBe(false);
  });

  it("cada papel alcança o que é dele, inclusive nas sub-rotas", () => {
    expect(papelPodeAcessar("mentor", "/encontros")).toBe(true);
    expect(papelPodeAcessar("mentor", "/encontros/abc/feedback/xyz")).toBe(true);
    expect(papelPodeAcessar("participante", "/trajetoria")).toBe(true);
    expect(papelPodeAcessar("participante", "/caixa/e1")).toBe(true);
  });

  it("rota desconhecida é negada por padrão", () => {
    // Esquecer de declarar quem acessa uma tela nova resulta em porta fechada,
    // não em porta aberta. É a diferença entre um bug visível e um vazamento.
    expect(papelPodeAcessar("participante", "/relatorios-secretos")).toBe(false);
    expect(papelPodeAcessar("mentor", "/relatorios-secretos")).toBe(false);
  });

  it("as rotas públicas passam para qualquer um", () => {
    expect(rotaEhPublica("/")).toBe(true);
    expect(rotaEhPublica("/entrar")).toBe(true);
    expect(rotaEhPublica("/auth/retorno")).toBe(true);
    expect(rotaEhPublica("/turma")).toBe(false);
  });
});
