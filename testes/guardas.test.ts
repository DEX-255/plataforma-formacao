import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Guardas do design system.
 *
 * specs/05 escreveu a regra do roxo e specs/07 a repetiu. Nenhum documento
 * impede alguém de escrever `text-roxo` num rótulo de 11px daqui a dois meses,
 * quando esta conversa já tiver sido esquecida. Estes testes impedem.
 */

const RAIZ = join(import.meta.dirname, "..");
const FONTE = join(RAIZ, "src");
const TOKENS = join(FONTE, "app", "globals.css");

/**
 * Os dois únicos arquivos autorizados a conter cor literal.
 * `globals.css` é a fonte; `cores-literais.ts` é a cópia mínima exigida pelas
 * APIs que não aceitam variável CSS — e o teste abaixo prova que ela não
 * divergiu da fonte.
 */
const LITERAIS = join(FONTE, "app", "cores-literais.ts");
const AUTORIZADOS = new Set([TOKENS, LITERAIS]);

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

/** Hex mencionado em comentário é documentação, não estilo. */
function semComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

describe("cor só vem de token", () => {
  it("nenhum hexadecimal fora de globals.css", () => {
    const infratores: string[] = [];

    for (const caminho of arquivos(FONTE, [".ts", ".tsx", ".css"])) {
      if (AUTORIZADOS.has(caminho)) continue;

      const conteudo = semComentarios(readFileSync(caminho, "utf8"));
      const achados = conteudo.match(/#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g);

      if (achados) {
        infratores.push(`${relative(RAIZ, caminho)}: ${[...new Set(achados)].join(", ")}`);
      }
    }

    expect(
      infratores,
      "Cor literal fora dos tokens. O design system deixa de valer no momento em que " +
        "uma tela inventa a própria cor — use um token de src/app/globals.css.",
    ).toEqual([]);
  });
});

describe("a cópia literal não pode divergir da fonte", () => {
  it("cada cor de cores-literais.ts bate com globals.css", async () => {
    const { CORES_LITERAIS } = await import("@/app/cores-literais");
    const css = readFileSync(TOKENS, "utf8");

    for (const [token, valor] of Object.entries(CORES_LITERAIS)) {
      const achado = css.match(new RegExp(`${token}:\\s*([^;]+);`));

      expect(achado, `${token} não existe em globals.css`).not.toBeNull();
      expect(
        achado?.[1]?.trim().toLowerCase(),
        `${token} divergiu: globals.css e cores-literais.ts discordam`,
      ).toBe(valor.toLowerCase());
    }
  });
});

describe("a regra do roxo", () => {
  /**
   * `--roxo` (#8C52FF) dá 4,27:1 sobre `--preto` e 3,87:1 sobre `--papel`:
   * reprova para texto pequeno em qualquer fundo da paleta.
   *
   * WCAG considera "texto grande" a partir de 24px, ou 18,66px em bold. Da
   * escala de specs/05, só dois papéis alcançam isso:
   *   --text-display      clamp(88px, 22vw, 300px)
   *   --text-titulo-tela  clamp(28px, 5vw, 44px)
   *
   * `text-titulo-secao` (22px, peso 600) NÃO alcança — fica abaixo dos 24px e
   * o peso 600 não conta como bold. É por isso que ele não está na lista.
   */
  const TAMANHOS_PERMITIDOS = ["text-display", "text-titulo-tela"];

  it("text-roxo só aparece junto de tipografia grande", () => {
    const infratores: string[] = [];

    for (const caminho of arquivos(FONTE, [".ts", ".tsx"])) {
      const conteudo = semComentarios(readFileSync(caminho, "utf8"));

      // Cada atributo de classe é avaliado inteiro: o tamanho precisa estar
      // no mesmo elemento que a cor.
      for (const [, classes] of conteudo.matchAll(
        /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{\[([^\]]*)\])/g,
      )) {
        const alvo = classes ?? "";
        const usaRoxo = /\btext-roxo\b(?!-)/.test(alvo);
        if (!usaRoxo) continue;

        const temTamanho = TAMANHOS_PERMITIDOS.some((t) => alvo.includes(t));
        if (!temTamanho) {
          infratores.push(`${relative(RAIZ, caminho)}: "${alvo.trim()}"`);
        }
      }
    }

    expect(
      infratores,
      "text-roxo em tipografia que não é grande. Sobre fundo escuro use " +
        "text-roxo-claro (7,20:1); sobre papel use text-preto.",
    ).toEqual([]);
  });

  it("existe --color-roxo-claro para texto pequeno", () => {
    const css = readFileSync(TOKENS, "utf8");
    expect(css).toContain("--color-roxo-claro");
  });

  it("existe --color-erro-claro, porque --erro reprova sobre o fundo escuro", () => {
    const css = readFileSync(TOKENS, "utf8");
    expect(css).toContain("--color-erro-claro");
  });
});

describe("os tokens de specs/05 existem", () => {
  const ESPERADOS = [
    // base
    "--color-roxo",
    "--color-roxo-claro",
    "--color-preto",
    "--color-papel",
    "--color-papel-alto",
    // semânticos
    "--color-sucesso",
    "--color-atencao",
    "--color-erro",
    "--color-erro-claro",
    "--color-neutro",
    // superfícies
    "--color-fundo",
    "--color-superficie",
    "--color-superficie-alta",
    "--color-borda",
    "--color-borda-forte",
    // tipografia
    "--font-display",
    "--font-sans",
    "--font-mono",
    "--text-display",
    "--text-titulo-tela",
    "--text-titulo-secao",
    "--text-corpo",
    "--text-corpo-destaque",
    "--text-secundario",
    "--text-rotulo",
    "--text-kicker",
    // forma
    "--radius-campo",
    "--radius-cartao",
    "--radius-pilula",
    "--shadow-solida",
    "--shadow-botao",
    // toque
    "--size-toque",
    "--size-toque-lista",
  ];

  it.each(ESPERADOS)("%s está definido", (token) => {
    const css = readFileSync(TOKENS, "utf8");
    expect(css).toContain(`${token}:`);
  });
});

describe("os utilitários nomeados existem de verdade", () => {
  /**
   * Escrever `min-h-toque` no `className` não basta: o namespace `--size-*` do
   * Tailwind 4 alimenta `size-*`, `w-*` e `h-*`, mas **não** `min-h-*`. Sem um
   * `@utility` declarado, a classe não gera CSS e a altura mínima simplesmente
   * não existe — foi o que aconteceu, e os botões pareciam certos só pelo
   * padding.
   *
   * Este teste existe porque o teste de componente (`toHaveClass`) passava
   * enquanto a garantia não valia. Classe presente não é regra aplicada.
   */
  /**
   * As três cores da série do gráfico de evolução.
   *
   * Não foram escolhidas a olho: passaram os seis critérios do validador de
   * paleta contra a superfície do app. Renomear um token sem mexer no
   * componente deixaria a linha sem cor e o gráfico ilegível — e o gráfico vai
   * para o documento final da pessoa.
   */
  it.each(["--color-serie-1", "--color-serie-2", "--color-serie-3"])(
    "o token %s existe",
    (token) => {
      const css = readFileSync(TOKENS, "utf8");
      expect(css).toContain(`${token}:`);
    },
  );

  const UTILITARIOS = [
    "min-h-toque",
    "min-h-toque-lista",
    "size-toque",
    "borda-dura",
    "icone-roxo",
    "grao",
    "halftone",
  ];

  it.each(UTILITARIOS)("@utility %s está declarado", (nome) => {
    const css = readFileSync(TOKENS, "utf8");
    expect(css).toMatch(new RegExp(`@utility\\s+${nome}\\s*\\{`));
  });

  it("toda classe de alvo de toque usada no código tem utilitário correspondente", () => {
    const css = readFileSync(TOKENS, "utf8");
    const usadas = new Set<string>();

    // `size-toque` entra na varredura junto de `min-h-toque`: é a mesma
    // armadilha com outro nome, e o guarda que só olhasse um deixaria o
    // seletor de nota com alvos de tamanho nenhum.
    for (const caminho of arquivos(FONTE, [".ts", ".tsx"])) {
      const conteudo = semComentarios(readFileSync(caminho, "utf8"));
      for (const [, nome] of conteudo.matchAll(
        /\b((?:min-h-toque|size-toque)[\w-]*)/g,
      )) {
        if (nome) usadas.add(nome);
      }
    }

    const semDeclaracao = [...usadas].filter(
      (n) => !new RegExp(`@utility\\s+${n}\\s*\\{`).test(css),
    );

    expect(
      semDeclaracao,
      "Classe de alvo de toque usada sem @utility: ela não gera CSS nenhum.",
    ).toEqual([]);
  });
});

describe("sem gradiente", () => {
  it("nenhum linear-gradient — é princípio declarado da marca", () => {
    const infratores: string[] = [];

    for (const caminho of arquivos(FONTE, [".ts", ".tsx", ".css"])) {
      const conteudo = semComentarios(readFileSync(caminho, "utf8"));
      if (/linear-gradient|bg-gradient-/.test(conteudo)) {
        infratores.push(relative(RAIZ, caminho));
      }
    }

    expect(
      infratores,
      "Profundidade vem de deslocamento e borda, não de blur nem de gradiente.",
    ).toEqual([]);
  });
});
