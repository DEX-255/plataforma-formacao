/**
 * O painel do encontro — `RF-D5`.
 *
 * A lista da turma que o mentor percorre no fim da dinâmica. A ordenação aqui
 * não é conveniência: é o mecanismo pelo qual `specs/03` "empurra para a
 * cobertura em vez de deixar isso por conta da boa vontade".
 */

export type LinhaDaTurma = {
  participacaoId: string;
  nome: string;
  avatarUrl: string | null;
  /** Feedbacks recebidos neste encontro, somando todos os mentores. */
  recebidos: number;
  /** Já escrevi para esta pessoa neste encontro. */
  euEscrevi: boolean;
};

/**
 * Quem ninguém olhou vem primeiro.
 *
 * Ordena por **total recebido**, não por "eu ainda não escrevi". A diferença
 * decide o que a tela produz: ordenando pela fila de cada mentor, dois mentores
 * atacam a lista na mesma ordem e podem cobrir as mesmas pessoas, deixando o
 * mesmo buraco intacto na semana inteira. Ordenando pelo total, quem está
 * descoberto sobe para o topo de **todos** ao mesmo tempo.
 *
 * O desempate por "eu ainda não escrevi" devolve a fila pessoal sem desfazer
 * isso, e o nome no fim mantém a lista estável entre recarregamentos — ordem
 * que muda sozinha faz o mentor perder o lugar onde estava.
 */
export function ordenarTurma(linhas: readonly LinhaDaTurma[]): LinhaDaTurma[] {
  return [...linhas].sort(
    (a, b) =>
      a.recebidos - b.recebidos ||
      Number(a.euEscrevi) - Number(b.euEscrevi) ||
      a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

/**
 * Busca sem acento, sem pontuação e sem caixa.
 *
 * Quem digita "gabriela" com o polegar não põe acento, e a turma tem nomes que
 * têm. Exigir o acento certo transformaria a busca em obstáculo justamente na
 * turma grande, que é a única em que ela existe.
 *
 * A pontuação sai pelo mesmo motivo, e esse caso apareceu num teste: quem
 * procura *Karina D'Ávila* digita "davila", não "d'avila". Vale igual para o
 * hífen do sobrenome composto. O espaço fica, porque separa nomes de verdade.
 */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .toLowerCase()
    .trim();
}

export function filtrarPorNome(
  linhas: readonly LinhaDaTurma[],
  busca: string,
): LinhaDaTurma[] {
  const alvo = normalizarBusca(busca);
  if (!alvo) return [...linhas];
  return linhas.filter((l) => normalizarBusca(l.nome).includes(alvo));
}

export type Cobertura = {
  total: number;
  /** Ninguém escreveu para estas pessoas neste encontro. */
  semNenhum: number;
  euEscrevi: number;
};

/**
 * O número que incomoda.
 *
 * `semNenhum` é a mesma conta que `liberacao-do-encontro` vai mostrar antes de
 * confirmar a liberação. Mostrá-la já no painel dá ao mentor a chance de
 * consertar a desigualdade de atenção **enquanto ainda dá tempo**, em vez de
 * descobrir no instante em que ela vira fato consumado para aquela semana.
 */
export function coberturaDaTurma(linhas: readonly LinhaDaTurma[]): Cobertura {
  return {
    total: linhas.length,
    semNenhum: linhas.filter((l) => l.recebidos === 0).length,
    euEscrevi: linhas.filter((l) => l.euEscrevi).length,
  };
}
