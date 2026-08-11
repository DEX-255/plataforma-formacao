---
id: registrar-feedback
title: Registrar feedback — a tela do mentor
intent: plataforma-formacao-dex
complexity: high
mode: validate
status: completed
depends_on:
  - edicao-e-encontros
created: 2026-08-06T00:26:01Z
run_id: run-dex-006
completed_at: 2026-08-11T14:18:54.131Z
---

# Work Item: Registrar feedback — a tela do mentor

## Description

**A tela mais importante do produto.** Se ela tiver fricção, nada mais acontece: sem
registro não há trajetória, não há cobertura, não há documento final. O critério de
sucesso 4 do produto — mentores registrando na última semana com a mesma frequência da
primeira — se decide aqui e em nenhum outro lugar.

Cobre `RF-D1` a `RF-D5`: o painel do encontro e o formulário.

O momento real: acabou a dinâmica, o mentor está **em pé, com o celular, cinco minutos
antes de a próxima coisa começar**, e a memória está fresca. Se ele adiar, não escreve
mais.

## Acceptance Criteria

**Painel do encontro (`RF-D5`)**

- [ ] Turma listada com: já escrevi, quantos feedbacks recebeu no total, presença
- [ ] **Ordenação padrão: quem ainda não recebeu nada vem primeiro**
- [ ] Busca por nome, fixa no topo, sem sumir com o scroll
- [ ] Cabeçalho traz tema, framework, **meu eixo neste encontro** e o estado do encontro
- [ ] Alvo de toque de 56px por item

**Formulário (`RF-D1` a `RF-D4`)**

- [ ] Ordem na tela: quem estou avaliando → meu eixo com a pergunta-âncora → o que os
      outros já escreveram → situação → ponto → sugestão → nota com descritor → salvar
- [ ] O eixo **vem preenchido** pela atribuição e não é escolhido a cada vez (`RN-02`)
- [ ] `RF-D2`: antes do formulário, o mentor lê o que os outros mentores já registraram
      daquele participante naquele encontro — autor, eixo e bloco visível. Informativo,
      **nunca bloqueante**
- [ ] Salvar sem sugestão é impossível (`RN-01`), e a mensagem de erro **explica por quê,
      citando a diretriz** — não um "campo obrigatório" seco
- [ ] `RF-D3`: ao pontuar, o descritor daquele nível para aquele eixo aparece na tela; a
      assimetria da escala é comunicada (`RN-16`)
- [ ] "Não observado" é opção de nota, não ausência dela (`RN-07`)
- [ ] O aviso de que a nota **entra no documento final da pessoa** fica junto da nota, não
      no rodapé
- [ ] Antes da liberação o mentor edita e apaga o que ele mesmo escreveu; depois, o bloco
      visível trava e o interno continua editável (`RN-06`)
- [ ] Ninguém edita feedback de outro mentor
- [ ] Rascunho local a cada alteração, limpo ao confirmar (`D-03`) — sobrevive a perda de
      conexão e a fechar o app
- [ ] Salvar volta **para a lista**, com aquele nome marcado, não para tela de confirmação
- [ ] Confirmação otimista: o mentor não espera o servidor para ir ao próximo nome
- [ ] Nenhuma escrita de bloco interno atravessa para componente de cliente indevidamente

**Medido, não estimado**

- [ ] Um registro completo custa **menos de um minuto**, cronometrado num celular de
      verdade, em pé, com uma mão
- [ ] Primeiro conteúdo < 1,5s e interativa < 2,5s em 4G simulado
- [ ] JavaScript da rota < 120 KB comprimido

## Technical Notes

**O design doc precisa resolver a tensão central desta tela:** ela tem dois blocos com
públicos opostos — o visível, que a pessoa vai ler, e o interno, que ela nunca vê durante
a formação — e precisa caber em uma tela de celular sem que o mentor confunda os dois.
Errar aqui não gera bug, gera um mentor escrevendo no campo errado.

**Zero navegação até o encontro do dia.** Existindo encontro aberto, é nele que o mentor
cai ao entrar.

**Cada passo entre um nome e o próximo se multiplica por quarenta.** É a lente para toda
decisão de interação aqui.

## Dependencies

- edicao-e-encontros
