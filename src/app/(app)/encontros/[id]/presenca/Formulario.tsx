"use client";

import { useActionState, useState } from "react";
import { Botao } from "@/componentes/ui";
import {
  ESTADOS_DE_PRESENCA,
  ROTULO_CURTO,
  marcarTodosPresentes,
  alternarStatus,
  resumoDePresenca,
  type MarcacaoDePresenca,
} from "@/dominio/presenca";
import type { StatusPresenca } from "@/dominio/tipos";
import { salvarPresenca, type ResultadoDaPresenca } from "./acoes";

/**
 * `RF-C1` — a marcação em massa é o fluxo principal, não um atalho.
 *
 * O caminho real é o mentor abrir a lista no fim do encontro e **desmarcar três
 * pessoas**. "Todos presentes" fica em cima, grande, antes da lista; marcar um
 * por um continua possível e é o caso de exceção.
 *
 * Construir o contrário transformaria trinta segundos em três minutos, e o
 * mentor pararia de marcar — que devolve o problema inteiro: sem presença, a
 * cobertura vira alarme falso toda semana.
 */
export function Formulario({
  encontroId,
  inicial,
}: {
  encontroId: string;
  inicial: readonly MarcacaoDePresenca[];
}) {
  const [linhas, setLinhas] = useState<MarcacaoDePresenca[]>([...inicial]);
  const [resultado, acao, enviando] = useActionState<
    ResultadoDaPresenca | null,
    FormData
  >(salvarPresenca, null);

  const resumo = resumoDePresenca(linhas);

  return (
    <form action={acao} className="flex flex-col gap-6 pb-28">
      <input type="hidden" name="encontro" value={encontroId} />

      <div className="flex flex-col gap-3">
        <Botao
          variante="secundario"
          onClick={() => setLinhas(marcarTodosPresentes(linhas))}
          className="sm:self-start"
        >
          Todos presentes
        </Botao>
        <p className="text-secundario text-neutro">
          Depois é só corrigir quem faltou — costuma ser mais rápido que marcar
          um por um.
        </p>
      </div>

      <p className="text-secundario text-neutro" role="status">
        {resumo.presentes} presentes · {resumo.ausentes} ausentes ·{" "}
        {resumo.justificados} justificadas
        {resumo.semMarcar > 0 && ` · ${resumo.semMarcar} sem marcar`}
      </p>

      <ul className="flex flex-col gap-2">
        {linhas.map((l) => (
          <li
            key={l.participacaoId}
            className="flex min-h-toque-lista flex-col gap-3 rounded-campo border border-borda bg-superficie px-4 py-3 sm:flex-row sm:items-center"
          >
            <span className="flex-1 truncate text-corpo text-papel">
              {l.nome}
            </span>

            <input
              type="hidden"
              name={`presenca:${l.participacaoId}`}
              value={l.status ?? ""}
            />

            <div
              role="radiogroup"
              aria-label={`Presença de ${l.nome}`}
              className="flex gap-2"
            >
              {ESTADOS_DE_PRESENCA.map((estado) => {
                const escolhido = l.status === estado;
                return (
                  <button
                    key={estado}
                    type="button"
                    role="radio"
                    aria-checked={escolhido}
                    onClick={() =>
                      setLinhas(
                        alternarStatus(
                          linhas,
                          l.participacaoId,
                          estado as StatusPresenca,
                        ),
                      )
                    }
                    className={[
                      "min-h-toque flex-1 rounded-pilula px-4 text-secundario",
                      "borda-dura transition-colors duration-150 sm:flex-none",
                      escolhido
                        ? estado === "presente"
                          ? "border-sucesso bg-sucesso/20 text-papel"
                          : "border-atencao bg-atencao/20 text-papel"
                        : "border-borda bg-superficie-alta text-neutro hover:border-borda-forte hover:text-papel",
                    ].join(" ")}
                  >
                    {ROTULO_CURTO[estado]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {resultado?.erro && (
        <p role="alert" className="text-secundario text-erro-claro">
          {resultado.erro}
        </p>
      )}

      {/* specs/05, Mobile: a ação principal fica fixa no rodapé. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-2xl">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex min-h-toque flex-1 items-center justify-center rounded-pilula borda-dura border-preto bg-roxo px-6 py-3 font-sans font-bold text-corpo text-papel shadow-botao transition-[transform,box-shadow] duration-150 ease-saida hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-hover active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo disabled:pointer-events-none disabled:opacity-50"
          >
            {enviando ? "Salvando…" : "Salvar presença"}
          </button>
        </div>
      </div>
    </form>
  );
}
