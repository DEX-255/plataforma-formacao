import Link from "next/link";
import { redirect } from "next/navigation";
import { Simbolo } from "@/componentes/marca/Simbolo";
import { Sidebar, BarraInferior } from "@/componentes/nav/Navegacao";
import { exigirSessao } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Casca da área logada.
 *
 * `specs/04` dá navegações diferentes aos dois papéis, e a diferença não é
 * estética: o participante tem três destinos, e sidebar para três destinos é
 * peso morto. O mentor circula entre encontro, turma e gestão o tempo todo.
 *
 * O ponto no item "Encontros" custa uma consulta por navegação. Vale: é o que
 * diz ao mentor que existe trabalho aberto sem ele precisar ir olhar.
 */
export default async function LayoutDoApp({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await exigirSessao();

  async function sair() {
    "use server";
    const supabase = await clienteServidor();
    await supabase.auth.signOut();
    redirect("/entrar");
  }

  if (sessao.papel !== "mentor") {
    return (
      <div className="min-h-screen bg-fundo">
        <header className="flex items-center justify-between border-b border-borda px-6 py-4">
          <Link
            href="/"
            aria-label="DEX — página inicial"
            className="inline-flex min-h-toque items-center gap-3 text-papel transition-opacity duration-150 hover:opacity-70"
          >
            <Simbolo tamanho={28} />
            <span className="font-display font-extrabold text-titulo-secao">
              DEX
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-secundario text-neutro sm:block">
              {sessao.usuario.nome}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="min-h-toque rounded-pilula border border-borda px-4 text-secundario text-papel transition-colors duration-150 hover:border-borda-forte"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {children}
      </div>
    );
  }

  const supabase = await clienteServidor();
  const { data: aberto } = await supabase
    .from("encontro")
    .select("id")
    .eq("status", "aberto")
    .limit(1)
    .maybeSingle();

  const nav = {
    temEncontroAberto: aberto !== null,
    nome: sessao.usuario.nome,
    sair,
  };

  return (
    <div className="flex min-h-screen bg-fundo">
      <Sidebar {...nav} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* No celular a barra inferior leva a navegação; o topo fica só com
            identidade e saída, que não cabem no polegar. */}
        <header className="flex items-center justify-between border-b border-borda px-6 py-4 lg:hidden">
          <Link
            href="/encontros"
            aria-label="DEX — encontros"
            className="inline-flex min-h-toque items-center gap-3 text-papel transition-opacity duration-150 hover:opacity-70"
          >
            <Simbolo tamanho={26} />
            <span className="font-display font-extrabold text-titulo-secao">
              DEX
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-secundario text-neutro sm:block">
              {sessao.usuario.nome}
            </span>
            <form action={sair}>
              <button
                type="submit"
                className="min-h-toque rounded-pilula border border-borda px-4 text-secundario text-papel transition-colors duration-150 hover:border-borda-forte"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* A barra inferior é fixa; sem esta folga ela cobre o fim da lista. */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-0">{children}</div>
      </div>

      <BarraInferior {...nav} />
    </div>
  );
}
