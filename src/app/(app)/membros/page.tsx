import type { Metadata } from "next";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { contarPendentes, normalizar, ordenarMembros, type Membro } from "@/dominio/membros";
import { Chip } from "@/componentes/ui";
import { Formulario } from "./Formulario";
import { removerMembro } from "./acoes";

export const metadata: Metadata = { title: "Membros" };

/**
 * `/membros` — `RF-A2`.
 *
 * Duas funções, e a segunda costuma ser esquecida: cadastrar quem entra, e
 * **mostrar quem ainda não acessou**, que é o que permite cobrar antes do
 * primeiro encontro avaliativo em vez de descobrir na hora.
 *
 * Componente de servidor: a lista de quem tem acesso ao sistema não precisa
 * trafegar como dado para o navegador montar (`D-02`).
 */
export default async function Membros() {
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, nome")
    .eq("status", "ativa")
    .order("nome", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Membros
        </h1>
        <p className="mt-4 text-corpo text-neutro">
          Nenhuma edição ativa. Crie uma edição antes de liberar acesso — todo
          dado do sistema pertence a uma edição.
        </p>
      </main>
    );
  }

  const [{ data: autorizados }, { data: usuarios }] = await Promise.all([
    supabase
      .from("email_autorizado")
      .select("email, papel")
      .eq("edicao_id", edicao.id),
    supabase.from("usuario").select("email, nome, avatar_url"),
  ]);

  // Junção em memória: não existe FK entre as duas tabelas — a autorização é
  // por e-mail, e a pessoa só vira `usuario` quando entra pela primeira vez.
  const porEmail = new Map(
    (usuarios ?? []).map((u) => [normalizar(u.email), u]),
  );

  const membros: Membro[] = (autorizados ?? []).map((a) => {
    const u = porEmail.get(normalizar(a.email));
    return {
      email: a.email,
      papel: a.papel,
      entrou: u ? { nome: u.nome, avatar_url: u.avatar_url } : null,
    };
  });

  const lista = ordenarMembros(membros);
  const pendentes = contarPendentes(membros);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Edição {edicao.nome}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Membros
        </h1>
        <p className="text-corpo text-neutro">
          Só quem está nesta lista consegue entrar. Autenticar no Google não
          basta.
        </p>
      </header>

      <section className="rounded-cartao border border-borda bg-superficie p-6">
        <Formulario edicaoId={edicao.id} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            {lista.length} {lista.length === 1 ? "pessoa" : "pessoas"}
          </h2>
          {pendentes > 0 && (
            <p className="text-secundario text-atencao">
              {pendentes === 1
                ? "1 ainda não entrou"
                : `${pendentes} ainda não entraram`}
            </p>
          )}
        </div>

        {lista.length === 0 ? (
          <p className="rounded-cartao border border-borda bg-superficie p-6 text-corpo text-neutro">
            Ninguém liberado ainda. Cole a lista de e-mails acima — enquanto ela
            estiver vazia, nem os mentores conseguem entrar.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lista.map((m) => (
              <li
                key={m.email}
                className="flex min-h-toque-lista flex-wrap items-center gap-3 rounded-campo border border-borda bg-superficie px-4 py-3"
              >
                <span className="flex-1 break-all text-corpo text-papel">
                  {m.entrou ? m.entrou.nome : m.email}
                  {m.entrou && (
                    <span className="block text-secundario text-neutro">
                      {m.email}
                    </span>
                  )}
                </span>

                <Chip tom={m.papel === "mentor" ? "roxo" : "neutro"}>
                  {m.papel}
                </Chip>

                {/* Estado nunca é só cor: a palavra vai escrita. */}
                <Chip tom={m.entrou ? "sucesso" : "atencao"}>
                  {m.entrou ? "entrou" : "não entrou"}
                </Chip>

                <form action={removerMembro}>
                  <input type="hidden" name="email" value={m.email} />
                  <button
                    type="submit"
                    className="min-h-toque rounded-pilula border border-borda px-4 text-secundario text-papel transition-colors duration-150 hover:border-erro-claro hover:text-erro-claro"
                  >
                    Remover
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <p className="text-secundario text-neutro">
          Remover tira o acesso na requisição seguinte e{" "}
          <strong className="text-papel">não apaga nada</strong> do que a pessoa
          já produziu ou recebeu — o documento final dela continua reproduzível.
        </p>
      </section>
    </main>
  );
}
