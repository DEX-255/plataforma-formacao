# 01 — Produto

## O que é

Uma plataforma interna para a Formação DEX: os mentores registram feedback estruturado sobre cada participante ao longo dos encontros semanais, e cada participante acompanha a própria trajetória no perfil.

Não é um site institucional com área logada. É uma ferramenta de trabalho com uma página pública mínima na frente.

**A plataforma registra, não produz.** Tudo que aparece aqui foi dito na dinâmica, presencialmente. O sistema dá endereço e memória a esse feedback; ele não cria feedback novo, não pede que o mentor escreva sobre quem não observou, e não promete cobertura a ninguém.

A consequência prática decide texto de tela: **ausência de registro é ausência de conversa, e isso é normal.** Um participante que não recebeu feedback num encontro não foi esquecido pelo sistema — ninguém falou com ele naquele dia, e a plataforma não tem o que inventar. As telas do participante dizem isso com naturalidade, sem pedir desculpa e sem prometer que vem depois. Forçar o contrário produziria enchimento, que é o que `RN-15` existe para evitar.

Isso não torna a cobertura irrelevante: o problema 3 abaixo continua valendo, e é **na tela do mentor** que a desigualdade de atenção aparece para ser corrigida — enquanto ainda dá tempo, antes de virar fato consumado.

## O problema

A DEX já tem uma cultura de feedback escrita e um sistema de papéis de avaliação bem definido. O que não existe é onde isso mora. Hoje o feedback acontece na dinâmica, oralmente, e evapora. Três consequências:

1. **O participante não consegue ver evolução.** Ele ouve seis observações ao longo do semestre, em dias diferentes, e nunca vê o arco.
2. **O corte do PS depende de memória.** Quem decide precisa lembrar de 40 pessoas ao longo de 10 encontros.
3. **A atenção é desigual e ninguém percebe.** Como todo mentor pode observar qualquer participante, alguns recebem quinze observações e outros duas — e a diferença não é mérito, é acaso.

## Para quem

**Participante da formação.** Estudante do INF-UFG no processo seletivo. Entra pelo celular, algumas vezes por semana, geralmente à noite. Quer saber como está indo e o que fazer diferente.

**Mentor.** Membro da DEX que conduz e avalia. Registra feedback logo depois da dinâmica — em pé, no corredor, pelo celular, com pouco tempo e a memória fresca. É o usuário cuja fricção importa mais: se a tela dele for lenta ou longa, ele não preenche, e sem preenchimento o produto inteiro deixa de existir.

**Visitante.** Alguém que ouviu falar da DEX e chegou pelo Instagram. Só precisa entender o que é e por onde entrar.

## Escopo da v1

- Login com Google restrito a e-mails autorizados
- Edição, encontros e presença
- Feedback do mentor: bloco visível assinado + bloco interno com nota
- Três frameworks de avaliação: oratória, bomba em dupla, negociação
- Liberação semanal dos feedbacks
- Perfil do participante com trajetória
- Caixa de mensagem anônima do participante
- Visão de turma com cobertura de feedback
- Documento final individual, exportável
- Landing pública mínima

## Fora do escopo da v1

Explicitamente fora, para não virarem escopo por inércia:

- Feedback entre pares (participante → participante)
- Notificação por e-mail ou push
- Área pública com programas, eventos, time e histórico
- Autoavaliação do participante
- Chat ou comentário em feedback
- Painel de estatísticas da turma além da cobertura
- Múltiplas edições simultâneas — o sistema é multi-edição no modelo de dados, mas a v1 opera uma por vez
- Aplicativo nativo — é web, responsivo, e isso basta

## Critérios de sucesso

O produto funcionou se, ao fim da Formação 2026.2:

1. Nenhum participante chegou ao fim com menos de **quatro** registros de feedback.
2. **Todo** feedback visível tem sugestão prática preenchida — porque o sistema não aceita sem.
3. A decisão do corte foi tomada consultando a plataforma, não a memória.
4. Os mentores continuaram registrando na **última** semana com a mesma frequência da primeira. Queda de uso é o sintoma de fricção, e é o risco número um deste produto.
5. Todo participante recebeu seu documento final.

## Prazo

A Formação começa na **primeira semana de setembro de 2026** e vai até o fim do semestre, com encontro por semana. As datas exatas ainda dependem de um horário que feche com todos, então o sistema não assume cronograma: o encontro é criado quando acontece.

Isso dá aproximadamente quatro semanas até o primeiro uso real.

**Ordem de construção** — o que precisa estar de pé no dia 1 vem primeiro:

| Fase | O que | Quando precisa existir |
|---|---|---|
| 1 | Login, edição, encontro, feedback do mentor, perfil do participante | Primeiro encontro avaliativo (encontro 2) |
| 2 | Presença, caixa anônima, liberação semanal, cobertura de turma | Primeiras semanas |
| 3 | Landing pública | A qualquer momento |
| 4 | Documento final e exportação | Fim do semestre |

O encontro 1 (Perfil Empreendedor) não tem avaliação, o que dá uma semana extra de folga na fase 1.
