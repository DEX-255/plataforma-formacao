import type { Metadata } from "next";
import Link from "next/link";
import { exigirParticipante } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { FRAMEWORKS } from "@/dominio/frameworks";
import {
  ordenarTrajetoria,
  estadoNaTrajetoria,
  TRAJETORIA_VAZIA,
  ROTULO_DE_PRESENCA,
  type ItemDaTrajetoria,
} from "@/dominio/trajetoria";

export const metadata: Metadata = { title: "Minha trajetória" };

/** Data local — `new Date("2026-09-03")` é lido como UTC e mostra o dia anterior. */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number) as [number, number, number];
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

/**
 * `/trajetoria` — `RF-E1` e `RF-E3`.
 *
 * **Esta tela é a prova prática de `RN-03`.** Toda leitura de feedback acontece
 * pela view `feedback_visivel`, que não tem as colunas do bloco interno. Se em
 * algum momento o objeto completo chegar ao navegador para "renderizar só uma
 * parte", a regra já foi violada — mesmo que a tela pareça certa. Por isso não
 * existe nenhum componente de cliente aqui.
 *
 * O ritmo é o oposto do da tela do mentor: densidade baixa, tipografia grande,
 * feito para ser lido devagar. É o que a pessoa leva para a semana seguinte.
 */
export default async function Trajetoria() {
  const sessao = await exigirParticipante();
  const supabase = await clienteServidor();

  const { data: participacao } = await supabase
    .from("participacao")
    .select("id, edicao_id")
    .eq("usuario_id", sessao.usuario.id)
    .maybeSingle();

  if (!participacao) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Minha trajetória
        </h1>
        <p className="mt-4 text-corpo text-neutro">
          Não encontramos sua participação nesta edição. Procure um mentor —
          isso costuma ser um cadastro que ficou pela metade, e resolve na hora.
        </p>
      </main>
    );
  }

  // Rascunho não aparece: a política `encontro_participante` já o exclui, e
  // esta consulta não precisa saber disso para estar certa.
  const [{ data: encontros }, { data: visiveis }, { data: presencas }] =
    await Promise.all([
      supabase
        .from("encontro")
        .select("id, numero, tema, data, framework, status")
        .eq("edicao_id", participacao.edicao_id),
      supabase.from("feedback_visivel").select("encontro_id"),
      supabase
        .from("presenca")
        .select("encontro_id, status")
        .eq("participacao_id", participacao.id),
    ]);

  // As colunas da view vêm anuláveis nos tipos gerados — o Postgres não infere
  // `not null` através de uma view. Na prática nunca são nulas, mas descartar o
  // que for é mais honesto que afirmar o contrário com um `!`.
  const porEncontro = new Map<string, number>();
  for (const f of visiveis ?? []) {
    if (!f.encontro_id) continue;
    porEncontro.set(f.encontro_id, (porEncontro.get(f.encontro_id) ?? 0) + 1);
  }

  const presencaDe = new Map(
    (presencas ?? []).map((p) => [p.encontro_id, p.status]),
  );

  const itens: ItemDaTrajetoria[] = (encontros ?? []).map((e) => ({
    id: e.id,
    numero: e.numero,
    tema: e.tema,
    data: e.data,
    framework: e.framework,
    status: e.status,
    presenca: presencaDe.get(e.id) ?? null,
    feedbacks: porEncontro.get(e.id) ?? 0,
  }));

  const linha = ordenarTrajetoria(itens);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Minha trajetória
        </h1>
        <p className="text-corpo-destaque text-neutro">
          O que os mentores observaram sobre você ao longo da formação.
        </p>
      </header>

      {linha.length === 0 ? (
        /* RF-E3 — a primeira impressão que a turma inteira tem do produto,
           e ela acontece uma vez só. */
        <section className="flex flex-col gap-4 rounded-cartao borda-dura border-roxo bg-superficie p-6">
          <h2 className="font-display font-semibold text-titulo-secao text-papel">
            {TRAJETORIA_VAZIA.titulo}
          </h2>
          {TRAJETORIA_VAZIA.linhas.map((l) => (
            <p key={l} className="text-corpo text-neutro">
              {l}
            </p>
          ))}
        </section>
      ) : (
        <ol className="flex flex-col gap-4">
          {linha.map((item) => {
            const estado = estadoNaTrajetoria(item, item.feedbacks);
            const definicao = FRAMEWORKS[item.framework];

            const cartao = (
              <>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-mono font-bold text-rotulo uppercase text-neutro">
                    {String(item.numero).padStart(2, "0")}
                  </span>
                  <span className="flex-1 font-display font-semibold text-titulo-secao text-papel">
                    {item.tema}
                  </span>
                  <Chip tom={estado.tom}>{estado.rotulo}</Chip>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-secundario text-neutro">
                  <span>{formatarData(item.data)}</span>
                  {definicao.eixos.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{definicao.nome}</span>
                    </>
                  )}
                  {item.presenca && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{ROTULO_DE_PRESENCA[item.presenca]}</span>
                    </>
                  )}
                </div>

                {estado.explicacao && (
                  <p className="text-corpo text-neutro">{estado.explicacao}</p>
                )}

                {estado.temConteudo && (
                  <p className="text-secundario text-roxo-claro">Ler →</p>
                )}
              </>
            );

            return (
              <li key={item.id}>
                {estado.temConteudo ? (
                  <Link
                    href={`/trajetoria/encontro/${item.id}`}
                    className="flex min-h-toque-lista flex-col gap-2 rounded-cartao borda-dura border-borda bg-superficie p-5 transition-colors duration-150 hover:border-roxo"
                  >
                    {cartao}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2 rounded-cartao border border-borda bg-superficie p-5">
                    {cartao}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
