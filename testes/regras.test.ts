import { describe, it, expect } from "vitest";
import * as r from "@/dominio/regras";
import {
  FRAMEWORKS,
  acharEixo,
  auxilioDeCalibragem,
  eixoPertenceAoFramework,
  eixosDe,
  temDescritores,
} from "@/dominio/frameworks";
import type { Encontro, Feedback, MensagemAnonima } from "@/dominio/tipos";

/**
 * Um teste por RN. specs/07: "É a única parte em que teste não é opcional —
 * cada uma dessas regras existe porque sua violação causa dano real a uma
 * pessoa."
 */

const encontro = (status: Encontro["status"]): Pick<Encontro, "status"> => ({
  status,
});

const feedbackCompleto: Feedback = {
  id: "f1",
  encontro_id: "e1",
  participacao_id: "p1",
  mentor_id: "m1",
  eixo: "fala",
  situacao: "Na apresentação de hoje",
  ponto: "Muletas sonoras frequentes",
  sugestao: 'Grave dois minutos e conte os "hã"',
  nota: 2,
  nao_observado: false,
  observacao_interna: "Interno: travado, mas melhorou",
  criado_em: "2026-09-10T20:00:00Z",
  atualizado_em: "2026-09-10T20:00:00Z",
};

describe("RN-01 — sugestão é obrigatória", () => {
  it("recusa vazio, espaço e nulo", () => {
    expect(r.sugestaoPreenchida("Grave dois minutos")).toBe(true);
    expect(r.sugestaoPreenchida("")).toBe(false);
    expect(r.sugestaoPreenchida("    ")).toBe(false);
    expect(r.sugestaoPreenchida(null)).toBe(false);
  });

  it("o motivo cita a diretriz, não diz 'campo obrigatório'", () => {
    expect(r.MOTIVO_SUGESTAO_OBRIGATORIA).toContain("diretriz 6");
  });
});

describe("RN-02 — um mentor, um eixo", () => {
  const atribuicoes = [
    { encontro_id: "e1", mentor_id: "m1", eixo: "fala" },
    { encontro_id: "e1", mentor_id: "m2", eixo: "mensagem" },
  ];

  it("o eixo vem da atribuição, não da escolha do mentor", () => {
    expect(r.eixoDoMentorNoEncontro(atribuicoes, "e1", "m1")).toBe("fala");
  });

  it("o mentor não escreve fora do próprio canal", () => {
    expect(r.mentorPodeEscreverNoEixo(atribuicoes, "e1", "m1", "fala")).toBe(true);
    expect(r.mentorPodeEscreverNoEixo(atribuicoes, "e1", "m1", "presenca")).toBe(
      false,
    );
  });

  it("a atribuição vale só para aquele encontro — muda toda semana", () => {
    expect(r.eixoDoMentorNoEncontro(atribuicoes, "e2", "m1")).toBeNull();
  });
});

describe("RN-03 — o participante nunca vê o bloco interno", () => {
  it("o recorte não deixa passar nota nem observação interna", () => {
    const visivel = r.apenasBlocoVisivel(feedbackCompleto);

    expect(Object.keys(visivel)).not.toContain("nota");
    expect(Object.keys(visivel)).not.toContain("observacao_interna");
    expect(Object.keys(visivel)).not.toContain("nao_observado");
    expect(JSON.stringify(visivel)).not.toContain("travado");
  });

  it("o que a pessoa precisa ler continua ali", () => {
    const visivel = r.apenasBlocoVisivel(feedbackCompleto);
    expect(visivel.sugestao).toContain("Grave dois minutos");
    expect(visivel.mentor_id).toBe("m1");
  });
});

describe("RN-04 — feedback visível é sempre assinado", () => {
  it("não existe feedback visível sem mentor", () => {
    expect(r.feedbackEstaAssinado(feedbackCompleto)).toBe(true);
    expect(r.feedbackEstaAssinado({ mentor_id: "" })).toBe(false);
  });
});

describe("RN-05 — feedback só aparece após a liberação", () => {
  it("rascunho e aberto não mostram nada", () => {
    expect(r.feedbackVisivelParaParticipante(encontro("rascunho"))).toBe(false);
    expect(r.feedbackVisivelParaParticipante(encontro("aberto"))).toBe(false);
    expect(r.feedbackVisivelParaParticipante(encontro("liberado"))).toBe(true);
  });
});

describe("RN-06 — depois da liberação o bloco visível trava", () => {
  it("antes da liberação o autor edita", () => {
    expect(r.podeEditarBlocoVisivel(encontro("aberto"), "m1", "m1")).toBe(true);
  });

  it("depois da liberação, o que a pessoa leu é o que ficou", () => {
    expect(r.podeEditarBlocoVisivel(encontro("liberado"), "m1", "m1")).toBe(false);
  });

  it("o bloco interno continua editável — ninguém de fora o leu", () => {
    expect(r.podeEditarBlocoInterno("m1", "m1")).toBe(true);
  });

  it("ninguém edita feedback de outro mentor, em nenhum estado", () => {
    expect(r.podeEditarBlocoVisivel(encontro("aberto"), "m1", "m2")).toBe(false);
    expect(r.podeEditarBlocoInterno("m1", "m2")).toBe(false);
  });
});

describe("RN-07 — 'não observado' é valor de nota, não ausência", () => {
  it("nota com não-observado é estado impossível", () => {
    expect(r.notaCoerente(3, false)).toBe(true);
    expect(r.notaCoerente(null, true)).toBe(true);
    expect(r.notaCoerente(3, true)).toBe(false);
    expect(r.notaCoerente(null, false)).toBe(false);
  });

  it("a escala vai de 1 a 5, inteira", () => {
    expect(r.notaValida(1)).toBe(true);
    expect(r.notaValida(5)).toBe(true);
    expect(r.notaValida(0)).toBe(false);
    expect(r.notaValida(6)).toBe(false);
    expect(r.notaValida(2.5)).toBe(false);
  });
});

describe("RN-08 — a mensagem anônima não guarda vínculo com o autor", () => {
  it("mensagem limpa passa", () => {
    const msg: MensagemAnonima = {
      id: "m1",
      encontro_id: "e1",
      texto: "senti que ninguém olhou pra mim hoje",
      ordem_aleatoria: 0.42,
    };
    expect(r.mensagemEstaLimpa(msg)).toBe(true);
  });

  it("qualquer campo que denuncie o autor reprova", () => {
    for (const campo of ["participacao_id", "usuario_id", "autor_id", "criado_em"]) {
      const sujo = {
        id: "m1",
        encontro_id: "e1",
        texto: "x",
        ordem_aleatoria: 0.1,
        [campo]: "vazou",
      } as unknown as MensagemAnonima;

      expect(r.mensagemEstaLimpa(sujo), `${campo} passou despercebido`).toBe(false);
    }
  });
});

describe("RN-09 — uma mensagem por participante por encontro", () => {
  it("só com o encontro aberto e sem ter enviado antes", () => {
    expect(r.podeEnviarMensagem(encontro("aberto"), false)).toBe(true);
    expect(r.podeEnviarMensagem(encontro("aberto"), true)).toBe(false);
    expect(r.podeEnviarMensagem(encontro("liberado"), false)).toBe(false);
  });
});

describe("RN-10 — ordem aleatória fixa, nunca ordem de chegada", () => {
  it("ordena por ordem_aleatoria, não por id", () => {
    const msgs: MensagemAnonima[] = [
      { id: "a", encontro_id: "e", texto: "primeira a chegar", ordem_aleatoria: 0.9 },
      { id: "b", encontro_id: "e", texto: "segunda", ordem_aleatoria: 0.1 },
      { id: "c", encontro_id: "e", texto: "terceira", ordem_aleatoria: 0.5 },
    ];

    expect(r.ordenarMensagens(msgs).map((m) => m.id)).toEqual(["b", "c", "a"]);
  });

  it("não muda o array original — ordem estável entre renderizações", () => {
    const msgs: MensagemAnonima[] = [
      { id: "a", encontro_id: "e", texto: "x", ordem_aleatoria: 0.9 },
      { id: "b", encontro_id: "e", texto: "y", ordem_aleatoria: 0.1 },
    ];
    r.ordenarMensagens(msgs);
    expect(msgs[0]?.id).toBe("a");
  });

  it("mentor só lê depois da liberação", () => {
    expect(r.mensagensVisiveisParaMentor(encontro("aberto"))).toBe(false);
    expect(r.mensagensVisiveisParaMentor(encontro("liberado"))).toBe(true);
  });
});

describe("RN-11 — só entra quem está na lista", () => {
  const lista = [{ email: "Ana@ufg.br" }, { email: "bruno@ufg.br" }];

  it("ignora maiúscula e espaço em volta", () => {
    expect(r.emailAutorizado("  ana@ufg.br ", lista)).toBe(true);
  });

  it("e-mail fora da lista não entra", () => {
    expect(r.emailAutorizado("carla@ufg.br", lista)).toBe(false);
  });
});

describe("RN-12 — participante só enxerga a si mesmo", () => {
  it("não alcança participação alheia", () => {
    expect(r.participantePodeVer(["p1"], "p1")).toBe(true);
    expect(r.participantePodeVer(["p1"], "p2")).toBe(false);
  });
});

describe("RN-13 — encerrar a edição revoga o acesso do participante", () => {
  it("participante perde, mentor mantém em modo arquivo", () => {
    expect(r.participanteTemAcesso({ status: "ativa" }, "participante")).toBe(true);
    expect(r.participanteTemAcesso({ status: "encerrada" }, "participante")).toBe(
      false,
    );
    expect(r.participanteTemAcesso({ status: "encerrada" }, "mentor")).toBe(true);
  });
});

describe("RN-14 — um encontro pode não ter avaliação", () => {
  it("framework 'nenhum' é estado normal", () => {
    expect(r.encontroTemAvaliacao("nenhum")).toBe(false);
    expect(r.encontroTemAvaliacao("oratoria")).toBe(true);
  });

  it("Perfil Empreendedor não abre formulário mesmo com o encontro aberto", () => {
    expect(
      r.encontroAceitaFeedback({ status: "aberto", framework: "nenhum" }),
    ).toBe(false);
    expect(
      r.encontroAceitaFeedback({ status: "aberto", framework: "oratoria" }),
    ).toBe(true);
  });
});

describe("RN-15 — a nota mede estado, não esforço", () => {
  it("não existe mecanismo de bônus por evolução", () => {
    // A regra é implementada pela AUSÊNCIA de recurso: nenhuma função deste
    // módulo compõe, ajusta ou pondera nota. Se alguma aparecer, RN-15 caiu.
    const suspeitas = Object.keys(r).filter((n) =>
      /ajust|bonus|bônus|ponder|composta|evolucaoNota/i.test(n),
    );
    expect(suspeitas).toEqual([]);
  });

  it("o texto que explica a regra existe para a interface usar", () => {
    expect(r.NOTA_MEDE_ESTADO).toContain("estado de hoje");
  });
});

describe("RN-16 — a escala é assimétrica por desenho", () => {
  it("1 e 2 são o ponto de partida esperado", () => {
    expect(r.nivelEhEsperadoNoInicio(1)).toBe(true);
    expect(r.nivelEhEsperadoNoInicio(2)).toBe(true);
    expect(r.nivelEhEsperadoNoInicio(3)).toBe(false);
  });

  it("5 é fora da curva", () => {
    expect(r.nivelEhForaDaCurva(5)).toBe(true);
    expect(r.nivelEhForaDaCurva(4)).toBe(false);
  });

  it("cada nível tem um texto de expectativa para a tela do mentor", () => {
    for (const n of [1, 2, 3, 4, 5] as const) {
      expect(r.expectativaDoNivel(n).length).toBeGreaterThan(0);
    }
    expect(r.expectativaDoNivel(4)).toContain("Evolução grande");
  });
});

describe("RN-17 — todo dado pertence a uma edição", () => {
  it("nenhuma consulta atravessa edições sem pedir", () => {
    expect(r.mesmaEdicao({ edicao_id: "a" }, { edicao_id: "a" })).toBe(true);
    expect(r.mesmaEdicao({ edicao_id: "a" }, { edicao_id: "b" })).toBe(false);
  });
});

describe("RN-18 — nada é apagado, tudo é arquivado", () => {
  it("encerrar muda o status, não remove", () => {
    const edicao = {
      id: "e",
      nome: "2026.2",
      inicio: null,
      fim: null,
      status: "ativa" as const,
    };
    expect(r.encerrarEdicao(edicao).status).toBe("encerrada");
    expect(r.encerrarEdicao(edicao).id).toBe("e");
  });

  it("feedback já lido não é apagado", () => {
    expect(r.podeApagarFeedback(encontro("aberto"), "m1", "m1")).toBe(true);
    expect(r.podeApagarFeedback(encontro("liberado"), "m1", "m1")).toBe(false);
  });

  it("o módulo não expõe nenhuma função de exclusão", () => {
    const exclusoes = Object.keys(r).filter((n) =>
      /^(apagar|remover|excluir|deletar)(?!.*pode)/i.test(n),
    );
    expect(exclusoes).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════

describe("frameworks — dado declarativo", () => {
  it("os eixos batem com specs/02", () => {
    expect(eixosDe("oratoria").map((e) => e.id)).toEqual([
      "mensagem",
      "fala",
      "presenca",
    ]);
    expect(eixosDe("bomba").map((e) => e.id)).toEqual(["manual", "executor"]);
    expect(eixosDe("negociacao").map((e) => e.id)).toEqual([
      "numeros",
      "leitura",
      "conducao",
    ]);
    expect(eixosDe("nenhum")).toHaveLength(0);
  });

  it("cada canal da oratória carrega a pergunta-âncora do documento", () => {
    expect(acharEixo("oratoria", "mensagem")?.perguntaAncora).toBe(
      "Isso sobreviveria à transcrição?",
    );
    expect(acharEixo("oratoria", "fala")?.perguntaAncora).toBe(
      "De olhos fechados, o que eu ouço?",
    );
    expect(acharEixo("oratoria", "presenca")?.perguntaAncora).toBe(
      "Para onde aponta a atenção do palestrante?",
    );
  });

  it("os quinze descritores da rubrica estão escritos", () => {
    let total = 0;
    for (const eixo of eixosDe("oratoria")) {
      expect(eixo.descritores).toHaveLength(5);
      total += eixo.descritores?.length ?? 0;
    }
    expect(total).toBe(15);
  });

  it("eixo de um framework não vale em outro", () => {
    expect(eixoPertenceAoFramework("oratoria", "fala")).toBe(true);
    expect(eixoPertenceAoFramework("bomba", "fala")).toBe(false);
  });

  it("as dinâmicas avisam que o desfecho não é a avaliação", () => {
    expect(FRAMEWORKS.bomba.guardaResultado).toContain("não é a avaliação");
    expect(FRAMEWORKS.negociacao.guardaResultado).toContain("condução");
  });

  it("oratória é linha; bomba e negociação são retrato", () => {
    expect(FRAMEWORKS.oratoria.forma).toBe("linha");
    expect(FRAMEWORKS.bomba.forma).toBe("retrato");
    expect(FRAMEWORKS.negociacao.forma).toBe("retrato");
  });
});

describe("RF-D3 — auxílio de calibragem", () => {
  it("com descritor escrito, mostra o descritor", () => {
    const a = auxilioDeCalibragem("oratoria", "fala", 2);
    expect(a?.tipo).toBe("descritor");
    if (a?.tipo === "descritor") {
      expect(a.descritor.titulo).toBe("Muletas dominantes");
    }
  });

  it("sem descritor, cai para 'o que observar' em vez de quebrar", () => {
    // Liderança acontece antes de os descritores da bomba existirem.
    expect(temDescritores("bomba", "manual")).toBe(false);

    const a = auxilioDeCalibragem("bomba", "manual", 3);
    expect(a?.tipo).toBe("observar");
    if (a?.tipo === "observar") {
      expect(a.itens.length).toBeGreaterThan(0);
    }
  });

  it("eixo inexistente devolve nulo, não explode", () => {
    expect(auxilioDeCalibragem("oratoria", "inventado", 3)).toBeNull();
  });
});
