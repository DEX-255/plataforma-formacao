"use client";

import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

/**
 * Entrada por senha — **só em desenvolvimento**.
 *
 * Existe porque o OAuth do Google exige credenciais de um projeto do Google
 * Cloud, e sem elas nenhuma tela atrás do login pode ser aberta e conferida.
 *
 * **Isto não é uma porta dos fundos.** A sessão nasce por outro provedor, e
 * daí em diante o caminho é idêntico: passa por `/auth/retorno`, chama
 * `provisionar_acesso`, e a lista de autorizados (`RN-11`) continua valendo.
 * Uma conta com senha que não esteja na lista é recusada igual.
 *
 * Só é renderizado quando `NEXT_PUBLIC_LOGIN_LOCAL` vale `"1"`. Essa variável
 * não existe em produção, e `testes/guardas-auth.test.ts` falha se ela vazar
 * para `.env.example` ou para a configuração de deploy.
 */
export function LoginLocal() {
  const [email, setEmail] = useState("mentor@dex.local");
  const [senha, setSenha] = useState("dex-local");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setErro(null);

    const { error } = await clienteNavegador().auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro(error.message);
      setEntrando(false);
      return;
    }

    // Mesmo destino do retorno do Google: é lá que a lista é conferida.
    //
    // Navegação do navegador, não do router: `/auth/retorno` é um route
    // handler de servidor, e ele precisa receber o cookie de sessão que o
    // `signInWithPassword` acabou de gravar. `router.push()` faria navegação
    // de cliente e não executaria o handler.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/auth/retorno";
  }

  return (
    <form
      onSubmit={entrar}
      className="mt-8 rounded-campo border-2 border-dashed border-borda p-4"
    >
      <p className="font-mono font-bold text-rotulo uppercase text-neutro">
        desenvolvimento local
      </p>

      <div className="mt-3 flex flex-col gap-2">
        <input
          aria-label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-campo border-2 border-borda bg-superficie-alta px-3 py-2 text-corpo text-papel"
        />
        <input
          aria-label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="rounded-campo border-2 border-borda bg-superficie-alta px-3 py-2 text-corpo text-papel"
        />
        <button
          type="submit"
          disabled={entrando}
          className="min-h-toque rounded-pilula borda-dura border-borda-forte bg-papel px-4 py-2 font-sans font-bold text-corpo text-preto disabled:opacity-60"
        >
          {entrando ? "Entrando…" : "Entrar sem Google"}
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-2 text-secundario text-erro-claro">
          {erro}
        </p>
      )}
    </form>
  );
}
