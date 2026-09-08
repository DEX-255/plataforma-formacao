# Subir para produção

Passo a passo, na ordem obrigatória. **Cada serviço precisa de um dado do
anterior** — fora de ordem, trava.

```
1. Supabase ──→ dá o <ref>.supabase.co
2.   └─→ Google Cloud OAuth (a URL de callback é do Supabase)
3.         └─→ volta ao Supabase (cola Client ID + Secret)
4.               └─→ migrações e bootstrap
5.                     └─→ Vercel (precisa da URL + chave anônima)
6.                           └─→ volta ao Supabase (Site URL é o da Vercel)
7.                                 └─→ testar UMA conta @discente.ufg.br
```

**Faça tudo com a conta Google da própria DEX**, não com a pessoal. A plataforma
guarda avaliação nominal de estudante e precisa sobreviver à troca de gestão.

---

## 1 · Supabase

Criar projeto em [supabase.com](https://supabase.com).

- **Região: São Paulo (`sa-east-1`)** — a turma toda acessa de Goiânia.
- **Guarde a senha do banco.** Ela aparece uma vez só, e sem ela não dá para
  rodar as migrações.
- **Não crie tabela nenhuma pelo painel** (`D-06`). As migrações fazem isso.

Anote de *Project Settings → API*:

| Onde vai | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave anônima (ou *publishable*) |
| **não vai a lugar nenhum na nuvem** | a `service_role` — ver o aviso no fim |

## 2 · Google Cloud — o OAuth

[console.cloud.google.com](https://console.cloud.google.com) → novo projeto.

1. **Tela de consentimento OAuth** → tipo **Externo**. Nome do app e e-mail de
   suporte com a cara da DEX: é o que o estudante lê ao autorizar.
2. **Credenciais → Criar → ID do cliente OAuth → Aplicativo da Web.**
3. Em **URIs de redirecionamento autorizados**, cole exatamente:

   ```
   https://<ref>.supabase.co/auth/v1/callback
   ```

   O `<ref>` é o do passo 1. Quem recebe o retorno do Google é o Supabase, não a
   nossa aplicação — por isso a URL não é a do site.

Guarde **Client ID** e **Client Secret**.

## 3 · Supabase → Auth → Google

*Authentication → Providers → Google* → ligar → colar Client ID e Secret.

## 4 · Migrações e bootstrap

Com a senha do banco em mãos, no diretório do projeto:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push          # aplica as 9 migrações
```

**Nunca `db reset` apontando para produção** — ele recria o banco do zero.

Depois, uma vez só: abra `supabase/bootstrap.sql`, troque os dois valores do
topo e rode no *SQL Editor* do painel.

> A lista de autorizados é fechada e só mentor escreve nela — mas mentor só
> existe se estiver na lista. Num banco novo isso é um ciclo fechado e **ninguém
> entra, nem quem criou o projeto**. O bootstrap abre a porta uma vez; daí em
> diante tudo acontece pela tela `/membros`.

Use o e-mail da conta Google **com que você realmente clica em "entrar"**. Se é
o gmail pessoal que fica logado no navegador, é ele — não o institucional.

## 5 · Vercel

*Add New → Project* → importar `DEX-255/plataforma-formacao`.

Variáveis de ambiente — **apenas estas duas**:

```
NEXT_PUBLIC_SUPABASE_URL       = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = <a chave anônima>
```

**O que NÃO pode entrar aqui:**

- `NEXT_PUBLIC_LOGIN_LOCAL` — é a entrada por senha do desenvolvimento. Em
  produção seria porta dos fundos. `testes/guardas-auth.test.ts` falha se ela
  vazar, e o CI barra.
- `SUPABASE_SERVICE_ROLE_KEY` — ela **ignora toda a RLS** (`D-07`). Só o gerador
  do documento final a usa, rodando na máquina de quem gera. O site nunca
  precisa dela, e há teste garantindo que ela aparece num arquivo só.

## 6 · Fechar o círculo no Supabase

Agora que a Vercel deu uma URL, volte em *Authentication → URL Configuration*:

| Campo | Valor |
|---|---|
| **Site URL** | `https://<seu-app>.vercel.app` (ou o domínio próprio) |
| **Redirect URLs** | `https://<seu-app>.vercel.app/auth/retorno` |

Sem isso o Google devolve para `localhost` e o login não fecha.

**Dica de sequência:** suba primeiro no subdomínio `.vercel.app` e teste tudo.
Domínio próprio pode entrar depois — é trocar esses dois campos. Não deixe a
decisão de domínio bloquear o teste do `@discente`.

## 7 · Testar UMA conta `@discente.ufg.br` — **faça isto cedo**

Assim que o login existir, antes de qualquer outra coisa.

O `@discente` é conta Google, isso está confirmado. O risco que sobra é o
administrador do Workspace da UFG restringir quais aplicativos de terceiros os
usuários podem autorizar. Se estiver ligado, **ninguém com `@discente` entra**, e
o erro aparece do lado do Google, não no nosso código.

**Destravar isso passa pelo STI da UFG e leva tempo.** Não pode ser descoberto no
dia do encontro.

- [ ] Uma conta `@discente` entra e chega até a trajetória

---

## Depois de subir

- [ ] Conferir o que o plano gratuito do Supabase guarda de **backup**, e por
      quanto tempo. Durante a formação isso é o seguro contra erro humano.
- [ ] Proteger o `main` — hoje bloqueado pelo plano `free` da organização. Ver
      `revisao-geral.md`.
- [ ] Passar o `roteiro-de-validacao.md` inteiro, com o sistema em produção.

## Se der errado

| Sintoma | Causa quase certa |
|---|---|
| Volta para `/entrar` sem mensagem | e-mail fora da lista de autorizados — rode o bootstrap ou cadastre em `/membros` |
| Google reclama de `redirect_uri_mismatch` | a URI do passo 2 não bate com `https://<ref>.supabase.co/auth/v1/callback` |
| Login volta para `localhost` | Site URL do passo 6 não foi trocada |
| `permission denied for table ...` | migração não aplicada — rode `db push` |
