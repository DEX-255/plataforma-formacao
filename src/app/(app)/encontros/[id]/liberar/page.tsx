import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import {
  montarPrevia,
  avisoDeCobertura,
  encontroPodeSerLiberado,
  CONSEQUENCIAS_DA_LIBERACAO,
  LIBERACAO_E_IRREVERSIVEL,
} from "@/dominio/liberacao";
import { Confirmacao } from "./Confirmacao";

export const metadata: Metadata = { title: "Liberar encontro" };

/**
 * `/encontros/[id]/liberar` — `RF-B4`.
 *
 * A tela existe para ser **lida antes de clicar**, e é a única do produto que
 * tenta desacelerar quem a usa. Tudo o mais é feito para o mentor ir rápido;
 * aqui ele está prestes a revelar texto para a turma inteira, de uma vez, sem
 * volta.
 *
 * A contagem de quem não vai receber nada é o ponto do requisito, não um
 * detalhe da prévia: é o último instante em que dá para consertar a
 * desigualdade de atenção antes que ela vire fato consumado para a semana.
 */
export default async function LiberarEncontro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, framework, status, edicao_id")
    .eq("id", id)
    .maybeSingle();

  if (!encontro) notFound();

  // Não existe liberar o que não está aberto. O painel já não oferece o
  // caminho; isto fecha o endereço digitado à mão.
  if (!encontroPodeSerLiberado(encontro)) {
    redirect(`/encontros/${encontro.id}`);
  }

  const [{ data: participacoes }, { data: feedbacks }, { data: mensagens }] =
    await Promise.all([
      supabase
        .from("participacao")
        .select("id")
        .eq("edicao_id", encontro.edicao_id)
        .eq("status", "ativo"),
      supabase
        .from("feedback")
        .select("participacao_id")
        .eq("encontro_id", encontro.id),
      /**
       * A contagem vem de uma função que devolve **só o inteiro**.
       *
       * Duas coisas nesta linha, e a segunda é séria.
       *
       * Contar por `mensagem_anonima` devolvia zero: a policy só entrega
       * mensagem de encontro já liberado, corretamente. A tela dizia "0
       * mensagens" com três no banco — a consulta não errava, obedecia.
       *
       * Contar por `mensagem_enviada` resolvia o número e abria um buraco muito
       * pior: aquela tabela tem `participacao_id`, e ler linha de lá é ler a
       * lista de quem escreveu. Com uma mensagem no encontro, isso identifica o
       * autor sem esforço nenhum. A leitura foi removida (migração
       * `20260811200000`) e sobrou esta função, que não tem caminho para a
       * identidade.
       */
      supabase.rpc("contar_mensagens_do_encontro", { p_encontro: encontro.id }),
    ]);

  const previa = montarPrevia({
    participacoes: (participacoes ?? []).length,
    participacoesComFeedback: new Set(
      (feedbacks ?? []).map((f) => f.participacao_id),
    ).size,
    feedbacks: (feedbacks ?? []).length,
    mensagens: mensagens ?? 0,
  });

  const aviso = avisoDeCobertura(previa);

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
          Liberar o encontro
        </h1>
      </header>

      {/* O que vai acontecer, antes de qualquer botão. */}
      <section className="flex flex-col gap-4 rounded-cartao borda-dura border-borda bg-superficie p-5 sm:p-6">
        <h2 className="font-mono font-bold text-rotulo uppercase text-neutro">
          No instante em que você confirmar
        </h2>

        <ul className="flex flex-col gap-2 text-corpo text-papel">
          {CONSEQUENCIAS_DA_LIBERACAO.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden className="icone-roxo">
                →
              </span>
              {c}
            </li>
          ))}
        </ul>

        <p className="text-secundario text-erro-claro">
          {LIBERACAO_E_IRREVERSIVEL}
        </p>
      </section>

      {/* Os números. */}
      <section className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-titulo-secao text-papel">
          O que está para ser liberado
        </h2>

        <dl className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-4">
            <dt className="text-secundario text-neutro">Vão receber feedback</dt>
            <dd className="font-display font-extrabold text-titulo-tela text-papel">
              {previa.comFeedback}
              <span className="text-titulo-secao text-neutro">
                {" "}
                de {previa.turma}
              </span>
            </dd>
          </div>

          <div
            className={[
              "flex flex-col gap-1 rounded-cartao p-4",
              previa.semNenhum > 0
                ? "borda-dura border-atencao bg-superficie-alta"
                : "border border-borda bg-superficie",
            ].join(" ")}
          >
            <dt className="text-secundario text-neutro">Não vão receber nada</dt>
            <dd
              className={[
                "font-display font-extrabold text-titulo-tela",
                previa.semNenhum > 0 ? "text-atencao" : "text-papel",
              ].join(" ")}
            >
              {previa.semNenhum}
            </dd>
          </div>

          <div className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-4">
            <dt className="text-secundario text-neutro">Feedbacks no total</dt>
            <dd className="font-display font-extrabold text-titulo-secao text-papel">
              {previa.feedbacks}
            </dd>
          </div>

          <div className="flex flex-col gap-1 rounded-cartao border border-borda bg-superficie p-4">
            <dt className="text-secundario text-neutro">Mensagens anônimas</dt>
            <dd className="font-display font-extrabold text-titulo-secao text-papel">
              {previa.mensagens}
            </dd>
          </div>
        </dl>

        {/* RF-B4 — um número grande aqui é para incomodar. */}
        {aviso && (
          <div className="flex flex-col gap-2 rounded-cartao borda-dura border-atencao bg-superficie-alta p-5">
            <p className="font-display font-semibold text-corpo-destaque text-atencao">
              {aviso}
            </p>
            <p className="text-secundario text-neutro">
              Este é o último momento em que dá para consertar isso nesta semana.
              Se alguém recebeu feedback no encontro e ainda não foi registrado,
              vale voltar e escrever antes de liberar.
            </p>
            <p className="text-secundario text-neutro">
              Se ninguém falou com essas pessoas hoje, liberar não piora nada —
              a plataforma registra o que aconteceu, e a trajetória delas vai
              dizer isso com naturalidade.
            </p>
          </div>
        )}
      </section>

      <Confirmacao encontroId={encontro.id} />
    </main>
  );
}
