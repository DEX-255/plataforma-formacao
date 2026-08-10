# 04 — Telas e fluxos

## Os dois fluxos que decidem o produto

### O mentor registrando feedback

O momento real: acabou a dinâmica, o mentor está em pé, com o celular, cinco minutos antes de a próxima coisa começar, e a memória está fresca. Se ele adiar, não escreve mais.

```
abre o app  →  cai direto no encontro aberto de hoje
            →  vê a turma, quem ainda não recebeu nada em cima
            →  toca num nome
            →  lê o que os outros mentores já escreveram    (diretriz 4)
            →  escreve situação, ponto, sugestão
            →  pontua, com o descritor do nível na tela     (RN-16)
            →  salva  →  volta pra lista, aquele nome marcado
            →  próximo nome
```

Cada volta desse laço deveria custar menos de um minuto. Duas consequências de desenho:

- **Zero navegação até o encontro do dia.** Existindo encontro aberto, é nele que o mentor cai ao entrar.
- **Depois de salvar, volta para a lista, não para uma tela de confirmação.** O trabalho é em sequência; qualquer passo entre um nome e o próximo se multiplica por quarenta.

### O participante lendo o feedback da semana

```
recebe o aviso de que liberou  →  entra  →  trajetória
                                        →  encontro da semana
                                        →  lê por eixo
                                        →  vê a sugestão em destaque
```

Aqui o ritmo é o oposto: é para ser lido devagar. Densidade baixa, tipografia grande, sugestão com peso visual próprio — é o que a pessoa vai levar para a semana seguinte.

## Inventário de telas

Legenda de prioridade igual à de `03-requisitos.md`.

---

### Públicas

**`/` — Home** · P3
Landing mínima, direção **4b**: fundo preto quente, DEX em roxo gigante, "De pessoas. Para pessoas." circulado. Header com A DEX · Impacto · Entrar.
*Mobile:* o DEX gigante escala por `clamp()` e continua sendo o gesto principal; navegação vira menu.

**`/entrar` — Login** · P1
Direção **3e**: fundo papel, card de borda dura com sombra sólida, selo "★ ÁREA DE MEMBROS" rotacionado, "e aí! bora entrar?".
Um botão do Google no lugar dos campos de e-mail e senha do mock. Uma linha dizendo que o acesso é restrito à formação.
*Estados:* padrão · autenticando · e-mail não autorizado (recusa explicativa, com contato) · edição encerrada (mensagem de encerramento e como receber o documento).
⏳ A 3e é clara e a home 4b é escura — ver `pendencias.md`.

---

### Participante

**`/trajetoria` — Minha trajetória** · P1
Tela inicial. Linha do tempo vertical dos encontros, do mais recente para trás.
*Cada item:* número, tema, data, presença, e o estado do feedback — liberado (com contagem), aguardando liberação, ou encontro sem avaliação.
*Estados:* vazio explicativo (RF-E3) · com encontros · edição encerrada.
*Mobile:* é a tela nativa do formato. Cartões empilhados.

**`/trajetoria/encontro/[id]` — Encontro em detalhe** · P1
Os feedbacks daquele encontro, agrupados por eixo, com o nome do mentor.
Situação, ponto e sugestão visualmente distintos. A **sugestão** carrega o maior peso — é a única parte acionável.
Cabeçalho do eixo traz a pergunta-âncora ("de olhos fechados, o que eu ouço?"), que ensina o modelo sem precisar explicar.

**`/caixa/[encontro]` — Caixa anônima** · P2
Aparece como chamada na trajetória enquanto o encontro está aberto.
Um campo, um botão. O texto explica **como** o anonimato funciona — sem vínculo guardado, ordem embaralhada — porque a promessa sozinha não é acreditada.
*Estados:* aberta · já enviei (confirmação, sem mostrar o que escrevi) · fechada.

---

### Mentor

**`/encontros` — Encontros da edição** · P1
Lista com estado de cada um. Ação de criar. Havendo encontro aberto, ele aparece no topo com destaque.

**`/encontros/[id]` — Painel do encontro** · P1
*A tela de trabalho.* Turma listada, **quem ainda não recebeu nada primeiro**, com busca por nome.
Por pessoa: já escrevi, quantos recebeu no total, presença.
Cabeçalho: tema, framework, meu eixo neste encontro, e o estado do encontro.
Ações: marcar presença, liberar.
*Mobile:* prioritária. Lista de toque grande, busca fixa no topo, nada de tabela.

**`/encontros/[id]/feedback/[participante]` — Registrar feedback** · P1
*A tela mais importante do produto.* Desenhada primeiro no celular.
Ordem: quem estou avaliando → meu eixo com a pergunta-âncora → o que os outros já escreveram → situação → ponto → sugestão → nota com descritor → salvar.
O aviso de que a nota entra no documento final fica junto da nota, não no rodapé.
*Estados:* novo · editando · travado após liberação (bloco visível em leitura, interno editável).

**`/encontros/[id]/eixos` — Atribuir eixos** · P1
Mentores da edição, um eixo para cada, naquele encontro. Avisa eixo descoberto, não bloqueia.

**`/encontros/[id]/anonimas` — Mensagens anônimas** · P2
Só depois da liberação. Cartões sem autor, sem horário, ordem embaralhada. Sem responder e sem marcar como lida.

**`/turma` — Turma** · P2
Lista dos participantes com cobertura, presença e média por eixo.
Destaque para quem está abaixo da cobertura da turma — e quem faltou aparece como falta, não como buraco (RF-C2).
*Mobile:* cartões, não tabela.

**`/turma/[participante]` — Perfil do participante** · P2
Tudo sobre uma pessoa: todos os feedbacks com bloco interno e nota, evolução por eixo, presença, retratos das dinâmicas. É a tela consultada na decisão do corte.

**`/membros` — Membros e acesso** · P1
Lista de e-mails autorizados, papel, quem já entrou. Adicionar em lote colando uma lista. Remover bloqueia sem apagar histórico.

**`/encerrar` — Encerramento** · P3
Encerra a edição e gera os documentos. Confirmação que nomeia a consequência. Prévia de um documento antes de gerar todos.

---

## Navegação

**Mentor** — sidebar escura permanente, na referência aprovada.

```
DEX                        ← símbolo + wordmark
────────────────
FORMAÇÃO
  Encontros                ← ponto se há encontro aberto
  Turma
────────────────
GESTÃO
  Membros
  Encerramento
────────────────
  [avatar] Nome            ← rodapé, com sair
```

**Participante** — sem sidebar. A área dele tem três destinos (trajetória, encontro, caixa) e sidebar para isso é peso morto. Header simples com logo, nome e sair.

**Mobile** — a sidebar do mentor vira barra inferior com Encontros, Turma e Perfil; Membros e Encerramento passam para dentro do Perfil. São ações raras, feitas no computador.

## Estados que precisam existir em toda tela

Enumerados aqui porque são o que costuma faltar e o que faz o produto parecer quebrado:

**Vazio** — sempre explicando o que vai aparecer ali e quando. Nunca uma área em branco.
**Carregando** — esqueleto com a forma do conteúdo, não spinner centralizado.
**Erro** — o que aconteceu e o que fazer. Erro de rede ao salvar feedback **não pode perder o texto digitado**: o mentor escreveu aquilo em pé no corredor e não vai escrever de novo.
**Sem permissão** — recusa clara em vez de tela vazia.
**Encerrada** — a edição acabou; o que ainda é possível fazer.
