import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirParticipante } from "@/lib/auth";
import { clienteServidor } from "@/lib/supabase/servidor";
import {
  estadoDaCaixa,
  COMO_O_ANONIMATO_FUNCIONA,
  AVISO_SEM_RECUPERAR,
} from "@/dominio/caixa";
import { Formulario } from "./Formulario";

export const metadata: Metadata = { title: "Caixa anônima" };

/**
 * `/caixa/[encontro]` — `RF-F1`.
 *
 * A tela existe para ser **acreditada**. Um estudante prestes a criticar um
 * mentor está calculando risco, e "sua mensagem é anônima" não é argumento —
 * é o que qualquer sistema diria. O que convence é saber o que o sistema faz,
 * e é por isso que a explicação do mecanismo ocupa mais espaço que o próprio
 * formulário.
 *
 * Componente de servidor: a única coisa que atravessa para o navegador é o id
 * do encontro.
 */
export default async function Caixa({
  params,
}: {
  params: Promise<{ encontro: string }>;
}) {
  const { encontro: encontroId } = await params;
  await exigirParticipante();
  const supabase = await clienteServidor();

  const { data: encontro } = await supabase
    .from("encontro")
    .select("id, numero, tema, status")
    .eq("id", encontroId)
    .maybeSingle();

  if (!encontro) notFound();

  // `enviada_propria` deixa o participante ler a própria marca — é o que
  // permite dizer "você já enviou" sem mostrar o que ele escreveu.
  const { count: minhaMarca } = await supabase
    .from("mensagem_enviada")
    .select("*", { count: "exact", head: true })
    .eq("encontro_id", encontro.id);

  const estado = estadoDaCaixa(encontro, (minhaMarca ?? 0) > 0);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-10">
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
          Encontro {String(encontro.numero).padStart(2, "0")} · {encontro.tema}
        </p>
        <h1 className="font-display font-extrabold text-titulo-tela text-papel">
          Caixa anônima
        </h1>
        <p className="text-corpo-destaque text-neutro">
          Um canal para você falar sobre os mentores e sobre a formação. É
          opcional, e não escrever nada não tem consequência nenhuma.
        </p>
      </header>

      {estado.tipo === "fechada" ? (
        <section className="flex flex-col gap-3 rounded-cartao border border-borda bg-superficie p-6">
          <p className="font-display font-semibold text-titulo-secao text-papel">
            {estado.motivo === "liberado"
              ? "A caixa deste encontro está fechada."
              : "A caixa deste encontro ainda não abriu."}
          </p>
          <p className="text-corpo text-neutro">
            {estado.motivo === "liberado"
              ? "Ela fecha no momento em que os feedbacks são liberados — para você escrever antes de ler o que os mentores registraram, e não em resposta a isso."
              : "Ela abre quando o encontro começar."}
          </p>
        </section>
      ) : estado.tipo === "ja-enviei" ? (
        <section className="flex flex-col gap-3 rounded-cartao borda-dura border-roxo bg-superficie-alta p-6">
          <p className="font-display font-semibold text-titulo-secao text-papel">
            Você já enviou sua mensagem deste encontro.
          </p>
          <p className="text-corpo text-neutro">
            É uma por encontro. Ela chega aos mentores junto com as outras
            quando este encontro for liberado.
          </p>
          {/* RF-F1 — a confirmação NÃO mostra o texto. Poder recuperar
              implicaria que o vínculo existe em algum lugar. */}
          <p className="text-secundario text-neutro">{AVISO_SEM_RECUPERAR}</p>
        </section>
      ) : (
        <Formulario encontroId={encontro.id} />
      )}

      {/* A explicação do mecanismo, sempre — inclusive depois de enviar, porque
          é o que sustenta a confiança para a próxima semana. */}
      <section className="flex flex-col gap-4 rounded-cartao border border-borda bg-superficie p-6">
        <h2 className="font-mono font-bold text-rotulo uppercase text-neutro">
          Como o anonimato funciona aqui
        </h2>

        <ul className="flex flex-col gap-3">
          {COMO_O_ANONIMATO_FUNCIONA.map((linha) => (
            <li key={linha} className="flex gap-3 text-corpo text-neutro">
              <span aria-hidden className="icone-roxo">
                ·
              </span>
              {linha}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
