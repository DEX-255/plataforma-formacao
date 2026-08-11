# Revisão geral — do código pronto até setembro

Os quinze work items estão concluídos: **425 testes**, lint limpo, build de
produção OK. O que falta não é código.

Este documento junta as três coisas que ainda dependem de gente, na ordem em que
elas bloqueiam a formação de setembro de 2026.

> **Por que três listas separadas.** Elas têm dono, prazo e natureza diferentes.
> Misturá-las faz a decisão de produto parecer tarefa e a tarefa operacional
> parecer opcional — e a operacional é a que tem prazo externo.

---

## Ordem sugerida

```
  1 ─── Contas e OAuth          ← começa AGORA, depende de terceiros
   │
   ├── 2 ─── Passada de validação      ← 3 a 4 horas, sua
   │
   └── 3 ─── Decisões de produto       ← sem prazo externo, mas mudam código
                                          se decididas depois
```

O item 1 vem primeiro porque **o teste da conta `@discente` pode travar no STI da
UFG**, e destravar leva tempo que você não controla.

---

# Parte 1 · O que bloqueia setembro

Nada aqui é código. Tudo depende de conta criada, permissão concedida ou
combinação com o time.

## 1.1 — Criar as contas · **comece por aqui**

Supabase, Vercel e um projeto no Google Cloud para o OAuth. Todas gratuitas.

**Decidido:** criar tudo com a conta Google da própria DEX, para sobreviverem à
troca de gestão. Você confirmou que os três cuidados foram tomados:

- mais de uma pessoa consegue entrar na conta da DEX;
- telefone e e-mail de recuperação não são pessoais;
- membros entram com login próprio, sem compartilhar senha.

- [ ] Projeto no Supabase
- [ ] Projeto no Vercel
- [ ] Cliente OAuth no Google Cloud, com a tela de consentimento mostrando a DEX

## 1.2 — Testar UMA conta `@discente.ufg.br` · **o risco de prazo**

Assim que o OAuth existir, antes de qualquer outra coisa.

O `@discente` é conta Google, isso está confirmado. O risco que sobra é o
administrador do Workspace da UFG restringir quais aplicativos de terceiros os
usuários podem autorizar. Se estiver ligado, **ninguém com `@discente` entra**, e
o erro aparece do lado do Google.

**Destravar isso passa pelo STI da UFG e leva tempo.** Não pode ser descoberto no
dia do encontro.

- [ ] Uma conta `@discente` entra e chega na trajetória

## 1.3 — Rodar o `bootstrap.sql` · uma vez só

A lista de autorizados é fechada por padrão e só mentor escreve nela — mas mentor
só existe se estiver na lista. Num banco novo isso é um ciclo fechado e **ninguém
entra, nem você**.

Use o e-mail da conta Google com que você **realmente clica em "entrar"**. Se é o
gmail pessoal que fica logado no navegador, é ele, não o institucional.

- [ ] `supabase/bootstrap.sql` rodado no projeto de produção
- [ ] Primeiro mentor entra e cadastra os outros por `/membros`

## 1.4 — Domínio · bloqueia o deploy, não o código

`dex.ufg.br` traria burocracia da UFG e provavelmente hospedagem deles. Um
domínio próprio resolve em uma tarde e custa pouco.

- [ ] Decidido

## 1.5 — Combinar com o time

- [ ] Mentores sabem que a recusa vai acontecer no encontro 2, e que se resolve
      na hora pelo `/membros`
- [ ] Datas dos encontros (o sistema não depende, mas a linha do tempo melhora)

---

# Parte 2 · A passada de validação

`roteiro-de-validacao.md` — **147 itens em quinze fluxos**. Estimo 3 a 4 horas,
com um celular físico na mão.

Ela acontece **de uma vez, agora que tudo está pronto** — foi a decisão que
tomamos no meio do caminho, e a razão continua valendo: um conserto feito na
semana 8 pode ter quebrado algo entregue na semana 3, e validar em pedaços dá a
sensação de segurança sem a segurança.

## O que não repetir

O roteiro já exclui o que os 425 testes provam sozinhos a cada `npm test`:
`RN-03`, `RN-08`, `RN-10`, `RN-12`, o ciclo dos encontros, as regras de domínio,
os guardas do design system. A tabela está no fim do arquivo.

## Os seis itens que eu faria primeiro

Se o tempo apertar, estes são os que mais pesam — cada um é uma falha que
nenhum teste alcança:

| Item | O que é |
|---|---|
| **F4.7** | Um mentor que nunca viu a tela registra um feedback. Depois: *"o que dessa tela a pessoa avaliada vai ler?"* Se hesitar, a separação dos dois blocos falhou |
| **F4.1** | Cronometrar um registro completo, em pé, com uma mão. **Menos de um minuto** ou o mentor desiste na terceira semana |
| **F7.2** | Um estudante lê a explicação do anonimato: *"você escreveria uma crítica a um mentor aqui?"* Se não confiar, a caixa fica vazia |
| **F11.2** | Imprimir um documento final **em papel** e ler **imaginando quem não passou** |
| **F9.6** | Um "não observado" no meio da série tem que virar buraco, nunca ponto baixo — esse gráfico vai no documento da pessoa |
| **F12** | O ensaio geral de uma semana inteira. É onde a regressão entre itens aparece |

## O que só dá para testar em produção

O fluxo F15 depende da Parte 1: OAuth real, `bootstrap.sql` rodado, a variável
de login local ausente, e a medição no 4G do corredor do INF.

---

# Parte 3 · Decisões de produto em aberto

Nenhuma bloqueia setembro. Todas mudam código se decididas depois — algumas
pouco, uma bastante.

## 3.1 — O orçamento de JavaScript não é cumprível · **decida antes de medir de novo**

Medido na build de produção:

| Rota | JS comprimido |
|---|---|
| `/` — landing, quase estática | 134 KB |
| `/membros` | 137 KB |
| Registrar feedback | ~143 KB |

O orçamento escrito é **120 KB**, e o piso do React 19 + Next 16 é 134 KB. Nenhuma
rota do projeto o cumpre, nem as que quase não têm código próprio. A tela de
feedback custa ~9 KB **sobre esse piso** — isso sim estava sob controle.

**Recomendo trocar o critério por "incremento sobre o piso" (ex.: +15 KB por
rota).** É a única saída que continua pegando regressão de verdade. As
alternativas: revisar o número para ~160 KB, ou atacar o piso em item próprio —
e este só vale se o 4G do corredor doer na prática, o que a Parte 2 mede.

- [ ] Critério novo escrito em `.specs-fire/.../registrar-feedback.md`

## 3.2 — Conteúdo de avaliação · trava a qualidade, não o sistema

- [ ] **Analisar ponto a ponto as dinâmicas de cada formação** — o que acontece,
      o que se observa, como vira formulário
- [ ] **Validar os eixos** da bomba (dois papéis) e da negociação (três eixos).
      Os da negociação são proposta minha do zero: ponto de partida para
      corrigir, não conclusão
- [ ] **Escrever os descritores 1–5** desses eixos. Depende da validação acima
- [ ] **Gestão Ágil de Projetos** — a dinâmica vai mudar; definir quando existir
- [ ] **Formações Extras** — formato e avaliação a definir

O sistema já funciona sem isso: os eixos sem descritor caem para a lista de "o
que observar", e o documento final mostra o texto explicando por que não há nota.
**Acrescentar os níveis depois é acrescentar dados em `frameworks.ts` — nenhuma
tela muda, nenhuma migração.**

## 3.3 — O peso da nota no documento final · **decisão de produto, não de código**

Você levantou duas mudanças possíveis: **tirar os gráficos** e **mexer no texto**,
porque *"uma pessoa reprovar por notas não achamos que faça tanto sentido"*.

A segunda é a que importa, e ela expõe uma tensão que vale nomear:

**Se a nota não é o que decide o corte, o documento hoje dá a ela mais peso
visual do que ela tem de papel real.** Ele já não diz se a pessoa passou, já
explica a escala antes de mostrar número, e já põe as palavras antes de tudo.
Mas gráfico, tabela e média somam três representações do mesmo número — e três
representações dizem "isto aqui é o que interessa", independente do que o texto
afirme.

Três saídas, da mais leve para a mais pesada:

1. **Só texto.** Trocar "as notas ficaram escondidas para o feedback ser lido
   como orientação" por algo que diga o que a nota é de fato: um registro de
   calibragem entre mentores, não o critério do processo. Uma constante em
   `src/dominio/documento.ts`.
2. **Tirar a tabela, manter o gráfico.** O gráfico mostra movimento, que é a
   coisa útil; a tabela dá o número exato, que é a que vira placar. Remover uma
   chamada de função em `documento/gerar.ts`.
3. **Tirar os números por completo.** O documento vira só as palavras dos
   mentores, a presença e os retratos. Uma linha em `SECOES` — e o teste de
   `RF-H2` deixa de se aplicar, porque não há número a legendar.

**Não decida isso agora.** Decida depois do **F11.2** — imprimir um documento em
papel e ler imaginando quem não passou. É provável que o papel diga o que a tela
não disse.

- [ ] Decisão tomada, depois da leitura impressa

## 3.4 — As fontes do documento final

O gerador roda fora do Next e a pilha de fontes cai para as do sistema. O
documento sai tipograficamente pior do que foi desenhado.

**Conserto:** baixar os arquivos para `documento/fontes/` e referenciá-los por
`@font-face`. Isso também é o que torna o PDF idêntico daqui a anos, sem depender
de rede.

- [ ] Fontes locais no gerador

---

# As perguntas que você fez

## Mexer no gerador de documentos é fácil?

**Sim, e essa foi uma decisão de desenho, não sorte.**

| O que você vai querer mudar | Onde | Dificuldade |
|---|---|---|
| Texto de qualquer seção | `src/dominio/documento.ts` | Trivial — são constantes |
| **Ordem das seções** | o vetor `SECOES`, no mesmo arquivo | Trivial, e o teste avisa se quebrar `RF-H2` |
| Aparência (tipografia, cores, espaço) | o bloco `<style>` em `documento/gerar.ts` | Fácil — é CSS comum |
| Acrescentar uma seção | `SECOES` + uma entrada no objeto `conteudo` | Fácil |
| Como o gráfico desenha | `svgDaEvolucao` em `gerar.ts` | Média — é SVG à mão |
| **Tirar a tabela de notas** | remover a chamada `tabelaDaEvolucao` | Uma linha |
| **Tirar os números por completo** | remover `como-ler-a-escala` e `evolucao` de `SECOES` | Duas linhas, mais ajustar o teste de `RF-H2` |

Três coisas que tornam isso seguro:

- **`montarHtml` é função pura**: recebe dados, devolve texto. Dá para testar sem
  abrir navegador nem banco.
- **A ordem é testada.** Se alguém puser o gráfico antes da legenda da escala, o
  teste falha citando `RF-H2` — a regra não depende de lembrarem dela.
- **A reprodutibilidade é testada.** Gerar duas vezes tem que dar bytes idênticos.

**A única armadilha:** o HTML é um template literal e o CSS mora dentro dele.
Backtick ou `${` num comentário quebra o arquivo. Aconteceu duas vezes comigo e o
TypeScript aponta na hora — mas vale saber antes.

## Mexer no site durante a formação quebra alguma coisa?

Separei em dois riscos, porque são muito diferentes.

### Perder o banco: **o risco real estava nos testes, e acabei de fechá-lo**

A suíte de testes **apaga todas as tabelas, com os gatilhos desligados**. É o que
ela precisa fazer para testar as regras contra o banco de verdade. Sete arquivos
liam `DATABASE_URL` com `?? localhost`, então bastava essa variável estar
exportada na sessão por outro motivo — e ela **foi exportada várias vezes** durante
o desenvolvimento, para gerar documento e conferir dado.

Um `npm test` distraído nessa condição levaria os feedbacks, as notas e as
presenças da formação. Nada disso é reproduzível a partir de outro lugar.

Agora a suíte recusa rodar contra qualquer host que não seja local, com a
mensagem dizendo o que ia acontecer. Verificado apontando para um host falso da
Supabase.

**O que ainda merece cuidado:**

- [ ] **Migração destrutiva.** Nada impede alguém de escrever `drop column` numa
      migração e aplicar em produção. A regra: durante a formação, migração que
      remove coluna ou tabela **não entra** — acrescentar é seguro, remover não é.
- [ ] **Backup.** Confirmar o que o plano gratuito do Supabase guarda e por
      quanto tempo. Se for pouco, um `pg_dump` semanal durante a formação custa
      um comando.
- [ ] **Nunca rodar `supabase db reset` apontando para produção.** Ele recria o
      banco do zero.

### Quebrar a plataforma: **risco real, e é o que o CI/CD resolve**

Um deploy ruim derruba telas. Hoje nada impede subir código que não compila ou
que quebrou um teste — a garantia é lembrar de rodar `npm test` antes.

A boa notícia: a Vercel guarda todo deploy e **volta para o anterior em um
clique**. Então o pior caso hoje é alguns minutos de site quebrado, não perda de
dado.

## CI/CD, inclusive para depois que você sair

**Sim, e o argumento mais forte é exatamente esse.**

Os 425 testes não são burocracia: eles são onde as regras moram. `RN-03` (o
participante nunca vê a nota), `RN-08` (ninguém descobre quem escreveu na caixa
anônima), `RN-12` (participante só vê a si mesmo) — cada uma tem teste contra o
banco real.

Enquanto você estiver por perto, você lembra de rodar. **Quem entrar na DEX em
2027 não vai saber que essas regras existem.** Vai mexer numa policy, achar que
melhorou, e `RN-03` quebra em silêncio — o tipo de falha que só aparece quando
alguém vê a nota de outra pessoa.

CI é o que faz o teste rodar para quem não sabe que ele existe.

**O que eu montaria** — em uma sessão, não é grande:

1. **GitHub Actions em cada push e PR:** sobe o Supabase local, roda `npm test`,
   `npm run lint`, `npm run build`. Falhou, o PR fica vermelho.
2. **Vercel conectada ao repositório:** cada PR ganha um endereço de prévia; o
   `main` publica sozinho.
3. **Proteção do `main`:** só entra por PR com o CI verde. É o que impede alguém
   de publicar direto sem passar pelos testes.
4. **Um `CONTRIBUINDO.md` curto:** as quatro regras cuja violação é irreversível,
   como rodar local, e a regra da migração destrutiva.

Um cuidado: o repositório é **local, sem remote**. O primeiro passo é criar o
repositório no GitHub — de preferência na organização da DEX, não na sua conta
pessoal, pelo mesmo motivo das outras contas.

- [x] ~~GitHub Actions com testes, lint e build~~ — `.github/workflows/ci.yml`
- [x] ~~`CONTRIBUINDO.md`~~ — as quatro regras, a armadilha do `security definer`,
      a regra da migração destrutiva
- [ ] **Repositório no GitHub, na organização da DEX** — é o passo que falta, e é
      seu: o repo é local, sem remote
- [ ] Vercel conectada, com prévia por PR
- [ ] `main` protegido: só entra por PR com o CI verde

**O workflow foi escrito mas nunca rodou no GitHub** — não existe repositório
remoto ainda. A sequência que ele executa (`supabase start` → lint → tipos →
testes → build com as variáveis do CI) foi verificada localmente, comando a
comando. O que só o primeiro push vai dizer é se o runner sobe o Supabase sem
tropeço; se der problema, é ali.

**Recomendo fazer isso antes de setembro**, não depois: durante a formação
qualquer conserto é feito com pressa, e é exatamente aí que a rede de proteção
vale.

---

## Registro das passadas

| Data | Quem | Parte | O que ficou pendente |
|---|---|---|---|
| — | — | — | — |
