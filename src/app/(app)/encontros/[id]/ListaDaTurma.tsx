"use client";

import { useState } from "react";
import Link from "next/link";
import { Chip } from "@/componentes/ui";
import { filtrarPorNome, ordenarTurma, type LinhaDaTurma } from "@/dominio/painel";

/**
 * A lista da turma — `RF-D5`.
 *
 * Componente de cliente **só por causa da busca**. Nada do bloco interno chega
 * aqui: `LinhaDaTurma` tem nome, contagem e se eu já escrevi. A nota e a
 * observação interna não atravessam a fronteira, e há teste de guarda para
 * isso.
 *
 * A ordenação vem de `ordenarTurma`, não daqui — é regra, não apresentação.
 */
export function ListaDaTurma({
  encontroId,
  linhas,
}: {
  encontroId: string;
  linhas: readonly LinhaDaTurma[];
}) {
  const [busca, setBusca] = useState("");
  const visiveis = ordenarTurma(filtrarPorNome(linhas, busca));

  return (
    <div className="flex flex-col gap-4">
      {/* specs/05, Mobile: "busca da turma fixa no topo, sem sumir com o
          scroll". Numa turma de cinquenta, rolar até a busca é o que faz o
          mentor desistir de procurar e simplesmente pegar o próximo da lista. */}
      <div className="sticky top-0 z-10 -mx-5 bg-fundo px-5 py-3 sm:-mx-6 sm:px-6">
        <label htmlFor="busca-turma" className="sr-only">
          Buscar participante pelo nome
        </label>
        <input
          id="busca-turma"
          type="search"
          inputMode="search"
          placeholder="Buscar pelo nome"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="min-h-toque w-full rounded-campo border-2 border-borda bg-superficie-alta px-4 py-3 font-sans text-corpo text-papel placeholder:text-neutro transition-[border-color,box-shadow] duration-150 ease-saida focus:border-roxo focus:shadow-foco focus:outline-none"
        />
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-cartao border border-borda bg-superficie p-5 text-corpo text-neutro">
          Ninguém com esse nome na turma.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((l) => (
            <li key={l.participacaoId}>
              <Link
                href={`/encontros/${encontroId}/feedback/${l.participacaoId}`}
                /* Sem destaque por borda em quem está descoberto: no começo do
                   encontro a turma inteira está em zero, e tudo destacado é
                   nada destacado. Quem precisa de atenção já é dito três
                   vezes — pela posição no topo, pelo "ninguém escreveu ainda"
                   e pela contagem no cabeçalho da seção. */
                className="flex min-h-toque-lista items-center gap-3 rounded-campo border border-borda bg-superficie px-4 py-3 transition-colors duration-150 hover:border-borda-forte"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-corpo text-papel">
                    {l.nome}
                  </span>
                  <span className="block text-secundario text-neutro">
                    {l.recebidos === 0
                      ? "ninguém escreveu ainda"
                      : l.recebidos === 1
                        ? "1 feedback"
                        : `${l.recebidos} feedbacks`}
                  </span>
                </span>

                {/* Estado nunca é só cor: a palavra vai escrita. */}
                {l.euEscrevi ? (
                  <Chip tom="sucesso">escrevi</Chip>
                ) : (
                  <Chip tom="neutro">falta</Chip>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
