# Specs — Plataforma DEX

Especificação da plataforma interna da Formação DEX. Escrita antes do código, e mantida como fonte de verdade depois dele.

## Como usar

**A spec vem antes.** Nenhuma tela, tabela ou regra entra no código sem estar aqui. Se durante a implementação aparecer uma decisão que a spec não cobre, o caminho é atualizar a spec e depois codar — não decidir no arquivo e esquecer. É isso que evita o código virar o único lugar onde as regras existem.

**Cada regra tem um código.** `RN-03`, `RF-D2`. Commits, comentários e testes referenciam esses códigos. Quando a regra mudar, dá para achar tudo que depende dela.

**O que ainda não está decidido está marcado.** Nada de decisão implícita: se um ponto depende de resposta do Fred, ele aparece como ⏳ e está listado em `../pendencias.md`.

## Os documentos

| | | |
|---|---|---|
| `01-produto.md` | **Produto** | O que é, para quem, o que está dentro e fora do escopo, como saber se deu certo |
| `02-dominio.md` | **Domínio** | Glossário, entidades, ciclos de vida e as regras de negócio invariantes |
| `03-requisitos.md` | **Requisitos** | Requisitos funcionais numerados, com critério de aceite |
| `04-telas-e-fluxos.md` | **Telas e fluxos** | Jornadas por papel e o inventário de telas com seus estados |
| `05-design-system.md` | **Design system** | Tokens, tipografia, componentes, comportamento mobile |
| `06-arquitetura-e-dados.md` | **Arquitetura e dados** | Stack, esquema do banco, estrutura de pastas, decisões técnicas |
| `07-qualidade.md` | **Qualidade** | Privacidade, anonimato, acessibilidade, segurança e o que testar |

## Contexto de domínio

As specs referenciam, mas não repetem, os documentos institucionais da DEX em `../dominio/`:

- `diretrizes-de-feedback.md` — a cultura de feedback. Várias regras do sistema existem para fazer cumprir essas diretrizes.
- `papeis-avaliacao-oratoria.md` — os três canais e o que cada mentor observa.
- `rubrica-notas-oratoria.md` — o que cada nota de 1 a 5 significa.
- `frameworks-dinamicas.md` — avaliação das dinâmicas que não são de apresentação.
- `calendario-agendex.ics` — calendário da entidade.

Quando esses documentos e as specs discordarem, **os documentos de domínio ganham**. Eles descrevem como a DEX funciona; a spec descreve como o software atende a isso.
