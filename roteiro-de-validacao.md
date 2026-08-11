# Roteiro de validação

O que precisa ser conferido **por uma pessoa, com o sistema rodando**, antes da
formação começar.

Este arquivo cresce a cada work item concluído e é executado **de uma vez só, no
fim** — não etapa a etapa. A razão é concreta: um conserto feito hoje pode
quebrar algo entregue três itens atrás, e validar em pedaços dá a sensação de
segurança sem a segurança. O que vale é a passada inteira, com o sistema no
estado em que ele vai ser usado.

## Como usar

1. Suba o ambiente (`README.md`, seção *Como rodar*).
2. Execute os fluxos **na ordem**. Vários dependem do estado deixado pelo anterior.
3. Marque `[x]` no que passou. O que falhar vira item em `pendencias.md`.
4. **Faça tudo no celular**, ou no navegador a 390px de largura. É o dispositivo
   principal do mentor, e metade dos defeitos encontrados até aqui só aparecia lá.

> **O que NÃO está aqui:** o que a suíte automatizada já prova. Ver a seção
> *O que a suíte já garante* no fim — não vale repetir à mão o que 425 testes
> conferem a cada `npm test`.

---

## Preparação

- [ ] `npx supabase db reset` — banco limpo, seed aplicado
- [ ] `npm test` passa inteiro
- [ ] `npm run build` sem erro
- [ ] Duas contas Google de verdade em mãos, uma delas `@discente.ufg.br`
- [ ] Um celular físico, não só o navegador redimensionado

---

## F1 — Quem entra e quem não entra

**Por que importa:** é a única barreira entre a turma e a avaliação nominal dela.
Falhar aqui não é bug de tela, é vazamento.

- [ ] **F1.1** Entrar com uma conta Google que **não** está na lista de
      autorizados → recusa clara, com a instrução de procurar um mentor e usar
      o `@discente`. Não pode criar conta vazia nem tela em branco.
- [ ] **F1.2** Entrar com uma conta `@discente.ufg.br` autorizada → entra.
      **Este é o teste que não pode ser descoberto no dia do encontro:** o
      Workspace da UFG pode bloquear aplicativos de terceiros, e destravar passa
      pelo STI.
- [ ] **F1.3** Entrar como mentor → cai em `/encontros`. Entrar como participante
      → cai em `/trajetoria`.
- [ ] **F1.4** Com a pessoa logada em outra aba, remover o e-mail dela em
      `/membros` → na **próxima ação** dela o acesso cai. Não esperar expirar
      sessão (`RN-11`).
- [ ] **F1.5** Remover alguém e conferir que o feedback que ela recebeu
      **continua no banco** (`RN-18`). O documento final dela tem que continuar
      reproduzível.
- [ ] **F1.6** Colar uma lista de 20 e-mails de uma vez, com vírgula, ponto e
      vírgula e quebra de linha misturados, incluindo um repetido e um inválido
      → adiciona os válidos, ignora o repetido em silêncio, aponta o inválido.
- [ ] **F1.7** `/membros` mostra quem **ainda não entrou**. É o que permite
      cobrar antes do encontro 2 em vez de descobrir na hora.
- [ ] **F1.8** Um participante tentando abrir `/membros` ou `/encontros` pelo
      endereço direto → recusado, não tela vazia.

## F2 — A landing e a porta de entrada

- [ ] **F2.1** Abrir `/` no celular: nada rola na horizontal, o "DEX" gigante não
      estoura, o símbolo aparece.
- [ ] **F2.2** O texto da home é o aprovado ("A DEX é um centro de construção e
      aceleração de perfis empreendedores…").
- [ ] **F2.3** O Instagram aponta para **hub.dex**.
- [ ] **F2.4** Em `/entrar`, o logo no topo esquerdo volta para a home.
- [ ] **F2.5** A transição home → login mantém o fundo escuro, e a sombra do
      card aparece (é roxa; preta sobre preto sumiria).

## F3 — Criar e abrir encontro

- [ ] **F3.1** Criar encontro com número, tema, data e framework → nasce em
      `rascunho`, com o número seguinte já sugerido.
- [ ] **F3.2** Logado como **participante**, o encontro em rascunho **não
      aparece** em lugar nenhum.
- [ ] **F3.3** Criar um encontro com framework **Sem avaliação** → a confirmação
      **não** manda atribuir eixos, e em nenhuma tela ele lê como pendência.
      Tem que ler como *cumprido* (`RN-14`).
- [ ] **F3.4** Atribuir eixos com menos mentores do que eixos → avisa qual eixo
      fica descoberto e **deixa salvar assim mesmo**.
- [ ] **F3.5** Abrir o encontro → a lista mostra ele no topo com destaque, e o
      item "Encontros" da navegação ganha o ponto.
- [ ] **F3.6** Com dois encontros abertos em semanas diferentes, conferir que a
      ordenação da lista continua fazendo sentido.

## F4 — Registrar feedback · a tela mais importante

**Por que importa:** se ela tiver fricção, nada mais acontece. Sem registro não há
trajetória, não há cobertura, não há documento final.

- [ ] **F4.1 — O cronômetro.** Em pé, com o celular numa mão, registrar um
      feedback completo (situação, ponto, sugestão, nota) **em menos de um
      minuto**. Cronometrar de verdade. Se passar de um minuto, o mentor
      desiste na terceira semana.
- [ ] **F4.2** A lista da turma põe **quem ainda não recebeu nada** no topo.
- [ ] **F4.3** A busca fica fixa no topo e **não some ao rolar**. Testar com a
      turma inteira, rolando até o fim.
- [ ] **F4.4** Buscar por "joao" (sem acento) acha "João". Buscar por sobrenome
      acha. Buscar por "davila" acha "D'Ávila".
- [ ] **F4.5** O eixo do mentor **vem preenchido** — ele nunca escolhe (`RN-02`).
- [ ] **F4.6** Antes do formulário aparece o que **os outros mentores** já
      escreveram: autor, eixo e texto visível. Conferir que **não** aparece nota
      nem observação interna de ninguém.
- [ ] **F4.7 — A confusão que não pode acontecer.** Peça a **um mentor que nunca
      viu a tela** para registrar um feedback, sem explicar nada. Depois
      pergunte: *"o que dessa tela a pessoa avaliada vai ler?"* Se ele hesitar,
      a separação dos dois blocos falhou. Este é o teste mais importante da
      lista, e o único que não dá para automatizar.
- [ ] **F4.8** Tentar salvar sem sugestão → a mensagem **cita a diretriz 6**, não
      diz "campo obrigatório" (`RN-01`).
- [ ] **F4.9** Escolher cada nota de 1 a 5 → o descritor daquele eixo aparece, e
      a frase sobre a assimetria da escala aparece junto (`RF-D3`, `RN-16`).
- [ ] **F4.10** "Não observado" é escolhível ao lado dos números, e a tela
      explica que é diferente de deixar em branco (`RN-07`).
- [ ] **F4.11** O aviso de que a nota **entra no documento final** está junto da
      nota, visível sem rolar.
- [ ] **F4.12 — O corredor sem sinal.** Escrever metade do feedback, **desligar o
      Wi-Fi e os dados**, fechar o app, reabrir → o texto está lá (`D-03`).
- [ ] **F4.13** Salvar → volta para a lista com aquele nome marcado, **sem tela
      de confirmação** no meio.
- [ ] **F4.14** Registrar para 5 pessoas seguidas sem sair da lista. Contar
      quantos toques cada uma custa — esse número multiplica por 40.
- [ ] **F4.15** Editar um feedback já salvo antes da liberação → muda tudo.
- [ ] **F4.16** Apagar um feedback próprio antes da liberação → some.
- [ ] **F4.17** Entrar como **outro mentor** e tentar editar feedback alheio →
      não consegue, e a tela não oferece.

## F5 — A trajetória do participante

**Por que importa:** é o outro lado do produto, e o único que a turma inteira vê.
O ritmo é o oposto do da tela do mentor — aqui é para ser lido devagar, e é o que
a pessoa leva para a semana seguinte.

- [ ] **F5.1 — A primeira impressão.** Entrar com uma conta que ainda não recebeu
      nada → a trajetória **explica o que vai aparecer ali e quando**, e não
      mostra um espaço em branco (`RF-E3`). Acontece uma vez só, na primeira
      semana, para a turma inteira.
- [ ] **F5.2** Encontro **aberto** aparece como *"os feedbacks deste encontro
      ainda não foram liberados"*, nunca como vazio.
- [ ] **F5.3** Encontro **sem avaliação** aparece como cumprido, e o texto não
      sugere que faltou alguma coisa (`RN-14`).
- [ ] **F5.4** Encontro **liberado** mostra a contagem e leva ao detalhe.
- [ ] **F5.5** Um encontro liberado em que **ninguém escreveu para aquela
      pessoa** → a tela diz isso com naturalidade e lembra que guarda o que foi
      dito presencialmente. Não pede desculpa, não promete que vem depois.
      A plataforma registra, não produz (`specs/01`): sem conversa no encontro,
      não há o que registrar, e isso é normal.
- [ ] **F5.6** No detalhe, os feedbacks vêm **agrupados por eixo**, com a
      pergunta-âncora no cabeçalho de cada grupo.
- [ ] **F5.7 — O teste do modelo.** Mostrar o detalhe a alguém de fora e
      perguntar: *"por que tem três textos aqui?"* Se a pessoa responder algo
      como "cada um olhou uma coisa", o agrupamento por eixo está fazendo o
      trabalho dele. Se responder "são três opiniões", falhou.
- [ ] **F5.8** Situação, ponto e sugestão são visualmente distintos, e a
      **sugestão tem o maior peso** — é a única parte acionável.
- [ ] **F5.9** Todo feedback está **assinado com o nome do mentor** (`RN-04`).
- [ ] **F5.10** A ordem é do **mais recente para trás**.
- [ ] **F5.11** A presença aparece em cada encontro.
- [ ] **F5.12** O participante **não tem sidebar** — só header com logo, nome e
      sair.
- [ ] **F5.13** Abrir o código-fonte da página (Ctrl+U) e procurar por `nota`,
      `observacao_interna` e por um trecho da observação interna escrita por um
      mentor. **Nada pode aparecer** (`RN-03`).
- [ ] **F5.14** Digitar o endereço de `/encontros`, `/membros` e de um formulário
      de feedback logado como participante → cai na trajetória, sem vazar nome de
      outro participante (`RN-12`).

## F6 — A liberação semanal

**Por que importa:** é irreversível e atinge a turma inteira de uma vez. É o
único lugar do produto em que a tela tenta desacelerar quem a usa.

- [ ] **F6.1** A tela mostra os quatro números antes de qualquer botão: quantos
      vão receber, **quantos não vão receber nada**, total de feedbacks e
      quantas mensagens anônimas serão reveladas.
- [ ] **F6.2** Conferir os quatro **contando à mão** no banco. O número de
      mensagens é o que mais engana: o mentor não pode ler mensagem de encontro
      aberto, e a contagem vem da marca de envio, não do texto.
- [ ] **F6.3** Com gente descoberta, o aviso aparece com o número escrito por
      extenso na frase, não só no cartão.
- [ ] **F6.4** O botão só habilita depois de escrever LIBERAR. Tentar enviar com
      o campo vazio ou com outra palavra é recusado **no servidor** também —
      testar chamando a ação direto, não só pela tela.
- [ ] **F6.5** Ao confirmar, as três coisas acontecem juntas: participante passa
      a ler o feedback, a caixa anônima recusa nova mensagem, e o mentor passa a
      ver as mensagens.
- [ ] **F6.6** Tentar liberar o mesmo encontro de novo → recusado.
- [ ] **F6.7** Um feedback escrito **depois** da liberação aparece de imediato
      para o participante (`RN-05`).
- [ ] **F6.8** Depois de liberado, o painel do encontro não oferece mais o
      caminho de liberar, e o endereço digitado à mão volta para o painel.

## F7 — A caixa anônima

**Por que importa:** é a única parte do sistema em que uma falha destrói a
confiança de forma irreversível. Alguém critica um mentor, é identificado, e
nunca mais ninguém escreve nada — nem naquela edição, nem nas seguintes, porque
a história circula.

- [ ] **F7.1** A caixa aparece na trajetória enquanto o encontro está aberto, e
      some quando ele é liberado.
- [ ] **F7.2 — O teste da credibilidade.** Peça a **um estudante que não conhece
      o sistema** para ler a explicação do anonimato e depois pergunte: *"você
      escreveria uma crítica a um mentor aqui?"*. Se a resposta for "não sei se
      dá pra confiar", o texto falhou — e caixa em que ninguém acredita fica
      vazia, que é a mesma coisa que não ter caixa.
- [ ] **F7.3** Enviar uma mensagem → a confirmação **não mostra o que foi
      escrito**, e explica por que não dá para recuperar.
- [ ] **F7.4** Tentar enviar uma segunda no mesmo encontro → recusado (`RN-09`).
- [ ] **F7.5** Depois da liberação, a caixa recusa mensagem nova e explica que
      fechou para você escrever **antes** de ler o feedback.
- [ ] **F7.6** O mentor lê todas juntas, **sem autor, sem horário**, e a ordem
      não é a de envio (`RN-10`).
- [ ] **F7.7** Recarregar a tela do mentor várias vezes → a ordem **não muda**.
- [ ] **F7.8** Não há como responder, reagir ou marcar como lida.
- [ ] **F7.9 — A tentativa de reidentificação, pela interface.** Com **uma
      mensagem só** num encontro, o mentor tenta descobrir de quem é: pela tela,
      pelo endereço direto, pelo inspetor. Não pode conseguir.
- [ ] **F7.10** Conferir no banco, como administrador, que não existe junção
      possível entre `mensagem_anonima` e qualquer coisa que identifique alguém.
      **Se der para ligar, o item não está pronto** — é severidade máxima.

## F8 — Presença

**Por que importa:** sem presença, a tela de cobertura vira alarme falso toda
semana, apontando como buraco de atenção quem simplesmente faltou. Alarme que
dispara sem motivo passa a ser ignorado — inclusive quando estiver certo.

- [ ] **F8.1 — O caminho real.** No fim de um encontro, tocar em **"todos
      presentes"** e depois desmarcar três pessoas. Cronometrar: tem que ser
      mais rápido que marcar um por um. Se não for, o mentor para de marcar.
- [ ] **F8.2** Os três estados existem e funcionam: presente, ausente,
      justificada.
- [ ] **F8.3** Salvar, sair e voltar → a marcação continua lá.
- [ ] **F8.4** Desmarcar alguém que estava marcado e salvar → some de verdade.
- [ ] **F8.5 — O alarme falso.** Com metade da turma ausente e ninguém com
      feedback, o painel **não** conta os ausentes como buraco de atenção. Diz
      quantos vieram e não receberam, e quantos não vieram, separado.
- [ ] **F8.6** Na lista da turma, quem faltou aparece como falta — não como
      "ninguém escreveu ainda" — e vai para o **fim** da lista, não para o topo.
- [ ] **F8.7** Depois da liberação, a presença não muda mais, e o endereço
      digitado à mão volta para o painel.
- [ ] **F8.8** A presença aparece na trajetória do participante.

## F9 — Turma e cobertura

**Por que importa:** é a defesa contra o corte premiar quem por acaso recebeu
mais atenção. Sem esta tela, a diferença entre receber quinze observações e duas
passa despercebida — e ela quase nunca é mérito.

- [ ] **F9.1** A lista põe quem tem menos feedback primeiro.
- [ ] **F9.2** "Sem nenhum feedback" mostra o número certo. Conferir contando à
      mão — é o número que não cala mesmo quando a turma inteira está em zero.
- [ ] **F9.3** Com a turma bem distribuída, **ninguém** aparece destacado como
      abaixo da cobertura. Se metade da turma acender, o critério está errado.
- [ ] **F9.4** Quem faltou aparece com a falta, e a falta não conta como buraco
      de atenção (`RF-C2`).
- [ ] **F9.5** No perfil, o gráfico mostra as três linhas com a legenda escrita.
- [ ] **F9.6 — O gráfico não pode mentir.** Registre um "não observado" no meio
      da série de alguém. No gráfico ele tem que aparecer **abaixo da escala**,
      na faixa `n/o`, e a linha tem que **se partir ali** — nunca virar ponto
      baixo nem atravessar por cima. Este é o teste mais importante da tela: o
      gráfico vai para o documento final, e a pessoa leria uma queda que não
      existiu.
- [ ] **F9.7** A tabela abaixo do gráfico mostra `n/o` na célula, não zero nem
      vazio, e a média ignora esses encontros.
- [ ] **F9.8 — A cor segue o eixo.** Abra o perfil de **duas pessoas
      diferentes** e confira que Fala tem a mesma cor nas duas. Se trocar, os
      documentos ficam incomparáveis.
- [ ] **F9.9** Imprimir o gráfico em preto e branco (ou simular daltonismo) →
      ainda dá para dizer qual linha é qual, pela legenda e pela tabela.
- [ ] **F9.10** O perfil mostra o bloco interno — nota e observação — e a
      trajetória do mesmo encontro **não** mostra. Comparar as duas telas lado a
      lado.
- [ ] **F9.11** No celular, a turma são cartões empilhados, não tabela rolando
      na horizontal.

## F10 — Encerramento da edição

**Por que importa:** é o gesto mais pesado do produto. A turma inteira perde o
acesso de uma vez, e não há botão para reabrir.

- [ ] **F10.1** A confirmação **nomeia a consequência** — não pergunta "tem
      certeza". Ler e conferir que diz o que muda no mundo.
- [ ] **F10.2** O botão só habilita depois de escrever ENCERRAR, e o servidor
      recusa sem a palavra.
- [ ] **F10.3 — A sessão já aberta.** Deixe um participante logado em outra aba.
      Encerre a edição. Na **próxima ação dele**, a tela tem que explicar que a
      formação terminou e como receber o documento — **não** "cadastro
      incompleto" nem tela vazia.
- [ ] **F10.4** Tentar entrar de novo como participante → recusa com a mensagem
      de encerramento.
- [ ] **F10.5** Aprovado e não aprovado perdem o acesso igualmente. Conferir com
      duas contas.
- [ ] **F10.6** O mentor continua entrando e vendo tudo: encontros, turma,
      feedbacks, notas.
- [ ] **F10.7** Conferir no banco que **nada foi apagado** (`RN-18`).
- [ ] **F10.8** A tela informa o que acontece com os dados e o caminho para
      pedir exclusão.
- [ ] **F10.9** Reabrir não é oferecido em lugar nenhum.
- [ ] **F10.10** Com um encontro ainda aberto no momento do encerramento, a
      caixa anônima **também** para de aceitar mensagem.

## F11 — O documento final

**Por que importa:** é o momento em que a nota deixa de ser interna, e a única
coisa que a pessoa leva. Para muita gente vai ser a primeira vez que vê um número
associado ao próprio desempenho — **inclusive quem não passou**.

- [ ] **F11.1** Gerar a prévia (`npx tsx documento/cli.ts --previa`) e abrir no
      navegador.
- [ ] **F11.2 — Ler impresso, em papel.** Imprimir de verdade, não olhar na tela.
      Ler **imaginando quem não passou**. Se em algum ponto a leitura soar como
      sentença, o texto está errado.
- [ ] **F11.3** A legenda da escala aparece **antes** do primeiro número, e as
      duas não se separam entre páginas.
- [ ] **F11.4** O documento não diz em lugar nenhum se a pessoa passou.
- [ ] **F11.5** Um "não observado" aparece como `n/o` na tabela e **fora da
      escala** no gráfico. Nunca como zero.
- [ ] **F11.6** Todo feedback está assinado com o nome do mentor.
- [ ] **F11.7** As dinâmicas sem rubrica (bomba, negociação) aparecem em texto,
      com a explicação de por que não têm nota.
- [ ] **F11.8** Gerar duas vezes → arquivos idênticos (`shasum`).
- [ ] **F11.9** Gerar o lote inteiro: um arquivo por pessoa, nomeado por
      participante, **inclusive para quem não recebeu feedback nenhum**.
- [ ] **F11.10** Imprimir em PDF pelo Chrome: cabe na A4, não corta texto, não
      quebra o gráfico ao meio.
- [ ] **F11.11 — O teste do leitor.** Mostre um documento a alguém de fora e
      pergunte: *"o que essa pessoa deveria fazer depois de ler isto?"*. Se a
      resposta for sobre as sugestões, funcionou. Se for sobre a nota, a ordem
      falhou.

## F12 — Ensaio geral · uma semana inteira

Este é o fluxo que só faz sentido **depois de tudo pronto**. Ele simula um ciclo
real, do jeito que vai acontecer em setembro.

Repete de propósito coisas já conferidas nos fluxos acima. Não é desperdício: lá
cada tela foi testada isolada, com o banco arrumado à mão; aqui elas são testadas
**na sequência real, com o estado que a anterior deixou** — que é onde a
regressão entre itens aparece.

- [ ] **F12.1** Mentor cria o encontro 1 (Perfil Empreendedor, sem avaliação),
      abre, marca presença.
- [ ] **F12.2** Participante entra e vê o encontro 1 na trajetória **como
      cumprido**, sem sugerir que faltou feedback (`RN-14`).
- [ ] **F12.3** Mentor cria o encontro 2 (Oratória), atribui os três eixos a três
      mentores diferentes, abre.
- [ ] **F12.4** Três mentores registram feedback para as mesmas 10 pessoas, cada
      um no eixo dele.
- [ ] **F12.5** Participante entra **antes da liberação** → vê o encontro, **não
      vê feedback nenhum** (`RN-05`).
- [ ] **F12.6** Participante escreve na caixa anônima.
- [ ] **F12.7** Participante tenta escrever uma segunda mensagem → recusado
      (`RN-09`).
- [ ] **F12.8** Mentor abre a tela de liberação → ela mostra quantos vão receber
      feedback e **quantos não vão receber nenhum**. Conferir que o número está
      certo contando à mão.
- [ ] **F12.9** Liberar. No mesmo instante: feedback aparece para os
      participantes, caixa anônima fecha, mensagens aparecem para os mentores.
- [ ] **F12.10** Participante lê o feedback dele → vê situação, ponto, sugestão e
      **o nome do mentor** (`RN-04`). **Não vê nota nem observação interna**
      (`RN-03`). Conferir também no código-fonte da página (Ctrl+U), não só na
      tela.
- [ ] **F12.11** Participante tenta ver a trajetória de outro pelo endereço
      direto → recusado (`RN-12`).
- [ ] **F12.12** Mentor lê as mensagens anônimas → sem autor, sem horário, e a
      ordem **não** é a de envio (`RN-08`, `RN-10`).
- [ ] **F12.13** Mentor tenta editar o texto visível de um feedback já liberado →
      travado, com a razão escrita. A nota continua editável (`RN-06`).
- [ ] **F12.14** Encerrar a edição → participantes perdem o acesso, e o login
      deles passa a explicar isso e a dizer como receber o documento (`RN-13`).
- [ ] **F12.15** Mentor continua acessando tudo em modo arquivo.
- [ ] **F12.16** Gerar o documento final de uma pessoa → a nota aparece **aqui,
      pela primeira vez**, junto de toda a trajetória dela.
- [ ] **F12.17** Imprimir o documento final em PDF → cabe, não corta texto, não
      fica com fundo escuro desperdiçando tinta.

## F13 — Mobile, em todas as telas

Passar por **todas** as telas construídas, no celular físico:

- [ ] **F13.1** Nenhuma rola na horizontal.
- [ ] **F13.2** Nenhum botão ou link abaixo de 44px de altura.
- [ ] **F13.3** Itens de lista percorridos em sequência têm 56px.
- [ ] **F13.4** Nenhum campo com fonte abaixo de 16px (abaixo disso o iOS dá zoom
      sozinho e o mentor perde o contexto no meio do preenchimento).
- [ ] **F13.5** A barra inferior não cobre conteúdo nem o botão principal.
- [ ] **F13.6** Com o teclado aberto, o campo em foco continua visível.
- [ ] **F13.7** Testar em **iPhone e Android**, não só num.

## F14 — Acessibilidade e leitura

- [ ] **F14.1** Nenhum estado é comunicado só por cor — todo chip tem a palavra
      escrita.
- [ ] **F14.2** Navegar uma tela inteira só pelo teclado, com foco visível.
- [ ] **F14.3** Passar o leitor de tela pelo formulário de feedback: os rótulos
      são anunciados, e o erro da sugestão é lido junto do campo.
- [ ] **F14.4** Aumentar a fonte do sistema para 200% → nada some nem se
      sobrepõe.

## F15 — Só dá para testar em produção

Não têm como ser validados localmente. Entram no dia em que as contas existirem.

- [ ] **F15.1** `supabase/bootstrap.sql` rodado **uma vez** no banco de produção,
      com o e-mail certo — o da conta Google com que você realmente clica em
      "entrar".
- [ ] **F15.2** Depois do bootstrap, o primeiro mentor entra e consegue cadastrar
      os outros por `/membros`.
- [ ] **F15.3** A tela de consentimento do Google mostra **a DEX** como autora do
      aplicativo, não uma pessoa física.
- [ ] **F15.4** `NEXT_PUBLIC_LOGIN_LOCAL` **não existe** no ambiente de produção.
      Conferir que a tela de login **não** mostra o formulário de senha.
- [ ] **F15.5** A `service_role` não aparece em nenhuma variável exposta ao
      navegador (`D-07`).
- [ ] **F15.6** Carregar a tela de registrar feedback no 4G de verdade, no
      corredor do INF, e medir. É o cenário real.

---

## O que a suíte já garante

Não repetir à mão. Estes rodam a cada `npm test` e falham sozinhos:

| Área | O que já está coberto |
|---|---|
| `RN-03` | O participante não lê a tabela `feedback`; a view não tem as colunas do bloco interno; nenhum componente de cliente recebe `nota` ou `observacao_interna` |
| `RN-08` / `RN-10` | Não existe coluna nem **ordem física** ligando mensagem a autor — inclui o teste de reidentificação com acesso total ao banco |
| `RN-12` | Participante não alcança dado de outro, nem pedindo pelo id |
| `RN-06` | Bloco visível travado após a liberação, no banco; bloco interno segue editável |
| Ciclo do encontro | Toda transição inválida recusada pelo banco, não só escondida na tela |
| `RN-01`, `RN-07`, `RN-16` | Regras de domínio, uma função por regra |
| Design system | Nenhum hex fora dos dois arquivos autorizados; todo utilitário de toque gera CSS de verdade |
| Login local | A suíte falha se `NEXT_PUBLIC_LOGIN_LOCAL` vazar para produção |

**O que a suíte não pode provar** é justamente o que este roteiro cobre: se o
mentor entende qual bloco a pessoa vai ler, se o registro cabe em um minuto com
o celular na mão, e se o texto sobrevive ao corredor sem sinal.

---

## Registro das passadas

| Data | Quem | Até onde foi | O que falhou |
|---|---|---|---|
| — | — | — | — |
