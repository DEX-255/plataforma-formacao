import type { Metadata } from "next";
import Link from "next/link";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import { FRAMEWORKS } from "@/dominio/frameworks";
import {
  ordenarEncontros,
  proximoNumero,
  estadoDoEncontro,
} from "@/dominio/encontros";
import { FormularioCriar } from "./FormularioCriar";

export const metadata: Metadata = { title: "Encontros" };

/**
 * Data no fuso local.
 *
 * `new Date("2026-09-03")` é lido como UTC e, a oeste de Greenwich, exibe o dia
 * anterior — o encontro de quinta apareceria como quarta. Montando a data pelos
 * componentes, ela fica local.
 */
function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number) as [number, number, number];
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

/**
 * `/encontros` — `RF-B1` e a lista de `specs/04`.
 *
 * "Havendo encontro aberto, ele aparece no topo com destaque." O destaque não
 * é enfeite: é o encontro em que o mentor tem trabalho agora, e ele chega aqui
 * com o celular na mão, minutos depois da dinâmica.
 */
export default async function Encontros() {
  await exigirMentor();
  const supabase = await clienteServidor();

  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, nome, status")
    .eq("status", "ativa")
    .order("nome", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Encontros
        </h1>
        <p className="mt-4 text-corpo text-neutro">
          Nenhuma edição ativa. Todo dado do sistema pertence a uma edição
          (`RN-17`), então o encontro precisa de uma para existir.
        </p>
      </main>
    );
  }

  const { data: encontros } = await supabase
    .from("encontro")
    .select("id, numero, tema, data, framework, status")
    .eq("edicao_id", edicao.id);

  const lista = ordenarEncontros(encontros ?? []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-kicker uppercase text-neutro">
          Edição {edicao.nome}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Encontros
        </h1>
        <p className="text-corpo text-neutro">
          O encontro é criado quando acontece. Não há cronograma para seguir.
        </p>
      </header>

      <section className="rounded-cartao border border-borda bg-superficie p-6">
        <FormularioCriar
          edicaoId={edicao.id}
          numeroSugerido={proximoNumero(lista)}
        />
      </section>

      {lista.length === 0 ? (
        <p className="rounded-cartao border border-borda bg-superficie p-6 text-corpo text-neutro">
          Nenhum encontro ainda. Crie o primeiro acima — ele nasce em rascunho e
          só aparece para os participantes quando você abrir.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {lista.map((e) => {
            const estado = estadoDoEncontro(e);
            const destaque = e.status === "aberto";

            return (
              <li key={e.id}>
                <Link
                  href={`/encontros/${e.id}`}
                  className={[
                    "flex min-h-toque-lista flex-col gap-2 p-5",
                    "rounded-cartao transition-colors duration-150",
                    destaque
                      ? "borda-dura border-roxo bg-superficie-alta"
                      : "border border-borda bg-superficie hover:border-borda-forte",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="font-mono font-bold text-rotulo uppercase text-neutro">
                      {String(e.numero).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display font-semibold text-titulo-secao text-papel">
                      {e.tema}
                    </span>
                    <Chip tom={estado.tom}>{estado.rotulo}</Chip>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-secundario text-neutro">
                    <span>{formatarData(e.data)}</span>
                    <span aria-hidden>·</span>
                    <span>{FRAMEWORKS[e.framework].nome}</span>
                  </div>

                  <p className="text-secundario text-neutro">{estado.detalhe}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
