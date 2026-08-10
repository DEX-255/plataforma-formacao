import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/dominio/banco";

/**
 * Cliente de servidor.
 *
 * **Toda leitura que envolve bloco interno ou dado de turma acontece por aqui.**
 * A separação entre este arquivo e `navegador.ts` é o que dá efeito prático ao
 * `D-02`: ela está na estrutura, não na disciplina de quem escreve a tela.
 *
 * Este cliente usa a chave anônima e continua sujeito à RLS — ele não tem
 * privilégio especial. O que ele tem é o fato de rodar no servidor: o que não
 * é enviado ao navegador não vaza (`RN-03`).
 */
export async function clienteServidor() {
  const jar = await cookies();

  return createServerClient<Database>(
    exigir("NEXT_PUBLIC_SUPABASE_URL"),
    exigir("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (cookies) => {
          try {
            for (const { name, value, options } of cookies) {
              jar.set(name, value, options);
            }
          } catch {
            // Componente de servidor não escreve cookie. O middleware renova a
            // sessão, então engolir aqui é correto e não perde nada.
          }
        },
      },
    },
  );
}

function exigir(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente ausente: ${nome}. Copie .env.example para .env.local.`,
    );
  }
  return valor;
}
