import type { Encontro, StatusEncontro, AtribuicaoEixo, Usuario } from "./tipos";
import { eixosDe, type Eixo, type Framework } from "./frameworks";
import { encontroTemAvaliacao } from "./regras";

/**
 * Ciclo de vida do encontro e atribuição de eixos.
 *
 * Fonte: `specs/02`, seção *Ciclo de vida do encontro*, e `RF-B1`…`RF-B5`.
 *
 * Fica fora de `regras.ts` pelo mesmo motivo que `membros.ts` e `acesso.ts`:
 * aquele arquivo é a casa das regras numeradas `RN-01`…`RN-18`, uma função por
 * regra. O ciclo de vida não é uma `RN` — é a máquina de estados de que várias
 * delas dependem. Misturar as duas coisas faria a numeração parar de significar
 * algo.
 */

// ── Transições ─────────────────────────────────────────────────────────────

/**
 * `rascunho → aberto → liberado`, e nada mais.
 *
 * Não há volta de `liberado` para `aberto` (`specs/02`): a liberação revelou
 * feedback e fechou a caixa anônima, e desfazer isso na tela não desfaz o que
 * as pessoas já leram.
 *
 * Esta função é a versão em TypeScript da regra. A versão que **de fato** a
 * garante é o gatilho `encontro_transicao` no banco — quem escreve por outro
 * caminho não passa por aqui.
 */
export function transicaoValida(de: StatusEncontro, para: StatusEncontro): boolean {
  return (
    (de === "rascunho" && para === "aberto") ||
    (de === "aberto" && para === "liberado")
  );
}

export function podeAbrir(encontro: Pick<Encontro, "status">): boolean {
  return transicaoValida(encontro.status, "aberto");
}

export function podeLiberar(encontro: Pick<Encontro, "status">): boolean {
  return transicaoValida(encontro.status, "liberado");
}

/** `RF-B3` — o que muda no mundo quando o encontro abre. */
export const CONSEQUENCIAS_DE_ABRIR = [
  "Os mentores passam a registrar feedback.",
  "A caixa anônima abre para os participantes.",
  "O encontro aparece na trajetória de quem participa.",
] as const;

// ── Atribuição de eixos ────────────────────────────────────────────────────

/** `RF-B2` — encontro sem avaliação pula a etapa inteira (`RN-14`). */
export function precisaAtribuirEixos(framework: Framework): boolean {
  return encontroTemAvaliacao(framework);
}

/**
 * O que dizer depois de criar — `RN-14`.
 *
 * Existe aqui, e não na tela, porque a primeira versão errou: a confirmação
 * mandava "atribua os eixos antes de abrir" mesmo num encontro `nenhum`, que
 * não tem eixo nenhum para atribuir. A frase inventava uma etapa faltando —
 * exatamente o que a regra proíbe. Regra que a tela decide sozinha é regra que
 * ninguém testa.
 */
export function confirmacaoDeCriacao(framework: Framework): string {
  return precisaAtribuirEixos(framework)
    ? "Encontro criado em rascunho. Atribua os eixos antes de abrir."
    : "Encontro criado em rascunho. Ele não tem eixos — abra quando acontecer.";
}

export type ConferenciaDeEixos = {
  /** Eixo do framework que ninguém vai observar neste encontro. */
  eixosSemMentor: readonly Eixo[];
  /** Mentor da edição que não recebeu eixo neste encontro. */
  mentoresSemEixo: readonly Usuario[];
  /** Mentores cujo eixo atribuído não pertence ao framework do encontro. */
  eixosForaDoFramework: readonly AtribuicaoEixo[];
};

/**
 * `RF-B2` — **avisa, não bloqueia.**
 *
 * Deixar um eixo descoberto é decisão legítima: às vezes falta mentor, e a
 * alternativa a um eixo sem dono é o encontro não abrir. O que não pode é isso
 * acontecer sem ninguém ver — na semana seguinte a lacuna já virou fato.
 */
export function conferirAtribuicoes(
  framework: Framework,
  mentores: readonly Usuario[],
  atribuicoes: readonly AtribuicaoEixo[],
): ConferenciaDeEixos {
  if (!precisaAtribuirEixos(framework)) {
    return { eixosSemMentor: [], mentoresSemEixo: [], eixosForaDoFramework: [] };
  }

  const eixos = eixosDe(framework);
  const eixosValidos = new Set(eixos.map((e) => e.id));
  const eixosCobertos = new Set(atribuicoes.map((a) => a.eixo));
  const mentoresComEixo = new Set(atribuicoes.map((a) => a.mentor_id));

  return {
    eixosSemMentor: eixos.filter((e) => !eixosCobertos.has(e.id)),
    mentoresSemEixo: mentores.filter((m) => !mentoresComEixo.has(m.id)),
    eixosForaDoFramework: atribuicoes.filter((a) => !eixosValidos.has(a.eixo)),
  };
}

export function atribuicaoEstaCompleta(conferencia: ConferenciaDeEixos): boolean {
  return (
    conferencia.eixosSemMentor.length === 0 &&
    conferencia.eixosForaDoFramework.length === 0
  );
}

// ── Lista ──────────────────────────────────────────────────────────────────

/**
 * `RF-B1` — o encontro é criado quando acontece, então o número seguinte é
 * sugestão, não cronograma. Não existe lista pré-cadastrada para consultar.
 */
export function proximoNumero(encontros: readonly Pick<Encontro, "numero">[]): number {
  return encontros.reduce((maior, e) => Math.max(maior, e.numero), 0) + 1;
}

/**
 * `/encontros` — "havendo encontro aberto, ele aparece no topo com destaque"
 * (`specs/04`). O resto desce em ordem decrescente: o trabalho da semana está
 * sempre no alto, e o histórico fica abaixo.
 */
export function ordenarEncontros<T extends Pick<Encontro, "numero" | "status">>(
  encontros: readonly T[],
): T[] {
  return [...encontros].sort((a, b) => {
    if (a.status === "aberto" && b.status !== "aberto") return -1;
    if (b.status === "aberto" && a.status !== "aberto") return 1;
    return b.numero - a.numero;
  });
}

export function encontroAberto<T extends Pick<Encontro, "status">>(
  encontros: readonly T[],
): T | null {
  return encontros.find((e) => e.status === "aberto") ?? null;
}

// ── Como o estado é dito ───────────────────────────────────────────────────

export type Estado = {
  rotulo: string;
  tom: "roxo" | "sucesso" | "atencao" | "neutro";
  /** Frase de apoio na lista. Vazia quando o rótulo já basta. */
  detalhe: string;
};

/**
 * `RN-14` / `RF-B5` — **o encontro sem avaliação é cumprido, não incompleto.**
 *
 * Aqui é onde a regra vive ou morre. Perfil Empreendedor não tem avaliação
 * individual por desenho: o objetivo é reflexão pessoal. Se a tela disser
 * "aguardando feedback" ou "0 de 50", ela mente sobre a dinâmica e ensina o
 * mentor a preencher o que não observou — que é exatamente o enchimento que
 * `RN-15` existe para evitar.
 *
 * Por isso `nenhum` tem rótulo próprio em vez de reaproveitar o de `liberado`
 * com uma contagem zerada.
 */
export function estadoDoEncontro(
  encontro: Pick<Encontro, "status" | "framework">,
): Estado {
  if (!encontroTemAvaliacao(encontro.framework)) {
    if (encontro.status === "rascunho") {
      return {
        rotulo: "rascunho",
        tom: "neutro",
        detalhe: "Ainda invisível para os participantes.",
      };
    }
    return {
      rotulo: "sem avaliação",
      tom: "roxo",
      detalhe: "Encontro cumprido. Este não tem feedback individual por desenho.",
    };
  }

  switch (encontro.status) {
    case "rascunho":
      return {
        rotulo: "rascunho",
        tom: "neutro",
        detalhe: "Ainda invisível para os participantes.",
      };
    case "aberto":
      return {
        rotulo: "aberto",
        tom: "atencao",
        detalhe: "Mentores registrando. Caixa anônima aberta.",
      };
    case "liberado":
      return {
        rotulo: "liberado",
        tom: "sucesso",
        detalhe: "Os participantes já leram o feedback deste encontro.",
      };
  }
}
