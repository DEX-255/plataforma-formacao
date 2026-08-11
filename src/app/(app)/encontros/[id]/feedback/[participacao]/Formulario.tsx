"use client";

import { useActionState, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { CampoTexto } from "@/componentes/ui";
import { SeletorDeNota } from "@/componentes/ui/SeletorDeNota";
import type { Framework } from "@/dominio/frameworks";
import {
  sugestaoPreenchida,
  notaCoerente,
  MOTIVO_SUGESTAO_OBRIGATORIA,
} from "@/dominio/regras";
import {
  chaveDoRascunho,
  lerRascunho,
  gravarRascunho,
  apagarRascunho,
  type RascunhoDeFeedback,
} from "@/lib/rascunho";
import { salvarFeedback, type ResultadoDoFeedback } from "../acoes";

/**
 * O formulário — `RF-D1`, `RF-D3`, `RF-D4`.
 *
 * A separação dos dois blocos é feita **pelo rótulo de audiência**, não pela
 * navegação: o cabeçalho do bloco visível traz o nome real da pessoa. Não se
 * escreve uma avaliação crua sob um título que diz "O que a Ana vai ler".
 * Errar aqui não gera bug, gera um mentor escrevendo no campo errado.
 *
 * O rascunho (`D-03`) grava a cada tecla e **só é apagado quando o servidor
 * confirma** — nunca ao navegar. A ordem inversa seria mais simples e perderia
 * o texto exatamente no corredor sem sinal, que é onde ele é mais caro.
 */

type Props = {
  encontroId: string;
  participacaoId: string;
  nomeDoParticipante: string;
  primeiroNome: string;
  eixo: string;
  framework: Framework;
  /** RN-06 — depois da liberação o bloco visível fica em leitura. */
  visivelEditavel: boolean;
  inicial: RascunhoDeFeedback;
  jaExistia: boolean;
};

const VAZIO: RascunhoDeFeedback = {
  situacao: "",
  ponto: "",
  sugestao: "",
  nota: null,
  naoObservado: false,
  observacaoInterna: "",
};

export function Formulario({
  encontroId,
  participacaoId,
  nomeDoParticipante,
  primeiroNome,
  eixo,
  framework,
  visivelEditavel,
  inicial,
  jaExistia,
}: Props) {
  const router = useRouter();
  const chave = chaveDoRascunho(encontroId, participacaoId, eixo);

  /**
   * O rascunho gravado é lido como **fonte externa**, não copiado para o estado
   * num efeito.
   *
   * Copiar num efeito era a versão anterior, e o lint estava certo em recusar:
   * o servidor renderiza `inicial`, o efeito roda depois da hidratação e força
   * um segundo render em cascata. `useSyncExternalStore` existe para este caso
   * exato — `getServerSnapshot` devolve nada no servidor, e o React reconcilia
   * a diferença sozinho depois de hidratar.
   */
  const assinar = useCallback((avisar: () => void) => {
    window.addEventListener("storage", avisar);
    return () => window.removeEventListener("storage", avisar);
  }, []);

  const guardadoBruto = useSyncExternalStore(
    assinar,
    () => (typeof window === "undefined" ? null : window.localStorage.getItem(chave)),
    () => null,
  );

  const [editado, setEditado] = useState<RascunhoDeFeedback | null>(null);

  // O rascunho local vence o que veio do servidor: se ele existe, é porque a
  // gravação anterior não chegou a confirmar, e o texto de lá é mais novo.
  const guardado = useMemo(
    () => (guardadoBruto ? lerRascunho(chave) : null),
    [guardadoBruto, chave],
  );

  const valor = editado ?? guardado ?? inicial;
  const restaurado = editado === null && guardado !== null;

  const mexer = (mudanca: Partial<RascunhoDeFeedback>) => {
    const proximo = { ...valor, ...mudanca };
    gravarRascunho(chave, proximo);
    setEditado(proximo);
  };

  const [resultado, acao, enviando] = useActionState<
    ResultadoDoFeedback | null,
    FormData
  >(async (anterior, dados) => {
    const r = await salvarFeedback(anterior, dados);
    // Confirmou: só agora o rascunho pode sumir.
    if (r.ok) apagarRascunho(chave);
    return r;
  }, null);

  const [erroLocal, setErroLocal] = useState<ResultadoDoFeedback | null>(null);

  /**
   * Otimista quanto à **rede**, nunca quanto à **validação**.
   *
   * Sair da tela na hora é o que permite ao mentor ir ao próximo nome sem
   * esperar o corredor. Mas `RN-01` é verificável aqui mesmo, e navegar antes
   * de conferir mandaria a recusa chegar quando a tela que a mostraria já não
   * existe mais — o mentor acharia que salvou, e o feedback ficaria sem
   * sugestão. Isso apareceu ao rodar, não no papel.
   *
   * A conferência do servidor continua sendo a barreira de verdade; esta aqui
   * existe para a mensagem ter onde aparecer.
   */
  const enviar = (dados: FormData) => {
    if (!sugestaoPreenchida(valor.sugestao)) {
      setErroLocal({
        ok: false,
        erro: MOTIVO_SUGESTAO_OBRIGATORIA,
        campo: "sugestao",
      });
      return;
    }

    if (!notaCoerente(valor.nota, valor.naoObservado)) {
      setErroLocal({
        ok: false,
        erro: "Escolha uma nota de 1 a 5 ou marque “não observado”.",
        campo: "nota",
      });
      return;
    }

    setErroLocal(null);
    acao(dados);
    router.push(`/encontros/${encontroId}`);
  };

  // O erro local aparece antes de sair da tela; o do servidor, se a pessoa
  // voltar. Os dois usam o mesmo lugar para não existirem duas linguagens de
  // erro na tela mais importante do produto.
  const problema = erroLocal ?? resultado;

  return (
    /* `noValidate` de propósito. Com a validação nativa ligada, o navegador
       barra o envio antes da nossa conferência e mostra o balão dele —
       "Preencha este campo". É exatamente o "campo obrigatório seco" que
       `RN-01` recusa: a regra existe para dizer que apontar problema sem
       indicar caminho não ajuda quem recebe, e essa frase não cabe num balão
       do sistema. Descoberto ao rodar: o teste passava e a mensagem certa
       nunca aparecia. */
    <form action={enviar} noValidate className="flex flex-col gap-8 pb-28">
      <input type="hidden" name="encontro" value={encontroId} />
      <input type="hidden" name="participacao" value={participacaoId} />
      <input type="hidden" name="eixo" value={eixo} />

      {restaurado && (
        <p
          role="status"
          className="rounded-campo border border-borda bg-superficie-alta p-4 text-secundario text-atencao"
        >
          Recuperamos o que você tinha escrito e não chegou a salvar.
        </p>
      )}

      {/* ── Bloco visível ─────────────────────────────────────────────────
          O rótulo nomeia quem lê. É a barreira contra escrever no campo
          errado, e ela é de texto, não de navegação. */}
      <section className="flex flex-col gap-5 rounded-cartao border border-borda bg-superficie p-5 sm:p-6">
        <header className="flex flex-col gap-1">
          <h2 className="font-mono font-bold text-rotulo uppercase text-papel">
            O que {primeiroNome} vai ler
          </h2>
          <p className="text-secundario text-neutro">
            Assinado por você. {nomeDoParticipante} lê isto quando o encontro for
            liberado.
          </p>
        </header>

        {!visivelEditavel && (
          <p className="text-secundario text-atencao">
            O encontro já foi liberado e {primeiroNome} já leu isto. O texto fica
            como está; a nota e a observação interna continuam editáveis.
          </p>
        )}

        <CampoTexto
          id="situacao"
          name="situacao"
          rotulo="Situação"
          auxilio="Onde foi. “Na apresentação de hoje…”"
          rows={2}
          required
          disabled={!visivelEditavel}
          value={valor.situacao}
          onChange={(e) => mexer({ situacao: e.target.value })}
        />

        <CampoTexto
          id="ponto"
          name="ponto"
          rotulo="Ponto"
          auxilio="O que você observou, sem rodeio e sem julgar a pessoa."
          rows={3}
          required
          disabled={!visivelEditavel}
          value={valor.ponto}
          onChange={(e) => mexer({ ponto: e.target.value })}
        />

        <CampoTexto
          id="sugestao"
          name="sugestao"
          rotulo="Sugestão"
          auxilio="O caminho prático. É a diretriz 6 da DEX, e sem ela não salva."
          rows={3}
          required
          disabled={!visivelEditavel}
          erro={problema?.campo === "sugestao" ? problema.erro : undefined}
          value={valor.sugestao}
          onChange={(e) => mexer({ sugestao: e.target.value })}
        />
      </section>

      {/* ── Bloco interno ─────────────────────────────────────────────────
          Superfície diferente e borda dura. O aviso do documento final fica
          aqui dentro, junto da nota — RF-D1 é explícito que sem essa frase o
          mentor pontua achando que ninguém verá. */}
      <section className="flex flex-col gap-5 rounded-cartao borda-dura border-roxo bg-superficie-alta p-5 sm:p-6">
        <header className="flex flex-col gap-1">
          <h2 className="font-mono font-bold text-rotulo uppercase icone-roxo">
            Só mentores
          </h2>
          <p className="text-secundario text-neutro">
            {primeiroNome} não vê nada daqui durante a formação —{" "}
            <strong className="text-papel">
              mas a nota entra no documento final dela no encerramento.
            </strong>
          </p>
        </header>

        <SeletorDeNota
          framework={framework}
          eixo={eixo}
          nota={valor.nota}
          naoObservado={valor.naoObservado}
          onChange={({ nota, naoObservado }) => mexer({ nota, naoObservado })}
        />

        <input type="hidden" name="nota" value={valor.nota ?? ""} />
        <input
          type="hidden"
          name="nao_observado"
          value={valor.naoObservado ? "1" : "0"}
        />

        {problema?.campo === "nota" && (
          <p role="alert" className="text-secundario text-erro-claro">
            {problema.erro}
          </p>
        )}

        <CampoTexto
          id="observacao_interna"
          name="observacao_interna"
          rotulo="Observação interna"
          auxilio="O que ajuda na decisão do corte e não caberia no texto acima."
          rows={3}
          value={valor.observacaoInterna}
          onChange={(e) => mexer({ observacaoInterna: e.target.value })}
        />
      </section>

      {problema?.erro && !problema.campo && (
        <p role="alert" className="text-secundario text-erro-claro">
          {problema.erro}
        </p>
      )}

      {/* specs/05, Mobile: "salvar fica fixo no rodapé, não no fim do
          formulário" — ao alcance do polegar em pé. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-borda bg-superficie px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex min-h-toque flex-1 items-center justify-center rounded-pilula borda-dura border-preto bg-roxo px-6 py-3 font-sans font-bold text-corpo text-papel shadow-botao transition-[transform,box-shadow] duration-150 ease-saida hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-botao-hover active:translate-x-[6px] active:translate-y-[6px] active:shadow-botao-ativo disabled:pointer-events-none disabled:opacity-50"
          >
            {jaExistia ? "Salvar alterações" : "Salvar e voltar à lista"}
          </button>
        </div>
      </div>
    </form>
  );
}

export { VAZIO as RASCUNHO_VAZIO };
