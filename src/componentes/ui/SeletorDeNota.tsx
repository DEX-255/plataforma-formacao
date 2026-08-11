"use client";

import type { Nivel, Framework } from "@/dominio/frameworks";
import { auxilioDeCalibragem, EXPECTATIVA_DA_ESCALA } from "@/dominio/frameworks";

/**
 * Seletor de nota — `specs/05`, `RF-D3`, `RN-07`, `RN-16`.
 *
 * "É componente, não input genérico" — e a razão é que ele carrega três regras
 * que um `<select>` de 1 a 5 perderia:
 *
 * **`RN-07`** — "não observado" é o sexto alvo, ao lado dos números, e não uma
 * caixa de marcar. Caixa lê como *pular*; alvo lê como *veredito*. A diferença
 * é o que impede o gráfico de mentir depois, misturando "avaliei 3" com "não
 * tive como observar".
 *
 * **`RF-D3`** — escolhido o nível, o descritor daquele eixo aparece na tela. O
 * mentor lê "2 — Muletas dominantes: há um vício sonoro recorrente…" em vez de
 * escolher um número no vazio. Onde os descritores ainda não foram escritos
 * (bomba, negociação), cai para "o que observar" — caso normal, não erro.
 *
 * **`RN-16`** — a escala é assimétrica por desenho. Sem dizer isso na hora de
 * pontuar, cada mentor calibra por conta própria e a nota perde a
 * comparabilidade entre pessoas, que é a única coisa que ela existe para dar.
 */

const NIVEIS: Nivel[] = [1, 2, 3, 4, 5];

type Props = {
  framework: Framework;
  eixo: string;
  nota: number | null;
  naoObservado: boolean;
  onChange: (valor: { nota: number | null; naoObservado: boolean }) => void;
};

export function SeletorDeNota({
  framework,
  eixo,
  nota,
  naoObservado,
  onChange,
}: Props) {
  const auxilio =
    nota !== null ? auxilioDeCalibragem(framework, eixo, nota as Nivel) : null;

  return (
    <div className="flex flex-col gap-3">
      <p
        id="rotulo-nota"
        className="font-mono font-bold text-rotulo uppercase text-papel"
      >
        Nota
      </p>

      <div
        role="radiogroup"
        aria-labelledby="rotulo-nota"
        className="flex flex-wrap gap-2"
      >
        {NIVEIS.map((n) => {
          const escolhido = nota === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={escolhido}
              onClick={() => onChange({ nota: n, naoObservado: false })}
              className={[
                "flex size-toque items-center justify-center",
                "rounded-campo borda-dura font-display font-extrabold text-titulo-secao",
                "transition-colors duration-150",
                escolhido
                  ? "border-roxo bg-roxo text-papel"
                  : "border-borda bg-superficie-alta text-neutro hover:border-borda-forte hover:text-papel",
              ].join(" ")}
            >
              {n}
            </button>
          );
        })}

        {/* RN-07 — um valor de nota, não a ausência dela. Por isso mora no
            mesmo grupo dos números, e não separado como uma exceção. */}
        <button
          type="button"
          role="radio"
          aria-checked={naoObservado}
          onClick={() => onChange({ nota: null, naoObservado: true })}
          className={[
            "flex min-h-toque items-center justify-center px-4",
            "rounded-campo borda-dura text-secundario",
            "transition-colors duration-150",
            naoObservado
              ? "border-roxo bg-roxo/20 text-papel"
              : "border-borda bg-superficie-alta text-neutro hover:border-borda-forte hover:text-papel",
          ].join(" ")}
        >
          não observado
        </button>
      </div>

      {/* RF-D3 — o descritor entra na tela no momento da escolha. */}
      {auxilio && nota !== null && (
        <div className="flex flex-col gap-2 rounded-campo border border-borda bg-superficie-alta p-4">
          {auxilio.tipo === "descritor" ? (
            <>
              <p className="font-display font-semibold text-corpo-destaque text-papel">
                {auxilio.descritor.nivel} — {auxilio.descritor.titulo}
              </p>
              <p className="text-secundario text-neutro">
                {auxilio.descritor.texto}
              </p>
            </>
          ) : (
            <>
              <p className="font-mono font-bold text-rotulo uppercase text-neutro">
                O que observar
              </p>
              <ul className="flex flex-col gap-1 text-secundario text-neutro">
                {auxilio.itens.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </>
          )}

          {/* RN-16 — dito na hora de pontuar, não numa página de ajuda. */}
          <p className="text-secundario text-atencao">
            {EXPECTATIVA_DA_ESCALA[nota as Nivel]}
          </p>
        </div>
      )}

      {naoObservado && (
        <p className="text-secundario text-neutro">
          Registrado como <strong className="text-papel">não observado</strong>.
          É diferente de deixar em branco: diz que você não teve como observar
          este eixo, e o gráfico da pessoa não vai tratar isso como nota baixa.
        </p>
      )}
    </div>
  );
}
