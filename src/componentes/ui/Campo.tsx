import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

/**
 * Campo — specs/05, seção Componentes.
 *
 * Três coisas não são negociáveis aqui:
 *
 * 1. **Rótulo sempre.** Placeholder não é rótulo: some quando a pessoa digita,
 *    e leitor de tela não anuncia de forma confiável (specs/07).
 * 2. **Nunca abaixo de 16px.** Abaixo disso o iOS dá zoom sozinho ao focar, e
 *    o mentor perde o contexto da tela no meio do preenchimento.
 * 3. **Erro é texto, não só borda vermelha.** Estado nunca é comunicado só por
 *    cor, e o erro é ligado ao campo por `aria-describedby`.
 */

const campoBase = [
  "w-full px-4 py-3",
  "font-sans text-corpo",
  "bg-superficie-alta text-papel",
  "rounded-campo border-2 border-borda",
  "placeholder:text-neutro",
  "transition-[border-color,box-shadow] duration-150 ease-saida",
  "focus:border-roxo focus:shadow-foco focus:outline-none",
  "disabled:opacity-50",
].join(" ");

type Comuns = {
  rotulo: string;
  auxilio?: ReactNode;
  erro?: string;
  id: string;
};

function Envolucro({
  rotulo,
  auxilio,
  erro,
  id,
  children,
}: Comuns & { children: ReactNode }) {
  const idAuxilio = auxilio ? `${id}-auxilio` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono font-bold text-rotulo uppercase text-papel"
      >
        {rotulo}
      </label>

      {auxilio && (
        <p id={idAuxilio} className="text-secundario text-neutro">
          {auxilio}
        </p>
      )}

      {children}

      {erro && (
        <p id={idErro} role="alert" className="text-secundario text-erro-claro">
          {erro}
        </p>
      )}
    </div>
  );
}

type PropsCampo = Comuns & InputHTMLAttributes<HTMLInputElement>;

export function Campo({
  rotulo,
  auxilio,
  erro,
  id,
  className = "",
  ...resto
}: PropsCampo) {
  return (
    <Envolucro rotulo={rotulo} auxilio={auxilio} erro={erro} id={id}>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={
          [auxilio ? `${id}-auxilio` : null, erro ? `${id}-erro` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${campoBase} ${className}`}
        {...resto}
      />
    </Envolucro>
  );
}

type PropsSelecao = Comuns & SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Seleção — specs/05, seção Componentes.
 *
 * `<select>` nativo por dentro, de propósito. No celular ele abre a roda do
 * sistema: alvo grande, rolagem com inércia, leitor de tela funcionando sem
 * nada da nossa parte. Uma lista customizada trocaria tudo isso por aparência.
 *
 * `appearance-none` some com a seta do sistema, então ela é redesenhada aqui —
 * sem isso o campo fica sem indicação de que abre.
 */
export function Selecao({
  rotulo,
  auxilio,
  erro,
  id,
  className = "",
  children,
  ...resto
}: PropsSelecao) {
  return (
    <Envolucro rotulo={rotulo} auxilio={auxilio} erro={erro} id={id}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={erro ? true : undefined}
          aria-describedby={
            [auxilio ? `${id}-auxilio` : null, erro ? `${id}-erro` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={`${campoBase} min-h-toque appearance-none pr-12 ${className}`}
          {...resto}
        >
          {children}
        </select>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-neutro"
        >
          <path
            d="m7 10 5 5 5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Envolucro>
  );
}

type PropsArea = Comuns & TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Situação, ponto e sugestão são áreas de texto — é onde o mentor escreve. */
export function CampoTexto({
  rotulo,
  auxilio,
  erro,
  id,
  rows = 4,
  className = "",
  ...resto
}: PropsArea) {
  return (
    <Envolucro rotulo={rotulo} auxilio={auxilio} erro={erro} id={id}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={erro ? true : undefined}
        aria-describedby={
          [auxilio ? `${id}-auxilio` : null, erro ? `${id}-erro` : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`${campoBase} resize-y ${className}`}
        {...resto}
      />
    </Envolucro>
  );
}
