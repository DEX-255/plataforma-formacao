import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variante = "primario" | "secundario";

/**
 * Botão — specs/05, seção Componentes.
 *
 * O afundar é a única animação com personalidade do produto: no hover translada
 * 2px e a sombra encolhe, no active translada 6px e a sombra some. O botão
 * afunda de verdade. É o gesto que carrega o lado lúdico da direção 3e.
 *
 * O texto dentro de preenchimento roxo é `papel` e nunca menor que 16px bold —
 * `#8C52FF` dá 3,87:1 contra `--papel`, que reprova para texto pequeno.
 */

const base = [
  "inline-flex items-center justify-center gap-2",
  "min-h-toque px-6 py-3",
  "font-sans font-bold text-corpo",
  "rounded-pilula borda-dura border-preto",
  "transition-[transform,box-shadow] duration-150 ease-saida",
  "disabled:opacity-50 disabled:pointer-events-none",
  "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-hover",
  "active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo",
].join(" ");

const variantes: Record<Variante, string> = {
  primario: "bg-roxo text-papel shadow-botao",
  secundario: "bg-papel text-preto shadow-botao",
};

type PropsBotao = {
  variante?: Variante;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Botao({
  variante = "primario",
  className = "",
  children,
  type = "button",
  ...resto
}: PropsBotao) {
  return (
    <button
      type={type}
      className={`${base} ${variantes[variante]} ${className}`}
      {...resto}
    >
      {children}
    </button>
  );
}

type PropsBotaoLink = {
  variante?: Variante;
  children: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

/** Mesma aparência, semântica de link. Navegação nunca deve ser um `button`. */
export function BotaoLink({
  variante = "primario",
  className = "",
  children,
  ...resto
}: PropsBotaoLink) {
  return (
    <a className={`${base} ${variantes[variante]} ${className}`} {...resto}>
      {children}
    </a>
  );
}
