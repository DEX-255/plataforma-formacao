import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { lerEdicao } from "./dados";
import { montarHtml } from "./gerar";
import { nomeDoArquivo } from "../src/dominio/documento";

/**
 * Gerador do documento final — `RF-H1`, `RF-H3`.
 *
 * Roda **uma vez por semestre, local**. Não precisa ser rápido nem estar
 * hospedado, e é isso que libera orçamento para qualidade tipográfica.
 *
 *     npx tsx documento/cli.ts --previa          # um documento, para conferir
 *     npx tsx documento/cli.ts                   # todos
 *     npx tsx documento/cli.ts --edicao 2026.2   # uma edição específica
 *
 * O HTML sai em `documento/saida/`. O PDF é o Chrome imprimindo esse HTML — o
 * navegador é o melhor motor de tipografia disponível, e `specs/06` escolheu
 * isso de propósito em vez de uma biblioteca de PDF.
 *
 * **A prévia existe por exigência do produto**, não por conveniência: `RF-A4`
 * pede conferir um documento antes de gerar todos, e o work item pede que ele
 * seja **lido impresso, em papel, imaginando quem não passou**, antes de ir para
 * qualquer pessoa.
 */

const SAIDA = join(import.meta.dirname, "saida");

async function principal() {
  const args = process.argv.slice(2);
  const previa = args.includes("--previa");
  const iEdicao = args.indexOf("--edicao");
  const nomeDaEdicao = iEdicao >= 0 ? args[iEdicao + 1] : undefined;

  const edicao = await lerEdicao(nomeDaEdicao);

  if (edicao.participantes.length === 0) {
    console.error(`Nenhum participante na edição ${edicao.nome}.`);
    process.exit(1);
  }

  // `RF-H1` — para todos, aprovados e não aprovados, com o mesmo conteúdo.
  // A prévia é o primeiro em ordem alfabética; a ordem é estável, então a
  // prévia é sempre a mesma pessoa entre execuções.
  const alvos = previa
    ? edicao.participantes.slice(0, 1)
    : edicao.participantes;

  mkdirSync(SAIDA, { recursive: true });

  for (const p of alvos) {
    const arquivo = join(SAIDA, `${nomeDoArquivo(p.nome, edicao.nome)}.html`);
    writeFileSync(arquivo, montarHtml(p, edicao.nome), "utf8");
    console.log(`  ${p.nome}  →  ${arquivo}`);
  }

  console.log(
    previa
      ? `\nPrévia de 1 de ${edicao.participantes.length}. Abra no navegador, ` +
          `imprima em papel e leia imaginando quem não passou.\n` +
          `Depois rode sem --previa para gerar todos.`
      : `\n${alvos.length} documentos em ${SAIDA}.\n` +
          `Para o PDF: abra cada HTML no Chrome e imprima (Ctrl+P → Salvar como PDF).`,
  );
}

principal().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
