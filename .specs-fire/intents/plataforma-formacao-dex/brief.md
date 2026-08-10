---
id: plataforma-formacao-dex
title: Plataforma interna da Formação DEX
status: in_progress
created: 2026-08-06T00:26:01Z
---

# Intent: Plataforma interna da Formação DEX

> **Este brief é derivado, não original.** A fonte é
> [`specs/01-produto.md`](../../../specs/01-produto.md). Ele existe para o FIRE ter um
> intent a que amarrar os work items. Divergindo, `specs/01` vence.

## Goal

Uma plataforma interna para a Formação DEX: os mentores registram feedback estruturado
sobre cada participante ao longo dos encontros semanais, e cada participante acompanha a
própria trajetória no perfil.

Não é um site institucional com área logada. É uma ferramenta de trabalho com uma página
pública mínima na frente.

## Users

**Participante da formação.** Estudante do INF-UFG no processo seletivo. Entra pelo
celular, algumas vezes por semana, geralmente à noite. Quer saber como está indo e o que
fazer diferente.

**Mentor.** Membro da DEX que conduz e avalia. Registra feedback logo depois da dinâmica
— em pé, no corredor, pelo celular, com pouco tempo e a memória fresca. **É o usuário
cuja fricção importa mais:** se a tela dele for lenta ou longa, ele não preenche, e sem
preenchimento o produto inteiro deixa de existir.

**Visitante.** Alguém que ouviu falar da DEX e chegou pelo Instagram. Só precisa
entender o que é e por onde entrar.

## Problem

A DEX já tem uma cultura de feedback escrita e um sistema de papéis de avaliação bem
definido. O que não existe é **onde isso mora**. Hoje o feedback acontece na dinâmica,
oralmente, e evapora. Três consequências:

1. **O participante não consegue ver evolução.** Ele ouve seis observações ao longo do
   semestre, em dias diferentes, e nunca vê o arco.
2. **O corte do PS depende de memória.** Quem decide precisa lembrar de 40 pessoas ao
   longo de 10 encontros.
3. **A atenção é desigual e ninguém percebe.** Como todo mentor pode observar qualquer
   participante, alguns recebem quinze observações e outros duas — e a diferença não é
   mérito, é acaso.

## Success Criteria

Ao fim da Formação 2026.2:

- Nenhum participante chegou ao fim com menos de **quatro** registros de feedback.
- **Todo** feedback visível tem sugestão prática preenchida — porque o sistema não
  aceita sem (`RN-01`).
- A decisão do corte foi tomada consultando a plataforma, não a memória.
- Os mentores continuaram registrando na **última** semana com a mesma frequência da
  primeira. Queda de uso é o sintoma de fricção, e é o risco número um deste produto.
- Todo participante recebeu seu documento final — aprovados e não aprovados igualmente.

## Constraints

- **Prazo:** a Formação começa na **primeira semana de setembro de 2026**. São
  aproximadamente quatro semanas até o primeiro uso real. O encontro 1 (Perfil
  Empreendedor) não tem avaliação, o que dá uma semana extra de folga na fase 1.
- **As datas dos encontros não existem ainda.** O sistema não assume cronograma: o
  encontro é criado quando acontece.
- **`RN-01`…`RN-18` são invariantes** — valem em qualquer tela, e são responsabilidade
  do banco e do servidor, nunca só da interface.
- **Celular em primeiro lugar**, em 4G ruim, no corredor do INF, à noite. Um registro de
  feedback precisa custar menos de um minuto.
- **Escala pequena:** ~50 participantes, ~10 mentores, ~15 encontros. A stack se
  justifica por RLS e login Google, não por volume.
- **Uma pessoa construindo**, com a formação já marcada.

## Notes

**Fora do escopo da v1**, explicitamente, para não virarem escopo por inércia: feedback
entre pares, notificação por e-mail ou push, área pública com programas e time,
autoavaliação, chat ou comentário em feedback, estatísticas além da cobertura, múltiplas
edições simultâneas, aplicativo nativo.

**Bloqueio ativo:** o SVG do símbolo precisa ser redesenhado antes de entrar no produto
— o arquivo atual é um traço automático com três roxos errados e sem `viewBox`. Ver
[`pendencias.md`](../../../pendencias.md).

**Pendências de conteúdo que não bloqueiam código:** os descritores 1–5 dos eixos da
bomba e da negociação, e o framework de Gestão Ágil de Projetos. O modelo de dados
aceita frameworks novos sem migração (`eixo` é `text`, não `enum`), então isso pode
chegar depois sem retrabalho.
