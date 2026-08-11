import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { FRAMEWORKS, acharEixo } from "@/dominio/frameworks";
import { eixoDoMentorNoEncontro, encontroAceitaFeedback } from "@/dominio/regras";
import { coberturaDaTurma, type LinhaDaTurma } from "@/dominio/painel";
import { podeMarcarPresenca } from "@/dominio/presenca";
import { ListaDaTurma } from "./ListaDaTurma";
import {
  estadoDoEncontro,
  podeAbrir,
  podeLiberar,
  precisaAtribuirEixos,
  conferirAtribuicoes,
  atribuicaoEstaCompleta,
  CONSEQUENCIAS_DE_ABRIR,
} from "@/dominio/encontros";
import { abrirEncontro } from "../acoes";

export const metadata: Metadata = { title: "Encontro" };

/**
 * `/encontros/[id]` — o painel do encontro.
 *
 * Aqui está o **cabeçalho** que `specs/04` pede: tema, framework, meu eixo
 * neste encontro e o estado. A lista da turma com cobertura e busca é a tela
 * de trabalho de `RF-D5` e chega com o work item `registrar-feedback`; a
 * presença, com `presenca`. O que existe agora é a casca e as ações do ciclo
 * de vida — sem elas, `/encontros` levaria a lugar nenhum.
 */
export default async function PainelDoEncontro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessao = await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, data, framework, status, edicao_id")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  const [
    { data: atribuicoes },
    { data: mentores },
    { data: participacoes },
    { data: feedbacks },
    { data: presencas },
  ] = await Promise.all([
      supabase.from("atribuicao_eixo").select("*").eq("encontro_id", encontro.id),
      supabase.from("usuario").select("*").eq("papel", "mentor"),
      supabase
        .from("participacao")
        .select("id, status, usuario:usuario_id (id, nome, avatar_url)")
        .eq("edicao_id", encontro.edicao_id)
        .eq("status", "ativo"),
      // Só as colunas que a contagem usa. `select("*")` traria nota e
      // observação interna para uma tela que não mostra nenhuma das duas —
      // D-02 é "não busque o que a tela não usa", não só "não exiba".
      supabase
        .from("feedback")
        .select("participacao_id, mentor_id")
        .eq("encontro_id", encontro.id),
      supabase
        .from("presenca")
        .select("participacao_id, status")
        .eq("encontro_id", encontro.id),
    ]);

  const presencaDe = new Map(
    (presencas ?? []).map((p) => [p.participacao_id, p.status]),
  );

  const turma: LinhaDaTurma[] = (participacoes ?? [])
    .filter((p) => p.usuario)
    .map((p) => ({
      participacaoId: p.id,
      nome: p.usuario!.nome,
      avatarUrl: p.usuario!.avatar_url,
      recebidos: (feedbacks ?? []).filter((f) => f.participacao_id === p.id).length,
      euEscrevi: (feedbacks ?? []).some(
        (f) => f.participacao_id === p.id && f.mentor_id === sessao.usuario.id,
      ),
      presenca: presencaDe.get(p.id) ?? null,
    }));

  const cobertura = coberturaDaTurma(turma);

  const definicao = FRAMEWORKS[encontro.framework];
  const estado = estadoDoEncontro(encontro);
  const precisaEixos = precisaAtribuirEixos(encontro.framework);

  const conferencia = conferirAtribuicoes(
    encontro.framework,
    mentores ?? [],
    atribuicoes ?? [],
  );

  // RN-02 — o canal deste mentor neste encontro. Vazio é informação, não erro.
  const meuEixoId = eixoDoMentorNoEncontro(
    atribuicoes ?? [],
    encontro.id,
    sessao.usuario.id,
  );
  const meuEixo = meuEixoId ? acharEixo(encontro.framework, meuEixoId) : undefined;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <div>
        <Link
          href="/encontros"
          className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
        >
          ← Encontros
        </Link>
      </div>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-kicker uppercase text-neutro">
            Encontro {String(encontro.numero).padStart(2, "0")}
          </p>
          <Chip tom={estado.tom}>{estado.rotulo}</Chip>
        </div>

        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          {encontro.tema}
        </h1>

        <p className="text-corpo text-neutro">
          {definicao.nome}
          {definicao.eixos.length > 0 &&
            ` · ${definicao.eixos.map((e) => e.nome).join(" · ")}`}
        </p>
      </header>

      {/* RN-02 — o mentor precisa saber qual é o canal dele antes de escrever. */}
      {precisaEixos && (
        <section
          className={[
            "flex flex-col gap-2 rounded-cartao p-6",
            meuEixo
              ? "borda-dura border-roxo bg-superficie-alta"
              : "border border-borda bg-superficie",
          ].join(" ")}
        >
          <p className="font-mono font-bold text-rotulo uppercase text-neutro">
            Meu eixo neste encontro
          </p>

          {meuEixo ? (
            <>
              <p className="font-display font-semibold text-titulo-secao text-papel">
                {meuEixo.nome}
              </p>
              <p className="text-corpo text-neutro">
                &ldquo;{meuEixo.perguntaAncora}&rdquo;
              </p>
            </>
          ) : (
            <p className="text-corpo text-neutro">
              Você não tem eixo atribuído aqui. Isso é permitido — quem não
              observou não escreve. Se for engano,{" "}
              <Link
                href={`/encontros/${encontro.id}/eixos`}
                className="text-roxo-claro underline underline-offset-4"
              >
                ajuste a atribuição
              </Link>
              .
            </p>
          )}
        </section>
      )}

      {/* RN-14 / RF-B5 — encontro cumprido, e a tela não sugere que faltou algo. */}
      {!precisaEixos && (
        <section className="flex flex-col gap-2 rounded-cartao border border-borda bg-superficie p-6">
          <p className="font-display font-semibold text-titulo-secao text-papel">
            Encontro sem feedback individual
          </p>
          <p className="text-corpo text-neutro">
            Este encontro entra na trajetória e aceita presença, e nenhum
            formulário abre. É assim por desenho, não por falta: o objetivo aqui
            é a reflexão de cada um, e registrar o que não foi observado
            produziria enchimento.
          </p>
        </section>
      )}

      {/* RF-B2 — avisa, não bloqueia. */}
      {precisaEixos && (
        <section className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display font-semibold text-titulo-secao text-papel">
              Eixos deste encontro
            </h2>
            {encontro.status !== "liberado" && (
              <Link
                href={`/encontros/${encontro.id}/eixos`}
                className="min-h-toque text-secundario text-roxo-claro underline underline-offset-4"
              >
                Atribuir
              </Link>
            )}
          </div>

          {(atribuicoes ?? []).length === 0 ? (
            <p className="text-corpo text-neutro">
              Ninguém atribuído ainda. Cada mentor observa um eixo, e é a
              atribuição que define sobre o que ele escreve.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(mentores ?? [])
                .filter((m) =>
                  (atribuicoes ?? []).some((a) => a.mentor_id === m.id),
                )
                .map((m) => {
                  const eixoId = eixoDoMentorNoEncontro(
                    atribuicoes ?? [],
                    encontro.id,
                    m.id,
                  );
                  const eixo = eixoId
                    ? acharEixo(encontro.framework, eixoId)
                    : undefined;

                  return (
                    <li
                      key={m.id}
                      className="flex min-h-toque flex-wrap items-center gap-3"
                    >
                      <span className="flex-1 text-corpo text-papel">{m.nome}</span>
                      <Chip tom="roxo">{eixo?.nome ?? eixoId}</Chip>
                    </li>
                  );
                })}
            </ul>
          )}

          {!atribuicaoEstaCompleta(conferencia) && (
            <p className="text-secundario text-atencao">
              {conferencia.eixosSemMentor.length > 0 && (
                <>
                  Sem mentor:{" "}
                  {conferencia.eixosSemMentor.map((e) => e.nome).join(", ")}.
                  Ninguém vai observar isso neste encontro.
                </>
              )}
            </p>
          )}

          {conferencia.mentoresSemEixo.length > 0 && (
            <p className="text-secundario text-neutro">
              Sem eixo:{" "}
              {conferencia.mentoresSemEixo.map((m) => m.nome).join(", ")}.
            </p>
          )}
        </section>
      )}

      {/* RF-B3 — abrir, e o que isso desencadeia. */}
      {podeAbrir(encontro) && (
        <section className="flex flex-col gap-4 rounded-cartao borda-dura border-borda bg-superficie p-6">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            Abrir o encontro
          </h2>

          <ul className="flex flex-col gap-1 text-corpo text-neutro">
            {CONSEQUENCIAS_DE_ABRIR.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>

          {precisaEixos && !atribuicaoEstaCompleta(conferencia) && (
            <p className="text-secundario text-atencao">
              Ainda há eixo sem mentor. Dá para abrir assim — e ninguém vai
              escrever sobre esse eixo nesta semana.
            </p>
          )}

          <form action={abrirEncontro}>
            <input type="hidden" name="encontro" value={encontro.id} />
            <button
              type="submit"
              className="inline-flex min-h-toque items-center justify-center gap-2 rounded-pilula borda-dura border-preto bg-roxo px-6 py-3 font-sans font-bold text-corpo text-papel shadow-botao transition-[transform,box-shadow] duration-150 ease-saida hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-hover active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo"
            >
              Abrir encontro
            </button>
          </form>
        </section>
      )}

      {/* RF-D5 — a tela de trabalho. Só faz sentido com o encontro aceitando
          feedback: em rascunho ninguém escreve, e sem avaliação não há o quê. */}
      {encontroAceitaFeedback(encontro) && (
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-display font-semibold text-titulo-secao text-papel">
              Turma
            </h2>
            <p className="text-secundario text-neutro">
              {cobertura.euEscrevi} de {cobertura.total} por você
            </p>
          </div>

          {/* O número que incomoda, e ainda dá tempo de consertar. RF-C2: quem
              faltou já saiu desta conta, senão o alarme dispararia toda semana
              sem motivo e o mentor pararia de olhar para ele. */}
          {cobertura.semNenhum > 0 && (
            <p className="text-secundario text-atencao">
              {cobertura.semNenhum === 1
                ? "1 pessoa veio e não recebeu feedback de ninguém."
                : `${cobertura.semNenhum} pessoas vieram e não receberam feedback de ninguém.`}
            </p>
          )}

          {cobertura.faltaram > 0 && (
            <p className="text-secundario text-neutro">
              {cobertura.faltaram === 1
                ? "1 pessoa não veio."
                : `${cobertura.faltaram} pessoas não vieram.`}
            </p>
          )}

          <ListaDaTurma encontroId={encontro.id} linhas={turma} />
        </section>
      )}

      {/* RF-C1 — presença. Antes da liberação, e por isso vem antes do bloco
          de liberar: é uma das coisas a fechar na semana. */}
      {podeMarcarPresenca(encontro) && encontro.status !== "rascunho" && (
        <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-5">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            Presença
          </h2>
          <p className="text-corpo text-neutro">
            {cobertura.faltaram > 0
              ? `${cobertura.faltaram} ${cobertura.faltaram === 1 ? "pessoa marcada como ausente" : "pessoas marcadas como ausentes"}.`
              : "Marque quem veio — é o que impede a cobertura de cobrar feedback de quem faltou."}
          </p>
          <div>
            <Link
              href={`/encontros/${encontro.id}/presenca`}
              className="inline-flex min-h-toque items-center rounded-pilula border border-borda px-5 text-secundario text-papel transition-colors duration-150 hover:border-borda-forte"
            >
              Marcar presença →
            </Link>
          </div>
        </section>
      )}

      {/* RF-F2 — as mensagens só existem depois da liberação. */}
      {encontro.status === "liberado" && (
        <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-5">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            Mensagens anônimas
          </h2>
          <p className="text-corpo text-neutro">
            O que a turma escreveu sobre este encontro, sem autor e em ordem
            embaralhada.
          </p>
          <div>
            <Link
              href={`/encontros/${encontro.id}/anonimas`}
              className="inline-flex min-h-toque items-center rounded-pilula border border-borda px-5 text-secundario text-papel transition-colors duration-150 hover:border-borda-forte"
            >
              Ler as mensagens →
            </Link>
          </div>
        </section>
      )}

      {/* RF-B4 — o ritual semanal. Fica no fim de propósito: é a última coisa
          que se faz com o encontro, e não deve competir com a lista da turma
          enquanto ainda há gente para escrever. */}
      {podeLiberar(encontro) && (
        <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-5">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            Liberar este encontro
          </h2>
          <p className="text-corpo text-neutro">
            Publica os feedbacks para os participantes, fecha a caixa anônima e
            revela as mensagens aos mentores — tudo ao mesmo tempo, e sem volta.
          </p>
          <div>
            <Link
              href={`/encontros/${encontro.id}/liberar`}
              className="inline-flex min-h-toque items-center rounded-pilula border border-borda px-5 text-secundario text-papel transition-colors duration-150 hover:border-borda-forte"
            >
              Ver o que vai acontecer →
            </Link>
          </div>
        </section>
      )}

      {encontro.status === "aberto" && !encontroAceitaFeedback(encontro) && (
        <p className="text-secundario text-neutro">
          A marcação de presença chega no próximo item. O encontro já está
          visível na trajetória de quem participa e a caixa anônima está aberta.
        </p>
      )}
    </main>
  );
}
