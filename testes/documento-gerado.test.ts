import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { montarHtml } from "../documento/gerar";
import type { DadosDoParticipante } from "../documento/dados";

/** `RF-H1`, `RF-H2`, `RF-H3`, `D-07` — o documento gerado. */

const RAIZ = join(import.meta.dirname, "..");

const participante: DadosDoParticipante = {
  nome: "Ana Beatriz Rocha",
  email: "ana@dex.local",
  participacaoId: "p1",
  encontros: [
    {
      id: "e0",
      numero: 1,
      tema: "Perfil Empreendedor",
      data: "2026-09-03",
      framework: "nenhum",
      presenca: "presente",
      feedbacks: [],
    },
    {
      id: "e1",
      numero: 2,
      tema: "Modelos de Negócio",
      data: "2026-09-10",
      framework: "oratoria",
      presenca: "presente",
      feedbacks: [
        {
          id: "f1",
          eixo: "fala",
          mentor: "Rafael Moura",
          situacao: "Na apresentação do canvas",
          ponto: "Muletas sonoras em quase toda transição",
          sugestao: "Grave dois minutos e conte as muletas",
          nota: 2,
          naoObservado: false,
        },
      ],
    },
    {
      id: "e2",
      numero: 3,
      tema: "Arte da Oratória",
      data: "2026-09-17",
      framework: "oratoria",
      presenca: "ausente",
      feedbacks: [
        {
          id: "f2",
          eixo: "fala",
          mentor: "Beatriz Lins",
          situacao: "Na roda",
          ponto: "Não deu para observar",
          sugestao: "Sem sugestão desta vez",
          nota: null,
          naoObservado: true,
        },
      ],
    },
    {
      id: "e3",
      numero: 4,
      tema: "Bomba em dupla",
      data: "2026-09-24",
      framework: "bomba",
      presenca: "presente",
      feedbacks: [
        {
          id: "f3",
          eixo: "manual",
          mentor: "Rafael Moura",
          situacao: "Na dinâmica",
          ponto: "Despejou o manual sem diagnosticar",
          sugestao: "Pergunte o que a pessoa está vendo antes de instruir",
          nota: null,
          naoObservado: true,
        },
      ],
    },
  ],
};

const html = montarHtml(participante, "2026.2");

describe("RF-H3 — o mesmo documento, sempre", () => {
  it("duas execuções produzem exatamente o mesmo HTML", () => {
    // Rodar de novo anos depois, a partir dos dados arquivados, tem de produzir
    // o mesmo documento. Qualquer `new Date()` ou ordem indefinida quebraria
    // isto sem ninguém mudar uma linha.
    expect(montarHtml(participante, "2026.2")).toBe(html);
  });

  it("não carrega a data de hoje", () => {
    const hoje = new Date();
    const ano = String(hoje.getFullYear());
    // A única data do documento é a dos encontros, que vem do banco.
    expect(html).not.toContain(hoje.toISOString().slice(0, 10));
    // 2026 aparece porque é a edição e a data dos encontros; o teste acima é o
    // que pega data de geração. Este só documenta o cuidado.
    expect(ano.length).toBe(4);
  });
});

describe("RF-H2 — a legenda vem antes do gráfico, no HTML entregue", () => {
  it("a seção da escala aparece antes da seção de evolução", () => {
    const escala = html.indexOf("o que estes números querem dizer");
    const evolucao = html.indexOf("Evolução em oratória");

    expect(escala, "a legenda da escala sumiu do documento").toBeGreaterThan(-1);
    expect(evolucao).toBeGreaterThan(-1);
    expect(escala).toBeLessThan(evolucao);
  });

  it("e o primeiro número da escala aparece depois da explicação", () => {
    const escala = html.indexOf("o que estes números querem dizer");
    const svg = html.indexOf("<svg");
    expect(escala).toBeLessThan(svg);
  });

  it("as palavras dos mentores vêm antes de tudo isso", () => {
    const encontros = html.indexOf("Encontro a encontro");
    const escala = html.indexOf("o que estes números querem dizer");
    expect(encontros).toBeLessThan(escala);
  });

  it("a legenda e o gráfico não se separam na paginação", () => {
    expect(html).toContain("break-after: avoid");
    expect(html).toContain("break-before: avoid");
  });
});

describe("o conteúdo — RF-H1", () => {
  it("identifica a pessoa e a edição", () => {
    expect(html).toContain("Ana Beatriz Rocha");
    expect(html).toContain("2026.2");
  });

  it("traz o feedback com autoria (RN-04)", () => {
    expect(html).toContain("Rafael Moura");
    expect(html).toContain("Grave dois minutos e conte as muletas");
  });

  it("mostra a nota — é aqui que ela deixa de ser interna", () => {
    // Na tabela de evolução, o 2 da Ana em Fala.
    expect(html).toContain("<td>2</td>");
  });

  it("RN-07 — não observado vira n/o, nunca zero", () => {
    expect(html).toContain("n/o");
    expect(html).not.toContain("<td>0</td>");
  });

  it("encontro sem avaliação lê como desenho, não como falta", () => {
    expect(html).toContain("foi de reflexão");
  });

  it("dinâmica sem rubrica aparece em texto, sem número inventado", () => {
    expect(html).toContain("Despejou o manual sem diagnosticar");
    expect(html).toContain("régua");
  });

  it("a presença entra", () => {
    expect(html).toContain("Presença");
    expect(html).toContain("ausente");
  });

  it("é peça sobre papel: fundo claro, roxo fechado", () => {
    // specs/05 — a cor segue o fundo. O app é escuro; isto é impresso.
    expect(html).toContain("#F3F0E8");
    expect(html).toContain("@page");
  });
});

describe("o documento não decide nada", () => {
  const texto = html.toLowerCase();

  it("não diz aprovado nem reprovado", () => {
    for (const palavra of ["aprovado", "reprovado", "aprovada", "reprovada"]) {
      expect(texto).not.toContain(palavra);
    }
  });

  it("diz que não é veredito", () => {
    expect(texto).toContain("não é um veredito");
  });
});

/**
 * `D-07` — a chave que ignora a RLS existe apenas em variável de ambiente de
 * servidor e é usada **só pelo gerador**. Nenhum componente de cliente, nenhuma
 * rota pública, nenhum arquivo versionado.
 */
describe("D-07 — a service_role vive num lugar só", () => {
  function arquivos(dir: string): string[] {
    const saida: string[] = [];
    for (const nome of readdirSync(dir)) {
      if (nome === "node_modules" || nome === ".next" || nome === "saida") continue;
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
      else if (/\.(ts|tsx|js|mjs)$/.test(nome)) saida.push(caminho);
    }
    return saida;
  }

  it("só `documento/dados.ts` menciona a chave de serviço", () => {
    const mencionam = [
      ...arquivos(join(RAIZ, "src")),
      ...arquivos(join(RAIZ, "documento")),
    ].filter((c) => /SERVICE_ROLE/.test(readFileSync(c, "utf8")));

    expect(mencionam.map((c) => c.replace(RAIZ, ""))).toEqual([
      "/documento/dados.ts",
    ]);
  });

  it("o gerador não é importado por nenhuma tela", () => {
    const importam = arquivos(join(RAIZ, "src")).filter((c) =>
      /from\s+["'].*documento\/(dados|gerar|cli)["']/.test(
        readFileSync(c, "utf8"),
      ),
    );

    expect(
      importam,
      "Uma tela importou o gerador. É por aí que a service_role chega ao servidor web.",
    ).toEqual([]);
  });

  it("a chave não está versionada", () => {
    const env = join(RAIZ, ".env.example");
    const conteudo = readFileSync(env, "utf8");
    // O exemplo pode citar o nome da variável, nunca um valor.
    expect(conteudo).not.toMatch(/SERVICE_ROLE_KEY\s*=\s*ey/);
  });
});
