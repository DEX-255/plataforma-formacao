import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { eixosDe } from "@/dominio/frameworks";
import { precisaAtribuirEixos } from "@/dominio/encontros";
import { FormularioEixos } from "./FormularioEixos";

export const metadata: Metadata = { title: "Atribuir eixos" };

/**
 * `/encontros/[id]/eixos` — `RF-B2`.
 *
 * É o que torna `RN-02` operável: cada mentor é dono de um canal naquele
 * encontro e escreve só sobre ele. Sem esta tela, "um mentor, um eixo" seria
 * combinado no grupo do WhatsApp e o sistema não saberia de nada.
 */
export default async function AtribuirEixos({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, framework, status")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  // RN-14 — encontro sem avaliação pula a etapa. Mostrar um formulário vazio
  // aqui sugeriria que faltou preencher algo.
  if (!precisaAtribuirEixos(encontro.framework)) {
    redirect(`/encontros/${encontro.id}`);
  }

  // Depois da liberação a atribuição vira registro histórico: é ela que diz
  // quem tinha o canal quando cada feedback foi escrito.
  if (encontro.status === "liberado") {
    redirect(`/encontros/${encontro.id}`);
  }

  const [{ data: mentores }, { data: atribuicoes }] = await Promise.all([
    supabase.from("usuario").select("*").eq("papel", "mentor").order("nome"),
    supabase.from("atribuicao_eixo").select("*").eq("encontro_id", encontro.id),
  ]);

  const atual = Object.fromEntries(
    (atribuicoes ?? []).map((a) => [a.mentor_id, a.eixo]),
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
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
          Atribuir eixos
        </h1>
        <p className="text-corpo text-neutro">
          Cada mentor observa um eixo e escreve só sobre ele. É o que faz três
          olhares independentes virarem um retrato, em vez de três opiniões
          sobre a mesma coisa.
        </p>
      </header>

      {(mentores ?? []).length === 0 ? (
        <p className="rounded-cartao border border-borda bg-superficie p-6 text-corpo text-neutro">
          Nenhum mentor entrou no sistema ainda. Quem está na lista de
          autorizados só vira mentor aqui depois do primeiro login —{" "}
          <Link
            href="/membros"
            className="text-roxo-claro underline underline-offset-4"
          >
            confira em Membros
          </Link>
          .
        </p>
      ) : (
        <FormularioEixos
          encontroId={encontro.id}
          mentores={mentores ?? []}
          eixos={eixosDe(encontro.framework)}
          atual={atual}
        />
      )}
    </main>
  );
}
