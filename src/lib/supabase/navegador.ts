import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/dominio/banco";

/**
 * Cliente de navegador.
 *
 * **Nunca use este cliente para ler bloco interno ou dado de turma** (`D-02`).
 * Ele existe para o que só pode acontecer no navegador: iniciar o login com o
 * Google e encerrar a sessão.
 *
 * Se você precisou dele para buscar dado de avaliação, a tela está no lugar
 * errado — a busca devia estar num componente de servidor.
 */
export function clienteNavegador() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
