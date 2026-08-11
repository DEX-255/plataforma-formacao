import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * O bloco interno não atravessa para componente de cliente.
 *
 * `RN-03` é a regra que não pode falhar, e ela tem quatro camadas antes desta:
 * a view `feedback_visivel` sem as colunas, a RLS que nega por padrão,
 * `apenasBlocoVisivel()` e a renderização no servidor (`D-02`).
 *
 * Esta é a quinta, e cobre o que nenhuma das outras cobre: **alguém, daqui a
 * dois meses, passando `nota` como propriedade para um componente `"use
 * client"` sem perceber.** Nada quebraria, nada apareceria na tela — e o dado
 * estaria no HTML enviado ao navegador, legível por qualquer um com o
 * inspetor aberto.
 *
 * O formulário do mentor é a exceção declarada: ele **precisa** editar o bloco
 * interno, e são as palavras do próprio mentor sobre alguém que ele avalia.
 */

const RAIZ = join(import.meta.dirname, "..");
const FONTE = join(RAIZ, "src");

/**
 * Onde o mentor escreve o bloco interno. Não é brecha: é a tela cuja função é
 * exatamente essa, e o participante não tem acesso a ela — `exigirMentor()` no
 * servidor e RLS no banco.
 */
const AUTORIZADOS = [
  join(FONTE, "app", "(app)", "encontros", "[id]", "feedback"),
  join(FONTE, "componentes", "ui", "SeletorDeNota.tsx"),
  join(FONTE, "lib", "rascunho.ts"),
];

/** As colunas que o participante nunca pode ver durante a formação. */
const PROIBIDAS = ["nota", "nao_observado", "observacao_interna"];

function arquivos(dir: string, ext: string[]): string[] {
  const saida: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      saida.push(...arquivos(caminho, ext));
    } else if (ext.some((e) => nome.endsWith(e))) {
      saida.push(caminho);
    }
  }
  return saida;
}

function semComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function ehComponenteDeCliente(conteudo: string): boolean {
  return /^\s*["']use client["']/m.test(conteudo);
}

function autorizado(caminho: string): boolean {
  return AUTORIZADOS.some((a) => caminho.startsWith(a));
}

describe("RN-03 — o bloco interno não vai para o navegador", () => {
  const clientes = arquivos(FONTE, [".tsx", ".ts"]).filter((c) =>
    ehComponenteDeCliente(readFileSync(c, "utf8")),
  );

  it("existe componente de cliente para o teste ter o que olhar", () => {
    // Sem isto, apagar o `"use client"` de tudo faria o teste passar vazio.
    expect(clientes.length).toBeGreaterThan(0);
  });

  it("nenhum componente de cliente não autorizado menciona o bloco interno", () => {
    const infratores: string[] = [];

    for (const caminho of clientes) {
      if (autorizado(caminho)) continue;

      const conteudo = semComentarios(readFileSync(caminho, "utf8"));
      for (const coluna of PROIBIDAS) {
        // `\b` nas duas pontas: `nota` não pode casar com `notaram` nem com
        // `anotacao`, ou o guarda vira ruído e alguém o desliga.
        if (new RegExp(`\\b${coluna}\\b`).test(conteudo)) {
          infratores.push(`${relative(RAIZ, caminho)} → ${coluna}`);
        }
      }
    }

    expect(
      infratores,
      "Bloco interno alcançável de componente de cliente. RN-03 é a regra que " +
        "não pode falhar: nota e observação interna só saem no documento final.",
    ).toEqual([]);
  });

  it("a lista da turma não carrega nota — ela conta, não avalia", () => {
    const lista = join(
      FONTE,
      "app",
      "(app)",
      "encontros",
      "[id]",
      "ListaDaTurma.tsx",
    );
    const conteudo = semComentarios(readFileSync(lista, "utf8"));

    for (const coluna of PROIBIDAS) {
      expect(new RegExp(`\\b${coluna}\\b`).test(conteudo)).toBe(false);
    }
  });

  it("os caminhos autorizados existem — exceção que aponta para o vazio é exceção esquecida", () => {
    for (const caminho of AUTORIZADOS) {
      expect(() => statSync(caminho), `não existe: ${caminho}`).not.toThrow();
    }
  });
});
