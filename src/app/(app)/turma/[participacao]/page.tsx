import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { GraficoDeEvolucao } from "@/componentes/ui/GraficoDeEvolucao";
import { acharEixo, FRAMEWORKS } from "@/dominio/frameworks";
import {
  mediaPorEixo,
  seriesPorEixo,
  type NotaDeEixo,
} from "@/dominio/cobertura";
import { ROTULO_DE_PRESENCA } from "@/dominio/presenca";

export const metadata: Metadata = { title: "Perfil na turma" };

/**
 * `/turma/[participacao]` — `RF-G2`.
 *
 * **É a tela consultada na decisão do corte.** Precisa suportar leitura
 * demorada, lado a lado com outra pessoa, provavelmente no computador — e é a
 * única tela do mentor que não é desenhada primeiro no celular. Daí a coluna
 * mais larga e a densidade maior que o resto do produto.
 *
 * Aqui o bloco interno aparece: nota e observação, que é o que distingue esta
 * tela da trajetória. Só mentor chega, verificado no servidor, e a RLS nega a
 * tabela `feedback` a qualquer participante.
 */
export default async function PerfilNaTurma({
  params,
}: {
  params: Promise<{ participacao: string }>;
}) {
  const { participacao: participacaoId } = await params;
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: participacao } = await supabase
    .from("participacao")
    .select("id, status, usuario:usuario_id (nome, email)")
    .eq("id", participacaoId)
    .maybeSingle();

  if (!participacao?.usuario) notFound();

  const [{ data: feedbacks }, { data: encontros }, { data: presencas }, { data: mentores }] =
    await Promise.all([
      supabase
        .from("feedback")
        .select("*")
        .eq("participacao_id", participacaoId),
      supabase.from("encontro").select("id, numero, tema, framework, status"),
      supabase
        .from("presenca")
        .select("encontro_id, status")
        .eq("participacao_id", participacaoId),
      supabase.from("usuario").select("id, nome").eq("papel", "mentor"),
    ]);

  const encontroDe = new Map((encontros ?? []).map((e) => [e.id, e]));
  const nomeDoMentor = new Map((mentores ?? []).map((m) => [m.id, m.nome]));
  const presencaDe = new Map(
    (presencas ?? []).map((p) => [p.encontro_id, p.status]),
  );

  // A evolução só faz sentido dentro de um framework — oratória é a única que
  // se repete e vira linha (`frameworks.ts`, forma "linha").
  const notasDeOratoria: NotaDeEixo[] = (feedbacks ?? [])
    .filter((f) => encontroDe.get(f.encontro_id)?.framework === "oratoria")
    .map((f) => ({
      eixo: f.eixo,
      nota: f.nota,
      encontro: encontroDe.get(f.encontro_id)?.numero ?? 0,
    }));

  const medias = mediaPorEixo(notasDeOratoria);
  const series = seriesPorEixo("oratoria", notasDeOratoria);

  const porEncontro = [...(encontros ?? [])]
    .filter((e) => e.status !== "rascunho")
    .sort((a, b) => b.numero - a.numero);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-10 sm:px-6">
      <div>
        <Link
          href="/turma"
          className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
        >
          ← Turma
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          {participacao.usuario.nome}
        </h1>
        <p className="text-secundario text-neutro">
          {participacao.usuario.email}
        </p>
      </header>

      {/* Evolução por eixo — RF-G2. */}
      {series.length > 0 && (
        <section className="flex flex-col gap-5 rounded-cartao border border-borda bg-superficie p-5 sm:p-6">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            Evolução em oratória
          </h2>

          <GraficoDeEvolucao framework="oratoria" series={series} />

          {/* A tabela existe para quem não distingue as cores, para leitor de
              tela, e para conferir número — o gráfico mostra a forma, ela dá o
              valor. */}
          <table className="w-full border-collapse text-secundario">
            <caption className="sr-only">
              Notas por eixo em cada encontro de oratória
            </caption>
            <thead>
              <tr>
                <th className="border-b border-borda py-2 text-left font-mono text-rotulo uppercase text-neutro">
                  Eixo
                </th>
                {series[0]?.pontos.map((p) => (
                  <th
                    key={p.encontro}
                    className="border-b border-borda py-2 text-right font-mono text-rotulo uppercase text-neutro"
                  >
                    {p.encontro}
                  </th>
                ))}
                <th className="border-b border-borda py-2 text-right font-mono text-rotulo uppercase text-neutro">
                  Média
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const m = medias.get(s.eixo);
                return (
                  <tr key={s.eixo}>
                    <td className="border-b border-borda py-2 text-papel">
                      {acharEixo("oratoria", s.eixo)?.nome ?? s.eixo}
                    </td>
                    {s.pontos.map((p) => (
                      <td
                        key={p.encontro}
                        className="border-b border-borda py-2 text-right text-papel"
                      >
                        {/* RN-07 — não observado não vira zero nem célula vazia. */}
                        {p.nota ?? "n/o"}
                      </td>
                    ))}
                    <td className="border-b border-borda py-2 text-right text-papel">
                      {m?.media !== null && m?.media !== undefined
                        ? m.media.toFixed(1)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-secundario text-neutro">
            <strong className="text-papel">n/o</strong> é &ldquo;não
            observado&rdquo;: o mentor não teve como observar aquele eixo naquele
            encontro. Não entra na média e não é nota baixa (`RN-07`).
          </p>
        </section>
      )}

      {/* Tudo sobre a pessoa, encontro a encontro, com o bloco interno. */}
      <section className="flex flex-col gap-5">
        <h2 className="font-display font-semibold text-titulo-secao text-papel">
          Encontro a encontro
        </h2>

        {porEncontro.map((e) => {
          const meus = (feedbacks ?? []).filter((f) => f.encontro_id === e.id);
          const presenca = presencaDe.get(e.id) ?? null;

          return (
            <article
              key={e.id}
              className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-5 sm:p-6"
            >
              <header className="flex flex-wrap items-center gap-3">
                <span className="font-mono font-bold text-rotulo uppercase text-neutro">
                  {String(e.numero).padStart(2, "0")}
                </span>
                <span className="flex-1 font-display font-semibold text-corpo-destaque text-papel">
                  {e.tema}
                </span>
                {presenca && (
                  <Chip tom={presenca === "presente" ? "sucesso" : "neutro"}>
                    {ROTULO_DE_PRESENCA[presenca]}
                  </Chip>
                )}
              </header>

              {meus.length === 0 ? (
                <p className="text-secundario text-neutro">
                  {FRAMEWORKS[e.framework].eixos.length === 0
                    ? "Encontro sem feedback individual, por desenho."
                    : presenca && presenca !== "presente"
                      ? "Não veio a este encontro."
                      : "Ninguém registrou feedback aqui."}
                </p>
              ) : (
                meus.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-col gap-2 border-l-2 border-borda pl-4"
                  >
                    <p className="text-secundario text-neutro">
                      {nomeDoMentor.get(f.mentor_id) ?? "Mentor"} ·{" "}
                      <span className="text-roxo-claro">
                        {acharEixo(e.framework, f.eixo)?.nome ?? f.eixo}
                      </span>
                    </p>
                    <p className="text-secundario text-neutro">{f.situacao}</p>
                    <p className="text-corpo text-papel">{f.ponto}</p>
                    <p className="text-corpo text-neutro">{f.sugestao}</p>

                    {/* O bloco interno — é isto que distingue esta tela da
                        trajetória, e o motivo de só mentor chegar aqui. */}
                    <div className="mt-1 flex flex-col gap-1 rounded-campo border border-roxo/40 bg-superficie-alta p-3">
                      <p className="font-mono font-bold text-rotulo uppercase icone-roxo">
                        Só mentores
                      </p>
                      <p className="text-secundario text-papel">
                        Nota:{" "}
                        {f.nao_observado ? "não observado" : (f.nota ?? "—")}
                      </p>
                      {f.observacao_interna && (
                        <p className="text-secundario text-neutro">
                          {f.observacao_interna}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
