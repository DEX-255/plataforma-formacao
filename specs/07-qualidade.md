# 07 — Qualidade

## Privacidade

O sistema guarda avaliações nominais de estudantes, escritas por colegas, usadas numa decisão que afeta a vida deles. É o dado mais sensível que uma entidade estudantil costuma manipular.

**Finalidade declarada.** No primeiro acesso, o participante lê em uma tela curta: o que é registrado sobre ele, quem vê o quê, quando ele passa a ver, que existe um bloco interno que ele lerá só no documento final, e o que acontece com os dados no encerramento. Sem juridiquês. Não é termo de uso — é a mesma transparência que a cultura de feedback da DEX já pratica.

**Minimização.** Guarda-se e-mail, nome e foto do Google, e nada além. Nem matrícula, nem telefone, nem curso, nem período. Todo campo a mais é responsabilidade a mais sem contrapartida.

**Retenção.** Os dados sobrevivem ao encerramento porque o documento precisa ser reproduzível (RN-18). Mas isso é escolha, não inércia — e a tela de encerramento diz por quanto tempo.

**Direito de saída.** O participante pode pedir a exclusão dos dados dele. Não há tela para isso na v1; existe procedimento manual documentado, e o texto de transparência informa para quem pedir.

**LGPD.** Base legal é o legítimo interesse da entidade na condução do processo seletivo, com a transparência acima. O ponto que importa na prática: nada de dado sensível na acepção da lei, nenhum compartilhamento com terceiro, e acesso restrito a quem tem papel de mentor.

## Anonimato

A caixa anônima é a única parte do sistema em que uma falha destrói a confiança de forma irreversível. Alguém critica um mentor, é identificado, e nunca mais ninguém escreve nada.

Três defesas, e nenhuma delas é de interface:

1. **Não existe vínculo armazenado** entre mensagem e autor (RN-08). Não é ocultação — é ausência.
2. **Não existe horário** em `mensagem_enviada`, e a exibição usa ordem aleatória fixa (RN-10). Ordem de chegada é vazamento.
3. **Liberação em bloco.** As mensagens só aparecem no momento da liberação, todas juntas. Contador aparecendo em tempo real depois de uma dinâmica de quatro pessoas identifica o autor sem precisar de nome.

**Teste obrigatório:** tentar reidentificar o autor de uma mensagem tendo acesso total ao banco. Se for possível, é defeito de severidade máxima.

## Segurança

**Duas camadas, não uma.** A renderização no servidor impede que dado proibido saia (D-02); o RLS e a view `feedback_visivel` impedem que ele seja lido mesmo se sair. As duas erram por motivos diferentes, e é por isso que ambas existem: `RN-03` é a regra cuja violação causa dano irreversível.

**A interface não conta como barreira.** Esconder um botão impede de clicar, não de pedir. Nenhuma decisão de acesso é tomada só em componente.

**Autorização por requisição.** Papel lido do banco, nunca de claim (D-01).

**Lista de acesso é fechada por padrão.** Autenticar no Google não autoriza nada. E-mail fora da lista não cria conta (RN-11).

**Remoção é imediata.** Tirar um e-mail da lista derruba o acesso na requisição seguinte, sem esperar sessão expirar.

**Nada sensível no cliente.** Nota e observação interna não são enviados ao navegador do participante em nenhuma circunstância, nem como propriedade de componente (D-02). A `service_role` nunca sai do servidor (D-07).

## Acessibilidade

**Contraste.** As razões medidas e a regra do roxo estão em `05-design-system.md`. O resumo: `#8C52FF` reprova para texto pequeno em qualquer fundo da paleta, e por isso só aparece em tipografia grande, preenchimento e borda.

**Alvos de toque.** Mínimo 44×44px, 56px em listas percorridas em sequência. É acessibilidade e é ergonomia: o mentor está em pé, segurando o celular com uma mão.

**Teclado.** Todo o fluxo de registrar feedback é operável só com teclado — parte dos mentores vai preencher no notebook depois do encontro. Foco sempre visível, e o anel de foco não é removido.

**Leitor de tela.** Rótulo em todo campo. O seletor de nota anuncia o descritor do nível, não o número solto. Estado de encontro é texto, não só cor.

**Movimento.** `prefers-reduced-motion: reduce` desliga tudo que não seja opacidade.

**Idioma.** `lang="pt-BR"`. Tudo em português — nenhum rótulo em inglês vazando do framework.

## Desempenho

O contexto real é 4G ruim no corredor do INF, à noite, com celular intermediário. Metas na tela de registrar feedback, em 4G simulado:

| | Meta |
|---|---|
| Primeiro conteúdo | < 1,5s |
| Interativa | < 2,5s |
| Salvar feedback | < 1s, com confirmação otimista |
| JavaScript da rota | < 120 KB comprimido |

O limite de JavaScript é orçamento, não estimativa, e vale medir a cada entrega. Ele fica mais fácil de cumprir com renderização no servidor: o que é conteúdo não vira código enviado.

**Não bloquear em fonte.** `font-display: swap`, fontes no próprio domínio, só os pesos usados (D-05).

**Confirmação otimista ao salvar.** O mentor não espera resposta do servidor para seguir para o próximo nome. Falhando, o rascunho local segura o texto e a tela avisa (D-03).

**Sem biblioteca de gráfico.** Três linhas, cinco pontos, SVG à mão.

## O que testar

Automatizado, na ordem de importância:

**As regras invariantes.** Uma suíte com um teste por `RN-xx`, referenciando o código. É a única parte em que teste não é opcional — cada uma dessas regras existe porque sua violação causa dano real a uma pessoa.

**Autorização, nas duas camadas.** Pela aplicação: participante tentando abrir rota de mentor, perfil de outro participante, feedback de encontro ainda não liberado. E direto contra a API, com um token de participante real, sem passar pela interface: pedir a tabela `feedback` crua, pedir dado de outro participante. O esperado é recusa ou resultado vazio nos dois casos. Testar só pela interface não prova que a política está certa.

**Anonimato.** O teste de reidentificação descrito acima.

**Fluxo do mentor ponta a ponta.** Criar encontro → atribuir eixos → abrir → registrar feedback → liberar → participante vê. É o caminho que precisa funcionar no primeiro dia.

**Ciclo de vida.** Transições válidas e inválidas de encontro e de edição. Especialmente: liberado não volta para aberto, e edição encerrada derruba acesso de participante.

Manual, antes do primeiro uso real:

- Percorrer a tela de registrar feedback **num celular de verdade**, em pé, com uma mão, cronometrando. Se um registro leva mais de um minuto, a tela precisa mudar antes de setembro.
- Ler um documento final impresso, em papel.

## Riscos

**O mentor parar de preencher.** É o risco que mata o produto, e ele não se resolve com funcionalidade — se resolve com fricção baixa e com a visão de cobertura tornando o buraco visível. O critério de sucesso 4 em `01-produto.md` mede exatamente isso.

**Feedback duro chegar sem contexto.** A liberação semanal, a sugestão obrigatória e a assinatura existem para isso. O ponto que ainda depende das pessoas: a primeira liberação define a expectativa da turma inteira. Vale revisar os feedbacks do encontro 2 com cuidado extra antes de apertar o botão.

**A nota do documento final surpreender.** Mitigado pelo RF-H2 — a legenda da escala vai antes do gráfico — e pelo aviso na tela do mentor de que a nota será lida.

**Nada estar pronto em setembro.** Mitigado pela ordem de construção em `01-produto.md`. O encontro 1 não tem avaliação, o que dá uma semana a mais. Se ainda assim apertar, a fase 1 sozinha já entrega valor: sem presença, sem caixa anônima, sem landing — mas com feedback registrado e visível, que é o produto.
