import type { Metadata } from "next";
import Link from "next/link";
import { Simbolo } from "@/componentes/marca/Simbolo";

/**
 * Home — direção **4b** de `specs/05`: fundo preto quente, DEX roxo gigante,
 * "De pessoas. Para pessoas." circulado.
 *
 * `RF-I1` — página única. **Sem formulário de inscrição, sem captação.** Não é
 * o trabalho deste site: quem chega aqui já ouviu falar da DEX e só precisa
 * entender o que é e por onde entrar.
 *
 * O DEX gigante é Bricolage Grotesque 800 — um desenho de letra diferente do
 * wordmark oficial, que é uma sans geométrica leve. Os dois aparecem na mesma
 * tela: o oficial no header, o tipográfico no hero. ⏳ `pendencias.md`.
 */

export const metadata: Metadata = {
  title: "DEX — Hub de Empreendedorismo e Inovação",
  description:
    "Hub de Empreendedorismo e Inovação do Instituto de Informática da UFG.",
  robots: { index: true, follow: true },
};

export default function Home() {
  return (
    <main className="grao relative min-h-screen overflow-hidden bg-preto">
      {/* halftone — textura da home */}
      <div className="halftone pointer-events-none absolute inset-0" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <Link
          href="/"
          className="flex min-h-toque items-center gap-3 text-papel transition-opacity duration-150 hover:opacity-70"
        >
          <Simbolo tamanho={32} titulo="DEX" />
          <span className="font-display font-extrabold text-titulo-secao">
            DEX
          </span>
        </Link>

        <nav className="flex items-center gap-5 text-corpo font-medium md:gap-8">
          <a href="#a-dex" className="hidden text-papel hover:text-roxo-claro sm:block">
            A DEX
          </a>
          <a
            href="https://instagram.com/hub.dex"
            target="_blank"
            rel="noreferrer noopener"
            className="hidden text-papel hover:text-roxo-claro sm:block"
          >
            Instagram
          </a>
          <Link
            href="/entrar"
            className="inline-flex min-h-toque items-center rounded-pilula border-2 border-papel px-6 py-2 text-papel transition-colors duration-150 hover:bg-papel hover:text-preto"
          >
            Entrar
          </Link>
        </nav>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-kicker uppercase text-roxo-claro">
          Hub de empreendedorismo · UFG
        </p>

        {/* O roxo aqui passa porque é display: 4,27:1 reprova texto pequeno,
            não tipografia de 88px para cima. */}
        <h1 className="mt-2 font-display font-extrabold text-display text-roxo [text-shadow:10px_10px_0_var(--color-preto)]">
          DEX
        </h1>

        {/* A margem lateral existe para a elipse caber: ela se estende para
            fora do texto, e sem isso era cortada nas pontas no celular. */}
        <div className="relative mt-8 mx-4 sm:mx-0">
          <p className="font-serifa text-titulo-tela text-roxo">
            De pessoas. Para pessoas.
          </p>
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-[50%] border-[3px] border-roxo opacity-85 [rotate:-3deg] sm:-inset-x-8"
          />
        </div>
      </section>

      <section
        id="a-dex"
        className="relative z-10 mx-auto max-w-3xl px-6 pb-24 text-center"
      >
        <p className="text-corpo-destaque text-papel/80">
          A DEX é um centro de construção e aceleração de perfis empreendedores
          que fomenta, através de mentorias, formações e rodas de conversas, o
          empreendedorismo no ambiente universitário.
        </p>
        <p className="mt-6 text-corpo text-neutro">
          Esta plataforma é interna, para quem está na Formação DEX. Se você
          quer conhecer o hub, o caminho é o Instagram.
        </p>
      </section>
    </main>
  );
}
