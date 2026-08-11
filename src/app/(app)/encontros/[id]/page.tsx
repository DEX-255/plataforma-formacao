import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { FRAMEWORKS, acharEixo } from "@/dominio/frameworks";
import { eixoDoMentorNoEncontro } from "@/dominio/regras";
import {
  estadoDoEncontro,
  podeAbrir,
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

  const [{ data: atribuicoes }, { data: mentores }] = await Promise.all([
    supabase.from("atribuicao_eixo").select("*").eq("encontro_id", encontro.id),
    supabase.from("usuario").select("*").eq("papel", "mentor"),
  ]);

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

      {encontro.status === "aberto" && (
        <p className="text-secundario text-neutro">
          A tela de registro de feedback e a de presença chegam nos próximos
          itens. Enquanto isso, o encontro já está visível na trajetória de quem
          participa e a caixa anônima está aberta.
        </p>
      )}
    </main>
  );
}
