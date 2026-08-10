import { NextResponse, type NextRequest } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { telaInicialDoPapel } from "@/dominio/acesso";

/**
 * Retorno do OAuth do Google.
 *
 * A decisão de quem entra **não** acontece aqui: acontece em
 * `app.provisionar_acesso`, no banco. Este arquivo troca o código por uma
 * sessão, pergunta ao banco o que fazer, e redireciona.
 *
 * Manter a decisão no banco não é preferência de estilo — é o que garante que
 * ela vale também para qualquer outro caminho que crie sessão, presente ou
 * futuro. Uma verificação escrita só aqui protegeria só esta rota.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const supabase = await clienteServidor();

  // Com `code`, veio do Google e a sessão ainda não existe.
  // Sem `code`, a sessão já foi criada por outro provedor — é por aqui que o
  // login local por senha entra, e ele passa exatamente pelas mesmas checagens.
  if (code) {
    const { error: erroDeTroca } = await supabase.auth.exchangeCodeForSession(code);
    if (erroDeTroca) {
      return NextResponse.redirect(new URL("/entrar", url.origin));
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/entrar", url.origin));
  }

  const metadados = user.user_metadata ?? {};
  const nome =
    (metadados.full_name as string | undefined) ??
    (metadados.name as string | undefined) ??
    "";
  const avatar =
    (metadados.avatar_url as string | undefined) ??
    (metadados.picture as string | undefined) ??
    null;

  const { data, error } = await supabase.rpc("provisionar_acesso", {
    p_nome: nome,
    // A função aceita ausência, não `null`: omitir cai no default do SQL.
    ...(avatar ? { p_avatar: avatar } : {}),
  });

  const decisao = data as {
    resultado: string;
    papel?: "participante" | "mentor";
  } | null;

  if (error || !decisao) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/entrar", url.origin));
  }

  if (decisao.resultado !== "entra") {
    // A sessão é encerrada antes do redirecionamento: uma conta recusada não
    // fica com sessão viva em lugar nenhum (RN-11).
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL(`/entrar?recusa=${decisao.resultado}`, url.origin),
    );
  }

  return NextResponse.redirect(
    new URL(telaInicialDoPapel(decisao.papel ?? "participante"), url.origin),
  );
}
