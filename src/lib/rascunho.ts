/**
 * Rascunho local do feedback — `D-03`.
 *
 * "Conexão de corredor cai, e perder o texto significa não ter o feedback."
 * O mentor escreve em pé, minutos depois da dinâmica; se o texto sumir, ele não
 * reescreve — a memória fresca era o ativo, e ela não volta.
 *
 * **A ordem importa e é fácil de errar:** o rascunho é apagado quando o
 * servidor confirma, nunca quando a tela navega. Apagar ao navegar seria mais
 * simples e perderia o texto exatamente no caso em que ele é mais caro.
 *
 * O que fica gravado inclui a observação interna, que é avaliação franca sobre
 * um estudante. Fica no aparelho do próprio mentor, com as palavras dele, e sai
 * de lá na confirmação ou ao sair da conta — `limparTodosOsRascunhos()`.
 */

export type RascunhoDeFeedback = {
  situacao: string;
  ponto: string;
  sugestao: string;
  nota: number | null;
  naoObservado: boolean;
  observacaoInterna: string;
};

const PREFIXO = "dex:rascunho:";

/**
 * A chave carrega o eixo além do encontro e da pessoa.
 *
 * Sem ele, dois mentores usando o mesmo aparelho — que acontece, o celular fica
 * passando de mão no fim da dinâmica — sobrescreveriam o rascunho um do outro
 * sem qualquer sinal.
 */
export function chaveDoRascunho(
  encontroId: string,
  participacaoId: string,
  eixo: string,
): string {
  return `${PREFIXO}${encontroId}:${participacaoId}:${eixo}`;
}

export function lerRascunho(chave: string): RascunhoDeFeedback | null {
  if (typeof window === "undefined") return null;

  try {
    const bruto = window.localStorage.getItem(chave);
    if (!bruto) return null;
    return JSON.parse(bruto) as RascunhoDeFeedback;
  } catch {
    // Rascunho corrompido não pode derrubar a tela: o mentor perde o texto de
    // um, e não a capacidade de registrar o resto da turma.
    return null;
  }
}

export function gravarRascunho(chave: string, valor: RascunhoDeFeedback): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Cota estourada ou modo privado. Escrever é melhor esforço; o formulário
    // continua funcionando, só perde a rede de segurança.
  }
}

export function apagarRascunho(chave: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(chave);
  } catch {
    /* idem */
  }
}

/** Chamado ao sair da conta: o aparelho pode não ser só do mentor. */
export function limparTodosOsRascunhos(): void {
  if (typeof window === "undefined") return;
  try {
    const chaves = Object.keys(window.localStorage).filter((c) =>
      c.startsWith(PREFIXO),
    );
    for (const c of chaves) window.localStorage.removeItem(c);
  } catch {
    /* idem */
  }
}
