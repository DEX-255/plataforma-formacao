# 06 — Arquitetura e dados

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Uma base para o site público e o app. Renderização no servidor permite que dado proibido nunca chegue ao navegador (RN-03). |
| Estilo | **Tailwind** com os tokens de `05` | Os tokens viram configuração; o design system deixa de ser documento e passa a ser o que o código usa. |
| Auth + banco | **Supabase** (Google OAuth + Postgres + RLS) | Login Google pronto, e RLS aplica as regras de acesso no banco — não só na aplicação. Camada gratuita cobre a escala com folga. |
| Hospedagem | **Vercel** | Gratuito na escala do projeto, deploy por push. |
| Gráficos | **SVG à mão** | Três linhas com cinco pontos. Biblioteca de gráfico aqui pesa mais que o app e não fica com a cara da marca. |
| Documento final | **HTML + CSS de impressão**, PDF por Chrome headless | O documento é peça de design; construí-lo em HTML com as fontes da marca dá muito mais controle que gerador de PDF. É operação de uma vez por semestre, roda local. |

**Escala esperada:** ~50 participantes, ~10 mentores, ~15 encontros, na casa de 3.000 registros de feedback por edição. Qualquer banco relacional resolve. A escolha se justifica por RLS e login Google, não por volume.

### Por que Next.js e não React puro

A diferença que decide não é conforto de desenvolvimento, é **quantas barreiras existem entre o participante e a nota**.

Num React puro servido como arquivo estático, não há servidor de aplicação: o navegador de cada usuário fala direto com a API do banco, com um token na mão. Aí a política do banco não é a última defesa, é a **única** — e a interface deixa de proteger qualquer coisa, porque esconder um botão não impede ninguém de chamar a API pelo console.

Com renderização no servidor, as telas com dado sensível são montadas antes de sair, e o que não é enviado não vaza. A política do banco continua valendo por baixo, e passa a ser a segunda camada em vez da única. Para `RN-03` — o participante nunca vê nota nem observação interna — essa redundância é o que se quer: uma tela pode ter bug, uma consulta pode pedir coluna demais, e ainda assim nada sai.

O custo dessa escolha é ter um servidor no caminho, o que na Vercel é transparente e gratuito nessa escala.

**A alternativa considerada e descartada:** app estático com planilha ou Notion por trás. Barato e rápido, mas incapaz de garantir RN-03 e RN-08 — que são exatamente as regras que não podem falhar aqui.

## Estrutura de pastas

```
app/
  (publico)/
    page.tsx                        home
    entrar/page.tsx                 login
  (app)/
    layout.tsx                      sidebar / barra inferior
    trajetoria/                     participante
    encontros/[id]/                 mentor: painel, feedback, eixos, anônimas
    turma/[participante]/
    membros/
    encerrar/
  api/
componentes/
  ui/                               botão, cartão, campo, selo, chip
  feedback/                         formulário, seletor de nota, feedbacks anteriores
  grafico/                          evolução por eixo
dominio/
  regras.ts                         RN-01 a RN-18, uma função por regra
  frameworks.ts                     eixos, perguntas-âncora, descritores da rubrica
  tipos.ts                          tipos gerados do esquema + tipos de domínio
lib/
  supabase/                         clientes de servidor e de navegador
  auth.ts                           sessão, papel, proteção de rota
supabase/
  migrations/
  politicas/                        RLS
documento/                          gerador do documento final
specs/  dominio/  marca/            (fora do app)
```

Três pontos que sustentam a estrutura:

**`dominio/regras.ts` é a única casa das regras de negócio.** Nenhum componente decide sozinho se um feedback pode ser editado. A tela pergunta, a regra responde. É o que impede a mesma regra de existir em três lugares com três comportamentos.

**`dominio/frameworks.ts` é dado, não código espalhado.** Eixos, perguntas-âncora e descritores da rubrica vivem numa estrutura declarativa. Acrescentar o framework de Gestão Ágil ⏳ é acrescentar uma entrada — nenhuma tela muda.

**Dois clientes Supabase, e nunca o de navegador para dado sensível.** `lib/supabase/` separa o cliente de servidor do de navegador. Toda leitura que envolve bloco interno ou dado de turma acontece no servidor. É o que dá efeito prático ao D-02: a separação está na estrutura, não na disciplina de quem escreve a tela.

## Esquema

```sql
create type papel        as enum ('participante','mentor');
create type status_part  as enum ('ativo','desligado','aprovado','nao_aprovado');
create type status_enc   as enum ('rascunho','aberto','liberado');
create type status_ed    as enum ('ativa','encerrada');
create type presenca_st  as enum ('presente','ausente','justificado');
create type framework    as enum ('oratoria','bomba','negociacao','nenhum');

create table edicao (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,              -- '2026.2'
  inicio     date,
  fim        date,
  status     status_ed not null default 'ativa'
);

create table usuario (
  id         uuid primary key,           -- = auth.users.id
  email      text unique not null,
  nome       text not null,
  avatar_url text,
  papel      papel not null
);

create table email_autorizado (
  email       text primary key,
  papel       papel not null,
  edicao_id   uuid not null references edicao(id),
  convidado_por uuid references usuario(id),
  criado_em   timestamptz not null default now()
);

create table participacao (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuario(id),
  edicao_id  uuid not null references edicao(id),
  status     status_part not null default 'ativo',
  unique (usuario_id, edicao_id)
);

create table encontro (
  id          uuid primary key default gen_random_uuid(),
  edicao_id   uuid not null references edicao(id),
  numero      int  not null,
  tema        text not null,
  data        date not null,
  framework   framework not null,
  status      status_enc not null default 'rascunho',
  liberado_em timestamptz,
  unique (edicao_id, numero)
);

create table atribuicao_eixo (
  encontro_id uuid not null references encontro(id),
  mentor_id   uuid not null references usuario(id),
  eixo        text not null,
  primary key (encontro_id, mentor_id)
);

create table presenca (
  encontro_id    uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  status         presenca_st not null,
  marcado_por    uuid not null references usuario(id),
  marcado_em     timestamptz not null default now(),
  primary key (encontro_id, participacao_id)
);

create table feedback (
  id              uuid primary key default gen_random_uuid(),
  encontro_id     uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  mentor_id       uuid not null references usuario(id),
  eixo            text not null,

  -- bloco visível, assinado
  situacao  text not null,
  ponto     text not null,
  sugestao  text not null check (length(btrim(sugestao)) > 0),   -- RN-01

  -- bloco interno, nunca exposto ao participante
  nota                smallint check (nota between 1 and 5),
  nao_observado       boolean not null default false,
  observacao_interna  text,

  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  check (nao_observado = (nota is null)),                         -- RN-07
  unique (encontro_id, participacao_id, mentor_id, eixo)
);

-- RN-08: nenhuma coluna liga a mensagem ao autor.
create table mensagem_anonima (
  id              uuid primary key default gen_random_uuid(),
  encontro_id     uuid not null references encontro(id),
  texto           text not null,
  ordem_aleatoria double precision not null default random()      -- RN-10
);

-- RN-09: marca que enviou, sem apontar para o que escreveu.
create table mensagem_enviada (
  encontro_id     uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  primary key (encontro_id, participacao_id)
);
```

### Decisões que o esquema carrega

**O anonimato é estrutural.** `mensagem_anonima` e `mensagem_enviada` são escritas na mesma transação e não se referenciam. Não existe junção possível — nem para um mentor com acesso ao banco, nem para quem escreveu o código. `mensagem_enviada` não guarda horário de propósito: cruzar horário de envio com ordem de inserção reidentificaria o autor. Exibição sempre por `ordem_aleatoria`.

**`unique (encontro_id, participacao_id, mentor_id, eixo)`** garante um registro por mentor por pessoa por encontro. Se o mesmo mentor observar de novo, ele edita — não empilha.

**`check (nao_observado = (nota is null))`** impede o estado ambíguo em que existe nota e a marcação de não observado ao mesmo tempo (RN-07).

**Eixo é `text`, não enum.** Acrescentar o framework de Gestão Ágil ⏳ não deve exigir migração. A validação de qual eixo pertence a qual framework mora em `dominio/frameworks.ts`.

**Nada tem exclusão em cascata.** RN-18: encerrar edição arquiva, nunca apaga.

## RLS

As políticas são a última linha de defesa das regras de privacidade — funcionam mesmo que uma tela erre. A renderização no servidor é a primeira; esta é a que continua de pé quando a primeira falha.

| Tabela | Participante | Mentor |
|---|---|---|
| `feedback` | **acesso negado.** Lê pela view `feedback_visivel` | lê e escreve tudo da edição; escreve só as próprias linhas |
| `feedback_visivel` (view) | lê `id, encontro_id, mentor_id, eixo, situacao, ponto, sugestao` da própria participação, e só se o encontro estiver `liberado` | — |
| `mensagem_anonima` | insere; nunca lê | lê após liberação; nunca escreve |
| `mensagem_enviada` | lê a própria linha; insere | lê |
| `participacao`, `presenca` | lê a própria | lê tudo da edição |
| `usuario` | lê a si e os mentores | lê tudo |
| `email_autorizado`, `edicao`, `encontro` | — / lê `encontro` | lê e escreve |

**A view `feedback_visivel` não contém as colunas de nota e observação interna**, e a tabela `feedback` é negada ao participante por política. Coluna que não existe na view não vaza por consulta mal escrita. Manter isso mesmo com renderização no servidor é redundância proposital: as duas camadas erram por motivos diferentes, e RN-03 é a regra que não pode falhar.

Edição `encerrada` derruba toda leitura de participante (RN-13).

## Decisões técnicas

**D-01 — Papel no banco, não no token.** O papel vem de `usuario`, verificado a cada requisição. Papel em claim de JWT fica velho quando alguém é removido, e RN-11 exige que remover da lista derrube o acesso na hora.

**D-02 — Servidor por padrão.** Telas com dado sensível renderizam no servidor. O que não é enviado não vaza. Componente de cliente só onde há interação de verdade — formulário, busca, seletor de nota —, e nunca recebendo bloco interno como propriedade.

**D-03 — Rascunho local do feedback.** O formulário salva em `localStorage` a cada alteração e limpa ao confirmar. Conexão de corredor cai, e perder o texto significa não ter o feedback.

**D-04 — Sem notificação na v1.** O aviso de liberação sai pelo grupo de WhatsApp, como já acontece. E-mail transacional é infraestrutura, custo e mais uma coisa para quebrar.

**D-05 — Fontes hospedadas junto.** Cinco famílias vindas do Google Fonts custam caro no 4G do corredor. Só os pesos usados, servidos pelo próprio domínio, com `font-display: swap`.

**D-06 — Migrações versionadas em `supabase/migrations`.** Mudança de esquema é arquivo revisável, nunca clique no painel.

**D-07 — A `service_role` nunca chega ao navegador.** A chave que ignora RLS existe apenas em variável de ambiente de servidor, e é usada só pelo gerador do documento final. Nenhum componente de cliente, nenhuma rota pública, nenhum arquivo versionado.
