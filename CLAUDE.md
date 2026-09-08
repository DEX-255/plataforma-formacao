@AGENTS.md

# Plataforma da Formação DEX

Ferramenta interna do Hub de Empreendedorismo e Inovação do INF-UFG. Mentores registram
feedback estruturado sobre estudantes ao longo da formação; cada participante acompanha a
própria trajetória. **O dado aqui é avaliação nominal de estudante real, usada numa
decisão que afeta a vida deles.** Isso dita o cuidado de tudo abaixo.

Este arquivo é o **contexto compartilhado do projeto**: toda sessão de Claude Code o
carrega automaticamente, de qualquer pessoa e em qualquer máquina. Decisão de como se
trabalha aqui mora neste arquivo, não na memória de quem escreveu — memória é por pessoa
e por máquina, e não sobrevive à troca de gestão.

## Ao retomar, leia nesta ordem

1. `revisao-geral.md` — o que falta até setembro, em três partes
2. `DEPLOY.md` — como colocar no ar, e por que a ordem entre os serviços não é livre
3. `README.md` — como subir o ambiente e quais telas existem
4. `pendencias.md` — o histórico das decisões e o que cada item deixou de pé
5. `.specs-fire/intents/*/work-items/` — o estado de cada item (`status:` no frontmatter)
6. `specs/` — a especificação, começando por `specs/README.md`
7. `dominio/` — documentos institucionais da DEX
8. `roteiro-de-validacao.md` — os fluxos a conferir com o sistema rodando

**Precedência:** `dominio/` > `specs/` > código. Divergência é defeito, não ambiguidade.

## Como este projeto é construído

**Spec antes de código.** Nenhuma tela, tabela ou regra entra sem estar especificada.
Decisão nova volta para `specs/` **antes** de virar arquivo — é o que mantém as regras num
lugar só. Commits e testes citam os códigos (`RN-01`…`RN-18`, `RF-A1`…).

`src/dominio/regras.ts` é a **única casa das regras de negócio**. Nenhum componente decide
sozinho se um feedback pode ser editado: a tela pergunta, a regra responde.

**Nada de `git init`, commit ou push sem pedido explícito.**

## Validação de interface acontece no fim, de uma vez

**Não peça à pessoa que conduz o projeto para testar a interface item a item.** Ao
concluir um work item, acrescente os fluxos que ele exige a `roteiro-de-validacao.md` e
siga adiante. A passada completa acontece quando tudo estiver pronto.

O motivo é concreto: um conserto feito agora pode quebrar algo entregue três itens atrás,
e validar em pedaços dá a sensação de segurança sem a segurança. Medir a interface durante
a construção continua valendo — o que muda é **de quem** é o tempo gasto.

Ao terminar um item: derrube o servidor e os contêineres. Não deixe `localhost` de pé
"para o caso de".

## As quatro regras cuja violação é irreversível

| Regra | O que garante | Por que não se conserta depois |
|---|---|---|
| `RN-03` | O participante nunca vê nota nem observação interna durante a formação | Quem viu, viu |
| `RN-08` | Não existe vínculo armazenado entre mensagem anônima e autor | Um autor identificado uma vez, e ninguém escreve mais — nem naquela edição nem nas seguintes |
| `RN-10` | Mensagens anônimas em ordem aleatória, sem horário | Idem |
| `RN-12` | Participante só enxerga a si mesmo | Ler a avaliação de um colega não se desfaz |

Testadas contra o banco real em `testes/rls.test.ts`, `testes/liberacao-db.test.ts` e
`testes/guardas-bloco-interno.test.ts`, incluindo o teste de reidentificação.
**Testar só pela interface não prova que a política está certa.**

Se um desses testes falhar, **não contorne — o teste está certo**. Já aconteceu três vezes
neste projeto de um teste "quebrar" e a causa ser o código novo furando a regra.

### A armadilha do `security definer`

Funções `security definer` **passam por cima da RLS** — é para isso que existem. Quem pula
a RLS **herda a obrigação de repetir as regras que ela aplicava**.

Mordeu duas vezes: `enviar_mensagem_anonima` deixava o participante escrever depois da
edição encerrada, e a política de `mensagem_enviada` entregava a lista de quem tinha
escrito na caixa anônima — com uma mensagem no encontro, isso é o nome do autor. Nenhuma
das duas quebrou teste até alguém escrever o teste certo.

## Armadilhas já encontradas — não repita

- **Teste que verifica nome de classe não prova que a regra vale.** `min-h-toque` passava
  no teste e não gerava CSS nenhum; nenhum botão tinha altura mínima.
- **Decisão de design se valida vendo rodar**, não no papel. Abra a tela e meça a 390px:
  alvos ≥44px, nada rolando na horizontal, campos ≥16px. Metade dos defeitos encontrados
  neste projeto só apareceu assim — inclusive dois que fariam o gráfico do documento final
  mentir sobre a pessoa.
- **Regra decidida na tela é regra que ninguém testa.** Texto que depende de uma regra mora
  no domínio, com teste. Uma confirmação mandava "atribua os eixos" num encontro que não
  tem eixos, violando `RN-14`, porque a tela decidia sozinha.
- **A cor da sombra segue o fundo, não o elemento** (`specs/05`). Preta sobre preto some.
- **Cor de série segue a identidade, não a posição no vetor.** Fala precisa ter a mesma cor
  em todos os documentos finais, senão eles ficam incomparáveis.
- **Tudo destacado é nada destacado.** Alarme que dispara toda semana sem motivo passa a
  ser ignorado quando estiver certo.
- **A `service_role` nunca sai do servidor** (`D-07`) e nunca entra no repositório. Só o
  gerador do documento final a usa, e há teste garantindo que ela aparece num arquivo só.

## Migrações

**Acrescentar é seguro. Remover não é.** Durante a formação, migração que remove coluna ou
tabela **não entra** — `RN-18` diz que nada é apagado, e o documento final precisa
continuar reproduzível anos depois. Migração é arquivo em `supabase/migrations/`, nunca
clique no painel do Supabase (`D-06`).

## Os testes apagam o banco

A suíte limpa todas as tabelas, com os gatilhos desligados — é o que ela precisa para
verificar as regras contra o banco de verdade.

`exigirBancoLocal()` em `testes/bancada.ts` recusa rodar contra qualquer host que não seja
local. **Não contorne.** Sete arquivos leem `DATABASE_URL` com `?? localhost`, e basta essa
variável estar exportada por outro motivo para um `npm test` distraído levar os feedbacks,
as notas e as presenças da formação.

## Ambiente

```bash
npm install && npx supabase start && npm run dev
```

Login por senha em desenvolvimento (`NEXT_PUBLIC_LOGIN_LOCAL=1`), contas em
`supabase/seed.sql`, senha `dex-local`. Não é porta dos fundos: passa por
`provisionar_acesso` e pela lista de autorizados como qualquer sessão. Se essa variável
vazar para produção, `testes/guardas-auth.test.ts` falha.

Antes de qualquer PR: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. É o
que o CI roda (`.github/workflows/ci.yml`).

`CONTRIBUINDO.md` traz o mesmo para quem chega sem usar Claude Code.
