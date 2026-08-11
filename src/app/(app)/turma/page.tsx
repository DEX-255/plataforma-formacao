import type { Metadata } from "next";
import Link from "next/link";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import {
  ordenarPorCobertura,
  limiteDeCobertura,
  estaDescoberto,
  resumoDaTurma,
  type LinhaDaCobertura,
} from "@/dominio/cobertura";
import { ausenciaExplicaFaltaDeFeedback } from "@/dominio/presenca";

export const metadata: Metadata = { title: "Turma" };

/**
 * `/turma` — `RF-G1`.
 *
 * **A defesa contra o terceiro problema do produto** (`specs/01`): como todo
 * mentor pode observar qualquer participante, alguns recebem quinze observações
 * e outros duas — e a diferença não é mérito, é acaso. Sem esta tela, o corte
 * do PS premia quem por acaso recebeu mais atenção.
 *
 * Cartões empilhados, não tabela: `specs/05` é explícito de que **a turma não é
 * planilha**. Uma tabela de cinquenta linhas no celular vira rolagem horizontal,
 * e a decisão que esta tela alimenta é sobre pessoas.
 */
export default async function Turma() {
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
          Turma
        </h1>
        <p className="mt-4 text-corpo text-neutro">Nenhuma edição ativa.</p>
      </main>
    );
  }

  const [{ data: participacoes }, { data: encontros }, { data: feedbacks }, { data: presencas }] =
    await Promise.all([
      supabase
        .from("participacao")
        .select("id, usuario:usuario_id (nome)")
        .eq("edicao_id", edicao.id)
        .eq("status", "ativo"),
      supabase
        .from("encontro")
        .select("id, framework")
        .eq("edicao_id", edicao.id)
        .neq("status", "rascunho"),
      supabase.from("feedback").select("participacao_id, encontro_id"),
      supabase.from("presenca").select("participacao_id, status"),
    ]);

  // Encontros que de fato pedem feedback — os `nenhum` não entram na conta de
  // cobertura, senão todo mundo apareceria descoberto por causa deles (RN-14).
  const avaliativos = new Set(
    (encontros ?? []).filter((e) => e.framework !== "nenhum").map((e) => e.id),
  );

  const linhas: LinhaDaCobertura[] = (participacoes ?? [])
    .filter((p) => p.usuario)
    .map((p) => {
      const meus = (feedbacks ?? []).filter(
        (f) => f.participacao_id === p.id && avaliativos.has(f.encontro_id),
      );
      const comFeedback = new Set(meus.map((f) => f.encontro_id));
      const minhasPresencas = (presencas ?? []).filter(
        (x) => x.participacao_id === p.id,
      );

      return {
        participacaoId: p.id,
        nome: p.usuario!.nome,
        feedbacks: meus.length,
        encontrosComFeedback: comFeedback.size,
        encontrosSemFeedback: avaliativos.size - comFeedback.size,
        presencas: minhasPresencas.filter((x) => x.status === "presente").length,
        faltas: minhasPresencas.filter((x) =>
          ausenciaExplicaFaltaDeFeedback(x.status),
        ).length,
        notas: [],
      };
    });

  const lista = ordenarPorCobertura(linhas);
  const limite = limiteDeCobertura(linhas);
  const resumo = resumoDaTurma(linhas);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Edição {edicao.nome}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Turma
        </h1>
        <p className="text-corpo text-neutro">
          Quem recebeu menos atenção aparece primeiro. A diferença de cobertura
          entre duas pessoas quase nunca é mérito — é acaso, e é isso que esta
          tela existe para mostrar antes do corte.
        </p>
      </header>

      <section className="flex flex-wrap gap-3">
        <div className="flex-1 rounded-cartao border border-borda bg-superficie p-4">
          <p className="text-secundario text-neutro">Mediana da turma</p>
          <p className="font-display font-extrabold text-titulo-secao text-papel">
            {resumo.mediana} {resumo.mediana === 1 ? "feedback" : "feedbacks"}
          </p>
        </div>
        {/* O número sem ambiguidade. "Abaixo da cobertura" é relativo e cala
            quando a turma inteira está em zero — este não cala nunca, e ao ver
            rodando ficou claro que ele é o que o mentor precisa enxergar. */}
        <div
          className={[
            "flex-1 rounded-cartao p-4",
            resumo.semNenhum > 0
              ? "borda-dura border-atencao bg-superficie-alta"
              : "border border-borda bg-superficie",
          ].join(" ")}
        >
          <p className="text-secundario text-neutro">Sem nenhum feedback</p>
          <p
            className={[
              "font-display font-extrabold text-titulo-secao",
              resumo.semNenhum > 0 ? "text-atencao" : "text-papel",
            ].join(" ")}
          >
            {resumo.semNenhum}
          </p>
        </div>

        <div
          className={[
            "flex-1 rounded-cartao p-4",
            resumo.descobertos > 0
              ? "borda-dura border-atencao bg-superficie-alta"
              : "border border-borda bg-superficie",
          ].join(" ")}
        >
          <p className="text-secundario text-neutro">Abaixo da cobertura</p>
          <p
            className={[
              "font-display font-extrabold text-titulo-secao",
              resumo.descobertos > 0 ? "text-atencao" : "text-papel",
            ].join(" ")}
          >
            {resumo.descobertos}
          </p>
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {lista.map((l) => {
          const descoberto = estaDescoberto(l, limite);

          return (
            <li key={l.participacaoId}>
              <Link
                href={`/turma/${l.participacaoId}`}
                className={[
                  "flex min-h-toque-lista flex-col gap-2 p-5",
                  "rounded-cartao transition-colors duration-150",
                  descoberto
                    ? "borda-dura border-atencao bg-superficie-alta"
                    : "border border-borda bg-superficie hover:border-borda-forte",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex-1 font-display font-semibold text-titulo-secao text-papel">
                    {l.nome}
                  </span>
                  {descoberto && <Chip tom="atencao">pouca cobertura</Chip>}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-secundario text-neutro">
                  <span className="text-papel">
                    {l.feedbacks}{" "}
                    {l.feedbacks === 1 ? "feedback" : "feedbacks"}
                  </span>
                  <span>
                    {l.encontrosComFeedback} de {avaliativos.size}{" "}
                    {avaliativos.size === 1 ? "encontro" : "encontros"}
                  </span>
                  {/* RF-C2 — a falta é dita como falta, não somada ao buraco. */}
                  {l.faltas > 0 && (
                    <span>
                      {l.faltas} {l.faltas === 1 ? "falta" : "faltas"}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {lista.length === 0 && (
        <p className="rounded-cartao border border-borda bg-superficie p-5 text-corpo text-neutro">
          Nenhum participante nesta edição ainda.
        </p>
      )}
    </main>
  );
}
