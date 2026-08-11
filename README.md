# DEX — Plataforma da Formação

Plataforma interna do Hub de Empreendedorismo e Inovação do Instituto de Informática da UFG.

Os mentores registram feedback estruturado sobre cada participante ao longo dos encontros semanais da formação; cada participante acompanha a própria trajetória. No encerramento, todos recebem um documento individual com o que viveram no processo.

**Estado:** 14 dos 15 work items concluídos · 390 testes passando.
**Primeiro uso real:** primeira semana de setembro de 2026.

## Como rodar

Precisa de Node 20+ e Docker aberto (OrbStack serve).

```bash
npm install
npx supabase start          # sobe o Postgres local; na 1ª vez baixa imagens
cp .env.example .env.local  # e preencha com o que o supabase start imprimiu
npm run dev                 # http://localhost:3000
```

**Entrar sem o Google:** o OAuth exige credenciais que ainda não existem, então em
desenvolvimento a tela de login mostra um formulário de senha. Contas do
`supabase/seed.sql`, senha `dex-local`:

| Conta | Papel |
|---|---|
| `mentor@dex.local` | mentor → cai em `/encontros` |
| `participante@dex.local` | participante → cai em `/trajetoria` |

Isso não é porta dos fundos: a sessão passa por `/auth/retorno` e por
`provisionar_acesso` como qualquer outra, e a lista de autorizados continua valendo.
Ligado por `NEXT_PUBLIC_LOGIN_LOCAL=1`, que **não existe em produção** —
`testes/guardas-auth.test.ts` falha se vazar.

```bash
npm test                    # 390 testes; precisa do Supabase local de pé
npm run lint
npm run build

npx supabase db reset       # recria o banco do zero e reaplica o seed
npx supabase stop           # libera os contêineres
```

**Telas de pé:** `/` · `/entrar` · `/entrar?recusa=nao-autorizado` ·
`/entrar?recusa=edicao-encerrada` · `/membros` · `/encontros` ·
`/encontros/[id]` · `/encontros/[id]/eixos` ·
`/encontros/[id]/feedback/[participacao]` ·
`/encontros/[id]/liberar` · `/encontros/[id]/anonimas` · `/encontros/[id]/presenca` ·
`/turma` · `/turma/[participacao]` · `/encerrar` ·
`/trajetoria` · `/trajetoria/encontro/[id]` · `/caixa/[encontro]`.

**Mentor** — entra e cai em `/encontros`. Cria encontro, atribui eixos, abre,
registra feedback pelo painel da turma e libera o encontro no fim da semana.
Marca presença, libera o encontro e acompanha a cobertura da turma.

**Participante** — entra e vê a própria trajetória, com os feedbacks dos encontros
já liberados, agrupados por eixo. Escreve na caixa anônima enquanto o encontro está aberto.

**Nota ao rodar os testes:** `npm test` limpa o banco e reaplica o seed no fim. Encontros
criados à mão pela interface somem junto.

## Onde está cada coisa

```
src/         O código: app/, componentes/, dominio/, lib/
supabase/    Migrações, políticas de RLS, seed e bootstrap.sql
testes/      Suíte completa — inclui testes contra o banco real
specs/       Especificação do sistema. Comece por specs/README.md.
dominio/     Documentos institucionais da DEX — cultura de feedback,
             papéis de avaliação, rubrica, frameworks das dinâmicas.
             São a fonte de verdade do domínio; a spec atende a eles.
marca/       Identidade visual: logo e as explorações de design aprovadas.
.specs-fire/ Plano de execução: os quinze work items em que a spec foi
             decomposta, com dependências e ordem. Ver abaixo.
pendencias.md   O que ainda depende de decisão ou material.
roteiro-de-validacao.md   Os fluxos que uma pessoa precisa conferir com o
             sistema rodando. Cresce a cada item e é executado de uma vez
             só, no fim — não etapa a etapa.
```

### `specs/` e `.specs-fire/` não competem

`specs/` **é a especificação** — o que o sistema faz e por quê.
`.specs-fire/` **é o plano de execução** — em que ordem construir, com que checkpoint.

Os arquivos de `.specs-fire/standards/` são ponteiros curtos para `specs/`, não cópias.
A única exceção é `coding-standards.md`, que não tem contrapartida e é fonte de verdade
do que descreve. **Havendo divergência entre os dois, `specs/` vence** — e a divergência
é defeito, não ambiguidade.

## Como este projeto é construído

Spec antes de código. Nenhuma tela, tabela ou regra entra no código sem estar especificada; toda decisão nova volta para a spec antes de virar arquivo. É o que mantém as regras num lugar só em vez de espalhadas pelo código.

As regras de negócio têm código (`RN-01` … `RN-18`) e os requisitos também (`RF-A1` …). Commits e testes referenciam esses códigos.

## O essencial em cinco linhas

- Login com Google, restrito a uma lista de e-mails autorizados. Dois papéis: participante e mentor.
- O feedback do mentor tem um bloco visível e assinado, e um bloco interno com nota que o participante só lê no documento final.
- Sugestão prática é campo obrigatório — a diretriz 6 da DEX virou regra do sistema.
- Os feedbacks de um encontro são liberados em bloco, uma vez por semana. Nesse mesmo instante a caixa anônima fecha e as mensagens dos participantes chegam aos mentores.
- Ao fim do PS o acesso encerra para todos, e cada pessoa recebe seu documento.
