# 02 — Domínio

## Glossário

| Termo | Significado |
|---|---|
| **Edição** | Um ciclo completo da formação, ligado a um semestre. Ex: `2026.2`. Tudo pertence a uma edição. |
| **Participante** | Quem está fazendo a formação. Vê apenas o próprio perfil. |
| **Mentor** | Quem conduz e avalia. Vê tudo da edição, inclusive notas e observações internas. |
| **Encontro** | Um dia da formação. Tem tema, data e um framework de avaliação — ou nenhum. |
| **Framework** | O conjunto de eixos usado para avaliar um encontro: oratória, bomba em dupla, negociação, ou nenhum. |
| **Eixo** | O ângulo que um mentor específico observa num encontro. Na oratória são os *canais* (Mensagem, Fala, Presença). Cada mentor é dono de um eixo por encontro e só fala dele. |
| **Feedback** | O registro de um mentor sobre um participante num encontro. Tem um bloco visível e um bloco interno. |
| **Bloco visível** | Situação, ponto e sugestão. Assinado. O participante lê depois da liberação. |
| **Bloco interno** | Nota de 1 a 5 e observação livre. O participante nunca vê durante a formação; a nota entra no documento final. |
| **Liberação** | O momento semanal em que os feedbacks de um encontro passam a ser visíveis aos participantes. |
| **Caixa anônima** | Mensagem opcional que o participante envia sobre os mentores do dia e a formação. Sem autoria, e sem vínculo armazenado. |
| **Cobertura** | Quantos feedbacks um participante recebeu. Existe para expor desigualdade de atenção antes que ela contamine o corte. |
| **Documento final** | A peça individual entregue a cada participante no encerramento — trajetória, feedbacks, notas e gráficos. |

## Entidades

```
Edição 1─────n Encontro
   │              │
   │              ├──n Presença ────── Participação
   │              ├──n AtribuiçãoEixo ─ Usuário (mentor)
   │              ├──n Feedback ─────── Participação + Usuário (mentor)
   │              └──n MensagemAnônima  (sem vínculo com autor)
   │
   └───n Participação ── Usuário
```

**Usuário** — identidade. E-mail (Google), nome, foto, papel.
**Participação** — a presença de um usuário numa edição, com o status dele no PS. Um usuário pode participar de mais de uma edição ao longo do tempo; o histórico não se mistura.

Todo dado avaliativo pendura em **Participação**, nunca em **Usuário** direto. É o que permite alguém tentar o PS duas vezes sem que a segunda tentativa carregue a primeira.

## Ciclo de vida do encontro

```
  rascunho ──────► aberto ──────► liberado
```

**`rascunho`** — Criado, tema e framework definidos, eixos ainda não atribuídos. Invisível para participantes.

**`aberto`** — O encontro aconteceu. Mentores registram feedback e marcam presença. A caixa anônima está **aberta**. O participante vê o encontro na trajetória, mas nenhum feedback.

**`liberado`** — Um mentor libera. Nesse instante, três coisas acontecem ao mesmo tempo:
- os feedbacks visíveis aparecem para os participantes;
- a caixa anônima **fecha**;
- as mensagens anônimas ficam visíveis aos mentores.

Essa simultaneidade é proposital. O participante escreve a mensagem anônima **antes** de ler o feedback dele — senão a caixa vira canal de resposta ao feedback recebido, que é exatamente o que a diretriz 3 evita ("não dê feedback para quem está te dando feedback").

Não há volta de `liberado` para `aberto`.

## Ciclo de vida da edição

```
  ativa ──────► encerrada
```

**`ativa`** — Formação em curso.

**`encerrada`** — O PS acabou. O acesso dos participantes é revogado. Os dados permanecem para que os documentos possam ser gerados de novo anos depois. Mentores continuam acessando o arquivo.

## Frameworks e seus eixos

| Framework | Eixos | Onde |
|---|---|---|
| `oratoria` | `mensagem`, `fala`, `presenca` | Modelos de Negócio, Desenvolvimento de Produto, A Arte da Oratória, Marketing, Vendas |
| `bomba` | `manual`, `executor` | Liderança e Gestão de Pessoas |
| `negociacao` | `numeros`, `leitura`, `conducao` | Descomplicando Finanças |
| `nenhum` | — | Perfil Empreendedor |

⏳ Gestão Ágil de Projetos e Formações Extras estão sem framework definido. O modelo suporta acrescentar frameworks sem alterar o esquema — ver `06-arquitetura-e-dados.md`.

Na `bomba`, o eixo também identifica o **papel do participante** naquela dinâmica: quem tem o manual e quem tem a bomba são avaliados por critérios diferentes. Nos outros frameworks o eixo identifica só o ângulo do mentor.

## Regras de negócio

Regras invariantes. Valem em qualquer tela, e são responsabilidade do banco e do servidor — nunca só da interface.

### Feedback

**RN-01 — Sugestão é obrigatória.** Um feedback sem o campo de sugestão preenchido não é salvo. Tradução direta da diretriz 6: apontar problema sem indicar caminho não ajuda quem recebe.

**RN-02 — Um mentor, um eixo.** No encontro, o mentor só registra no eixo atribuído a ele. Ele pode ver o que os outros escreveram e usar isso para formar o veredito dele, mas não escreve fora do próprio canal.

**RN-03 — O participante nunca vê o bloco interno durante a formação.** Nem nota, nem observação interna, nem por acidente de API. A nota reaparece só no documento final.

**RN-04 — Feedback visível é sempre assinado.** O participante lê o nome do mentor. Não existe feedback visível anônimo.

**RN-05 — Feedback só aparece após a liberação do encontro.** Registrado num encontro já liberado, aparece de imediato.

**RN-06 — Depois da liberação, o bloco visível não é editado.** Antes, o mentor edita livremente. Depois, o que a pessoa leu é o que ficou. O bloco interno continua editável — ele não foi lido por ninguém de fora.

**RN-07 — "Não observado" é um valor de nota, não a ausência dela.** Distinguir "o mentor viu e avaliou 3" de "o mentor não teve como observar" é o que impede o gráfico de mentir. Um feedback pode ter bloco visível e nota "não observado".

### Anonimato

**RN-08 — A mensagem anônima não guarda vínculo com o autor.** Não é anonimato de interface, é anonimato de esquema: não existe coluna ligando mensagem a participante. Nem um mentor com acesso ao banco consegue descobrir quem escreveu.

**RN-09 — Uma mensagem por participante por encontro.** Controlado por um registro separado, que marca que a pessoa enviou sem apontar para o que ela escreveu.

**RN-10 — Mensagens são exibidas em ordem aleatória fixa.** Sem horário e sem ordem de chegada. Ordem de inserção correlacionada com o registro de envio reidentificaria o autor.

### Acesso

**RN-11 — Só entra quem está na lista.** Autenticar no Google não basta: o e-mail precisa estar autorizado. Quem não está recebe recusa, não uma conta vazia.

**RN-12 — Participante só enxerga a si mesmo.** Nunca outro participante, nunca a turma, nunca a cobertura.

**RN-13 — Ao encerrar a edição, o acesso dos participantes é revogado.** Aprovados e não aprovados igualmente. O que sobra para eles é o documento final.

### Avaliação

**RN-14 — Um encontro pode não ter avaliação.** É estado normal, não erro. Encontro expositivo ou de abertura entra na trajetória, marca presença, e não abre formulário. Forçar registro onde não houve observação produz enchimento, e enchimento destrói a credibilidade da nota.

**RN-15 — A nota mede estado, não esforço.** Quem evoluiu muito e ainda está em 2 recebe 2. O reconhecimento do avanço vive no texto. Ver `dominio/rubrica-notas-oratoria.md`.

**RN-16 — A escala é assimétrica por desenho.** A expectativa é que a turma comece em 1 e 2. Chegar a 4 significa evolução grande; 5 é fora da curva. A interface do mentor precisa comunicar isso no momento de pontuar, senão cada mentor calibra por conta própria e a nota perde comparabilidade.

### Estrutura

**RN-17 — Todo dado pertence a uma edição.** Nenhuma consulta atravessa edições sem pedir explicitamente.

**RN-18 — Nada é apagado, tudo é arquivado.** Encerrar edição não deleta. Documentos precisam ser reproduzíveis anos depois.
