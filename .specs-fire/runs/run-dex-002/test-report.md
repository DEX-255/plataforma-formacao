---
run: run-dex-002
work_item: auth-login-google
intent: plataforma-formacao-dex
generated: 2026-08-08T17:30:00Z
status: passed-com-ressalva
---

# Test Report: Login com Google, sessão e proteção de rota

## Summary

| Categoria | Passou | Falhou |
|---|---|---|
| Decisão de acesso (pura) | 13 | 0 |
| `provisionar_acesso` contra o banco | 15 | 0 |
| **Total do projeto** | **146** | **0** |

Lint limpo · TypeScript sem erro · build de produção OK.

## O que está provado

- `RN-11` — e-mail fora da lista é recusado, **e não cria conta órfã**
- `RN-11` — remover da lista derruba o acesso na entrada seguinte (`D-01`)
- `RN-13` — edição encerrada recusa participante e mantém mentor em modo arquivo
- `RF-A1` — nome e foto vêm do Google, sem formulário; atualizam a cada acesso
- `RF-A1` — participante ganha participação; mentor não; entrar duas vezes não duplica
- `RF-A3` — participante não alcança rota de mentor nem digitando a URL
- **Rota desconhecida é negada por padrão** — esquecer de declarar quem acessa uma
  tela nova resulta em porta fechada, não em porta aberta
- **A recusa não vaza informação:** quem está fora da lista ouve "não autorizado" mesmo
  com a edição encerrada. Dizer que a edição terminou já entrega que existe uma edição

## Ressalva — o que NÃO foi verificado

**O handshake do OAuth com o Google.** Ele exige um Client ID e um Client Secret de um
projeto do Google Cloud, que ainda não existe.

O que isso significa na prática, com precisão: o handshake só prova que a pessoa é dona
daquele e-mail. **Ele não decide nada.** Quem entra, com que papel, e quem é recusado —
tudo isso acontece em `provisionar_acesso`, no banco, e está testado com quinze casos.

Fica sem prova: a troca do código por sessão, a leitura de `full_name` e `avatar_url` do
perfil Google, e o redirecionamento de volta. É código mecânico, mas é código que nunca
rodou.

**Também não verificado por dependência:** o destino do redirecionamento. `/encontros` e
`/trajetoria` ainda não existem — são os itens 6 e 8.

## Uma decisão que evitou violar D-07

No retorno do login a pessoa está autenticada mas ainda não existe em `usuario`. Sem
essa linha, `app.papel_atual()` devolve nulo e a RLS nega a leitura de
`email_autorizado` — justamente a tabela que decide se ela entra.

A saída fácil seria usar a `service_role` no retorno do login. Ela **ignora a RLS por
inteiro**, e `D-07` reserva essa chave para o gerador do documento final. Uma função
`security definer` faz o mínimo necessário e nada além — e, por estar no banco, vale
para qualquer caminho que crie sessão, não só para esta rota.

## Dois defeitos encontrados

**1. Ambiguidade de nome na função.** Parâmetro de saída chamado `edicao_id` entra no
escopo do plpgsql e colide com a coluna de mesmo nome dentro do `INSERT`. O erro só
aparece em tempo de execução — e o caminho onde apareceria é o login. Resolvido
devolvendo `jsonb`.

**2. Os testes de banco se apagavam entre si.** Dois arquivos limpando as mesmas tabelas,
rodando em paralelo. As falhas apareciam em lugares sem relação com a causa. Resolvido
com `fileParallelism: false`.
