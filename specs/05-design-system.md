# 05 — Design system

Derivado das explorações aprovadas: home **4b**, login **3e**, sidebar da referência. Ver `../marca/exploracoes-design.html`.

## Cor

### Base

| Token | Hex | Uso |
|---|---|---|
| `--roxo` | `#8C52FF` | Cor da marca. Preenchimentos, bordas, tipografia display, acento. |
| `--roxo-claro` | `#B08CFF` | Roxo para **texto pequeno** sobre fundo escuro. Hover. |
| `--preto` | `#14110F` | Preto quente. Fundo do app e da home, bordas duras, sombras sólidas. |
| `--papel` | `#F3F0E8` | Texto sobre escuro, fundo do login e do documento final. |
| `--papel-alto` | `#FAF8F3` | Superfície elevada sobre papel — cartões. |

### A regra do roxo

Contrastes medidos (WCAG 2.1):

| Par | Razão | Veredito |
|---|---|---|
| `--papel` sobre `--preto` | **16,51:1** | AAA — texto corrido |
| `--roxo-claro` sobre `--preto` | **7,20:1** | AAA — texto corrido |
| `--roxo` sobre `--preto` | **4,27:1** | só texto grande |
| `--roxo` sobre `--papel` | **3,87:1** | só texto grande |
| `--papel` sobre `--roxo` | **3,87:1** | só texto grande |

**`--roxo` reprova para texto pequeno em qualquer fundo da paleta.** Daí a regra, que vale em todo o produto:

- `--roxo` em tipografia **só** a partir de 24px, ou 18px bold. Serve para display, número grande, título.
- Texto pequeno em roxo usa `--roxo-claro` sobre escuro. Sobre papel, não existe texto pequeno em roxo — usa `--preto`.
- Texto dentro de preenchimento roxo (botão, chip, selo) é `--papel` e nunca menor que 16px bold.
- Estado nunca é comunicado só por cor: rótulo ou ícone sempre acompanha.

Isso não é purismo. Metade do uso é celular, no corredor, com luz ruim.

### Semânticos

Contrastes medidos sobre `--preto`, como a spec pedia:

| Token | Hex | Sobre `--preto` | Uso |
|---|---|---|---|
| `--sucesso` | `#3E9B6B` | **5,47:1** — passa | Salvo, liberado |
| `--atencao` | `#C9821F` | **6,00:1** — passa | Sem cobertura, eixo descoberto |
| `--neutro` | `#8A857E` | **5,14:1** — passa | Texto secundário sobre escuro |
| `--erro` | `#B3261E` | **2,88:1** — reprova | Erro sobre fundo **claro**: login, documento final (5,74:1 sobre `--papel`) |
| `--erro-claro` | `#EC5F5F` | **5,70:1** — passa | Erro sobre fundo **escuro**: todo o app |

**O erro precisou se dividir em dois, como o roxo.** `#B3261E` é um vermelho fechado:
funciona sobre papel e desaparece sobre preto. E mensagem de erro é justamente o texto
que **precisa** ser lido — o mentor perdeu conexão salvando um feedback, ou o campo de
sugestão ficou vazio. Um aviso de erro ilegível é pior que nenhum, porque a pessoa vê que
algo aconteceu e não descobre o quê.

A regra prática: no app escuro use `--erro-claro`; no login e no documento final, que são
claros, use `--erro`.

### Superfícies do app

O interior é escuro, seguindo a referência aprovada e a home 4b.

| Token | Valor | Uso |
|---|---|---|
| `--fundo` | `#14110F` | Fundo geral |
| `--superficie` | `#1C1917` | Cartão, painel |
| `--superficie-alta` | `#252120` | Cartão sobre cartão, input |
| `--borda` | `rgba(243,240,232,.12)` | Divisórias |
| `--borda-forte` | `#F3F0E8` | Borda dura de destaque |

## Tipografia

Cinco famílias aparecem nas explorações. No app são **três** — cada família a mais é peso de carregamento e ruído visual. As serifas ficam restritas à home e ao documento final.

| Família | Onde | Pesos |
|---|---|---|
| **Bricolage Grotesque** | Display: DEX gigante, títulos de tela, números grandes | 800, 600 |
| **Space Grotesk** | Interface e texto corrido — o carro-chefe | 400, 500, 700 |
| **Space Mono** | Rótulo maiúsculo, código de eixo, data, dado | 400, 700 |
| *Young Serif* | Só na home: "De pessoas. Para pessoas." | 400 |
| *Instrument Serif* | Só no documento final | 400 |

### Escala

| Papel | Tamanho | Família |
|---|---|---|
| Display home | `clamp(88px, 22vw, 300px)` | Bricolage 800 |
| Título de tela | `clamp(28px, 5vw, 44px)` | Bricolage 800 |
| Título de seção | 22px | Bricolage 600 |
| Corpo | 16px / 1.6 | Space Grotesk 400 |
| Corpo destacado | 18px / 1.6 | Space Grotesk 500 |
| Secundário | 14px / 1.5 | Space Grotesk 400 |
| Rótulo | 11px, `letter-spacing: .14em`, maiúsculo | Space Mono 700 |
| Kicker | 13px, `letter-spacing: .34em`, maiúsculo | Space Mono 400 |

Corpo nunca abaixo de 16px em campo de formulário — abaixo disso o iOS dá zoom sozinho ao focar, e o mentor perde o contexto da tela no meio do preenchimento.

## Forma

Da direção 3e, que define a personalidade do interior:

| Token | Valor |
|---|---|
| `--raio-campo` | 14px |
| `--raio-cartao` | 22px |
| `--raio-pilula` | 100px |
| `--borda-dura` | 2.5px sólida |
| `--sombra-solida` | `10px 10px 0` — cartão |
| `--sombra-botao` | `6px 6px 0` — botão |

Sombra sólida, nunca difusa. Zero gradiente — é princípio declarado da marca. Profundidade vem de deslocamento e borda, não de blur.

### A cor da sombra segue o fundo

**A sombra só existe se contrastar com o que está atrás dela.** Descoberto ao levar o
card do login da 3e (papel) para o fundo escuro: a sombra preta sobre preto simplesmente
desaparecia, e com ela o gesto que dá personalidade à direção. Sobrava um retângulo.

| Onde | Sombra | Por quê |
|---|---|---|
| Sobre `--papel` | `--preto` | O padrão da 3e |
| Sobre `--preto` / `--superficie` | `--roxo` | Preta sobre preta não desloca nada |
| Elemento que **já é roxo** (botão) sobre escuro | `--papel` | Roxa sobre roxa também não desloca |

A regra é uma só, aplicada três vezes: escolha a cor que contrasta com o **fundo**, nunca
a que combina com o elemento.

Espaçamento em múltiplos de 4. Escala usada: 4, 8, 12, 16, 24, 32, 48, 64.

## Textura

Duas, ambas em CSS, sem imagem externa:

- **Grão** — ruído SVG, `opacity: .4`, `mix-blend-mode: overlay` no escuro e `multiply` no claro.
- **Halftone** — pontos em `radial-gradient`, 15px, `opacity: .55`. Fundo da home.

Textura é da home, do login e do documento. Nas telas de trabalho ela sai: atrapalha leitura de texto denso.

## Componentes

**Botão primário** — preenchimento roxo, borda dura preta, sombra 6px. No hover translada 2px e a sombra encolhe; no active translada 6px e a sombra some. O botão afunda de verdade — é o gesto que dá a personalidade lúdica da 3e.

**Cartão** — superfície, borda dura, sombra sólida 10px. Cartão de conteúdo denso usa borda fina `--borda` e dispensa a sombra.

**Selo** — pílula roxa rotacionada entre -7° e 6°, Space Mono 700, sombra sólida 4px. Usado com moderação: um por tela.

**Campo** — borda 2px, raio 14px, 16px mínimo. No foco, borda roxa e sombra sólida 3px roxa.

**Chip de eixo** — pílula com o nome do eixo. Um par de cores por eixo, sempre com o rótulo escrito junto.

**Item de lista da turma** — nome, avatar, cobertura, presença. Alvo de toque de 56px de altura no celular.

**Seletor de nota** — cinco alvos grandes. Ao escolher, o descritor daquele nível aparece na tela (RF-D3). É componente, não input genérico.

**Marcador de estado do encontro** — rascunho, aberto, liberado. Rótulo escrito, cor como reforço.

## Movimento

Discreto e curto. `150ms` para hover e foco, `250ms` para entrada de conteúdo, `ease-out`.

Anima só transform e opacity. Nada anima layout.

A única animação com personalidade é o afundar do botão. O resto é funcional.

Respeitar `prefers-reduced-motion: reduce` desligando tudo que não seja opacidade.

## Mobile

Não é adaptação: `/encontros/[id]` e a tela de registrar feedback são **desenhadas primeiro no celular** e depois expandidas.

- Alvo de toque mínimo 44×44px; 56px em listas percorridas em sequência.
- Uma coluna sempre. Tabela vira cartão empilhado — a turma não é planilha.
- Ações principais ao alcance do polegar: salvar fica fixo no rodapé, não no fim do formulário.
- Busca da turma fixa no topo, sem sumir com o scroll.
- Nenhuma tela rola na horizontal. Conteúdo largo rola dentro do próprio contêiner.
- O rascunho do feedback sobrevive a perda de conexão e a fechar o app (`04-telas-e-fluxos.md`, estados).

Pontos de quebra: `640px` para tablet, `1024px` para desktop com sidebar permanente.

## Logo

`../marca/logo/` — o `.svg` disponível é um traço automático do VTracer com três roxos diferentes (`#844DF1`, `#854EF3`, `#864EF5`), nenhum deles `#8C52FF`, sem `viewBox` e com curvas onde o desenho é reto.

Antes de entrar no produto, o símbolo precisa ser redesenhado: geometria reta exata, `viewBox`, cor única em `currentColor` para recolorir por contexto. ⏳ `../pendencias.md`.

Usos: símbolo sozinho na sidebar, no favicon e no documento; lockup horizontal no header público.
