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

## As regras do projeto estão no `CLAUDE.md`

Não duplicadas aqui de propósito: regra escrita em dois lugares diverge, e a que
diverge silenciosamente é a que causa dano.

**Leia `CLAUDE.md` antes de mexer em qualquer coisa** — mesmo que você não use
Claude Code. Ele é o contexto compartilhado do projeto e carrega:

- **as quatro regras cuja violação é irreversível** (`RN-03`, `RN-08`, `RN-10`,
  `RN-12`) e por que nenhuma se conserta depois;
- **a armadilha do `security definer`** — quem pula a RLS herda a obrigação de
  repetir as regras dela. Mordeu duas vezes neste projeto;
- **a regra das migrações** — acrescentar é seguro, remover não é, e durante a
  formação migração destrutiva não entra;
- **por que os testes apagam o banco** e a trava que impede isso em produção;
- as armadilhas já pisadas, para não pisarem de novo.

Se um teste falhar depois da sua mudança, **não contorne**. Três vezes neste
projeto um teste "quebrou" e a causa era o código novo furando uma regra.

## Onde olhar primeiro

1. **`CLAUDE.md`** — as regras do projeto e como se trabalha aqui
2. `revisao-geral.md` — o que ainda falta e por quê
3. `README.md` — como rodar, quais telas existem
4. `roteiro-de-validacao.md` — o que precisa ser conferido com o sistema rodando
5. `specs/` — a especificação
6. `dominio/` — os documentos institucionais da DEX, que têm precedência

**Spec antes de código.** Nenhuma tela, tabela ou regra entra sem estar em
`specs/`. Decisão nova volta para a spec antes de virar arquivo — é o que mantém
as regras num lugar só em vez de espalhadas por dez componentes. Commits e testes
citam os códigos (`RN-01`…`RN-18`, `RF-A1`…), e é isso que permite achar, dois
anos depois, por que uma linha existe.
