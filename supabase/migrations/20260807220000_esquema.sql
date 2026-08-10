-- ═══════════════════════════════════════════════════════════════════════════
-- Esquema — specs/06-arquitetura-e-dados.md
--
-- Nada aqui tem exclusão em cascata: RN-18 diz que encerrar edição arquiva,
-- nunca apaga, e os documentos precisam ser reproduzíveis anos depois.
-- ═══════════════════════════════════════════════════════════════════════════

create type papel        as enum ('participante','mentor');
create type status_part  as enum ('ativo','desligado','aprovado','nao_aprovado');
create type status_enc   as enum ('rascunho','aberto','liberado');
create type status_ed    as enum ('ativa','encerrada');
create type presenca_st  as enum ('presente','ausente','justificado');
create type framework    as enum ('oratoria','bomba','negociacao','nenhum');

create table edicao (
  id     uuid primary key default gen_random_uuid(),
  nome   text not null,                       -- '2026.2'
  inicio date,
  fim    date,
  status status_ed not null default 'ativa'
);

create table usuario (
  id         uuid primary key references auth.users(id),
  email      text unique not null,
  nome       text not null,
  avatar_url text,
  papel      papel not null
);

create table email_autorizado (
  email         text primary key,
  papel         papel not null,
  edicao_id     uuid not null references edicao(id),
  convidado_por uuid references usuario(id),
  criado_em     timestamptz not null default now()
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
  encontro_id     uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  status          presenca_st not null,
  marcado_por     uuid not null references usuario(id),
  marcado_em      timestamptz not null default now(),
  primary key (encontro_id, participacao_id)
);

create table feedback (
  id              uuid primary key default gen_random_uuid(),
  encontro_id     uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  mentor_id       uuid not null references usuario(id),
  eixo            text not null,

  -- bloco visível, assinado
  situacao text not null,
  ponto    text not null,
  sugestao text not null check (length(btrim(sugestao)) > 0),   -- RN-01

  -- bloco interno, nunca exposto ao participante
  nota               smallint check (nota between 1 and 5),
  nao_observado      boolean not null default false,
  observacao_interna text,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- RN-07: "não observado" é um valor de nota, não a ausência dela.
  check (nao_observado = (nota is null)),

  -- Um registro por mentor por pessoa por encontro. Observar de novo edita,
  -- não empilha.
  unique (encontro_id, participacao_id, mentor_id, eixo)
);

-- RN-08: nenhuma coluna liga a mensagem ao autor. Não é ocultação, é ausência.
create table mensagem_anonima (
  id              uuid primary key default gen_random_uuid(),
  encontro_id     uuid not null references encontro(id),
  texto           text not null,
  ordem_aleatoria double precision not null default random()     -- RN-10
);

-- O índice existe para o CLUSTER da liberação, não para consulta: ele é o que
-- permite reescrever a tabela na ordem aleatória e apagar a correlação entre
-- ordem física e ordem de chegada.
create index mensagem_anonima_ordem_idx
  on mensagem_anonima (encontro_id, ordem_aleatoria);

-- RN-09: marca que enviou, sem apontar para o que escreveu.
-- Sem coluna de horário, de propósito: cruzar horário de envio com ordem de
-- inserção reidentificaria o autor.
create table mensagem_enviada (
  encontro_id     uuid not null references encontro(id),
  participacao_id uuid not null references participacao(id),
  primary key (encontro_id, participacao_id)
);

-- Índices de trabalho
create index feedback_encontro_idx     on feedback (encontro_id);
create index feedback_participacao_idx on feedback (participacao_id);
create index participacao_usuario_idx  on participacao (usuario_id);
create index encontro_edicao_idx       on encontro (edicao_id);
