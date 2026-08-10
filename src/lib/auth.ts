import { redirect } from "next/navigation";
import { clienteServidor } from "./supabase/servidor";
import { telaInicialDoPapel } from "@/dominio/acesso";
import type { Papel, Usuario } from "@/dominio/tipos";

/**
 * Sessão e papel, do lado do servidor.
 *
 * `D-01` — **o papel vem da tabela `usuario`, verificado a cada requisição.**
 * Nunca de claim do JWT. Papel em claim fica velho quando alguém é removido da
 * lista, e `RN-11` exige que remover derrube o acesso na requisição seguinte —
 * não quando a sessão expirar.
 *
 * O custo é uma consulta por requisição. Numa turma de cinquenta pessoas isso
 * é irrelevante, e a alternativa é alguém desligado continuar lendo avaliação
 * da turma por mais uma hora.
 */

export type Sessao = {
  usuario: Usuario;
  papel: Papel;
};

export async function sessaoAtual(): Promise<Sessao | null> {
  const supabase = await clienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // A consulta que torna D-01 verdade. Se a linha sumiu, o acesso acabou.
  const { data: usuario } = await supabase
    .from("usuario")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!usuario) return null;

  return { usuario, papel: usuario.papel };
}

/** Para telas que exigem alguém logado. Sem sessão, volta para o login. */
export async function exigirSessao(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/entrar");
  return sessao;
}

/** Para as telas de mentor. Participante recebe recusa, não tela vazia. */
export async function exigirMentor(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel !== "mentor") redirect(telaInicialDoPapel(sessao.papel));
  return sessao;
}

export async function exigirParticipante(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (sessao.papel !== "participante") redirect(telaInicialDoPapel(sessao.papel));
  return sessao;
}
