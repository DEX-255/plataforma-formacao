import type { Database } from "./banco";

/**
 * Tipos de domínio, montados sobre os tipos gerados do esquema.
 *
 * Os gerados (`banco.ts`) são reescritos por `supabase gen types` e nunca
 * editados à mão — esquema e tipo divergindo em silêncio é como `RN-03` vaza.
 * O que este arquivo acrescenta é o vocabulário do glossário de `specs/02`.
 */

type Tabelas = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type Papel = Enums["papel"];
export type StatusEncontro = Enums["status_enc"];
export type StatusEdicao = Enums["status_ed"];
export type StatusParticipacao = Enums["status_part"];
export type StatusPresenca = Enums["presenca_st"];

export type Edicao = Tabelas["edicao"]["Row"];
export type Usuario = Tabelas["usuario"]["Row"];
export type Participacao = Tabelas["participacao"]["Row"];
export type Encontro = Tabelas["encontro"]["Row"];
export type AtribuicaoEixo = Tabelas["atribuicao_eixo"]["Row"];
export type Presenca = Tabelas["presenca"]["Row"];
export type Feedback = Tabelas["feedback"]["Row"];
export type MensagemAnonima = Tabelas["mensagem_anonima"]["Row"];

/**
 * O que o participante pode receber. Espelha a view `feedback_visivel`.
 *
 * Existe como tipo separado — e não como `Omit<Feedback, 'nota' | ...>` — para
 * que uma coluna nova no bloco interno **não** entre aqui por herança. Coluna
 * que aparece sozinha num tipo é exatamente como uma nota chega ao navegador
 * sem ninguém decidir isso.
 */
export type FeedbackVisivel = {
  id: string;
  encontro_id: string;
  participacao_id: string;
  mentor_id: string;
  eixo: string;
  situacao: string;
  ponto: string;
  sugestao: string;
};

/** O bloco que o participante nunca vê durante a formação (RN-03). */
export type BlocoInterno = {
  nota: number | null;
  nao_observado: boolean;
  observacao_interna: string | null;
};
