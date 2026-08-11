---
id: caixa-anonima-design
work_item: caixa-anonima
intent: plataforma-formacao-dex
run: run-dex-009
created: 2026-08-11T20:40:00Z
---

# Design: Caixa de mensagem anônima

O work item pede que este documento **procure o vazamento nos lugares que não são o
esquema**, porque o esquema já foi desenhado para não permitir a junção.

Procurei. Achei um, e ele não é hipotético.

## O vazamento que já existe no código commitado

A política `enviada_mentor_le` dá a qualquer mentor leitura irrestrita de
`mensagem_enviada` — e essa tabela tem `participacao_id`.

Verificado contra o banco, com a sessão de um mentor comum, sem acesso privilegiado
nenhum, e com o encontro **ainda aberto**:

```
 quem_enviou
-------------------
 Ana Beatriz Rocha
```

Com uma mensagem no encontro, a identificação é completa: o mentor sabe que só a Ana
escreveu, e depois da liberação lê a única mensagem que existe. Com duas, é cara ou
coroa. A proteção do esquema — não existir coluna ligando mensagem a autor — **assume que
a lista de quem enviou é secreta**, e ela não está.

Isso derruba `RN-08` na letra: *"Nem um mentor com acesso ao banco consegue descobrir quem
escreveu."* É a falha de severidade máxima que `specs/07` manda caçar, e o item diz que
com ela o trabalho não está pronto.

**Por que passou.** A política foi escrita junto com `enviada_propria`, provavelmente para
alimentar alguma contagem. O teste de reidentificação existente ataca pelo lado certo —
`ctid`, junção entre as tabelas — e passa, porque o caminho fácil não estava na mira: não
é preciso reidentificar nada quando a própria tabela entrega a lista.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Leitura de `mensagem_enviada` pelo mentor | **Removida.** Nenhum acesso a linha | A tabela existe para `RN-09`, não para consulta. Quem envia não é informação de ninguém |
| Contagem para a prévia da liberação | Função `security definer` devolvendo só o inteiro | `RF-B4` exige o número; o número não nomeia ninguém, a lista nomeia |
| "Já enviei" | Confirmação seca, sem o texto | Poder recuperar o próprio texto implica que o vínculo existe em algum lugar |
| Leitura pelo mentor | Só depois da liberação, todas juntas, por `ordem_aleatoria` | `RN-10`. Sem autor, sem horário, sem ordem de chegada |
| Sem responder, reagir ou marcar como lida | Nenhuma escrita do mentor sobre a mensagem | Não é canal de conversa. Qualquer estado por mensagem vira metadado a correlacionar |

## Onde mais o vazamento poderia estar

O item lista quatro lugares. Cada um, neste sistema:

**Log de requisição com corpo e usuário.** A mensagem chega por ação de servidor
autenticada — não há como não saber quem chamou, porque `RN-09` depende disso. O que dá
para garantir é que nada no caminho escreva as duas coisas em lugar nenhum: nenhum
`console`, nenhum `catch` que registre o corpo, nenhuma mensagem de erro que ecoe o texto.
Vira teste de guarda.

**Ordem de inserção correlacionada.** Resolvido no item anterior: o `CLUSTER` roda dentro
de `liberar_encontro()`, na mesma transação. Já tem teste que monta o zíper por `ctid`.

**Contador em tempo real.** Fechado ao remover a leitura da tabela. Sobra o número na tela
de liberação, que `RF-B4` exige — e ele é atualizado a cada visita àquela tela. **Risco
residual assumido:** um mentor que abra a tela repetidamente vê o número subir. Sem a
lista de autores isso não nomeia ninguém; combinado com observação presencial ("a Ana
acabou de sair da sala"), estreita. Não vejo como cumprir `RF-B4` sem isso, e registro
aqui em vez de esconder.

**Analytics.** Não existe nenhum no projeto, e este documento é o lugar de dizer que
acrescentar um que registre "usuário X enviou mensagem" quebra `RN-08`.

## O texto da tela é requisito, não enfeite

`RF-F1`: *"a tela afirma o anonimato e explica **como** ele é garantido"*. A justificativa
está na spec e vale repetir aqui porque decide o tom: **promessa de anonimato sem
explicação não é acreditada, e caixa em que ninguém acredita fica vazia.**

Então a tela não diz "sua mensagem é anônima". Ela diz o que o sistema faz:

- não existe coluna ligando a mensagem a quem escreveu;
- o que fica guardado é só que você enviou, separado do que você escreveu;
- os mentores leem todas juntas, embaralhadas, depois da liberação;
- nem quem tem acesso ao banco consegue refazer o par.

A última linha só pode ser escrita porque é verdade — e só é verdade depois da correção
acima.

## Camadas

| Camada | O que garante |
|---|---|
| Esquema | Nenhuma coluna liga mensagem a autor (`RN-08`) |
| `CLUSTER` na liberação | Nem a ordem física liga (`RN-08`) |
| `mensagem_enviada` sem leitura de mentor | A lista de quem enviou não é consultável |
| Policy de `mensagem_anonima` | Mentor lê só de encontro liberado (`RF-F2`) |
| RPC | Único caminho de escrita; não devolve o id da mensagem |
| Guarda de código | Nada no caminho registra corpo com usuário |

## Como saber que está pronto

- Teste de reidentificação com acesso total ao banco continua passando.
- **Teste novo:** mentor não consegue listar quem enviou, nem contando, nem por junção.
- Uma mensagem só no encontro e o mentor não consegue dizer de quem é.
- A tela do participante explica o mecanismo, não só promete.
