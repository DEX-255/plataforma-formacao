import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  estadoDaCaixa,
  mensagensParaLeitura,
  COMO_O_ANONIMATO_FUNCIONA,
  AVISO_SEM_RECUPERAR,
  NAO_E_CANAL_DE_CONVERSA,
} from "@/dominio/caixa";
import type { MensagemAnonima } from "@/dominio/tipos";

/** `RF-F1` e `RF-F2` — a caixa anônima. */

const msg = (id: string, ordem: number): MensagemAnonima => ({
  id,
  encontro_id: "e1",
  texto: `texto ${id}`,
  ordem_aleatoria: ordem,
});

describe("estados da caixa", () => {
  it("aberta quando o encontro está aberto e a pessoa não enviou", () => {
    expect(estadoDaCaixa({ status: "aberto" }, false)).toEqual({ tipo: "aberta" });
  });

  it("já enviei — RN-09, uma por encontro", () => {
    expect(estadoDaCaixa({ status: "aberto" }, true)).toEqual({ tipo: "ja-enviei" });
  });

  it("fecha na liberação, mesmo para quem não enviou", () => {
    expect(estadoDaCaixa({ status: "liberado" }, false)).toEqual({
      tipo: "fechada",
      motivo: "liberado",
    });
  });

  it("a liberação fecha inclusive para quem já tinha enviado", () => {
    expect(estadoDaCaixa({ status: "liberado" }, true).tipo).toBe("fechada");
  });

  it("rascunho ainda não abriu", () => {
    expect(estadoDaCaixa({ status: "rascunho" }, false)).toEqual({
      tipo: "fechada",
      motivo: "rascunho",
    });
  });
});

describe("RN-10 — ordem embaralhada, sempre a mesma", () => {
  const mensagens = [msg("c", 0.9), msg("a", 0.1), msg("b", 0.5)];

  it("ordena por ordem_aleatoria, não por chegada", () => {
    expect(mensagensParaLeitura(mensagens).map((m) => m.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("a ordem é fixa entre leituras — o mentor não vê a lista dançar", () => {
    const uma = mensagensParaLeitura(mensagens).map((m) => m.id);
    const outra = mensagensParaLeitura([...mensagens].reverse()).map((m) => m.id);
    expect(uma).toEqual(outra);
  });

  it("lista vazia não quebra", () => {
    expect(mensagensParaLeitura([])).toEqual([]);
  });
});

describe("RF-F1 — a tela explica COMO, não só promete", () => {
  const texto = COMO_O_ANONIMATO_FUNCIONA.join(" ").toLowerCase();

  it("explica que não existe a coluna, não que 'é seguro'", () => {
    expect(texto).toContain("coluna");
  });

  it("explica a marca separada do texto (RN-09)", () => {
    expect(texto).toContain("separado");
  });

  it("explica o embaralhamento (RN-10)", () => {
    expect(texto).toContain("embaralhad");
  });

  it("afirma que nem com acesso ao banco dá para refazer o par", () => {
    expect(texto).toContain("banco");
  });

  it("não se apoia em pedir confiança", () => {
    // "Confie em nós" é o que qualquer sistema diria, inclusive um que mente.
    for (const vazio of ["confie", "prometemos", "garantimos que"]) {
      expect(texto, `não convence: "${vazio}"`).not.toContain(vazio);
    }
  });

  it("avisa que nem o autor recupera o texto — e diz por quê", () => {
    expect(AVISO_SEM_RECUPERAR.toLowerCase()).toContain("vínculo");
  });

  it("diz que não é canal de conversa", () => {
    const t = NAO_E_CANAL_DE_CONVERSA.toLowerCase();
    expect(t).toContain("responder");
    expect(t).toContain("mão única");
  });
});

/**
 * O work item pede que o vazamento seja procurado **fora do esquema**. Um dos
 * lugares é o log: uma linha que registre o corpo da requisição junto do
 * usuário autenticado destrói o anonimato sem nenhum erro de SQL.
 */
describe("nada no caminho da mensagem registra o que foi escrito", () => {
  const RAIZ = join(import.meta.dirname, "..");
  const CAMINHO = join(RAIZ, "src", "app", "(app)", "caixa");

  function arquivos(dir: string): string[] {
    const saida: string[] = [];
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho));
      else if (/\.tsx?$/.test(nome)) saida.push(caminho);
    }
    return saida;
  }

  it("nenhum console no caminho da caixa", () => {
    const infratores = arquivos(CAMINHO).filter((c) =>
      /\bconsole\s*\./.test(readFileSync(c, "utf8")),
    );

    expect(
      infratores,
      "Um console no caminho da mensagem pode acabar num log de servidor ao lado do usuário autenticado.",
    ).toEqual([]);
  });

  it("a ação não devolve o texto nem o id da mensagem", () => {
    const acao = readFileSync(join(CAMINHO, "[encontro]", "acoes.ts"), "utf8");

    // O tipo de retorno é só ok/erro. Devolver o id criaria no cliente
    // exatamente o vínculo que o esquema evita.
    expect(acao).toMatch(/ResultadoDoEnvio\s*=\s*\{\s*ok: boolean;\s*erro\?: string;\s*\}/);
    expect(acao).not.toMatch(/return\s*\{[^}]*texto/);
  });

  it("o erro devolvido ao cliente não ecoa o texto", () => {
    const acao = readFileSync(join(CAMINHO, "[encontro]", "acoes.ts"), "utf8");
    // Nenhuma interpolação de `texto` dentro de uma mensagem de erro.
    expect(acao).not.toMatch(/erro:\s*[`"'][^`"']*\$\{\s*texto/);
  });
});
