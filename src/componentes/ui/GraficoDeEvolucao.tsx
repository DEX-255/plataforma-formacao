import {
  segmentosContinuos,
  canalDoEixo,
  type SerieDeEixo,
} from "@/dominio/cobertura";
import { acharEixo, type Framework } from "@/dominio/frameworks";

/**
 * Evolução por eixo — `RF-G2`.
 *
 * SVG à mão, sem biblioteca (`specs/06`): três linhas, até cinco pontos por
 * canal. Uma biblioteca de gráficos custaria mais KB que todo o resto da rota
 * para desenhar dezoito pontos.
 *
 * **`RN-07` é o que decide se este gráfico mente.** Um encontro em que o mentor
 * não teve como observar não vira ponto baixo: vira **buraco marcado**, e a
 * linha se parte ali. Ligar por cima desenharia uma evolução que ninguém
 * observou — e este gráfico vai para o documento final da pessoa, que o leria
 * achando que piorou.
 *
 * Sem interação: é componente de servidor, entra no documento final impresso, e
 * `RN-16` já explica a escala em texto. A identidade de cada eixo é dada por
 * legenda **e** rótulo direto, nunca só por cor.
 */

const L = 34; // margem esquerda, para os rótulos da escala
const D = 16; // margem direita
const T = 12;
const A = 150; // altura da área de desenho
/**
 * Faixa própria para os "não observado", **fora da escala 1–5**.
 *
 * A primeira versão desenhava o anel na altura de 3, no meio da escala, e ao
 * ver rodando ficou claro que ele lê como nota 3 — e colide com pontos reais
 * que estejam ali. Um marcador dentro da escala é um valor, por mais tracejado
 * que seja; `RN-07` diz justamente que "não observado" **não é valor**.
 *
 * Abaixo do 1, separado, ele não pode ser lido como número nenhum.
 */
const FAIXA_NO = 22;
const B = 28 + FAIXA_NO; // margem inferior: faixa do n/o + números dos encontros

/** As três cores da série, na ordem fixa dos eixos do framework. */
const CORES = [
  "var(--color-serie-1)",
  "var(--color-serie-2)",
  "var(--color-serie-3)",
];

export function GraficoDeEvolucao({
  framework,
  series,
  largura = 320,
}: {
  framework: Framework;
  series: readonly SerieDeEixo[];
  largura?: number;
}) {
  const encontros = [
    ...new Set(series.flatMap((s) => s.pontos.map((p) => p.encontro))),
  ].sort((a, b) => a - b);

  if (encontros.length === 0 || series.length === 0) return null;

  const alturaTotal = A + T + B;
  const x = (encontro: number) => {
    const i = encontros.indexOf(encontro);
    if (encontros.length === 1) return L + (largura - L - D) / 2;
    return L + (i / (encontros.length - 1)) * (largura - L - D);
  };
  // A escala é 1–5 e é fixa: começar no menor valor observado faria uma
  // diferença de meio ponto parecer um salto.
  const y = (nota: number) => T + A - ((nota - 1) / 4) * A;

  return (
    <figure className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${largura} ${alturaTotal}`}
        className="w-full"
        role="img"
        aria-label={`Evolução por eixo ao longo de ${encontros.length} ${encontros.length === 1 ? "encontro" : "encontros"}. Os valores exatos estão na tabela abaixo.`}
      >
        {/* Grade recessiva: as cinco linhas da escala. */}
        {[1, 2, 3, 4, 5].map((n) => (
          <g key={n}>
            <line
              x1={L}
              y1={y(n)}
              x2={largura - D}
              y2={y(n)}
              stroke="currentColor"
              strokeWidth={1}
              className="text-neutro/25"
            />
            <text
              x={L - 8}
              y={y(n) + 4}
              textAnchor="end"
              className="fill-current text-neutro"
              style={{ fontSize: 11 }}
            >
              {n}
            </text>
          </g>
        ))}

        {/* O rótulo da faixa de fora da escala. */}
        <text
          x={L - 8}
          y={T + A + FAIXA_NO / 2 + 4}
          textAnchor="end"
          className="fill-current text-neutro"
          style={{ fontSize: 10 }}
        >
          n/o
        </text>

        {/* Números dos encontros. */}
        {encontros.map((e) => (
          <text
            key={e}
            x={x(e)}
            y={alturaTotal - 8}
            textAnchor="middle"
            className="fill-current text-neutro"
            style={{ fontSize: 11 }}
          >
            {e}
          </text>
        ))}

        {series.map((serie) => {
          const cor = CORES[canalDoEixo(framework, serie.eixo)] ?? CORES[0];
          const segmentos = segmentosContinuos(serie.pontos);

          return (
            <g key={serie.eixo}>
              {segmentos.map((seg, j) => (
                <polyline
                  key={j}
                  fill="none"
                  stroke={cor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={seg
                    .map((p) => `${x(p.encontro)},${y(p.nota!)}`)
                    .join(" ")}
                />
              ))}

              {serie.pontos.map((p) =>
                p.nota === null ? (
                  /* RN-07 — o buraco é desenhado, não omitido nem zerado, e
                     mora **fora da escala**: dentro dela seria lido como nota. */
                  <circle
                    key={`vazio-${p.encontro}`}
                    cx={x(p.encontro)}
                    cy={T + A + FAIXA_NO / 2}
                    r={4}
                    fill="none"
                    stroke={cor}
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                  />
                ) : (
                  <circle
                    key={p.encontro}
                    cx={x(p.encontro)}
                    cy={y(p.nota)}
                    r={4}
                    fill={cor}
                    stroke="var(--color-superficie)"
                    strokeWidth={2}
                  />
                ),
              )}
            </g>
          );
        })}
      </svg>

      {/* Legenda: identidade nunca só por cor. */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {series.map((serie) => (
          <li
            key={serie.eixo}
            className="flex items-center gap-2 text-secundario text-neutro"
          >
            <span
              aria-hidden
              className="size-3 rounded-pilula"
              style={{ backgroundColor: CORES[canalDoEixo(framework, serie.eixo)] ?? CORES[0] }}
            />
            {acharEixo(framework, serie.eixo)?.nome ?? serie.eixo}
          </li>
        ))}
      </ul>

      <figcaption className="text-secundario text-neutro">
        A faixa <strong className="text-papel">n/o</strong>, abaixo da escala,
        marca encontro em que aquele eixo não foi observado. Fica fora do 1–5 de
        propósito: não é nota baixa, é ausência de observação — e a linha se
        parte ali em vez de atravessar por cima.
      </figcaption>
    </figure>
  );
}
