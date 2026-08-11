import type { Encontro, FeedbackVisivel, StatusPresenca } from "./tipos";
import { eixosDe, acharEixo, type Eixo, type Framework } from "./frameworks";
import { encontroTemAvaliacao } from "./regras";

/**
 * A trajetória do participante — `RF-E1`, `RF-E2`, `RF-E3`.
 *
 * O ritmo aqui é o **oposto** do da tela do mentor. Lá é sequência e
 * velocidade; aqui é para ser lido devagar. É o que a pessoa leva para a semana
 * seguinte.
 *
 * Este arquivo trabalha exclusivamente com `FeedbackVisivel`, que não tem as
 * colunas do bloco interno. Isso é proposital e vale como barreira: se um dia
 * alguém precisar de `nota` aqui, o tipo não deixa — e é para não deixar.
 */

export type ItemDaTrajetoria = {
  id: string;
  numero: number;
  tema: string;
  data: string;
  framework: Framework;
  status: Encontro["status"];
  presenca: StatusPresenca | null;
  /** Quantos feedbacks **desta pessoa** já estão visíveis neste encontro. */
  feedbacks: number;
};

/**
 * Do mais recente para trás (`specs/04`).
 *
 * O encontro de ontem é o que a pessoa veio ler; o do mês passado ela já leu.
 * Ordem crescente faria o conteúdo novo afundar mais a cada semana.
 */
export function ordenarTrajetoria<T extends Pick<ItemDaTrajetoria, "numero">>(
  itens: readonly T[],
): T[] {
  return [...itens].sort((a, b) => b.numero - a.numero);
}

export type EstadoNaTrajetoria = {
  rotulo: string;
  tom: "roxo" | "sucesso" | "atencao" | "neutro";
  /** A frase que evita o vazio ambíguo. */
  explicacao: string;
  /** Se vale abrir o detalhe. */
  temConteudo: boolean;
};

/**
 * Como cada encontro se apresenta para quem participou.
 *
 * Três dos quatro casos existem para **impedir um vazio ambíguo**, que é o
 * jeito mais fácil de esta tela machucar alguém: uma pessoa que abre a
 * trajetória e vê um espaço em branco conclui que foi esquecida.
 */
export function estadoNaTrajetoria(
  encontro: Pick<Encontro, "status" | "framework">,
  feedbacks: number,
): EstadoNaTrajetoria {
  // RN-14 / RF-B5 — cumprido, e a tela não sugere que faltou nada.
  if (!encontroTemAvaliacao(encontro.framework)) {
    return {
      rotulo: "encontro cumprido",
      tom: "roxo",
      explicacao:
        "Este encontro não tem feedback individual — ele é de reflexão, e foi assim desde o desenho.",
      temConteudo: false,
    };
  }

  // RN-05 — o feedback existe, mas ainda não é seu para ler.
  if (encontro.status !== "liberado") {
    return {
      rotulo: "aguardando liberação",
      tom: "atencao",
      explicacao:
        "Os feedbacks deste encontro ainda não foram liberados. Eles aparecem aqui quando os mentores terminarem de escrever.",
      temConteudo: false,
    };
  }

  if (feedbacks === 0) {
    /**
     * **A plataforma registra, não produz** (`specs/01`).
     *
     * Uma versão anterior desta frase explicava a ausência como limitação de
     * cobertura — "cada mentor acompanha uma parte da turma por vez". Estava
     * errada de premissa: tudo aqui foi dito presencialmente, e sem conversa no
     * encontro não há o que registrar. Ausência de registro é ausência de
     * conversa, e isso é normal.
     *
     * Por isso a frase não pede desculpa, não promete que vem depois e não
     * inventa explicação. Ela diz o que é, e lembra o que esta tela guarda —
     * porque quem abre e vê vazio precisa entender o modelo, não ser
     * consolado.
     */
    return {
      rotulo: "sem registro",
      tom: "neutro",
      explicacao:
        "Nenhum feedback foi registrado para você neste encontro. Esta tela guarda o que os mentores falaram com você presencialmente — nada além disso.",
      temConteudo: false,
    };
  }

  return {
    rotulo: feedbacks === 1 ? "1 feedback" : `${feedbacks} feedbacks`,
    tom: "sucesso",
    explicacao: "",
    temConteudo: true,
  };
}

// ── Detalhe do encontro — RF-E2 ────────────────────────────────────────────

export type GrupoDeEixo = {
  eixo: Eixo | null;
  /** Quando o eixo não é achado no framework — dado antigo, não erro de tela. */
  eixoId: string;
  feedbacks: readonly FeedbackVisivel[];
};

/**
 * Agrupa por eixo — e **é isso que ensina o modelo**.
 *
 * Sem o agrupamento, três feedbacks lado a lado leem como três opiniões
 * concorrentes e a pessoa fica sem saber em qual acreditar. Com ele, fica claro
 * que cada mentor olhou uma coisa diferente — que é o desenho de avaliação da
 * DEX, e não uma coincidência de quem escreveu.
 *
 * A ordem dos grupos segue a do framework, não a de chegada: é a mesma ordem em
 * toda a formação, e o participante passa a reconhecer o modelo pela posição.
 */
export function agruparPorEixo(
  framework: Framework,
  feedbacks: readonly FeedbackVisivel[],
): GrupoDeEixo[] {
  const grupos: GrupoDeEixo[] = [];

  for (const eixo of eixosDe(framework)) {
    const desteEixo = feedbacks.filter((f) => f.eixo === eixo.id);
    if (desteEixo.length > 0) {
      grupos.push({ eixo, eixoId: eixo.id, feedbacks: desteEixo });
    }
  }

  // Eixo que não pertence mais ao framework não some da tela: o feedback foi
  // escrito e lido, e sumir com ele seria reescrever a história da pessoa.
  const conhecidos = new Set(grupos.map((g) => g.eixoId));
  for (const f of feedbacks) {
    if (conhecidos.has(f.eixo)) continue;
    conhecidos.add(f.eixo);
    grupos.push({
      eixo: acharEixo(framework, f.eixo) ?? null,
      eixoId: f.eixo,
      feedbacks: feedbacks.filter((x) => x.eixo === f.eixo),
    });
  }

  return grupos;
}

/**
 * `RF-E3` — o vazio explicativo.
 *
 * "Perfil vazio sem explicação, na primeira semana, faz a pessoa achar que o
 * sistema está quebrado ou que ela foi esquecida." É a primeira impressão que a
 * turma inteira tem do produto, e ela acontece uma vez só.
 */
export const TRAJETORIA_VAZIA = {
  titulo: "Sua trajetória começa aqui",
  linhas: [
    "Quando um mentor te der feedback num encontro, ele registra aqui o que falou com você — assinado, e sempre com uma sugestão prática do que fazer a seguir.",
    "Os feedbacks de um encontro são liberados todos de uma vez, uma vez por semana. Até lá esta tela fica assim.",
    "Esta tela é o registro do que aconteceu presencialmente, não um canal à parte. Nada aqui é nota ou classificação.",
  ],
} as const;

export const ROTULO_DE_PRESENCA: Record<StatusPresenca, string> = {
  presente: "presente",
  ausente: "ausente",
  justificado: "falta justificada",
};
