"use client";

import { useActionState, useState } from "react";
import { Botao, Campo } from "@/componentes/ui";
import { liberarEncontro, type ResultadoDaLiberacao } from "./acoes";

/**
 * A confirmação — `RF-B4`, "irreversível, e a confirmação diz isso".
 *
 * Exige digitar LIBERAR. Um botão sozinho não separa "cliquei sem ler" de "eu
 * quis": o gesto é idêntico. Digitar obriga a passar os olhos no que está
 * escrito acima, e é a única fricção do produto que existe **de propósito** —
 * em todo o resto a fricção é inimiga.
 *
 * A palavra é conferida de novo no servidor. Aqui ela só habilita o botão, para
 * o estado da tela combinar com o que vai acontecer.
 */
export function Confirmacao({ encontroId }: { encontroId: string }) {
  const [palavra, setPalavra] = useState("");
  const [resultado, acao, enviando] = useActionState<
    ResultadoDaLiberacao | null,
    FormData
  >(liberarEncontro, null);

  const confirmado = palavra.trim().toLocaleUpperCase("pt-BR") === "LIBERAR";

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="encontro" value={encontroId} />

      <Campo
        id="confirmacao"
        name="confirmacao"
        rotulo="Escreva LIBERAR para confirmar"
        auxilio="Só para garantir que não foi toque sem querer."
        autoComplete="off"
        autoCapitalize="characters"
        value={palavra}
        onChange={(e) => setPalavra(e.target.value)}
        erro={resultado?.erro}
      />

      <div>
        <Botao type="submit" disabled={!confirmado || enviando}>
          {enviando ? "Liberando…" : "Liberar o encontro"}
        </Botao>
      </div>
    </form>
  );
}
