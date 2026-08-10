"use client";

import { useActionState, useRef, useEffect } from "react";
import { adicionarMembros, type ResultadoDaAdicao } from "./acoes";

/**
 * Cadastro de e-mails.
 *
 * Desenhado para os **dois** momentos de uso, que são opostos:
 *
 * 1. Antes da formação, sentado: colar uma coluna inteira da planilha.
 * 2. **No meio do encontro, em pé, com fila esperando:** alguém foi recusado
 *    porque entrou com a conta Google errada, e um mentor precisa liberar
 *    aquele e-mail agora.
 *
 * O segundo caso é o que dita o desenho: um campo, um botão, sem confirmação
 * em duas etapas, e o foco volta para o campo depois de salvar — porque pode
 * ter mais alguém na fila.
 */
export function Formulario({ edicaoId }: { edicaoId: string }) {
  const [resultado, acao, enviando] = useActionState<
    ResultadoDaAdicao | null,
    FormData
  >(adicionarMembros, null);

  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (resultado?.ok && resultado.adicionados > 0) {
      if (campo.current) campo.current.value = "";
      campo.current?.focus();
    }
  }, [resultado]);

  return (
    <form action={acao} className="flex flex-col gap-4">
      <input type="hidden" name="edicao" value={edicaoId} />

      <div className="flex flex-col gap-2">
        <label
          htmlFor="emails"
          className="font-mono font-bold text-rotulo uppercase text-papel"
        >
          E-mails
        </label>
        <p className="text-secundario text-neutro">
          Cole a coluna inteira da planilha, ou digite um só. Vírgula, ponto e
          vírgula e quebra de linha servem como separador.
        </p>
        <textarea
          id="emails"
          name="emails"
          ref={campo}
          rows={4}
          required
          placeholder={"ana@discente.ufg.br\nbruno@discente.ufg.br"}
          className="w-full rounded-campo border-2 border-borda bg-superficie-alta px-4 py-3 font-sans text-corpo text-papel placeholder:text-neutro focus:border-roxo focus:shadow-foco focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="papel"
            className="font-mono font-bold text-rotulo uppercase text-papel"
          >
            Papel
          </label>
          <select
            id="papel"
            name="papel"
            defaultValue="participante"
            className="min-h-toque rounded-campo border-2 border-borda bg-superficie-alta px-4 text-corpo text-papel focus:border-roxo focus:outline-none"
          >
            <option value="participante">Participante</option>
            <option value="mentor">Mentor</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="min-h-toque rounded-pilula borda-dura border-preto bg-roxo px-6 font-sans font-bold text-corpo text-papel shadow-botao-papel transition-[transform,box-shadow] duration-150 ease-saida hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-papel-hover active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo disabled:opacity-60 disabled:pointer-events-none"
        >
          {enviando ? "Adicionando…" : "Adicionar"}
        </button>
      </div>

      {resultado && (
        <div role="status" className="flex flex-col gap-1 text-secundario">
          {resultado.adicionados > 0 && (
            <p className="text-sucesso">
              {resultado.adicionados === 1
                ? "1 e-mail liberado. Peça para a pessoa tentar de novo."
                : `${resultado.adicionados} e-mails liberados.`}
            </p>
          )}
          {resultado.jaExistiam.length > 0 && (
            <p className="text-neutro">
              Já estavam na lista: {resultado.jaExistiam.join(", ")}
            </p>
          )}
          {resultado.invalidos.length > 0 && (
            <p className="text-atencao">
              Não parecem e-mail e ficaram de fora:{" "}
              {resultado.invalidos.join(", ")}
            </p>
          )}
          {resultado.erro && <p className="text-erro-claro">{resultado.erro}</p>}
        </div>
      )}
    </form>
  );
}
