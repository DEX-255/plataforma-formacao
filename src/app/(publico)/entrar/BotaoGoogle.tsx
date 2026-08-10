"use client";

import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

/**
 * O único lugar do produto que usa o cliente de navegador para autenticação —
 * o redirecionamento do OAuth precisa acontecer aqui.
 *
 * É componente de cliente porque tem interação de verdade (`D-02`): um clique
 * que dispara redirecionamento e um estado de "autenticando" que precisa
 * aparecer antes de a página sair.
 */
export function BotaoGoogle() {
  const [autenticando, setAutenticando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function entrar() {
    setAutenticando(true);
    setFalhou(false);

    const { error } = await clienteNavegador().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/retorno` },
    });

    if (error) {
      setAutenticando(false);
      setFalhou(true);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={entrar}
        disabled={autenticando}
        className={[
          "inline-flex min-h-toque items-center justify-center gap-3 px-6 py-4",
          "font-sans font-bold text-corpo",
          "bg-roxo text-papel",
          // Sombra em papel, não preta: o botão já é roxo e está sobre fundo
          // escuro. A regra de specs/05 é a sombra contrastar com o que está
          // atrás — preta aqui não deslocaria nada.
          "rounded-pilula borda-dura border-preto shadow-botao-papel",
          "transition-[transform,box-shadow] duration-150 ease-saida",
          "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-papel-hover",
          "active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo",
          "disabled:opacity-60 disabled:pointer-events-none",
        ].join(" ")}
      >
        {autenticando ? "Abrindo o Google…" : "Entrar com Google"}
      </button>

      {falhou && (
        <p role="alert" className="text-secundario text-erro-claro">
          Não consegui abrir o Google. Verifique a conexão e tente de novo.
        </p>
      )}
    </div>
  );
}
