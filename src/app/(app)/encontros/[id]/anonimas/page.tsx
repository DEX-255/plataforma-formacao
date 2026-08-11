import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { mensagensParaLeitura, NAO_E_CANAL_DE_CONVERSA } from "@/dominio/caixa";

export const metadata: Metadata = { title: "Mensagens anônimas" };

/**
 * `/encontros/[id]/anonimas` — `RF-F2`.
 *
 * Todas juntas, sem autor, sem horário, em ordem aleatória fixa (`RN-10`).
 *
 * **Não há nada para clicar em cada cartão**, e isso é desenho, não falta de
 * tempo: responder, reagir ou marcar como lida criaria um dado por mensagem, e
 * dado por mensagem é material de correlação. Além disso a caixa não é canal de
 * conversa — a diretriz 3 da DEX é justamente não devolver feedback a quem está
 * te dando feedback.
 *
 * A ordem vem de `mensagensParaLeitura`, não de um `order by` escrito aqui.
 * Ordenar por qualquer outra coisa — inclusive "como veio do banco" —
 * reintroduziria a correlação que o `CLUSTER` da liberação destrói.
 */
export default async function MensagensAnonimas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, status")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  // A policy já nega mensagem de encontro não liberado; isto evita a tela vazia
  // sem explicação para quem digitou o endereço.
  if (encontro.status !== "liberado") {
    redirect(`/encontros/${encontro.id}`);
  }

  const { data: mensagens } = await supabase
    .from("mensagem_anonima")
    .select("*")
    .eq("encontro_id", encontro.id);

  const lista = mensagensParaLeitura(mensagens ?? []);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-10">
      <div>
        <Link
          href={`/encontros/${encontro.id}`}
          className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
        >
          ← {encontro.tema}
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Encontro {String(encontro.numero).padStart(2, "0")}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Mensagens anônimas
        </h1>
        <p className="text-corpo text-neutro">
          {lista.length === 0
            ? "Ninguém escreveu neste encontro."
            : `${lista.length} ${lista.length === 1 ? "mensagem" : "mensagens"}, em ordem embaralhada.`}
        </p>
      </header>

      {lista.length > 0 && (
        <ul className="flex flex-col gap-4">
          {lista.map((m) => (
            <li
              key={m.id}
              className="rounded-cartao border border-borda bg-superficie p-5 sm:p-6"
            >
              <p className="whitespace-pre-wrap text-corpo-destaque text-papel">
                {m.texto}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-secundario text-neutro">{NAO_E_CANAL_DE_CONVERSA}</p>
    </main>
  );
}
