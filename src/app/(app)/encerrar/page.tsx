import type { Metadata } from "next";
import { exigirMentor } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import { Chip } from "@/componentes/ui";
import {
  podeEncerrar,
  CONSEQUENCIAS_DO_ENCERRAMENTO,
  POR_QUE_TODOS_IGUALMENTE,
  O_QUE_ACONTECE_COM_OS_DADOS,
  ENCERRAMENTO_E_IRREVERSIVEL,
} from "@/dominio/encerramento";
import { Confirmacao } from "./Confirmacao";

export const metadata: Metadata = { title: "Encerramento" };

/**
 * `/encerrar` — `RF-A4`.
 *
 * O gesto mais pesado do produto: a turma inteira perde o acesso de uma vez, e
 * não há botão para reabrir. A tela é escrita para ser lida antes de clicar, e
 * diz três coisas que costumam ficar implícitas: o que acontece, por que todo
 * mundo sai junto, e o que acontece com os dados depois.
 */
export default async function Encerramento() {
  await exigirMentor();
  const supabase = await clienteServidor();

  // Sem filtro de status: depois de encerrada a tela ainda precisa abrir, para
  // o mentor confirmar que aconteceu e ler o que vale a partir de agora.
  const { data: edicao } = await supabase
    .from("edicao")
    .select("id, nome, status")
    .order("nome", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!edicao) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-12">
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Encerramento
        </h1>
        <p className="mt-4 text-corpo text-neutro">Nenhuma edição cadastrada.</p>
      </main>
    );
  }

  const aberta = podeEncerrar(edicao);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-kicker uppercase text-neutro">
            Edição {edicao.nome}
          </p>
          <Chip tom={aberta ? "sucesso" : "neutro"}>
            {aberta ? "ativa" : "encerrada"}
          </Chip>
        </div>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          {aberta ? "Encerrar a edição" : "Edição encerrada"}
        </h1>
      </header>

      {aberta ? (
        <>
          <section className="flex flex-col gap-4 rounded-cartao borda-dura border-borda bg-superficie p-5 sm:p-6">
            <h2 className="font-mono font-bold text-rotulo uppercase text-neutro">
              No instante em que você confirmar
            </h2>

            <ul className="flex flex-col gap-2 text-corpo text-papel">
              {CONSEQUENCIAS_DO_ENCERRAMENTO.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden className="icone-roxo">
                    →
                  </span>
                  {c}
                </li>
              ))}
            </ul>

            <p className="text-secundario text-erro-claro">
              {ENCERRAMENTO_E_IRREVERSIVEL}
            </p>
          </section>

          <section className="flex flex-col gap-2 rounded-cartao border border-borda bg-superficie p-5 sm:p-6">
            <h2 className="font-display font-semibold text-titulo-secao text-papel">
              Por que todo mundo sai junto
            </h2>
            <p className="text-corpo text-neutro">{POR_QUE_TODOS_IGUALMENTE}</p>
          </section>
        </>
      ) : (
        <section className="flex flex-col gap-2 rounded-cartao border border-borda bg-superficie p-5 sm:p-6">
          <p className="text-corpo text-papel">
            Os participantes desta edição não acessam mais a plataforma. Ao
            tentarem entrar, a tela explica que a formação terminou e como
            receber o documento final.
          </p>
          <p className="text-corpo text-neutro">
            Você continua vendo tudo em modo arquivo: encontros, turma,
            feedbacks e notas.
          </p>
        </section>
      )}

      {/* RN-18 — a retenção é escolha, e a tela diz isso em vez de deixar
          implícito. Quem lê tem direito de saber por quê e por quanto tempo. */}
      <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-5 sm:p-6">
        <h2 className="font-display font-semibold text-titulo-secao text-papel">
          O que acontece com os dados
        </h2>
        {O_QUE_ACONTECE_COM_OS_DADOS.map((linha) => (
          <p key={linha} className="text-corpo text-neutro">
            {linha}
          </p>
        ))}
      </section>

      {aberta && <Confirmacao edicaoId={edicao.id} />}
    </main>
  );
}
