"use client";

import { useActionState, useState } from "react";
import { Botao, Selecao } from "@/componentes/ui";
import type { Eixo } from "@/dominio/frameworks";
import type { Usuario } from "@/dominio/tipos";
import { salvarEixos, type ResultadoEixos } from "../../acoes";

const SEM_EIXO = "";

/**
 * `RF-B2` — quem observa o quê neste encontro.
 *
 * Os avisos são calculados enquanto a pessoa mexe, não depois de salvar: o
 * requisito diz "avisa, não bloqueia", e um aviso que só aparece na volta do
 * servidor chega tarde demais para mudar a decisão.
 *
 * A conferência de verdade — a que a tela do encontro mostra — vem de
 * `conferirAtribuicoes` no servidor. Aqui é o espelho dela para o rascunho que
 * ainda não foi enviado.
 */
export function FormularioEixos({
  encontroId,
  mentores,
  eixos,
  atual,
}: {
  encontroId: string;
  mentores: readonly Usuario[];
  eixos: readonly Eixo[];
  /** `mentor_id → eixo`, como está salvo agora. */
  atual: Record<string, string>;
}) {
  const [escolhas, setEscolhas] = useState<Record<string, string>>(() =>
    Object.fromEntries(mentores.map((m) => [m.id, atual[m.id] ?? SEM_EIXO])),
  );

  const [resultado, acao, enviando] = useActionState<ResultadoEixos | null, FormData>(
    salvarEixos,
    null,
  );

  const cobertos = new Set(Object.values(escolhas).filter(Boolean));
  const eixosSemMentor = eixos.filter((e) => !cobertos.has(e.id));
  const mentoresSemEixo = mentores.filter((m) => !escolhas[m.id]);

  return (
    <form action={acao} className="flex flex-col gap-8">
      <input type="hidden" name="encontro" value={encontroId} />

      <div className="flex flex-col gap-5">
        {mentores.map((m) => (
          <Selecao
            key={m.id}
            id={`eixo-${m.id}`}
            name={`eixo:${m.id}`}
            rotulo={m.nome}
            value={escolhas[m.id] ?? SEM_EIXO}
            onChange={(ev) =>
              setEscolhas((atual) => ({ ...atual, [m.id]: ev.target.value }))
            }
          >
            <option value={SEM_EIXO}>Sem eixo neste encontro</option>
            {eixos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </Selecao>
        ))}
      </div>

      {(eixosSemMentor.length > 0 || mentoresSemEixo.length > 0) && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-cartao border border-borda bg-superficie-alta p-5"
        >
          {eixosSemMentor.length > 0 && (
            <p className="text-secundario text-atencao">
              <strong>Sem mentor:</strong>{" "}
              {eixosSemMentor.map((e) => e.nome).join(", ")}. Ninguém vai
              observar esse eixo neste encontro.
            </p>
          )}

          {mentoresSemEixo.length > 0 && (
            <p className="text-secundario text-neutro">
              <strong className="text-papel">Sem eixo:</strong>{" "}
              {mentoresSemEixo.map((m) => m.nome).join(", ")}. Eles não vão
              registrar feedback aqui.
            </p>
          )}

          <p className="text-secundario text-neutro">
            Nenhum dos dois impede salvar. Às vezes falta mentor, e a
            alternativa a um eixo descoberto seria o encontro não acontecer.
          </p>
        </div>
      )}

      {resultado?.erro && (
        <p role="alert" className="text-secundario text-erro-claro">
          {resultado.erro}
        </p>
      )}

      <div>
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar atribuição"}
        </Botao>
      </div>

      <p className="text-secundario text-neutro">
        A atribuição vale só para este encontro. Na semana seguinte ela é feita
        de novo — quem observou Fala hoje pode observar Mensagem no próximo.
      </p>
    </form>
  );
}
