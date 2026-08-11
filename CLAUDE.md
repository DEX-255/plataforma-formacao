@AGENTS.md

# Plataforma da Formação DEX

Ferramenta interna do Hub de Empreendedorismo e Inovação do INF-UFG. Mentores registram
feedback estruturado sobre estudantes ao longo da formação; cada participante acompanha a
própria trajetória. **O dado aqui é avaliação nominal de estudante real, usada numa
decisão que afeta a vida deles.** Isso dita o cuidado de tudo abaixo.

## Ao retomar, leia nesta ordem

1. `README.md` — como subir o ambiente e quais telas existem
2. `pendencias.md` — o checkpoint: o que está pronto, o que falta, o que trava
3. `.specs-fire/intents/*/work-items/` — o estado de cada item (o `status:` no frontmatter)
4. `specs/` — a especificação, começando por `specs/README.md`
5. `dominio/` — documentos institucionais da DEX
6. `roteiro-de-validacao.md` — o que uma pessoa precisa conferir antes de setembro

**Precedência:** `dominio/` > `specs/` > código. Divergência é defeito, não ambiguidade.

## Como este projeto é construído

**Spec antes de código.** Nenhuma tela, tabela ou regra entra sem estar especificada.
Decisão nova volta para `specs/` **antes** de virar arquivo — é o que mantém as regras num
lugar só. Commits e testes citam os códigos (`RN-01`…`RN-18`, `RF-A1`…).

`src/dominio/regras.ts` é a **única casa das regras de negócio**. Nenhum componente decide
sozinho se um feedback pode ser editado: a tela pergunta, a regra responde.

## Validação acontece no fim, de uma vez

**Não peça ao Fred para testar a interface item a item.** Ao concluir um work
item, acrescente os fluxos que aquele item exige a `roteiro-de-validacao.md` e
siga adiante. A passada completa acontece quando tudo estiver pronto.

O motivo é concreto: um conserto feito agora pode quebrar algo entregue três
itens atrás, e validar em pedaços dá a sensação de segurança sem a segurança.
Medir a interface durante a construção continua valendo — o que muda é **de
quem** é o tempo gasto.

Ao terminar um item: derrube o servidor e os contêineres. Não deixe `localhost`
de pé "para o caso de".

## As quatro regras cuja violação é irreversível

| Regra | O que garante |
|---|---|
| `RN-03` | O participante nunca vê nota nem observação interna durante a formação |
| `RN-08` | Não existe vínculo armazenado entre mensagem anônima e autor |
| `RN-10` | Mensagens anônimas em ordem aleatória, sem horário |
| `RN-12` | Participante só enxerga a si mesmo |

Elas têm teste contra o banco real em `testes/rls.test.ts`, incluindo o de
reidentificação. **Testar só pela interface não prova que a política está certa.**

## Armadilhas já encontradas — não repita

- **Teste que verifica nome de classe não prova que a regra vale.** `min-h-toque` passava
  no teste e não gerava CSS nenhum; nenhum botão tinha altura mínima.
- **Decisão de design se valida vendo rodar**, não no papel. Abra a tela, meça em 390px:
  alvos ≥44px, nada rolando na horizontal.
- **A cor da sombra segue o fundo, não o elemento** (`specs/05`). Preta sobre preto some.
- **A `service_role` nunca sai do servidor** (`D-07`) e nunca entra no repositório.
- **Nada de `git init`, commit ou push sem pedido explícito.**

## Ambiente

Login por senha em desenvolvimento (`NEXT_PUBLIC_LOGIN_LOCAL=1`), contas em
`supabase/seed.sql`, senha `dex-local`. Não é porta dos fundos: passa por
`provisionar_acesso` e pela lista de autorizados como qualquer sessão. Se essa variável
vazar para produção, `testes/guardas-auth.test.ts` falha.
