import type { Papel, StatusEdicao } from "./tipos";
import { emailAutorizado, participanteTemAcesso } from "./regras";

/**
 * A decisão de quem entra, isolada de Supabase, de cookie e de HTTP.
 *
 * Fica aqui — e não dentro do handler de login — porque é a regra que decide
 * quem tem acesso a avaliação de estudante. Regra dessa natureza precisa poder
 * ser lida inteira num arquivo e testada sem subir servidor nenhum.
 */

export type Autorizacao = {
  email: string;
  papel: Papel;
  edicao_id: string;
};

export type ResultadoDoLogin =
  | { tipo: "entra"; papel: Papel; edicaoId: string }
  | { tipo: "nao-autorizado" }
  | { tipo: "edicao-encerrada" };

/**
 * `RN-11` — autenticar no Google não autoriza nada.
 * `RN-13` — edição encerrada recusa participante e mantém mentor.
 *
 * A ordem das checagens importa: quem não está na lista recebe
 * "não autorizado", e não "edição encerrada". Dizer a alguém de fora que a
 * edição terminou já entrega que existe uma edição e que ela terminou — e
 * ninguém que não faz parte precisa saber disso.
 */
export function decidirLogin(
  email: string,
  autorizados: readonly Autorizacao[],
  statusDaEdicao: (edicaoId: string) => StatusEdicao | undefined,
): ResultadoDoLogin {
  if (!emailAutorizado(email, autorizados)) {
    return { tipo: "nao-autorizado" };
  }

  const normal = email.trim().toLowerCase();
  const entrada = autorizados.find(
    (a) => a.email.trim().toLowerCase() === normal,
  )!;

  const status = statusDaEdicao(entrada.edicao_id);
  if (!status) return { tipo: "nao-autorizado" };

  if (!participanteTemAcesso({ status }, entrada.papel)) {
    return { tipo: "edicao-encerrada" };
  }

  return { tipo: "entra", papel: entrada.papel, edicaoId: entrada.edicao_id };
}

/** Cada papel cai na própria tela inicial — `RF-A1`. */
export function telaInicialDoPapel(papel: Papel): string {
  return papel === "mentor" ? "/encontros" : "/trajetoria";
}

/**
 * Proteção de rota, decidida no servidor.
 *
 * A interface não conta como barreira: esconder um item da sidebar impede de
 * clicar, não de digitar a URL. Esta função é consultada a cada requisição.
 */
const ROTAS_DE_MENTOR = [
  "/encontros",
  "/turma",
  "/membros",
  "/encerrar",
] as const;

const ROTAS_DE_PARTICIPANTE = ["/trajetoria", "/caixa"] as const;

export const ROTAS_PUBLICAS = ["/", "/entrar", "/auth"] as const;

export function rotaEhPublica(caminho: string): boolean {
  return ROTAS_PUBLICAS.some(
    (r) => caminho === r || caminho.startsWith(`${r}/`),
  );
}

export function papelPodeAcessar(papel: Papel, caminho: string): boolean {
  if (rotaEhPublica(caminho)) return true;

  const deMentor = ROTAS_DE_MENTOR.some(
    (r) => caminho === r || caminho.startsWith(`${r}/`),
  );
  const deParticipante = ROTAS_DE_PARTICIPANTE.some(
    (r) => caminho === r || caminho.startsWith(`${r}/`),
  );

  if (deMentor) return papel === "mentor";
  if (deParticipante) return papel === "participante";

  // Rota desconhecida é negada por padrão. Acrescentar tela nova exige
  // declarar quem a acessa — esquecer resulta em porta fechada, não aberta.
  return false;
}
