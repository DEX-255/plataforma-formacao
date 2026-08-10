/**
 * Símbolo da DEX.
 *
 * Redesenho vetorial do original, não reinterpretação: a geometria foi medida
 * pixel a pixel de `marca/logo/dex-simbolo-fundo-preto.png` e reexpressa como
 * polígonos exatos. Sobreposição de 94% com o original, e o que sobra é
 * antialiasing de sub-pixel — nenhuma diferença de forma.
 *
 * O arquivo antigo (`dex-simbolo-vetorizado.svg`) era um traço automático do
 * VTracer: 17 KB, três roxos diferentes e nenhum deles o da marca, sem
 * `viewBox` e com curvas onde o desenho é reto.
 *
 * A construção que o original carrega, e que este desenho preserva:
 *   · hexágono de topo pontudo, raio 112, traço de 28
 *   · seis peças, todas separadas por folgas de exatamente 20
 *   · os cortes da moldura são biseis a 30°, paralelos às arestas vizinhas
 *   · cubo isométrico ao centro, três faces, mesmas folgas
 *
 * `currentColor` de propósito: o símbolo recolore por contexto. Roxo sobre
 * fundo escuro, papel dentro de preenchimento, preto sobre papel.
 */

type Props = {
  /** Lado em pixels. O quadro é quadrado; o símbolo ocupa a altura inteira. */
  tamanho?: number;
  className?: string;
  /**
   * Deixe vazio quando o nome "DEX" estiver escrito ao lado — senão o leitor
   * de tela anuncia a marca duas vezes.
   */
  titulo?: string;
};

export function Simbolo({ tamanho = 32, className = "", titulo }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 224 224"
      fill="currentColor"
      className={className}
      role={titulo ? "img" : "presentation"}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      {titulo && <title>{titulo}</title>}

      {/* moldura: chevron superior */}
      <path d="M23.5 51.5 112 0l88.5 51.5-28 16L112 32 51.5 67.5Z" />

      {/* moldura: lateral esquerda e diagonal inferior esquerda */}
      <path d="M15 69.5V168l87 56v-32l-59.5-40V86Z" />

      {/* moldura: lateral direita e diagonal inferior direita */}
      <path d="M209 69.5V168l-87 56v-32l59.5-40V86Z" />

      {/* cubo: face superior esquerda */}
      <path d="M101.5 61.5 61.5 84.5v48l40-23Z" />

      {/* cubo: face superior direita */}
      <path d="M122.5 61.5l40 23v48l-40-23Z" />

      {/* cubo: face inferior */}
      <path d="M112 126.5l40.5 23L112 173.5 71.5 149.5Z" />
    </svg>
  );
}
