import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { podeMarcarPresenca, type MarcacaoDePresenca } from "@/dominio/presenca";
import { Formulario } from "./Formulario";

export const metadata: Metadata = { title: "Presença" };

/**
 * `/encontros/[id]/presenca` — `RF-C1`.
 *
 * Parece o item mais simples da fase, e é — em linhas de código. A
 * consequência não é: **sem presença, a tela de cobertura vira alarme falso
 * toda semana**, apontando como buraco de atenção quem simplesmente faltou. Um
 * alarme que dispara sem motivo passa a ser ignorado, inclusive quando estiver
 * certo.
 */
export default async function Presenca({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, status, edicao_id")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  if (!podeMarcarPresenca(encontro)) {
    redirect(`/encontros/${encontro.id}`);
  }

  const [{ data: participacoes }, { data: marcadas }] = await Promise.all([
    supabase
      .from("participacao")
      .select("id, usuario:usuario_id (nome)")
      .eq("edicao_id", encontro.edicao_id)
      .eq("status", "ativo"),
    supabase
      .from("presenca")
      .select("participacao_id, status")
      .eq("encontro_id", encontro.id),
  ]);

  const jaMarcado = new Map(
    (marcadas ?? []).map((p) => [p.participacao_id, p.status]),
  );

  const linhas: MarcacaoDePresenca[] = (participacoes ?? [])
    .filter((p) => p.usuario)
    .map((p) => ({
      participacaoId: p.id,
      nome: p.usuario!.nome,
      status: jaMarcado.get(p.id) ?? null,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

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
          Presença
        </h1>
        <p className="text-corpo text-neutro">
          Quem faltou não aparece como buraco de atenção na cobertura — mas só
          se a presença estiver marcada.
        </p>
      </header>

      {linhas.length === 0 ? (
        <p className="rounded-cartao border border-borda bg-superficie p-5 text-corpo text-neutro">
          Nenhum participante nesta edição ainda.
        </p>
      ) : (
        <Formulario encontroId={encontro.id} inicial={linhas} />
      )}
    </main>
  );
}
