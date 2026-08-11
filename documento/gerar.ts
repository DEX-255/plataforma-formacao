import {
  SECOES,
  LEGENDA_DA_ESCALA,
  O_QUE_ESTE_DOCUMENTO_E,
  FECHAMENTO,
  POR_QUE_SEM_NOTA_NAS_DINAMICAS,
  temEscalaNumerica,
} from "../src/dominio/documento";
import {
  seriesPorEixo,
  segmentosContinuos,
  canalDoEixo,
  mediaPorEixo,
  type NotaDeEixo,
} from "../src/dominio/cobertura";
import { acharEixo, FRAMEWORKS } from "../src/dominio/frameworks";
import { ROTULO_DE_PRESENCA } from "../src/dominio/presenca";
import type { DadosDoParticipante } from "./dados";

/**
 * O documento final, em HTML — `RF-H1`, `RF-H2`, `RF-H3`.
 *
 * **Sobre papel, não sobre tela.** O app inteiro é escuro; este documento é
 * impresso, então a paleta se inverte: fundo `papel`, texto `preto`, e o roxo
 * fechado `#8C52FF` que `specs/05` reserva justamente para fundo claro. A regra
 * é a mesma de sempre — a cor segue o fundo, não o elemento.
 *
 * A função é pura: recebe dados, devolve string. É o que permite testar
 * reprodutibilidade (`RF-H3`) sem abrir navegador nenhum.
 */

const COR = {
  papel: "#F3F0E8",
  papelAlto: "#FAF8F3",
  preto: "#14110F",
  roxo: "#8C52FF",
  neutro: "#6B6660",
  serie: ["#6B3FD4", "#2F6FA8", "#A66A18"],
} as const;

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number) as [number, number, number];
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}

// ── O gráfico ──────────────────────────────────────────────────────────────

/**
 * SVG à mão, com as cores fechadas do papel.
 *
 * A lógica é a mesma da tela — `seriesPorEixo`, `segmentosContinuos` e
 * `canalDoEixo` vêm do domínio, então a ordem dos eixos e o canal de cor de cada
 * um são idênticos aos do app. Só a paleta muda, porque o fundo mudou.
 *
 * `RN-07`: "não observado" fica **fora da escala**, numa faixa própria. Dentro
 * dela seria lido como nota — e este é o documento que a pessoa guarda.
 */
function svgDaEvolucao(notas: readonly NotaDeEixo[]): string {
  const series = seriesPorEixo("oratoria", notas);
  if (series.length === 0) return "";

  const encontros = [
    ...new Set(series.flatMap((s) => s.pontos.map((p) => p.encontro))),
  ].sort((a, b) => a - b);

  const L = 40;
  const D = 20;
  const T = 16;
  const A = 170;
  const FAIXA = 26;
  const largura = 620;
  const altura = T + A + FAIXA + 30;

  const x = (e: number) =>
    encontros.length === 1
      ? L + (largura - L - D) / 2
      : L + (encontros.indexOf(e) / (encontros.length - 1)) * (largura - L - D);
  const y = (n: number) => T + A - ((n - 1) / 4) * A;

  const grade = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<line x1="${L}" y1="${y(n)}" x2="${largura - D}" y2="${y(n)}" stroke="${COR.neutro}" stroke-opacity="0.3" stroke-width="1"/>` +
        `<text x="${L - 10}" y="${y(n) + 4}" text-anchor="end" font-size="12" fill="${COR.neutro}">${n}</text>`,
    )
    .join("");

  const rotuloFaixa = `<text x="${L - 10}" y="${T + A + FAIXA / 2 + 4}" text-anchor="end" font-size="11" fill="${COR.neutro}">n/o</text>`;

  const eixoX = encontros
    .map(
      (e) =>
        `<text x="${x(e)}" y="${altura - 8}" text-anchor="middle" font-size="12" fill="${COR.neutro}">${e}</text>`,
    )
    .join("");

  const linhas = series
    .map((serie) => {
      const cor = COR.serie[canalDoEixo("oratoria", serie.eixo)] ?? COR.serie[0];

      const segmentos = segmentosContinuos(serie.pontos)
        .map(
          (seg) =>
            `<polyline fill="none" stroke="${cor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${seg
              .map((p) => `${x(p.encontro)},${y(p.nota!)}`)
              .join(" ")}"/>`,
        )
        .join("");

      const pontos = serie.pontos
        .map((p) =>
          p.nota === null
            ? `<circle cx="${x(p.encontro)}" cy="${T + A + FAIXA / 2}" r="4.5" fill="none" stroke="${cor}" stroke-width="1.5" stroke-dasharray="2 2"/>`
            : `<circle cx="${x(p.encontro)}" cy="${y(p.nota)}" r="4.5" fill="${cor}" stroke="${COR.papelAlto}" stroke-width="2"/>`,
        )
        .join("");

      return segmentos + pontos;
    })
    .join("");

  const legenda = series
    .map((s) => {
      const cor = COR.serie[canalDoEixo("oratoria", s.eixo)] ?? COR.serie[0];
      const nome = acharEixo("oratoria", s.eixo)?.nome ?? s.eixo;
      return `<span class="chave"><span class="bola" style="background:${cor}"></span>${escapar(nome)}</span>`;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${largura} ${altura}" class="grafico" role="img"
         aria-label="Evolução por eixo. Os valores estão na tabela ao lado.">
      ${grade}${rotuloFaixa}${eixoX}${linhas}
    </svg>
    <p class="legenda">${legenda}</p>`;
}

function tabelaDaEvolucao(notas: readonly NotaDeEixo[]): string {
  const series = seriesPorEixo("oratoria", notas);
  if (series.length === 0) return "";

  const medias = mediaPorEixo(notas);
  const encontros = [
    ...new Set(series.flatMap((s) => s.pontos.map((p) => p.encontro))),
  ].sort((a, b) => a - b);

  const cabecalho = encontros.map((e) => `<th>${e}</th>`).join("");

  const corpo = series
    .map((s) => {
      const m = medias.get(s.eixo);
      const celulas = encontros
        .map((e) => {
          const p = s.pontos.find((x) => x.encontro === e);
          // RN-07 — nunca zero, nunca célula vazia sem explicação.
          return `<td>${p === undefined ? "—" : (p.nota ?? "n/o")}</td>`;
        })
        .join("");

      return `<tr><th scope="row">${escapar(
        acharEixo("oratoria", s.eixo)?.nome ?? s.eixo,
      )}</th>${celulas}<td class="media">${
        m?.media != null ? m.media.toFixed(1) : "—"
      }</td></tr>`;
    })
    .join("");

  return `
    <table class="notas">
      <thead><tr><th scope="col">Eixo</th>${cabecalho}<th scope="col">Média</th></tr></thead>
      <tbody>${corpo}</tbody>
    </table>
    <p class="nota-rodape"><strong>n/o</strong> — não observado: naquele encontro
    ninguém teve como observar aquele eixo. Não é nota baixa e não entra na média.</p>`;
}

// ── As seções ──────────────────────────────────────────────────────────────

function secaoEncontros(p: DadosDoParticipante): string {
  const blocos = p.encontros
    .map((e) => {
      const definicao = FRAMEWORKS[e.framework];
      const presenca = e.presenca
        ? `<span class="presenca">${ROTULO_DE_PRESENCA[e.presenca]}</span>`
        : "";

      /**
       * Os feedbacks saem na **ordem dos eixos do framework**, não na ordem
       * alfabética que o banco devolve.
       *
       * É a mesma regra do gráfico: a identidade do eixo manda. Mensagem antes
       * de Fala antes de Presença, em todos os encontros e em todos os
       * documentos — quem lê passa a reconhecer o modelo pela posição, que é o
       * que o agrupamento por eixo existe para ensinar.
       */
      const ordemDosEixos = definicao.eixos.map((x) => x.id);
      const emOrdem = [...e.feedbacks].sort((a, b) => {
        const ia = ordemDosEixos.indexOf(a.eixo);
        const ib = ordemDosEixos.indexOf(b.eixo);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });

      const feedbacks =
        emOrdem.length === 0
          ? `<p class="vazio">${
              definicao.eixos.length === 0
                ? "Encontro sem feedback individual — foi de reflexão, e assim foi desenhado."
                : e.presenca && e.presenca !== "presente"
                  ? "Você não esteve neste encontro."
                  : "Nenhum feedback foi registrado para você neste encontro."
            }</p>`
          : emOrdem
              .map((f) => {
                const eixo = acharEixo(e.framework, f.eixo);
                return `
                <div class="feedback">
                  <p class="eixo">${escapar(eixo?.nome ?? f.eixo)} · <span class="autor">${escapar(f.mentor)}</span></p>
                  <p class="situacao">${escapar(f.situacao)}</p>
                  <p class="ponto">${escapar(f.ponto)}</p>
                  <div class="sugestao">
                    <p class="rotulo">O que fazer a seguir</p>
                    <p>${escapar(f.sugestao)}</p>
                  </div>
                </div>`;
              })
              .join("");

      return `
        <article class="encontro">
          <header>
            <span class="numero">${String(e.numero).padStart(2, "0")}</span>
            <h3>${escapar(e.tema)}</h3>
            <span class="data">${formatarData(e.data)}</span>
            ${presenca}
          </header>
          ${feedbacks}
        </article>`;
    })
    .join("");

  return `<section class="secao"><h2>Encontro a encontro</h2>${blocos}</section>`;
}

function secaoEscala(): string {
  const niveis = LEGENDA_DA_ESCALA.niveis
    .map(
      (n) =>
        `<li><span class="nivel">${n.nivel}</span><span>${escapar(n.expectativa)}</span></li>`,
    )
    .join("");

  return `
    <section class="secao escala">
      <h2>${escapar(LEGENDA_DA_ESCALA.titulo)}</h2>
      <p class="chamada">${escapar(LEGENDA_DA_ESCALA.chamada)}</p>
      <ul class="niveis">${niveis}</ul>
      <p class="fecho">${escapar(LEGENDA_DA_ESCALA.fecho)}</p>
    </section>`;
}

function secaoEvolucao(notas: readonly NotaDeEixo[]): string {
  if (notas.length === 0) return "";
  return `
    <section class="secao evolucao">
      <h2>Evolução em oratória</h2>
      ${svgDaEvolucao(notas)}
      ${tabelaDaEvolucao(notas)}
    </section>`;
}

function secaoRetratos(p: DadosDoParticipante): string {
  const dinamicas = p.encontros.filter(
    (e) => !temEscalaNumerica(e.framework) && e.framework !== "nenhum",
  );
  if (dinamicas.length === 0) return "";

  const blocos = dinamicas
    .map(
      (e) => `
      <article class="retrato">
        <h3>${escapar(e.tema)} · ${escapar(FRAMEWORKS[e.framework].nome)}</h3>
        ${e.feedbacks
          .map(
            (f) => `
          <div class="feedback">
            <p class="eixo">${escapar(acharEixo(e.framework, f.eixo)?.nome ?? f.eixo)} · <span class="autor">${escapar(f.mentor)}</span></p>
            <p class="ponto">${escapar(f.ponto)}</p>
            <div class="sugestao"><p class="rotulo">O que fazer a seguir</p><p>${escapar(f.sugestao)}</p></div>
          </div>`,
          )
          .join("")}
      </article>`,
    )
    .join("");

  return `
    <section class="secao">
      <h2>Retratos das dinâmicas</h2>
      <p class="chamada">${escapar(POR_QUE_SEM_NOTA_NAS_DINAMICAS)}</p>
      ${blocos}
    </section>`;
}

function secaoPresenca(p: DadosDoParticipante): string {
  const linhas = p.encontros
    .map(
      (e) =>
        `<tr><th scope="row">${String(e.numero).padStart(2, "0")} · ${escapar(e.tema)}</th><td>${
          e.presenca ? ROTULO_DE_PRESENCA[e.presenca] : "—"
        }</td></tr>`,
    )
    .join("");

  return `
    <section class="secao">
      <h2>Presença</h2>
      <table class="presencas"><tbody>${linhas}</tbody></table>
    </section>`;
}

// ── O documento ────────────────────────────────────────────────────────────

export function montarHtml(
  p: DadosDoParticipante,
  edicao: string,
): string {
  const notasDeOratoria: NotaDeEixo[] = p.encontros
    .filter((e) => e.framework === "oratoria")
    .flatMap((e) =>
      e.feedbacks.map((f) => ({
        eixo: f.eixo,
        nota: f.nota,
        encontro: e.numero,
      })),
    );

  /**
   * A ordem das seções vem de `SECOES`, no domínio, e não da ordem em que estão
   * escritas aqui. `RF-H2` é condição para o documento existir: a legenda da
   * escala precede o gráfico, e uma refatoração que troque as seções de lugar
   * quebra o teste antes de quebrar a leitura de alguém.
   */
  const conteudo: Record<string, string> = {
    capa: `
      <header class="capa">
        <p class="marca">DEX · Hub de Empreendedorismo e Inovação</p>
        <h1>${escapar(p.nome)}</h1>
        <p class="edicao">Formação DEX · Edição ${escapar(edicao)}</p>
      </header>`,
    "o-que-e": `
      <section class="secao abertura">
        ${O_QUE_ESTE_DOCUMENTO_E.map((l) => `<p>${escapar(l)}</p>`).join("")}
      </section>`,
    "encontro-a-encontro": secaoEncontros(p),
    "como-ler-a-escala": notasDeOratoria.length > 0 ? secaoEscala() : "",
    evolucao: secaoEvolucao(notasDeOratoria),
    retratos: secaoRetratos(p),
    presenca: secaoPresenca(p),
    fechamento: `
      <section class="secao fechamento">
        ${FECHAMENTO.map((l) => `<p>${escapar(l)}</p>`).join("")}
      </section>`,
  };

  const corpo = SECOES.map((s) => conteudo[s] ?? "").join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapar(p.nome)} · Formação DEX ${escapar(edicao)}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }

  :root {
    --papel: ${COR.papel};
    --papel-alto: ${COR.papelAlto};
    --preto: ${COR.preto};
    --roxo: ${COR.roxo};
    --neutro: ${COR.neutro};
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: var(--papel);
    color: var(--preto);
    /* As fontes da marca vêm do build do app e não existem aqui; a pilha cai
       para as do sistema. Ver pendencias.md — baixar os arquivos para
       documento/fontes/ é o que fecha isso. */
    font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
  }

  /* Depois da regra de body de propósito: ela zera a margem, e esta precisa
     vencer. Na impressão quem dá a margem é a regra @page; na tela não existe
     página, e sem isto o texto vai de ponta a ponta do monitor — linha longa
     demais para ler, justamente na conferência que precede o envio. */
  @media screen {
    body { max-width: 190mm; margin: 0 auto; padding: 24px 20px 60px; }
  }

  h1, h2, h3 { font-family: "Bricolage Grotesque", Georgia, serif; margin: 0; }
  h1 { font-size: 30pt; letter-spacing: -0.02em; line-height: 1.05; }
  h2 { font-size: 15pt; margin-bottom: 10pt; }
  h3 { font-size: 12pt; }

  .capa { padding: 24pt 0 18pt; border-bottom: 2.5px solid var(--preto); }
  .marca { font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; color: var(--neutro); margin: 0 0 14pt; }
  .edicao { color: var(--neutro); margin: 6pt 0 0; }

  .secao { margin-top: 22pt; break-inside: auto; }
  .abertura p { margin: 0 0 8pt; max-width: 62ch; }

  .encontro { margin-top: 14pt; break-inside: avoid; }
  .encontro header { display: flex; align-items: baseline; gap: 8pt; border-bottom: 1px solid rgba(20,17,15,.15); padding-bottom: 4pt; }
  .numero { font-family: "Space Mono", ui-monospace, monospace; font-size: 9pt; color: var(--neutro); }
  .data { font-size: 9pt; color: var(--neutro); margin-left: auto; }
  .presenca { font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; color: var(--neutro); }

  .feedback { margin: 10pt 0 0; padding-left: 10pt; border-left: 2px solid rgba(140,82,255,.35); break-inside: avoid; }
  .eixo { font-size: 9pt; text-transform: uppercase; letter-spacing: .08em; color: var(--roxo); margin: 0 0 4pt; }
  .autor { color: var(--neutro); text-transform: none; letter-spacing: 0; }
  .situacao { font-size: 9.5pt; color: var(--neutro); margin: 0 0 3pt; }
  .ponto { margin: 0 0 6pt; }
  .sugestao { background: var(--papel-alto); border: 1.5px solid rgba(140,82,255,.4); border-radius: 6pt; padding: 7pt 9pt; }
  .sugestao .rotulo { font-size: 8pt; text-transform: uppercase; letter-spacing: .1em; color: var(--roxo); margin: 0 0 2pt; }
  .sugestao p { margin: 0; font-weight: 500; }
  .vazio { color: var(--neutro); margin: 8pt 0 0; }

  /* RF-H2 — a legenda e o gráfico não se separam na paginação. */
  .escala { break-after: avoid; break-inside: avoid; }
  .evolucao { break-before: avoid; break-inside: avoid; }

  .chamada { max-width: 62ch; color: var(--neutro); margin: 0 0 10pt; }
  .niveis { list-style: none; padding: 0; margin: 0 0 10pt; }
  .niveis li { display: flex; gap: 9pt; align-items: baseline; margin-bottom: 5pt; }
  .nivel { font-family: "Bricolage Grotesque", Georgia, serif; font-weight: 800; font-size: 13pt; color: var(--roxo); min-width: 16pt; }
  .fecho { max-width: 62ch; }

  .grafico { width: 100%; height: auto; margin: 6pt 0 4pt; }
  .legenda { display: flex; gap: 14pt; font-size: 9.5pt; color: var(--neutro); margin: 0 0 10pt; }
  .chave { display: inline-flex; align-items: center; gap: 5pt; }
  .bola { width: 8pt; height: 8pt; border-radius: 50%; display: inline-block; }

  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { text-align: right; padding: 4pt 6pt; border-bottom: 1px solid rgba(20,17,15,.12); }
  th[scope="row"], thead th:first-child { text-align: left; }
  .media { font-weight: 700; }
  .nota-rodape { font-size: 9pt; color: var(--neutro); max-width: 62ch; margin: 6pt 0 0; }
  .presencas th[scope="row"] { font-weight: 400; }

  .retrato { margin-top: 12pt; break-inside: avoid; }
  .fechamento { border-top: 2.5px solid var(--preto); padding-top: 12pt; }
  .fechamento p { margin: 0 0 6pt; max-width: 62ch; }
</style>
</head>
<body>
${corpo}
</body>
</html>`;
}
