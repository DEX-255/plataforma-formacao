# Pendências — decisões e materiais em aberto

Nada aqui bloqueia o desenho continuar; cada item bloqueia uma parte específica da construção. Os itens marcados como **bloqueia código** precisam de resposta antes da implementação começar.

## Marca e design

- [x] ~~**O SVG do logo precisa ser redesenhado.**~~ **Feito.** `marca/logo/dex-simbolo.svg`,
      1,6 KB contra os 17 KB do traço automático. Não é reinterpretação: a geometria foi
      medida pixel a pixel do PNG e reexpressa como polígonos exatos — 94% de sobreposição
      com o original, e o que sobra é antialiasing de sub-pixel.
      A construção que o original carregava e que o redesenho preserva: hexágono de topo
      pontudo raio 112 com traço 28, seis peças separadas por folgas de **exatamente 20**,
      cortes em bisel de 30° paralelos às arestas vizinhas, cubo isométrico ao centro.
      Cor em `currentColor`, então ele recolore por contexto.
- [x] ~~**O símbolo sozinho, em transparente.**~~ Resolvido junto: o SVG não tem fundo e
      herda a cor de quem o contém.
- [x] ~~**O "DEX" gigante da home 4b é tipográfico?**~~ **Sim, decidido.** Fica em
      Bricolage Grotesque 800. O hero é gesto tipográfico, não aplicação de logo — o
      wordmark oficial é uma sans geométrica leve e a 300px as hastes ficariam frágeis.
      O lockup oficial continua no header e na sidebar, então a marca está presente do
      jeito certo. A convivência dos dois desenhos na mesma tela é escolha consciente.
- [x] ~~**A transição 4b → 3e.**~~ **Resolvida: o login foi para o escuro.** Foi validada
      vendo rodar, não no papel — e a primeira tentativa falhou. Levar o card da 3e para
      o fundo escuro fazia a sombra sólida preta desaparecer sobre o preto, e sumia o
      gesto que dá personalidade à direção. Corrigido com a sombra em roxo, e daí saiu
      uma regra geral que entrou em `specs/05`: **a cor da sombra segue o fundo, não o
      elemento.** O caminho agora é escuro do começo ao fim.
      Consequência tratada: no escuro a mensagem de recusa usa `--erro-claro`; o `--erro`
      fechado daria 2,88:1 e seria ilegível.

## Conteúdo de avaliação

- [ ] **Analisar ponto a ponto as dinâmicas de cada formação.** Ficou combinado revisitar cada uma com calma — o que exatamente acontece, o que se observa, e como isso vira formulário. Pendente para as cinco de oratória (Modelos de Negócio, Desenvolvimento de Produto, Arte da Oratória, Marketing, Vendas), a bomba em dupla e a negociação.
- [ ] **Validar os eixos das dinâmicas** (`dominio/frameworks-dinamicas.md`) — os dois papéis da bomba e os três eixos da negociação. Os da negociação são proposta minha do zero: vocês disseram ter pontos específicos a avaliar, então é ponto de partida para corrigir, não conclusão.
- [ ] **Escrever os descritores 1–5 dos eixos das dinâmicas.** Depende da validação acima. A rubrica de oratória (`dominio/rubrica-notas-oratoria.md`) já está escrita e revisada por você.
- [ ] **Gestão Ágil de Projetos** — a dinâmica vai mudar. Definir a avaliação quando a dinâmica existir. O modelo de dados já aceita frameworks novos sem migração.
- [ ] **Formações Extras** — formato e avaliação a definir.

## Infra

- [x] ~~Confirmar a stack.~~ **Decidido:** Next.js (App Router) + TypeScript + Tailwind, Supabase para login Google, banco e RLS, Vercel para hospedar. Chegamos a trocar por React puro com Vite e voltamos atrás: sem servidor, a política do banco vira a única barreira entre o participante e a nota, e `RN-03` é a regra que não pode falhar. Detalhes em `specs/06-arquitetura-e-dados.md`.
- [ ] **Domínio. · bloqueia deploy**
      `dex.ufg.br` traria burocracia da UFG e provavelmente hospedagem deles; um domínio próprio resolve em uma tarde e custa pouco. Precisa decidir antes de publicar, não antes de codar.
- [ ] **Contas a criar.** Supabase, Vercel, e um projeto no Google Cloud para o OAuth.
      Todas gratuitas. **Decidido: criar tudo com a conta Google da própria DEX** — assim
      elas sobrevivem à troca de gestão sem ninguém precisar transferir nada. Nos três
      serviços dá para entrar com "continuar com Google", então a conta da DEX vira a dona.
      Três cuidados, sem os quais a vantagem se perde:
      1. **Mais de uma pessoa precisa conseguir entrar na conta da DEX.** Se só uma sabe a
         senha, o problema é o mesmo de antes com outro nome.
      2. **Telefone e e-mail de recuperação não podem ser pessoais.** É por aí que a conta
         se perde quando alguém se forma. Se ligar 2FA, guardar os códigos de backup onde
         a DEX guarda as coisas dela, não no celular de uma pessoa.
      3. **Convidar os membros por login próprio.** Supabase e Vercel aceitam vários
         membros: a conta da DEX fica dona, e cada pessoa entra com a conta dela. Ninguém
         precisa compartilhar senha no dia a dia.
      Efeito colateral bom: a tela de consentimento do Google vai mostrar a DEX como
      autora do aplicativo, não uma pessoa física.
- [ ] **Testar o login com UMA conta `@discente.ufg.br` assim que o OAuth existir. · antes de setembro**
      Confirmado que o `@discente` é conta Google. O risco que sobra é o administrador do
      Workspace da UFG restringir quais aplicativos de terceiros os usuários podem
      autorizar — se estiver ligado, ninguém com `@discente` entra, e o erro aparece do
      lado do Google. Destravar isso passa pelo STI da UFG e leva tempo, então não pode
      ser descoberto no dia do encontro.
- [ ] **Rodar `supabase/bootstrap.sql` no projeto de produção. · uma vez só**
      A lista é fechada por padrão e só mentor escreve nela — mas mentor só existe se
      estiver na lista. Num banco novo isso é um ciclo fechado e **ninguém entra, nem
      você**. O script abre a porta uma vez; depois dele tudo acontece por `/membros`.
      Use o e-mail da conta Google com que você realmente clica em "entrar" — se é o
      gmail pessoal que fica logado no navegador, é ele, não o institucional.
- [ ] **Combinar com o time a correção na hora.** Ficou decidido: um e-mail por pessoa, e
      quem for recusado no encontro chama um mentor, que libera pelo `/membros`. Vale os
      mentores chegarem no encontro 2 sabendo disso — a recusa vai acontecer, e a tela já
      instrui a pessoa a procurar alguém.
- [ ] **Datas dos encontros.** Existem os temas; as datas dependem de um horário que feche com todos. O sistema não depende disso — o encontro é criado quando acontece — mas a linha do tempo fica melhor com elas.

## Plano de execução — checkpoint de 11/08/2026

A spec foi decomposta em **quinze work items** em `.specs-fire/`. O estado de cada um
vive no arquivo dele em `.specs-fire/intents/*/work-items/` — é lá que se olha, não aqui.

**Sete concluídos**, com **206 testes** passando, lint limpo e build de produção OK:

| # | Item | O que entrou |
|---|---|---|
| 1 | `fundacao-projeto` | Next 16 + Tailwind 4, `specs/05` virou tokens, 5 componentes de UI |
| 2 | `esquema-e-rls` | Esquema, políticas, view `feedback_visivel`, RPC anônima |
| 3 | `regras-de-dominio` | `RN-01`…`RN-18`, uma função por regra, 15 descritores da rubrica |
| 4 | `auth-login-google` | Decisão de acesso no banco, tela de login, proteção de rota |
| 5 | `landing-publica` | Home 4b, com o símbolo redesenhado |
| 6 | `membros-e-acesso` | `/membros` — colar lista, papel, quem ainda não entrou |
| 7 | `edicao-e-encontros` | `/encontros`, painel, atribuição de eixos, navegação do mentor |

**Os oito restantes, em ordem de dependência:**

**`registrar-feedback`** → `trajetoria-do-participante` → `liberacao-do-encontro` →
`caixa-anonima` · `presenca` → `turma-e-cobertura` → `encerramento-da-edicao` →
`documento-final`

O `registrar-feedback` é o mais importante do produto e o único que ainda passa por
design doc antes do código. `caixa-anonima` e `documento-final` também são `validate`.

**O que o item 7 deixou de pé.** O ciclo `rascunho → aberto → liberado` agora é
garantido por gatilho no banco, não por checagem na tela: voltar de `liberado` é
irreparável, porque o feedback já foi lido e a caixa anônima já fechou. Três testes
antigos quebraram nisso — o setup deles reabria um encontro liberado, que é justamente
a transição que o produto promete não existir.

A navegação do mentor entrou junto: sidebar no computador, barra inferior no celular
(`specs/04:136`), com ponto no item Encontros quando há encontro acontecendo. Só os
destinos que existem aparecem; Turma e Encerramento chegam com os itens deles.

**O que trava:** nada de código. Tudo roda local. O que falta é operacional — as contas,
e o teste do `@discente` assim que o OAuth existir.

**Ao retomar:** as instruções de subir o ambiente estão no `README.md`, seção *Como
rodar*. O login local por senha permite abrir todas as telas sem o Google.

## Já decidido

**Produto** — login Google + lista de e-mails autorizados · dois papéis, participante e mentor · feedback assinado do mentor com bloco interno invisível · nota 1–5 oculta durante a formação e revelada no documento final · sugestão prática obrigatória · liberação semanal em bloco · caixa anônima que fecha na liberação, sem vínculo armazenado · presença por encontro · visão de cobertura da turma · acesso encerra no fim do PS e todos recebem documento individual.

**Formações** — Perfil Empreendedor sem avaliação · cinco encontros de oratória · bomba em dupla com eixos separados por papel · negociação com três eixos.

**Design** — home 4b · login com o card da 3e sobre o fundo escuro da 4b, sombra em roxo · sidebar escura · o caminho inteiro é escuro · paleta `#8C52FF` / `#14110F` / `#F3F0E8` · Bricolage Grotesque, Space Grotesk, Space Mono e Young Serif só na home.

**Técnico** — Next.js (App Router) + TypeScript · Tailwind com os tokens do design system · Supabase para login Google, banco e RLS · Vercel · gráficos em SVG à mão · documento final em HTML com CSS de impressão.
