# 03 — Requisitos funcionais

Cada requisito tem código, enunciado e critério de aceite. O critério é o que um teste verifica.

Prioridade: **P1** precisa existir no primeiro encontro avaliativo · **P2** nas primeiras semanas · **P3** até o fim do semestre.

---

## A — Acesso e identidade

### RF-A1 — Entrar com Google · P1
O usuário entra exclusivamente com conta Google. Não há senha, cadastro ou recuperação.
- E-mail na lista autorizada → entra e cai na tela inicial do papel dele.
- E-mail fora da lista → recusa explicando que o acesso é restrito a membros da formação, com contato para dúvida. Não cria conta órfã.
- Primeiro acesso preenche nome e foto a partir do perfil Google, sem formulário.

### RF-A2 — Lista de e-mails autorizados · P1
Mentor gerencia quem pode entrar, definindo papel e edição.
- Adicionar um ou vários e-mails de uma vez (colar lista).
- Cada entrada tem papel (`participante` ou `mentor`) e edição.
- Remover um e-mail bloqueia acesso imediato, sem apagar o que a pessoa já produziu ou recebeu.
- A tela mostra quem já entrou e quem ainda não — útil para cobrar quem não acessou.

### RF-A3 — Sessão e papel · P1
O papel decide o que existe na interface.
- Participante nunca recebe do servidor dado que ele não pode ver, mesmo que a tela não fosse mostrar (RN-03, RN-12).
- Sessão persiste entre visitas. O mentor não faz login toda semana no corredor.

### RF-A4 — Encerrar edição · P3
Mentor encerra a edição.
- Pede confirmação nomeando a consequência: participantes perdem o acesso.
- Depois disso, login de participante daquela edição é recusado com mensagem de encerramento e o caminho para receber o documento (RN-13).
- Mentor continua acessando tudo em modo arquivo.

---

## B — Edição e encontros

### RF-B1 — Criar encontro · P1
Mentor cria o encontro quando ele acontece.
- Campos: número, tema, data, framework.
- Nasce em `rascunho`.
- Não depende de cronograma pré-cadastrado — as datas da formação ainda não existem.

### RF-B2 — Atribuir eixos aos mentores · P1
Antes de abrir, define-se quem observa o quê naquele encontro.
- Lista os mentores da edição; cada um recebe um eixo do framework do encontro.
- Aviso — não bloqueio — quando um eixo fica sem mentor ou quando um mentor fica sem eixo.
- A atribuição vale só para aquele encontro; muda toda semana.
- Encontro com framework `nenhum` pula esta etapa.

### RF-B3 — Abrir encontro · P1
Passa de `rascunho` para `aberto`.
- Formulários de feedback ficam disponíveis para os mentores.
- A caixa anônima abre para os participantes.
- O encontro aparece na trajetória dos participantes, sem feedback.

### RF-B4 — Liberar encontro · P2
Passa de `aberto` para `liberado`. É o ritual semanal.
- Antes de confirmar, mostra o que vai acontecer: quantos participantes vão receber feedback, **quantos não vão receber nenhum**, e quantas mensagens anônimas serão reveladas.
- Ao confirmar: feedbacks visíveis liberados, caixa anônima fechada, mensagens anônimas reveladas aos mentores.
- Irreversível, e a confirmação diz isso.

### RF-B5 — Encontro sem avaliação · P1
Framework `nenhum` é caminho de primeira classe.
- Entra na trajetória e aceita presença.
- Nenhum formulário de feedback abre.
- Na trajetória do participante aparece como encontro cumprido, sem sugerir que faltou algo.

---

## C — Presença

### RF-C1 — Marcar presença · P2
Mentor marca quem veio.
- Lista da turma com três estados: presente, ausente, justificado.
- Marcação em massa: "todos presentes" e depois só corrige as exceções — que é como isso funciona na prática.
- Editável enquanto o encontro não estiver liberado.

### RF-C2 — Presença explica ausência de feedback · P2
Onde a cobertura for exibida, quem faltou aparece como falta, não como buraco de atenção. Sem isso, a tela de cobertura vira alarme falso toda semana.

---

## D — Feedback do mentor

*A tela mais importante do produto. Se ela tiver fricção, nada mais acontece.*

### RF-D1 — Registrar feedback · P1
Mentor escolhe um participante do encontro e registra.
- O eixo vem preenchido pela atribuição do encontro e não é escolhido a cada vez (RN-02).
- **Bloco visível:** situação, ponto, sugestão.
- **Bloco interno:** nota de 1 a 5 ou "não observado", e observação livre.
- A tela deixa explícito que o bloco interno não aparece agora, mas **entra no documento final da pessoa**. Sem essa frase, o mentor pontua achando que ninguém verá.
- Salvar sem sugestão é impossível (RN-01), e a mensagem de erro explica por quê, citando a diretriz — não um "campo obrigatório" seco.

### RF-D2 — Ver o que já foi registrado antes de escrever · P1
Antes do formulário, o mentor lê o que os outros mentores já registraram daquele participante naquele encontro.
- Mostra autor, eixo e o bloco visível.
- É a diretriz 4 em software: evita quatro pessoas escrevendo a mesma observação e empurra cada mentor para um ângulo ainda descoberto.
- Informativo, nunca bloqueante.

### RF-D3 — Auxílio de calibragem · P1
No momento de pontuar, a interface mostra o descritor daquele nível para aquele eixo, tirado da rubrica.
- O mentor lê "2 — Muletas dominantes: há um vício sonoro ou verbal recorrente que atrapalha acompanhar o raciocínio" em vez de escolher um número no vazio.
- Comunica a assimetria da escala (RN-16): começar em 1–2 é o esperado, 5 é fora da curva.
- Para os eixos sem descritor escrito ⏳, mostra a lista de "o que observar" do framework.

### RF-D4 — Editar e apagar · P1
- Antes da liberação, o mentor edita ou apaga o que ele mesmo escreveu.
- Depois, o bloco visível trava e o interno continua editável (RN-06).
- Ninguém edita feedback de outro mentor.

### RF-D5 — Painel do encontro · P1
A tela onde o mentor abre o encontro e vê a turma.
- Cada participante com: já recebeu feedback meu, quantos feedbacks recebeu no total, presença.
- Ordenação padrão: **quem ainda não recebeu nada vem primeiro.** A tela empurra para a cobertura em vez de deixar isso por conta da boa vontade.
- Busca por nome, porque a turma tem 20 a 50 pessoas.

---

## E — Visão do participante

### RF-E1 — Minha trajetória · P1
A tela inicial do participante: a linha do tempo dos encontros.
- Encontros liberados mostram os feedbacks recebidos, com nome do mentor e eixo.
- Encontros abertos aparecem com "os feedbacks deste encontro ainda não foram liberados" — e não como vazio ambíguo.
- Encontro sem avaliação aparece como cumprido.
- Nunca mostra nota, observação interna, ou qualquer coisa de outro participante.

### RF-E2 — Encontro em detalhe · P1
Todos os feedbacks daquele encontro, agrupados por eixo.
- Situação, ponto e sugestão claramente distintos — a sugestão é o que a pessoa vai usar, e precisa ter destaque próprio.
- Ver o eixo ensina o modelo: a pessoa entende que cada mentor olhou uma coisa, e para de ler três feedbacks como três opiniões concorrentes.

### RF-E3 — Estado inicial vazio · P1
Antes do primeiro feedback, a trajetória explica o que vai aparecer ali e quando. Perfil vazio sem explicação, na primeira semana, faz a pessoa achar que o sistema está quebrado ou que ela foi esquecida.

---

## F — Caixa anônima

### RF-F1 — Enviar mensagem · P2
Enquanto o encontro está aberto, o participante pode enviar uma mensagem.
- Um campo de texto, opcional, sobre os mentores do dia e a formação.
- A tela afirma o anonimato e explica **como** ele é garantido — que não existe vínculo guardado. Promessa de anonimato sem explicação não é acreditada, e caixa em que ninguém acredita fica vazia.
- Uma por participante por encontro (RN-09).
- Fecha na liberação, e o participante vê quanto tempo resta.

### RF-F2 — Ler mensagens · P2
Depois da liberação, os mentores leem as mensagens daquele encontro.
- Todas juntas, sem autor, sem horário, em ordem aleatória fixa (RN-10).
- Sem responder, sem reagir, sem marcar como lida — não é canal de conversa.

---

## G — Turma e cobertura

### RF-G1 — Visão de turma · P2
Lista dos participantes da edição, para mentor.
- Por pessoa: total de feedbacks, encontros com e sem feedback, presenças, média por eixo.
- Destaque para quem está **abaixo da cobertura mínima** — quem tem menos registros que o restante da turma.
- É a defesa contra o corte premiar quem por acaso recebeu mais atenção.

### RF-G2 — Perfil do participante, visão do mentor · P2
Tudo sobre uma pessoa: bloco visível e interno, notas, presença, evolução por eixo.

---

## H — Encerramento e documento final

### RF-H1 — Gerar documentos · P3
Ao encerrar, o sistema gera um documento por participante.
- Conteúdo: identificação e edição, trajetória encontro a encontro, todos os feedbacks visíveis com autoria, gráfico de evolução da oratória (até 5 pontos por canal), retratos das dinâmicas, presença.
- Com a cara da DEX. É a única coisa que a pessoa leva, então é peça de design, não relatório.
- Gerado para **todos**, aprovados e não aprovados, com o mesmo conteúdo.

### RF-H2 — A legenda da escala vai junto · P3
O documento explica o que a nota significa antes de mostrá-la.
- Quem lê "2 de 5" sem contexto lê reprovação. A escala da DEX é assimétrica por desenho: começar em 1–2 é o esperado, 4 é evolução grande, 5 é fora da curva (RN-16).
- Sem essa legenda, entregar o gráfico a quem não passou faz mais mal que bem. **Este requisito é condição para o RF-H1 existir.**

### RF-H3 — Exportar em lote · P3
- Gera todos os documentos de uma vez.
- Saída em PDF, um arquivo por pessoa, nomeado por participante.
- Reproduzível: rodar de novo anos depois, a partir dos dados arquivados, produz o mesmo documento.

---

## I — Site público

### RF-I1 — Landing · P3
Página única: o que é a DEX, o que ela faz, link para o Instagram, botão de entrar.
- Sem formulário de inscrição, sem captação. Não é o trabalho deste site.

### RF-I2 — Tela de login · P1
Porta de entrada, alcançável direto por URL.
- Um botão do Google e nada mais.
- Explica em uma linha que o acesso é restrito aos membros da formação, para quem chegou por curiosidade não tentar e achar que quebrou.
