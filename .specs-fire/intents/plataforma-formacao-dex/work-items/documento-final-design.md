---
id: documento-final-design
work_item: documento-final
intent: plataforma-formacao-dex
run: run-dex-013
created: 2026-08-11T22:00:00Z
---

# Design: Documento final individual

**É o momento em que a nota interna deixa de ser interna.** Durante toda a formação
`RN-03` a manteve escondida; aqui ela aparece, e para muita gente vai ser a primeira vez
que vê um número associado ao próprio desempenho — **inclusive quem não passou**.

O work item pede que este documento trate a peça pelo que ela é: algo entregue a alguém
que talvez tenha sido reprovado. Ordem de leitura, tom e o que vem antes do gráfico não
são formatação — são a diferença entre um fechamento que ajuda e um que machuca.

## A decisão central: a ordem de leitura

Um documento que abre com o gráfico entrega o número nos primeiros três segundos. Quem
tirou 2 lê "reprovado" antes de ler qualquer palavra, e não chega no resto — as frases
que os mentores escreveram com cuidado viram legenda de uma sentença já lida.

Então o número vem **depois**, e a ordem é esta:

| # | Seção | Por que aqui |
|---|---|---|
| 1 | Capa — nome, edição, período | Identidade antes de conteúdo |
| 2 | O que este documento é | Uma vez, curto: é registro do que aconteceu, não veredito |
| 3 | **Encontro a encontro** | O grosso. As palavras, assinadas, com o eixo |
| 4 | **Como ler a escala** (`RF-H2`) | Antes de qualquer número existir na página |
| 5 | Evolução em oratória | Gráfico e tabela |
| 6 | Retratos das dinâmicas | Bomba e negociação, em texto |
| 7 | Presença | Fato, sem juízo |
| 8 | Fechamento | O que fazer com isto daqui para frente |

`RF-H2` diz que a legenda da escala é **condição para o `RF-H1` existir**. Aqui ela é
condição estrutural: a seção 4 vem antes da 5 e as duas não se separam na paginação.

## O que o documento não faz

**Não diz se a pessoa passou.** O resultado do PS é comunicado em outro canal, por gente,
e não cabe a um PDF. Um documento que carrega o veredito vira a coisa que a pessoa não
quer abrir — e aí ela também não lê o feedback, que é a única parte útil.

**Não compara com a turma.** Nada de média da turma, posição, percentil. A nota já é
comparável entre pessoas para quem decide; devolver essa comparação a quem recebe
transforma um instrumento de acompanhamento em placar.

**Não esconde nota baixa.** Omitir seria mentir, e a pessoa merece o registro real do que
foi observado. O que o documento faz é dar contexto **antes**, não maquiar depois.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Ordem | Palavras antes de números; legenda antes do gráfico | Quem lê "2 de 5" sem contexto lê reprovação |
| Resultado do PS | Fora do documento | Um PDF que carrega veredito é um PDF que não se abre |
| Comparação com a turma | Nenhuma | Devolver comparação a quem recebe vira placar |
| Formato | HTML + CSS de impressão, PDF por Chrome headless | `specs/06`. Roda local, uma vez por semestre — dá para gastar em tipografia |
| Acesso aos dados | `service_role`, só aqui (`D-07`) | O gerador roda como script, sem sessão de mentor |
| Reprodutibilidade | Nada de `new Date()`, nada de ordem não determinada | `RF-H3`: rodar de novo anos depois produz o mesmo arquivo |
| Dinâmicas sem descritor | Só o bloco visível, sem escala | Bomba e negociação não têm níveis escritos (`pendencias.md`); inventar número seria pior que não ter |

## Reprodutibilidade é uma restrição de código, não uma promessa

`RF-H3` pede que rodar de novo anos depois, a partir dos dados arquivados, produza **o
mesmo documento**. Isso proíbe três coisas que entrariam sem ninguém notar:

- **Data de geração no conteúdo.** Vira diferença a cada execução. A data que aparece é a
  do encerramento da edição, que está no banco.
- **Ordenação não determinada.** Todo `select` que alimenta o documento ordena por chave
  estável — número do encontro, ordem do eixo no framework, id.
- **Qualquer coisa aleatória.** Inclui a ordem das mensagens anônimas, que nem entram
  aqui: o documento é individual, e mensagem anônima não é de ninguém.

Há teste: gerar duas vezes tem de produzir bytes idênticos.

## `D-07` — onde a `service_role` vive

O gerador roda como script Node, sem sessão. Sem a `service_role` ele não leria nada,
porque toda política depende de `auth.uid()`.

O que a torna aceitável aqui e em nenhum outro lugar:

- roda **fora do servidor web** — não existe rota que a alcance;
- lê da variável de ambiente, e o processo termina;
- é o único arquivo do projeto que a menciona, e há teste garantindo isso.

## Como saber que está pronto

- Gerado para **todos**, aprovados e não aprovados, com o mesmo conteúdo.
- A legenda da escala aparece **antes** do primeiro número, na mesma página que o gráfico.
- Duas execuções produzem arquivos idênticos.
- A `service_role` não aparece em nenhum componente de cliente nem rota.
- **Lido impresso, em papel, antes de ir para qualquer pessoa** — e lido imaginando quem
  não passou.
