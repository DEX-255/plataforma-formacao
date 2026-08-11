"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Simbolo } from "@/componentes/marca/Simbolo";

/**
 * Navegação do mentor — `specs/04`, seção *Navegação*.
 *
 * Duas formas do mesmo conjunto de destinos, e um só lugar que os define: uma
 * lista que diverge entre desktop e celular vira dois produtos diferentes.
 *
 * `specs/04` prevê Encontros, Turma, Membros e Encerramento. Só entram aqui os
 * que existem — navegação apontando para 404 é pior que navegação nenhuma, e
 * uma tela inexistente parece defeito, não obra em andamento. Cada item chega
 * junto com o work item que o constrói.
 *
 * No celular a sidebar vira barra inferior (`specs/04:136`). Esse é o
 * dispositivo principal do mentor: ele registra em pé, com o celular, minutos
 * depois da dinâmica. Barra lateral fixa comeria a largura da lista de nomes,
 * que é o que ele veio ver.
 *
 * Componente de cliente porque marcar o item ativo exige `usePathname`, e ler
 * a URL no servidor não é suportado. Nada sensível atravessa: destinos fixos e
 * o nome de quem já está logado. `D-02` trata de nota e observação interna, e
 * nenhuma das duas passa por aqui.
 */

type Destino = {
  href: string;
  rotulo: string;
  grupo: "FORMAÇÃO" | "GESTÃO";
  /** Só nos destinos que cabem na barra inferior do celular. */
  noCelular: boolean;
  icone: React.ReactNode;
};

const IconeEncontros = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconeMembros = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
    <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M17 11.5a3 3 0 1 0-1.5-5.6M18 20c0-2.2-.8-3.7-2-4.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const IconeTurma = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-5">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const DESTINOS: Destino[] = [
  {
    href: "/encontros",
    rotulo: "Encontros",
    grupo: "FORMAÇÃO",
    noCelular: true,
    icone: IconeEncontros,
  },
  {
    href: "/turma",
    rotulo: "Turma",
    grupo: "FORMAÇÃO",
    noCelular: true,
    icone: IconeTurma,
  },
  {
    href: "/membros",
    rotulo: "Membros",
    grupo: "GESTÃO",
    noCelular: false,
    icone: IconeMembros,
  },
];

const GRUPOS = ["FORMAÇÃO", "GESTÃO"] as const;

function ativo(atual: string, href: string): boolean {
  return atual === href || atual.startsWith(`${href}/`);
}

type Props = {
  /** `specs/04` — ponto no item Encontros quando há encontro acontecendo. */
  temEncontroAberto: boolean;
  nome: string;
  sair: () => Promise<void>;
};

// ── Desktop ────────────────────────────────────────────────────────────────

export function Sidebar({ temEncontroAberto, nome, sair }: Props) {
  const caminho = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="hidden w-60 shrink-0 flex-col border-r border-borda bg-superficie lg:flex"
    >
      <Link
        href="/encontros"
        className="flex min-h-toque items-center gap-3 px-6 py-6 text-papel transition-opacity duration-150 hover:opacity-70"
      >
        <Simbolo tamanho={26} />
        <span className="font-display font-extrabold text-titulo-secao">DEX</span>
      </Link>

      <div className="flex flex-1 flex-col gap-6 px-3 py-2">
        {GRUPOS.map((grupo) => {
          const itens = DESTINOS.filter((d) => d.grupo === grupo);
          if (itens.length === 0) return null;

          return (
            <div key={grupo} className="flex flex-col gap-1">
              <p className="px-3 pb-1 font-mono text-rotulo uppercase text-neutro">
                {grupo}
              </p>
              {itens.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  aria-current={ativo(caminho, d.href) ? "page" : undefined}
                  className={[
                    "flex min-h-toque items-center gap-3 rounded-campo px-3",
                    "text-corpo transition-colors duration-150",
                    ativo(caminho, d.href)
                      ? "bg-roxo/15 text-papel"
                      : "text-neutro hover:bg-superficie-alta hover:text-papel",
                  ].join(" ")}
                >
                  <span className={ativo(caminho, d.href) ? "icone-roxo" : undefined}>
                    {d.icone}
                  </span>
                  {d.rotulo}
                  {d.href === "/encontros" && temEncontroAberto && (
                    <span
                      className="ml-auto size-2 rounded-pilula bg-roxo"
                      aria-label="há encontro aberto"
                    />
                  )}
                </Link>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-borda px-6 py-4">
        <span className="truncate text-secundario text-papel">{nome}</span>
        <form action={sair}>
          <button
            type="submit"
            className="min-h-toque text-left text-secundario text-neutro transition-colors duration-150 hover:text-papel"
          >
            Sair
          </button>
        </form>
      </div>
    </nav>
  );
}

// ── Celular ────────────────────────────────────────────────────────────────

/** Telas de tarefa focada, onde o rodapé pertence à ação e não à navegação. */
function ehTelaDeTarefa(caminho: string): boolean {
  return caminho.includes("/feedback/");
}

export function BarraInferior({ temEncontroAberto }: Props) {
  const caminho = usePathname();
  const itens = DESTINOS.filter((d) => d.noCelular);

  /**
   * O formulário de feedback fixa o próprio "salvar" no rodapé (`specs/05`,
   * Mobile), e os dois disputariam o mesmo canto de polegar — a barra ganharia,
   * por estar acima, e esconderia o botão.
   *
   * Sumir é a escolha certa e não só a conveniente: ali o mentor está no meio
   * de escrever sobre uma pessoa, e um destino de navegação encostado no
   * polegar é convite a perder o texto. A saída é o link de voltar no topo.
   */
  if (ehTelaDeTarefa(caminho)) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {itens.map((d) => (
        <Link
          key={d.href}
          href={d.href}
          aria-current={ativo(caminho, d.href) ? "page" : undefined}
          className={[
            "relative flex flex-1 min-h-toque-lista flex-col items-center justify-center gap-1 py-2",
            "text-rotulo uppercase transition-colors duration-150",
            ativo(caminho, d.href) ? "text-papel" : "text-neutro",
          ].join(" ")}
        >
          <span className={ativo(caminho, d.href) ? "icone-roxo" : undefined}>
            {d.icone}
          </span>
          <span className="font-mono">{d.rotulo}</span>
          {d.href === "/encontros" && temEncontroAberto && (
            <span
              className="absolute right-1/2 top-2 -mr-4 size-2 rounded-pilula bg-roxo"
              aria-label="há encontro aberto"
            />
          )}
        </Link>
      ))}
    </nav>
  );
}
