import Link from "next/link";
import { redirect } from "next/navigation";
import { Simbolo } from "@/componentes/marca/Simbolo";
import { exigirSessao } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";

/**
 * Casca da área logada.
 *
 * `specs/04` prevê uma sidebar escura permanente para o mentor. Ela ainda não
 * está aqui de propósito: os destinos dela — Encontros, Turma — não existem, e
 * navegação apontando para 404 é pior que navegação nenhuma. A sidebar chega
 * junto com o item `edicao-e-encontros`, quando houver para onde ir.
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
