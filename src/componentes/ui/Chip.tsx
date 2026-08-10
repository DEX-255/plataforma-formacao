import type { ReactNode } from "react";

/**
 * Chip — specs/05, seção Componentes.
 *
 * Pílula com rótulo. Vira o chip de eixo (Mensagem, Fala, Presença) e o
 * marcador de estado do encontro (rascunho, aberto, liberado).
 *
 * **O rótulo é obrigatório e a cor é reforço, nunca o recado.** Um encontro
 * "liberado" precisa dizer *liberado*, e não só ficar verde — specs/05 e a
 * seção de acessibilidade de specs/07. Daí o texto ser `children` e não uma
 * prop opcional: não existe chip sem palavra.
 *
 * Os tons usam as variantes claras sobre o fundo escuro do app. Texto de 11px
 * em `--erro` daria 2,88:1 e seria ilegível.
 */

type Tom = "roxo" | "sucesso" | "atencao" | "erro" | "neutro";

const tons: Record<Tom, string> = {
  roxo: "bg-roxo/15 text-roxo-claro border-roxo/40",
  sucesso: "bg-sucesso/15 text-sucesso border-sucesso/40",
  atencao: "bg-atencao/15 text-atencao border-atencao/40",
  erro: "bg-erro-claro/15 text-erro-claro border-erro-claro/40",
  neutro: "bg-neutro/15 text-neutro border-neutro/40",
};

type Props = {
  children: ReactNode;
  tom?: Tom;
  className?: string;
};

export function Chip({ children, tom = "neutro", className = "" }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center",
        "px-3 py-1",
        "font-mono font-bold text-rotulo uppercase",
        "rounded-pilula border",
        tons[tom],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
