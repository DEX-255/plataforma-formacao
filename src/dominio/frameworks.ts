import type { Database } from "./banco";

/**
 * Frameworks de avaliação — dado, não código espalhado.
 *
 * Fonte: `dominio/papeis-avaliacao-oratoria.md`, `dominio/rubrica-notas-oratoria.md`
 * e `dominio/frameworks-dinamicas.md`. Esses documentos têm precedência sobre
 * este arquivo: divergindo, eles vencem e este arquivo é que está errado.
 *
 * Acrescentar o framework de Gestão Ágil ⏳ é acrescentar uma entrada aqui.
 * Nenhuma tela muda, e o banco não precisa de migração — `eixo` é `text`, não
 * `enum`, exatamente por isso.
 */

export type Framework = Database["public"]["Enums"]["framework"];

export type Nivel = 1 | 2 | 3 | 4 | 5;

export type Descritor = {
  nivel: Nivel;
  titulo: string;
  texto: string;
};

export type Eixo = {
  /** Vai para a coluna `feedback.eixo`. */
  id: string;
  nome: string;
  /** A pergunta que o mentor carrega enquanto observa. */
  perguntaAncora: string;
  /** Mostrado quando ainda não há descritores escritos (RF-D3). */
  oQueObservar: string[];
  /** Ausente enquanto os níveis não forem escritos. Ver pendencias.md. */
  descritores?: readonly Descritor[];
};

export type DefinicaoFramework = {
  id: Framework;
  nome: string;
  eixos: readonly Eixo[];
  /** Aviso exibido ao mentor; existe onde o desfecho tenta se passar por nota. */
  guardaResultado?: string;
  /** Oratória se repete e vira linha; as outras acontecem uma vez e viram retrato. */
  forma: "linha" | "retrato" | "nenhuma";
};

// ═══════════════════════════════════════════════════════════════════════════
// Oratória — cinco encontros. A única que vira linha de evolução.
// ═══════════════════════════════════════════════════════════════════════════

const MENSAGEM: Eixo = {
  id: "mensagem",
  nome: "Mensagem",
  perguntaAncora: "Isso sobreviveria à transcrição?",
  oQueObservar: [
    "Existe uma tese, ou só um tema?",
    "A abertura conquista e o fechamento conclui?",
    "Os blocos têm transição entre si?",
    "Dado e história equilibrados para aquele público?",
    "O tempo foi cumprido?",
  ],
  descritores: [
    {
      nivel: 1,
      titulo: "Sem estrutura",
      texto:
        "Sequência de tópicos sem ligação; não é possível dizer qual era a ideia central. Abertura protocolar, fechamento por interrupção. Tempo estourado ou muito abaixo. Slides lidos em voz alta.",
    },
    {
      nivel: 2,
      titulo: "Tema sem tese",
      texto:
        "Dá para dizer sobre o que era, não o que estava sendo defendido. Os blocos existem, mas a fala salta entre eles sem transição. Abre bem ou fecha bem, nunca os dois. Abstração desregulada: ou só jargão, ou só generalidade.",
    },
    {
      nivel: 3,
      titulo: "Tese presente, execução irregular",
      texto:
        "Existe uma ideia central identificável e ela reaparece ao longo da fala. Abertura e fechamento cumprem sua função. Parte dos blocos tem transição. Usa dado ou história, raramente os dois. Tempo cumprido com aperto.",
    },
    {
      nivel: 4,
      titulo: "Argumento construído",
      texto:
        "A tese atravessa a fala inteira e cada bloco serve a ela. A abertura conquista os primeiros 30 segundos; o fechamento conclui em vez de apenas parar. Dado e história equilibrados. Abstração calibrada. No Q&A, responde o que foi perguntado.",
    },
    {
      nivel: 5,
      titulo: "Sobrevive à transcrição",
      texto:
        "Lido no papel, sem voz e sem corpo, o texto se sustenta e convence. O que ficou de fora foi escolha, não esquecimento. O Q&A aprofunda a tese. Os slides poderiam cair e a fala continuaria de pé.",
    },
  ],
};

const FALA: Eixo = {
  id: "fala",
  nome: "Fala",
  perguntaAncora: "De olhos fechados, o que eu ouço?",
  oQueObservar: [
    "As pausas são reais ou preenchidas com som?",
    "Há muleta verbal recorrente?",
    "Hedges corroendo a autoridade do que é dito?",
    "A entonação varia conforme o conteúdo?",
    "As frases terminam?",
  ],
  descritores: [
    {
      nivel: 1,
      titulo: "O silêncio não existe",
      texto:
        "Toda pausa é preenchida com som. Muletas verbais em quase toda frase. Ritmo único, ditado pelo nervosismo. O final da frase morre; trechos se perdem por projeção ou dicção.",
    },
    {
      nivel: 2,
      titulo: "Muletas dominantes",
      texto:
        "Há um vício sonoro ou verbal recorrente que atrapalha acompanhar o raciocínio. Hedges frequentes corroendo a autoridade do que está sendo dito. Entonação monótona. Ouve-se o texto, mas com esforço.",
    },
    {
      nivel: 3,
      titulo: "Audível e limpo o bastante",
      texto:
        "As muletas aparecem, mas não bloqueiam. Existem pausas reais, ainda que não intencionais — surgem do raciocínio, não do desenho. Projeção e dicção resolvidas. Entonação varia pouco. As frases terminam.",
    },
    {
      nivel: 4,
      titulo: "Voz a serviço do texto",
      texto:
        "Pausa usada de propósito, antes ou depois do que importa. Muletas residuais e não recorrentes. O ritmo varia conforme o conteúdo: acelera no exemplo, desacelera na tese. Ênfase distribuída.",
    },
    {
      nivel: 5,
      titulo: "Prosódia intencional",
      texto:
        "O silêncio é ferramenta e sustenta tensão. A entonação desenha a hierarquia da informação — dá para ouvir o que é tese e o que é parêntese. Não há o que retirar.",
    },
  ],
};

const PRESENCA: Eixo = {
  id: "presenca",
  nome: "Presença",
  perguntaAncora: "Para onde aponta a atenção do palestrante?",
  oQueObservar: [
    "A base é firme, ou há balanço e marcha contínua?",
    "As mãos gesticulam ou estão ocupadas com objeto de conforto?",
    "O olhar pousa em pessoas e volta?",
    "Percebe a queda de atenção da sala e reage?",
    "Recebe interrupção e discordância sem defensividade?",
  ],
  descritores: [
    {
      nivel: 1,
      titulo: "Atenção presa para dentro",
      texto:
        "Balanço, dança ou marcha contínua. Mãos ocupadas com objeto de conforto ou presas. Olhar no chão, no slide ou no notebook. Não percebe a sala.",
    },
    {
      nivel: 2,
      titulo: "Corpo instável, plateia ausente",
      texto:
        "A base alterna entre firme e balanço. Os gestos existem, mas não acompanham o que está sendo dito. Contato visual fixo em uma pessoa só, ou varrendo sem pousar. Segue o roteiro mesmo com a sala tendo caído.",
    },
    {
      nivel: 3,
      titulo: "Base resolvida",
      texto:
        "Fica de pé sem se balançar; o deslocamento não é descarga de nervosismo. Gestos soltos, ainda genéricos. Contato visual distribuído, ainda que breve. Percebe a queda de atenção, mas não sabe o que fazer com ela.",
    },
    {
      nivel: 4,
      titulo: "Corpo como instrumento",
      texto:
        "O deslocamento marca transição de bloco. O gesto ilustra o conteúdo. O olhar pousa em pessoas e volta. Percebe a sala e reage. Recebe interrupção e discordância sem defensividade.",
    },
    {
      nivel: 5,
      titulo: "Conduz a sala",
      texto:
        "Lê a plateia em tempo real e ajusta sem que o ajuste apareça. O silêncio corporal é tão intencional quanto o gesto. Interrupção vira material. A atenção da sala é gerenciada, não torcida.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Bomba em dupla — o eixo também identifica o PAPEL do participante.
// ═══════════════════════════════════════════════════════════════════════════

const MANUAL: Eixo = {
  id: "manual",
  nome: "Papel A — quem tem o manual",
  perguntaAncora: "Ele adaptou a informação a quem estava do outro lado?",
  oQueObservar: [
    "Diagnosticou antes de instruir, ou despejou o manual?",
    "Usou o vocabulário de quem executa, ou o jargão do documento?",
    "Uma instrução por vez com verificação, ou bloco de cinco passos?",
    "Pediu confirmação, ou assumiu que foi entendido?",
    "Separou o que era crítico do que era detalhe?",
    "Com o relógio apertando: acelerou atropelando, ou manteve o método?",
    "Quando o outro errou: culpou, assumiu que a instrução falhou, ou reformulou?",
  ],
};

const EXECUTOR: Eixo = {
  id: "executor",
  nome: "Papel B — quem tem a bomba",
  perguntaAncora: "Ele tornou fácil ser ajudado?",
  oQueObservar: [
    "Descreveu o que via com especificidade útil?",
    "Executou o que foi dito, ou o que achou que foi dito?",
    "Pediu repetição, ou fingiu ter entendido para não atrasar?",
    "Agiu antes da instrução terminar, por ansiedade?",
    "Ao errar: travou, escondeu, ou avisou na hora?",
    "Sinalizou quando a instrução não batia com a realidade dele?",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Negociação
// ═══════════════════════════════════════════════════════════════════════════

const NUMEROS: Eixo = {
  id: "numeros",
  nome: "Números",
  perguntaAncora: "Ele sabia os próprios números antes de abrir a boca?",
  oQueObservar: [
    "Definiu antes o que queria, o mínimo aceitável e a alternativa?",
    "Fala do valor em número, ou em adjetivo?",
    "Cada concessão veio com contrapartida?",
    "Ancorou primeiro ou esperou — e isso foi escolha ou acaso?",
    "Percebeu quando o acordo ficou pior que a alternativa dele?",
  ],
};

const LEITURA: Eixo = {
  id: "leitura",
  nome: "Leitura do outro",
  perguntaAncora: "Ele descobriu o que o outro lado realmente precisava?",
  oQueObservar: [
    "Perguntou antes de propor, ou chegou com pacote fechado?",
    "Separou o que o outro disse que queria do que ele precisava?",
    "Encontrou troca desigual — barato para ele, caro para o outro?",
    "Percebeu blefe, pressa ou trava real do outro lado?",
    "Ouviu mais do que falou?",
  ],
};

const CONDUCAO: Eixo = {
  id: "conducao",
  nome: "Condução",
  perguntaAncora: "Ele disputou o valor sem quebrar a relação?",
  oQueObservar: [
    "Firme sem hostil — discordou sem atacar a pessoa?",
    "Aguentou o silêncio, ou preencheu com concessão?",
    "Sustentou o próprio número na primeira objeção?",
    "Manteve a temperatura quando o outro subiu o tom?",
    "Soube parar — fechou na hora certa, ou aceitou não fechar?",
  ],
};

// ═══════════════════════════════════════════════════════════════════════════

export const FRAMEWORKS: Record<Framework, DefinicaoFramework> = {
  oratoria: {
    id: "oratoria",
    nome: "Oratória",
    eixos: [MENSAGEM, FALA, PRESENCA],
    forma: "linha",
  },
  bomba: {
    id: "bomba",
    nome: "Bomba em dupla",
    eixos: [MANUAL, EXECUTOR],
    forma: "retrato",
    guardaResultado:
      "O resultado não é a avaliação. Uma dupla pode se comunicar muito bem e a bomba explodir, ou desarmar por sorte. Avalia-se o processo, nunca o desfecho.",
  },
  negociacao: {
    id: "negociacao",
    nome: "Negociação",
    eixos: [NUMEROS, LEITURA, CONDUCAO],
    forma: "retrato",
    guardaResultado:
      "Quem fechou o melhor acordo não é a avaliação. Dá para ganhar por sorte ou porque o outro lado estava fraco. Avalia-se a condução.",
  },
  nenhum: {
    id: "nenhum",
    nome: "Sem avaliação",
    eixos: [],
    forma: "nenhuma",
  },
};

// ── Consultas ──────────────────────────────────────────────────────────────

export function eixosDe(framework: Framework): readonly Eixo[] {
  return FRAMEWORKS[framework].eixos;
}

export function acharEixo(framework: Framework, eixoId: string): Eixo | undefined {
  return FRAMEWORKS[framework].eixos.find((e) => e.id === eixoId);
}

export function eixoPertenceAoFramework(
  framework: Framework,
  eixoId: string,
): boolean {
  return acharEixo(framework, eixoId) !== undefined;
}

/**
 * RF-D3 — o que a interface mostra no momento de pontuar.
 *
 * Havendo descritor escrito, é ele. Não havendo — bomba e negociação, cujos
 * níveis ainda não foram escritos —, cai para a lista de "o que observar".
 * Isso é caso normal, não erro: a formação de Liderança acontece antes de os
 * descritores existirem, e a tela não pode quebrar por isso.
 */
export function auxilioDeCalibragem(
  framework: Framework,
  eixoId: string,
  nivel: Nivel,
): { tipo: "descritor"; descritor: Descritor } | { tipo: "observar"; itens: string[] } | null {
  const eixo = acharEixo(framework, eixoId);
  if (!eixo) return null;

  const descritor = eixo.descritores?.find((d) => d.nivel === nivel);
  if (descritor) return { tipo: "descritor", descritor };

  return { tipo: "observar", itens: [...eixo.oQueObservar] };
}

export function temDescritores(framework: Framework, eixoId: string): boolean {
  return (acharEixo(framework, eixoId)?.descritores?.length ?? 0) > 0;
}

/**
 * RN-16 — a escala é assimétrica por desenho.
 *
 * A expectativa é que a turma comece em 1 e 2. Chegar a 4 significa evolução
 * grande; 5 é fora da curva. A interface precisa comunicar isso no momento de
 * pontuar, senão cada mentor calibra por conta própria e a nota perde
 * comparabilidade entre pessoas — que é justamente o que ela existe para dar.
 */
export const EXPECTATIVA_DA_ESCALA: Record<Nivel, string> = {
  1: "Ponto de partida esperado no começo da formação.",
  2: "Ponto de partida esperado no começo da formação.",
  3: "Patamar funcional.",
  4: "Evolução grande. Poucas pessoas chegam aqui até o fim da formação.",
  5: "Fora da curva. Raro por desenho.",
};
