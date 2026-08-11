import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirParticipante } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { agruparPorEixo } from "@/dominio/trajetoria";
import type { FeedbackVisivel } from "@/dominio/tipos";

export const metadata: Metadata = { title: "Encontro" };

/**
 * `/trajetoria/encontro/[id]` — `RF-E2`.
 *
 * Os feedbacks agrupados **por eixo**, com a pergunta-âncora no cabeçalho de
 * cada grupo. Sem isso, a pessoa lê três feedbacks como três opiniões
 * concorrentes e fica confusa sobre em qual acreditar; com isso, entende que
 * cada mentor olhou uma coisa diferente — que é o desenho de avaliação da DEX.
 *
 * A hierarquia visual dos três campos não é estética: **a sugestão é a única
 * parte acionável**, e é a que a pessoa vai usar durante a semana. Situação
 * localiza, ponto explica, sugestão é o que fazer a seguir.
 *
 * Componente de servidor, lendo exclusivamente de `feedback_visivel` — a view
 * não tem as colunas do bloco interno, então `RN-03` vale mesmo que esta tela
 * esteja errada.
 */
export default async function EncontroEmDetalhe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await exigirParticipante();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, data, framework, status")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  // RN-05 — antes da liberação não há o que ler aqui, e a trajetória já explica
  // isso no cartão. Mandar de volta é melhor que uma tela vazia.
  if (encontro.status !== "liberado") {
    redirect("/trajetoria");
  }

  const { data: feedbacks } = await supabase
    .from("feedback_visivel")
    .select("*")
    .eq("encontro_id", encontro.id);

  /**
   * As colunas da view chegam anuláveis nos tipos gerados — o Postgres não
   * propaga `not null` através de uma view. Um `as FeedbackVisivel[]` calaria o
   * compilador afirmando algo que ninguém verificou; aqui a linha incompleta é
   * descartada de verdade.
   *
   * Descartar em silêncio é aceitável **porque o campo que falta seria exibido
   * vazio de qualquer jeito**, e um cartão sem ponto nem sugestão não é
   * feedback — é ruído numa tela que a pessoa lê para saber como está indo.
   */
  const meus: FeedbackVisivel[] = (feedbacks ?? []).flatMap((f) =>
    f.id &&
    f.encontro_id &&
    f.participacao_id &&
    f.mentor_id &&
    f.eixo &&
    f.situacao !== null &&
    f.ponto !== null &&
    f.sugestao !== null
      ? [
          {
            id: f.id,
            encontro_id: f.encontro_id,
            participacao_id: f.participacao_id,
            mentor_id: f.mentor_id,
            eixo: f.eixo,
            situacao: f.situacao,
            ponto: f.ponto,
            sugestao: f.sugestao,
          },
        ]
      : [],
  );

  if (meus.length === 0) {
    redirect("/trajetoria");
  }

  // RN-04 — feedback visível é sempre assinado, e assinatura sem nome não é
  // assinatura. A política `usuario_participante` permite ler mentores.
  const { data: mentores } = await supabase
    .from("usuario")
    .select("id, nome")
    .in("id", [...new Set(meus.map((f) => f.mentor_id))]);

  const nomeDoMentor = new Map((mentores ?? []).map((m) => [m.id, m.nome]));
  const grupos = agruparPorEixo(encontro.framework, meus);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-12">
      <div>
        <Link
          href="/trajetoria"
          className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
        >
          ← Minha trajetória
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Encontro {String(encontro.numero).padStart(2, "0")}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          {encontro.tema}
        </h1>
      </header>

      {grupos.map((grupo) => (
        <section key={grupo.eixoId} className="flex flex-col gap-5">
          {/* O cabeçalho do eixo ensina o modelo sem precisar explicar. */}
          {/* `items-start` porque o Chip é `inline-flex` e, num contêiner
              `flex-col`, esticaria na largura toda — vira uma faixa roxa em vez
              de uma pílula. */}
          <header className="flex flex-col items-start gap-2 border-l-2 border-roxo pl-4">
            <Chip tom="roxo">{grupo.eixo?.nome ?? grupo.eixoId}</Chip>
            {grupo.eixo && (
              <p className="font-display font-semibold text-corpo-destaque text-papel">
                &ldquo;{grupo.eixo.perguntaAncora}&rdquo;
              </p>
            )}
          </header>

          {grupo.feedbacks.map((f) => (
            <article
              key={f.id}
              className="flex flex-col gap-5 rounded-cartao border border-borda bg-superficie p-5 sm:p-6"
            >
              {/* Situação — localiza. O menor peso dos três. */}
              <p className="text-secundario text-neutro">{f.situacao}</p>

              {/* Ponto — o que foi observado. */}
              <p className="text-corpo-destaque text-papel">{f.ponto}</p>

              {/* Sugestão — a única parte acionável, e por isso a de maior
                  peso visual. É o que a pessoa leva para a semana. */}
              <div className="flex flex-col gap-2 rounded-campo borda-dura border-roxo bg-superficie-alta p-4">
                <p className="font-mono font-bold text-rotulo uppercase icone-roxo">
                  O que fazer a seguir
                </p>
                <p className="font-display font-semibold text-corpo-destaque text-papel">
                  {f.sugestao}
                </p>
              </div>

              {/* RN-04 — sempre assinado. */}
              <p className="text-secundario text-neutro">
                — {nomeDoMentor.get(f.mentor_id) ?? "Mentor"}
              </p>
            </article>
          ))}
        </section>
      ))}
    </main>
  );
}
