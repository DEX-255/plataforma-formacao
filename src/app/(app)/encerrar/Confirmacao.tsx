"use client";

import { useActionState, useState } from "react";
import { Botao, Campo } from "@/componentes/ui";
import {
  confirmacaoConfere,
  PALAVRA_DE_CONFIRMACAO,
} from "@/dominio/encerramento";
import { encerrarEdicao, type ResultadoDoEncerramento } from "./acoes";

/**
 * A confirmação — mesma fricção proposital da liberação, pela mesma razão: um
 * botão sozinho não separa "cliquei sem ler" de "eu quis".
 *
 * Aqui o gesto atinge a turma inteira e não tem volta, então digitar a palavra
 * obriga a passar os olhos no que está escrito acima.
 */
export function Confirmacao({ edicaoId }: { edicaoId: string }) {
  const [palavra, setPalavra] = useState("");
  const [resultado, acao, enviando] = useActionState<
    ResultadoDoEncerramento | null,
    FormData
  >(encerrarEdicao, null);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="edicao" value={edicaoId} />

      <Campo
        id="confirmacao"
        name="confirmacao"
        rotulo={`Escreva ${PALAVRA_DE_CONFIRMACAO} para confirmar`}
        auxilio="Depois disso, a turma inteira perde o acesso."
        autoComplete="off"
        autoCapitalize="characters"
        value={palavra}
        onChange={(e) => setPalavra(e.target.value)}
        erro={resultado?.erro}
      />

      <div>
        <Botao
          type="submit"
          disabled={!confirmacaoConfere(palavra) || enviando}
        >
          {enviando ? "Encerrando…" : "Encerrar a edição"}
        </Botao>
      </div>
    </form>
  );
}
