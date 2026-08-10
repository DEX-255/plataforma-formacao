import type { HTMLAttributes, ReactNode } from "react";

/**
 * Cartão — specs/05, seção Componentes.
 *
 * Duas formas, e a escolha entre elas é sobre densidade:
 *
 * - `destaque`: borda dura e sombra sólida de 10px. Para peça isolada — o card
 *   do login, um aviso, uma confirmação.
 * - `denso`: borda fina e sem sombra. Para conteúdo que se repete em lista —
 *   a turma, a trajetória, os feedbacks de um encontro. Sombra sólida repetida
 *   quarenta vezes numa tela vira ruído e cansa a leitura.
 */

type Forma = "destaque" | "denso";

const formas: Record<Forma, string> = {
  destaque: "borda-dura border-preto shadow-solida bg-superficie",
  denso: "border border-borda bg-superficie",
};

type Props = {
  forma?: Forma;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Cartao({
  forma = "denso",
  className = "",
  children,
  ...resto
}: Props) {
  return (
    <div
      className={`rounded-cartao p-6 ${formas[forma]} ${className}`}
      {...resto}
    >
      {children}
    </div>
  );
}
