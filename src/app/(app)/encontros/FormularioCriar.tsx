"use client";

import { useActionState, useState } from "react";
import { Botao, Campo, Selecao } from "@/componentes/ui";
import { FRAMEWORKS } from "@/dominio/frameworks";
import { confirmacaoDeCriacao } from "@/dominio/encontros";
import { criarEncontro, type ResultadoCriacao } from "./acoes";

/**
 * `RF-B1` — criar encontro.
 *
 * Fechado por padrão. A tela é lida muito mais vezes do que um encontro é
 * criado — uma vez por semana —, e um formulário sempre aberto empurraria a
 * lista para baixo justamente no celular, onde o mentor vem ver o encontro
 * da semana.
 *
 * Número e data vêm preenchidos com o palpite certo na quase totalidade das
 * vezes: o encontro seguinte, criado no dia em que aconteceu. `RF-B1` diz que
 * não há cronograma pré-cadastrado, então isso é sugestão e não trava nada.
 */
export function FormularioCriar({
  edicaoId,
  numeroSugerido,
}: {
  edicaoId: string;
  numeroSugerido: number;
}) {
  const [aberto, setAberto] = useState(false);
  const [resultado, acao, enviando] = useActionState<ResultadoCriacao | null, FormData>(
    async (anterior, dados) => {
      const r = await criarEncontro(anterior, dados);
      if (r.ok) setAberto(false);
      return r;
    },
    null,
  );

  const hoje = new Date().toISOString().slice(0, 10);

  if (!aberto) {
    return (
      <div className="flex flex-col gap-3">
        <Botao onClick={() => setAberto(true)} className="sm:self-start">
          Criar encontro
        </Botao>

        {/* A tela pergunta, a regra responde: RN-14 decide se faz sentido
            mandar atribuir eixos. */}
        {resultado?.ok && resultado.framework && (
          <p role="status" className="text-secundario text-sucesso">
            {confirmacaoDeCriacao(resultado.framework)}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="edicao" value={edicaoId} />

      <div className="grid gap-5 sm:grid-cols-[7rem_1fr]">
        <Campo
          id="numero"
          name="numero"
          rotulo="Número"
          type="number"
          min={1}
          step={1}
          required
          defaultValue={numeroSugerido}
          inputMode="numeric"
        />
        <Campo
          id="tema"
          name="tema"
          rotulo="Tema"
          required
          maxLength={120}
          placeholder="Modelos de Negócio"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          id="data"
          name="data"
          rotulo="Data"
          type="date"
          required
          defaultValue={hoje}
          auxilio="O dia em que o encontro aconteceu."
        />

        <Selecao
          id="framework"
          name="framework"
          rotulo="Framework"
          defaultValue="oratoria"
          auxilio="Define os eixos que os mentores vão observar."
        >
          {Object.values(FRAMEWORKS).map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
              {f.eixos.length > 0
                ? ` — ${f.eixos.map((e) => e.nome).join(", ")}`
                : " — encontro sem feedback individual"}
            </option>
          ))}
        </Selecao>
      </div>

      {resultado?.erro && (
        <p role="alert" className="text-secundario text-erro-claro">
          {resultado.erro}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Botao type="submit" disabled={enviando}>
          {enviando ? "Criando…" : "Criar em rascunho"}
        </Botao>
        <Botao variante="secundario" onClick={() => setAberto(false)}>
          Cancelar
        </Botao>
      </div>

      <p className="text-secundario text-neutro">
        O encontro nasce em <strong className="text-papel">rascunho</strong> e
        fica invisível para os participantes até você abrir.
      </p>
    </form>
  );
}
