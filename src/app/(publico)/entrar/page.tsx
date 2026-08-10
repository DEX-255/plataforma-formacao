import type { Metadata } from "next";
import Link from "next/link";
import { Simbolo } from "@/componentes/marca/Simbolo";
import { BotaoGoogle } from "./BotaoGoogle";
import { LoginLocal } from "./LoginLocal";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Tela de login — o card da direção **3e** sobre o fundo escuro da **4b**.
 *
 * A 3e original era papel claro, e o caminho ficava escuro → claro → escuro.
 * Levar o card para o escuro esbarrou num problema que só apareceu ao ver
 * rodando: a sombra sólida é preta, e preta sobre preta desaparece — sumia
 * justamente o gesto que dá personalidade à direção. Resolvido com a sombra em
 * roxo, e daí saiu a regra geral que está em `specs/05`: **a cor da sombra
 * segue o fundo, não o elemento.**
 *
 * `RF-I2` — um botão do Google e nada mais. Não existe senha neste produto.
 */

type Motivo = "nao-autorizado" | "edicao-encerrada";

const RECUSAS: Record<Motivo, { titulo: string; texto: string }> = {
  "nao-autorizado": {
    titulo: "Esta conta não está na lista.",
    texto:
      "Quase sempre é conta trocada: o navegador já estava logado na pessoal e entrou " +
      "com ela. Tente de novo com o seu e-mail @discente.ufg.br. Se você não tem um, " +
      "use a conta Google do e-mail que você preencheu no formulário de inscrição.",
  },
  "edicao-encerrada": {
    titulo: "Esta formação já encerrou.",
    texto:
      "O acesso à plataforma termina junto com o processo seletivo. O seu documento " +
      "individual, com toda a trajetória e os feedbacks que você recebeu, é enviado " +
      "pela organização — procure a DEX se ainda não recebeu o seu.",
  },
};

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ recusa?: string }>;
}) {
  const { recusa } = await searchParams;
  const motivo =
    recusa === "nao-autorizado" || recusa === "edicao-encerrada"
      ? RECUSAS[recusa as Motivo]
      : null;

  return (
    <main className="grao relative min-h-screen overflow-hidden bg-preto">
      <div className="halftone pointer-events-none absolute inset-0" />

      {/* Saída. Quem chegou aqui por curiosidade precisa conseguir voltar —
          o rótulo diz que é caminho de volta, não só a marca repetida. */}
      <header className="relative z-10 px-6 py-6">
        <Link
          href="/"
          aria-label="DEX — voltar para a página inicial"
          className="inline-flex min-h-toque items-center gap-3 text-papel transition-opacity duration-150 hover:opacity-70"
        >
          <Simbolo tamanho={32} />
          <span className="font-display font-extrabold text-titulo-secao">
            DEX
          </span>
        </Link>
      </header>

      {/* Centraliza no que sobra depois do header. Em produção o card é mais
          curto — sem o formulário de desenvolvimento — e sem isto ele ficaria
          jogado no topo com um vazio embaixo. */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-lg flex-col items-center justify-center gap-10 px-6 pb-16">

        <div className="relative w-full">
          <span
            style={{ rotate: "-7deg" }}
            className="absolute -top-5 left-6 z-10 inline-flex items-center rounded-pilula borda-dura border-preto bg-roxo px-4 py-2 font-mono font-bold text-corpo uppercase tracking-[0.14em] text-papel shadow-selo"
          >
            ★ área de membros
          </span>

          {/* Borda em papel e sombra em roxo: as duas precisam contrastar com o
              preto atrás, senão o card vira um retângulo sem forma. */}
          <div className="rounded-cartao borda-dura border-borda-forte bg-superficie p-8 pt-12 shadow-solida-roxo">
            <h1 className="font-display font-extrabold text-titulo-tela text-papel">
              e aí! bora entrar?
            </h1>

            <p className="mt-4 text-corpo text-papel/70">
              O acesso é restrito aos membros da Formação DEX. Entre com a mesma
              conta Google que você usou na inscrição.
            </p>

            {motivo && (
              <div
                role="alert"
                className="mt-6 rounded-campo border-2 border-erro-claro/40 bg-erro-claro/10 p-4"
              >
                {/* --erro-claro, não --erro: o fechado dá 2,88:1 aqui e some. */}
                <p className="font-sans font-bold text-corpo text-erro-claro">
                  {motivo.titulo}
                </p>
                <p className="mt-2 text-secundario text-papel/80">
                  {motivo.texto}
                </p>
              </div>
            )}

            <div className="mt-8">
              <BotaoGoogle />
            </div>

            {/* Só existe em desenvolvimento. A variável não é definida em
                produção, e há teste garantindo que ela não vaze para lá. */}
            {process.env.NEXT_PUBLIC_LOGIN_LOCAL === "1" && <LoginLocal />}
          </div>
        </div>

        <p className="text-center text-secundario text-neutro">
          Não existe senha aqui. Nada de cadastro, nada de recuperação — é a sua
          conta Google e pronto.
        </p>
      </div>
    </main>
  );
}
