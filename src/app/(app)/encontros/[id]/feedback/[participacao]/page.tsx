import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { acharEixo } from "@/dominio/frameworks";
import {
  eixoDoMentorNoEncontro,
  encontroAceitaFeedback,
  podeEditarBlocoVisivel,
  apenasBlocoVisivel,
} from "@/dominio/regras";
import type { RascunhoDeFeedback } from "@/lib/rascunho";
import { Formulario } from "./Formulario";

export const metadata: Metadata = { title: "Registrar feedback" };

/**
 * `/encontros/[id]/feedback/[participacao]` — a tela mais importante do produto.
 *
 * Componente de servidor por padrão (`D-02`). O que vai para o navegador é
 * apenas o que o formulário precisa editar: o rascunho do **próprio** mentor.
 * O painel `RF-D2` — o que os outros já escreveram — é montado aqui e desce
 * como HTML, passado por `apenasBlocoVisivel()`.
 *
 * Esse filtro parece redundante, já que o mentor tem permissão de ler nota
 * alheia. Não é: `D-02` é "não envie o que a tela não usa", e `RF-D2` pede
 * explicitamente **o bloco visível** dos outros. O mentor forma o veredito
 * dele; ancorar na nota de quem escreveu antes é o oposto do que a diretriz 4
 * quer.
 */
export default async function RegistrarFeedback({
  params,
}: {
  params: Promise<{ id: string; participacao: string }>;
}) {
  const { id, participacao } = await params;
  const sessao = await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, framework, status")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  // RN-14 — encontro sem avaliação não abre formulário. Não é erro; é o
  // desenho. Volta para o painel, que explica isso na própria tela.
  if (!encontroAceitaFeedback(encontro)) {
    redirect(`/encontros/${encontro.id}`);
  }

  const [{ data: alvo }, { data: atribuicoes }, { data: registrados }] =
    await Promise.all([
      supabase
        .from("participacao")
        .select("id, usuario:usuario_id (id, nome)")
        .eq("id", participacao)
        .maybeSingle(),
      supabase.from("atribuicao_eixo").select("*").eq("encontro_id", encontro.id),
      supabase
        .from("feedback")
        .select("*")
        .eq("encontro_id", encontro.id)
        .eq("participacao_id", participacao),
    ]);

  if (!alvo?.usuario) notFound();

  const nome = alvo.usuario.nome;
  const primeiroNome = nome.split(" ")[0] ?? nome;

  // RN-02 — o eixo vem da atribuição e não é escolhido a cada vez.
  const meuEixoId = eixoDoMentorNoEncontro(
    atribuicoes ?? [],
    encontro.id,
    sessao.usuario.id,
  );

  if (!meuEixoId) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-10">
        <Link
          href={`/encontros/${encontro.id}`}
          className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
        >
          ← {encontro.tema}
        </Link>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Sem eixo neste encontro
        </h1>
        <p className="text-corpo text-neutro">
          Você não tem eixo atribuído aqui, então não há canal em que escrever.
          Isso é permitido — quem não observou não escreve.{" "}
          <Link
            href={`/encontros/${encontro.id}/eixos`}
            className="text-roxo-claro underline underline-offset-4"
          >
            Ajustar a atribuição
          </Link>
          .
        </p>
      </main>
    );
  }

  const meuEixo = acharEixo(encontro.framework, meuEixoId);
  const meu = (registrados ?? []).find(
    (f) => f.mentor_id === sessao.usuario.id && f.eixo === meuEixoId,
  );

  // RF-D2 — o que os OUTROS registraram, só o bloco visível.
  const dosOutros = (registrados ?? [])
    .filter((f) => f.mentor_id !== sessao.usuario.id)
    .map(apenasBlocoVisivel);

  const autores = new Map(
    (
      await supabase
        .from("usuario")
        .select("id, nome")
        .in("id", dosOutros.length > 0 ? dosOutros.map((f) => f.mentor_id) : ["-"])
    ).data?.map((u) => [u.id, u.nome]) ?? [],
  );

  const inicial: RascunhoDeFeedback = {
    situacao: meu?.situacao ?? "",
    ponto: meu?.ponto ?? "",
    sugestao: meu?.sugestao ?? "",
    nota: meu?.nota ?? null,
    naoObservado: meu?.nao_observado ?? false,
    observacaoInterna: meu?.observacao_interna ?? "",
  };

  const visivelEditavel = meu
    ? podeEditarBlocoVisivel(encontro, meu.mentor_id, sessao.usuario.id)
    : true;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
      <Link
        href={`/encontros/${encontro.id}`}
        className="inline-flex min-h-toque items-center text-secundario text-neutro transition-colors duration-150 hover:text-papel"
      >
        ← {encontro.tema}
      </Link>

      {/* 1 — quem estou avaliando */}
      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Encontro {String(encontro.numero).padStart(2, "0")}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          {nome}
        </h1>
      </header>

      {/* 2 — meu eixo, com a pergunta-âncora */}
      {meuEixo && (
        <section className="flex flex-col gap-2 rounded-cartao borda-dura border-roxo bg-superficie-alta p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-bold text-rotulo uppercase text-neutro">
              Meu eixo
            </span>
            <Chip tom="roxo">{meuEixo.nome}</Chip>
          </div>
          <p className="font-display font-semibold text-corpo-destaque text-papel">
            &ldquo;{meuEixo.perguntaAncora}&rdquo;
          </p>
        </section>
      )}

      {/* 3 — o que os outros já escreveram. Informativo, nunca bloqueante. */}
      {dosOutros.length > 0 && (
        <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-5">
          <h2 className="font-mono font-bold text-rotulo uppercase text-neutro">
            O que os outros já registraram
          </h2>

          {dosOutros.map((f) => {
            const eixo = acharEixo(encontro.framework, f.eixo);
            return (
              <article
                key={f.id}
                className="flex flex-col gap-1 border-l-2 border-borda pl-4"
              >
                <p className="text-secundario text-neutro">
                  {autores.get(f.mentor_id) ?? "Mentor"} ·{" "}
                  <span className="text-roxo-claro">{eixo?.nome ?? f.eixo}</span>
                </p>
                <p className="text-secundario text-papel">{f.ponto}</p>
                <p className="text-secundario text-neutro">{f.sugestao}</p>
              </article>
            );
          })}

          <p className="text-secundario text-neutro">
            Serve para você achar o ângulo ainda descoberto, não para concordar.
            O veredito do seu eixo é seu.
          </p>
        </section>
      )}

      {/* 4 — o formulário */}
      <Formulario
        encontroId={encontro.id}
        participacaoId={participacao}
        nomeDoParticipante={nome}
        primeiroNome={primeiroNome}
        eixo={meuEixoId}
        framework={encontro.framework}
        visivelEditavel={visivelEditavel}
        inicial={inicial}
        jaExistia={Boolean(meu)}
      />
    </main>
  );
}
