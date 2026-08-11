# Contribuindo

Se você entrou na DEX depois e vai mexer nisto: leia esta página inteira antes.
São cinco minutos, e ela existe porque **este sistema guarda avaliação nominal de
estudante real, usada numa decisão que afeta a vida dele.**

## Rodar local

Precisa de Node 20+ e Docker aberto.

```bash
npm install
npx supabase start
cp .env.example .env.local     # preencha com o que o supabase start imprimiu
npm run dev
```

Contas de desenvolvimento em `supabase/seed.sql`, senha `dex-local`:
`mentor@dex.local` e `ana@dex.local`. Detalhes no `README.md`.

## Antes de abrir um PR

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

O CI roda exatamente isso. Se passar aqui, passa lá.

---

## As quatro regras cuja violação é irreversível

Estas não são preferências de estilo. Cada uma tem teste contra o banco de
verdade, e **quebrar qualquer uma causa dano que não se desfaz**.

| Regra | O que garante | Por que não dá para consertar depois |
|---|---|---|
| `RN-03` | O participante nunca vê nota nem observação interna durante a formação | Quem viu, viu |
| `RN-08` | Não existe vínculo armazenado entre mensagem anônima e autor | Um autor identificado uma vez, e ninguém escreve mais — nem naquela edição nem nas seguintes |
| `RN-10` | Mensagens anônimas em ordem aleatória, sem horário | Idem |
| `RN-12` | Participante só enxerga a si mesmo | Ler a avaliação de um colega não se desfaz |

Elas estão testadas em `testes/rls.test.ts`, `testes/liberacao-db.test.ts` e
`testes/guardas-bloco-interno.test.ts`. **Se um desses testes falhar, não
contorne: o teste está certo.** Já aconteceu três vezes neste projeto de um
teste "quebrar" e a causa ser o código novo furando a regra.

### A armadilha do `security definer`

Funções `security definer` **passam por cima da RLS** — é para isso que existem.
Quem pula a RLS **herda a obrigação de repetir as regras que ela aplicava**.

Já mordeu duas vezes aqui: `enviar_mensagem_anonima` deixava o participante
escrever depois da edição encerrada, e a política de `mensagem_enviada` entregava
a lista de quem tinha escrito na caixa anônima. Nenhuma das duas quebrou teste
até alguém escrever o teste certo.

---

## Migrações

- **Acrescentar é seguro. Remover não é.**
- **Durante a formação, migração que remove coluna ou tabela não entra.** Se
  parecer necessária, espere o encerramento. `RN-18` diz que nada é apagado, e o
  documento final precisa continuar reproduzível anos depois.
- Migração é arquivo em `supabase/migrations/`, nunca clique no painel do
  Supabase (`D-06`). O painel não deixa rastro e não roda no CI.

## O que nunca entra no repositório

- `SUPABASE_SERVICE_ROLE_KEY` — ela ignora toda a RLS. Vive só em variável de
  ambiente, e só o gerador do documento final a usa (`D-07`). Há teste garantindo
  que ela aparece em um arquivo só.
- `NEXT_PUBLIC_LOGIN_LOCAL` em produção. `testes/guardas-auth.test.ts` falha se
  vazar.
- Documentos finais gerados (`documento/saida/`).

## Os testes apagam o banco

A suíte limpa todas as tabelas, com os gatilhos desligados — é o que ela precisa
para verificar as regras contra o banco de verdade.

Existe uma trava (`exigirBancoLocal` em `testes/bancada.ts`) que recusa rodar
contra qualquer host que não seja local. **Não a contorne.** Se você acha que
precisa rodar contra outro banco, provavelmente não precisa.

---

## Como este projeto é construído

**Spec antes de código.** Nenhuma tela, tabela ou regra entra sem estar em
`specs/`. Decisão nova volta para a spec **antes** de virar arquivo — é o que
mantém as regras num lugar só em vez de espalhadas por dez componentes.

**Precedência:** `dominio/` > `specs/` > código. Divergência é defeito, não
ambiguidade.

**`src/dominio/regras.ts` é a única casa das regras de negócio.** Nenhum
componente decide sozinho se um feedback pode ser editado: a tela pergunta, a
regra responde.

Commits e testes citam os códigos (`RN-01`…`RN-18`, `RF-A1`…). Isso é o que
permite achar, dois anos depois, por que uma linha existe.

## Armadilhas já encontradas — não repita

- **Teste que verifica nome de classe não prova que a regra vale.**
  `min-h-toque` passava no teste e não gerava CSS nenhum; nenhum botão tinha
  altura mínima.
- **Decisão de design se valida vendo rodar**, não no papel. Abra a tela e meça
  em 390px: alvos ≥44px, nada rolando na horizontal.
- **Regra decidida na tela é regra que ninguém testa.** Texto que depende de uma
  regra mora no domínio, com teste.
- **A cor da sombra segue o fundo, não o elemento** (`specs/05`). Preta sobre
  preto some.
- **Cor de série segue a identidade, não a posição no vetor.** Fala precisa ter a
  mesma cor em todos os documentos finais.

## Onde olhar primeiro

1. `README.md` — como rodar, quais telas existem
2. `revisao-geral.md` — o que ainda falta e por quê
3. `roteiro-de-validacao.md` — o que precisa ser conferido com o sistema rodando
4. `specs/` — a especificação
5. `dominio/` — os documentos institucionais da DEX, que têm precedência
