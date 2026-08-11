---
id: registrar-feedback-design
work_item: registrar-feedback
intent: plataforma-formacao-dex
run: run-dex-006
created: 2026-08-11T13:48:00Z
---

# Design: Registrar feedback

`specs/03` (`RF-D1`…`RF-D5`) e `specs/04` já dizem **o que** a tela tem e **em que
ordem**. Este documento resolve o que eles não decidem — e a tensão que o work item
nomeia:

> A tela tem dois blocos com públicos opostos — o visível, que a pessoa vai ler, e o
> interno, que ela nunca vê durante a formação — e precisa caber num celular sem que o
> mentor confunda os dois. **Errar aqui não gera bug, gera um mentor escrevendo no campo
> errado.**

Vale insistir no que "errar" significa aqui, porque não é uma falha técnica: é uma
avaliação franca sobre um estudante real aparecendo no texto que ele vai ler, ou um
elogio protocolar ocupando o lugar do diagnóstico honesto. Nenhum teste pega isso.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Como separar os dois blocos | Um scroll só, com o bloco rotulado **por quem lê**, não pelo que é | O nome da pessoa no cabeçalho do bloco visível é a barreira mais forte que existe: não se escreve uma avaliação crua sob um título que diz "O que a Ana vai ler" |
| O que o painel `RF-D2` envia ao navegador | Só o bloco visível, passado por `apenasBlocoVisivel()` | O mentor **pode** ver nota alheia, mas esta tela não precisa dela. `D-02` é "não envie o que a tela não usa", não só "esconda do participante" |
| "Não observado" | Sexta opção do mesmo seletor de nota | Caixa de marcar lê como *pular*; opção lê como *veredito*. `RN-07` diz que é um valor |
| Salvar | Otimista: volta para a lista na hora, rascunho só é apagado na confirmação do servidor | O mentor não espera rede de corredor. E falha nunca vira texto perdido |
| Ordenação da turma | Total recebido crescente e, empatando, quem eu ainda não escrevi | `RF-D5` quer cobertura da turma; o mentor age sobre a própria fila. As duas coisas cabem numa ordenação só |
| Onde mora o rascunho | `localStorage`, chave por encontro + participante + eixo | `D-03`. Chave sem o eixo colidiria entre dois mentores no mesmo celular |

## A separação dos dois blocos

Três formas foram consideradas.

**Duas etapas** (escreve o visível, avança, escreve o interno) torna a fronteira temporal
e impossível de confundir. Foi descartada por custo: `specs/04` fixa a ordem numa
sequência única, e cada toque a mais se multiplica por quarenta pessoas.

**Abas** foi descartada de imediato — esconder um dos blocos é pior que confundi-los.

**Um scroll com quebra dura** é o escolhido. O que faz a quebra funcionar não é a linha
divisória, é o **rótulo por audiência**:

```
┌─────────────────────────────────┐
│ O QUE A ANA VAI LER             │  ← nome real, sempre
│ assinado por você               │
│                                 │
│ [situação] [ponto] [sugestão]   │
└─────────────────────────────────┘

╔═════════════════════════════════╗
║ SÓ MENTORES                     ║  ← superfície diferente, borda dura
║ A Ana não vê isto agora. Entra  ║
║ no documento final dela.        ║
║                                 ║
║ [nota 1–5 · não observado]      ║
║ [observação interna]            ║
╚═════════════════════════════════╝
```

O aviso de que a nota entra no documento final fica **dentro** do bloco interno, junto da
nota — `RF-D1` é explícito que sem essa frase o mentor pontua achando que ninguém verá.
Rodapé não serve: ninguém lê rodapé com o polegar no seletor.

## Salvar sem esperar o servidor

O caminho tem três estados e nenhum deles perde texto:

1. **Digitando** — cada alteração grava em `localStorage` (`D-03`).
2. **Salvou** — navega para a lista imediatamente, com o nome já marcado. O rascunho
   **continua** gravado.
3. **Confirmou** — a ação de servidor respondeu; aí o rascunho é apagado.

Falhando, o item na lista aparece como *não salvou* e reabrir restaura o texto. A ordem
importa: apagar o rascunho ao navegar seria rápido e perderia o feedback exatamente no
caso em que ele é mais difícil de reescrever — o corredor sem sinal.

## O que `RN-01` precisa dizer

Salvar sem sugestão é impossível, e a mensagem não é "campo obrigatório". Ela cita a
diretriz, porque a regra não é burocracia — é a diretriz 6 da DEX:

> A sugestão é obrigatória. É a diretriz 6 da DEX: apontar o problema sem indicar um
> caminho não ajuda quem recebe.

O texto já existe em `MOTIVO_SUGESTAO_OBRIGATORIA` (`src/dominio/regras.ts`). A tela não
escreve a frase — ela pergunta.

## Camadas que impedem o bloco interno de vazar

| Camada | O que garante |
|---|---|
| `feedback_visivel` (view) | Não tem as colunas do bloco interno. `RN-03` vale mesmo com consulta mal escrita |
| RLS | Participante não tem policy em `feedback`. Nega por padrão |
| `apenasBlocoVisivel()` | O painel `RF-D2` só recebe o que vai mostrar |
| Servidor por padrão | A lista da turma e o painel renderizam no servidor; só o formulário é cliente |
| Teste de guarda | Nenhum componente de cliente recebe `nota` ou `observacao_interna` como propriedade |

A última linha é a que falta hoje e entra com este item: um teste que varre os componentes
de cliente procurando essas duas palavras nas propriedades. É o análogo do guarda de hex
literal — barato, e pega a regressão que ninguém veria revisando.

## `RN-06` — o que trava e quando

| Momento | Bloco visível | Bloco interno |
|---|---|---|
| Encontro `aberto` | Edita e apaga | Edita |
| Encontro `liberado` | **Travado, em leitura** | Continua editável |

O bloco visível travado não some da tela: ele fica visível e em leitura, com a razão
escrita. Sumir faria parecer defeito. As duas condições já existem em
`podeEditarBlocoVisivel()` e `podeEditarBlocoInterno()`.

## O que fica de fora deste item

Presença na lista da turma vem de `presenca`. A liberação e a contagem de quem não vai
receber nada vêm de `liberacao-do-encontro`. A lista mostra o **lugar** da presença desde
já, para não redesenhar o item depois.

## Medições que decidem se está pronto

Não são estimativas — o work item pede número:

- Um registro completo em **menos de um minuto**, cronometrado a 390px.
- JavaScript da rota **< 120 KB** comprimido.
- Nenhum alvo abaixo de 44px; itens da lista da turma em 56px.

### Medido, na build de produção

| Medida | Alvo | Aferido | |
|---|---|---|---|
| Alvos de toque a 390px | ≥ 44px | nenhum abaixo | ✅ |
| Rolagem horizontal | nenhuma | nenhuma | ✅ |
| Fonte dos campos | ≥ 16px | 16px | ✅ |
| DOM interativo | < 2,5s | 153 ms | ✅ |
| JS da rota, comprimido | < 120 KB | **~143 KB** | ❌ |

**O orçamento de 120 KB não é alcançável nesta stack, e não é por causa desta
tela.** Medindo as outras rotas na mesma build:

| Rota | JS comprimido |
|---|---|
| `/` — landing, quase toda estática | 134 KB |
| `/membros` | 137 KB |
| `/encontros/[id]/feedback/[participacao]` | ~143 KB |

O piso do React 19 + Next 16 é **134 KB**, acima do orçamento inteiro. O código
desta rota — formulário, seletor de nota, rascunho, busca — custa **~9 KB** sobre
esse piso, que é o que de fato estava sob controle aqui.

O número 120 KB foi escrito no work item antes de a stack ser medida. Ele não
descreve mais nada verificável, e mantê-lo como critério faria a tela nascer
reprovada por uma conta que nenhum arquivo deste item pode mudar. **Corrigir o
orçamento é decisão de produto, não de implementação** — está em `pendencias.md`
esperando resposta, com três saídas possíveis: revisar o número para o piso
medido mais uma folga, trocar o critério por "incremento sobre o piso", ou
tratar o piso como problema a atacar em outro item.
