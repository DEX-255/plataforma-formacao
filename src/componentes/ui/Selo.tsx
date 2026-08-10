import type { ReactNode } from "react";

/**
 * Selo — specs/05, seção Componentes.
 *
 * Pílula roxa rotacionada, Space Mono 700, sombra sólida de 4px.
 * **Usado com moderação: um por tela.** Um selo chama atenção; três selos
 * competem entre si e nenhum chama.
 *
 * O texto é `papel` sobre roxo e nunca menor que 16px — a regra do roxo vale
 * aqui como em qualquer lugar, e `--rotulo` (11px) reprovaria.
 */

type Props = {
  children: ReactNode;
  /** Rotação em graus. specs/05 pede entre -7 e 6. */
  rotacao?: number;
  className?: string;
};

export function Selo({ children, rotacao = -7, className = "" }: Props) {
  const grau = Math.min(6, Math.max(-7, rotacao));

  return (
    <span
      style={{ rotate: `${grau}deg` }}
      className={[
        "inline-flex items-center",
        "px-4 py-2",
        "bg-roxo text-papel",
        "font-mono font-bold text-corpo uppercase tracking-[0.14em]",
        "rounded-pilula borda-dura border-preto shadow-selo",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
