"use client";

import { useActionState } from "react";
import { Botao, CampoTexto } from "@/componentes/ui";
import { AVISO_SEM_RECUPERAR } from "@/dominio/caixa";
import { enviarMensagem, type ResultadoDoEnvio } from "./acoes";

/**
 * `RF-F1` — um campo, um botão.
 *
 * Não guarda rascunho local, ao contrário do formulário de feedback (`D-03`).
 * É deliberado: o rascunho ficaria no aparelho ligando a pessoa ao texto, que é
 * exatamente o vínculo que o resto do sistema se esforça para não ter. Aqui a
 * mensagem é curta e escrita de uma vez; perder um parágrafo é menos grave que
 * deixar uma cópia identificável no celular.
 */
export function Formulario({ encontroId }: { encontroId: string }) {
  const [resultado, acao, enviando] = useActionState<
    ResultadoDoEnvio | null,
    FormData
  >(enviarMensagem, null);

  if (resultado?.ok) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-cartao borda-dura border-roxo bg-superficie-alta p-6"
      >
        <p className="font-display font-semibold text-titulo-secao text-papel">
          Mensagem enviada.
        </p>
        <p className="text-corpo text-neutro">
          Ela chega aos mentores junto com as outras, quando este encontro for
          liberado.
        </p>
        <p className="text-secundario text-neutro">{AVISO_SEM_RECUPERAR}</p>
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="encontro" value={encontroId} />

      <CampoTexto
        id="texto"
        name="texto"
        rotulo="Sua mensagem"
        auxilio="Sobre os mentores de hoje, a dinâmica, a formação. O que você quiser."
        rows={6}
        maxLength={2000}
        erro={resultado?.erro}
      />

      <p className="text-secundario text-neutro">{AVISO_SEM_RECUPERAR}</p>

      <div>
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar anonimamente"}
        </Botao>
      </div>
    </form>
  );
}
