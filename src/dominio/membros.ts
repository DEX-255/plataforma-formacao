import type { Papel } from "./tipos";

/**
 * Leitura da lista colada — `RF-A2`.
 *
 * Os e-mails chegam de uma planilha das respostas do formulário da fase 1 do
 * PS, e ninguém vai digitar quarenta linhas à mão. O caminho real é copiar uma
 * coluna inteira e colar.
 *
 * Por isso a leitura é tolerante: aceita vírgula, ponto e vírgula, quebra de
 * linha, tabulação e espaço como separador, e ignora repetição em silêncio.
 * **Uma repetição não pode recusar o lote inteiro** — quem colou não vai
 * caçar a linha duplicada com trinta pessoas esperando.
 */

export type LeituraDeEmails = {
  /** Prontos para inserir, normalizados e sem repetição. */
  validos: string[];
  /** Não parecem e-mail. Mostrados para a pessoa conferir, não descartados em silêncio. */
  invalidos: string[];
  /** Apareceram mais de uma vez na colagem. Informativo. */
  repetidos: string[];
  /** Já estavam na lista antes. Informativo. */
  jaExistiam: string[];
};

/**
 * Deliberadamente frouxo. A validação que importa acontece no login: o e-mail
 * só serve se for uma conta Google de verdade, e nenhuma expressão regular
 * sabe disso. O papel daqui é pegar erro de colagem — uma célula com nome,
 * um cabeçalho de planilha —, não julgar endereço.
 */
const PARECE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function lerEmailsColados(
  texto: string,
  jaNaLista: readonly string[] = [],
): LeituraDeEmails {
  const existentes = new Set(jaNaLista.map(normalizar));

  const vistos = new Set<string>();
  const validos: string[] = [];
  const invalidos: string[] = [];
  const repetidos: string[] = [];
  const jaExistiam: string[] = [];

  for (const bruto of texto.split(/[\s,;]+/)) {
    const pedaco = bruto.trim();
    if (!pedaco) continue;

    const email = normalizar(pedaco);

    if (!PARECE_EMAIL.test(email)) {
      invalidos.push(pedaco);
      continue;
    }
    if (vistos.has(email)) {
      repetidos.push(email);
      continue;
    }

    vistos.add(email);

    if (existentes.has(email)) {
      jaExistiam.push(email);
      continue;
    }

    validos.push(email);
  }

  return { validos, invalidos, repetidos, jaExistiam };
}

/** A lista é comparada sempre normalizada — o login também normaliza. */
export function normalizar(email: string): string {
  return email.trim().toLowerCase();
}

export type Membro = {
  email: string;
  papel: Papel;
  /** Preenchido quando a pessoa já entrou pelo menos uma vez. */
  entrou: { nome: string; avatar_url: string | null } | null;
};

/**
 * Quem ainda não entrou vem primeiro.
 *
 * A tela existe para duas coisas: cadastrar e **cobrar quem não acessou**. Ver
 * primeiro quem falta é o que torna a segunda possível sem procurar na lista —
 * mesma ideia da ordenação do painel do encontro (`RF-D5`).
 */
export function ordenarMembros(membros: readonly Membro[]): Membro[] {
  return [...membros].sort((a, b) => {
    if (!a.entrou && b.entrou) return -1;
    if (a.entrou && !b.entrou) return 1;
    return a.email.localeCompare(b.email, "pt-BR");
  });
}

export function contarPendentes(membros: readonly Membro[]): number {
  return membros.filter((m) => !m.entrou).length;
}
