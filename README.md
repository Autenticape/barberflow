# BarberFlow — Guia completo para colocar no ar (passo a passo)

Este guia assume que você nunca fez isso antes. Siga na ordem. Em caso de dúvida em
qualquer passo, volte ao chat com o Claude e descreva exatamente onde travou — cole
prints se possível.

Tempo estimado total: 1h30 a 3h na primeira vez.

---

## PARTE 1 — Criar o banco de dados (Supabase)

1. Acesse **supabase.com** e crie uma conta gratuita (pode usar login do Google).
2. Clique em **"New Project"**.
   - Nome: `barberflow` (ou o que preferir)
   - Senha do banco: crie uma senha forte e **guarde em local seguro** (não precisará
     digitar de novo, mas é bom ter salva)
   - Região: escolha a mais próxima do Brasil (ex: South America - São Paulo, se disponível)
3. Aguarde ~2 minutos enquanto o projeto é criado.
4. No menu lateral esquerdo, clique em **"SQL Editor"**.
5. Clique em **"New query"**.
6. Abra o arquivo `schema.sql` (que está junto com este guia), copie **todo o conteúdo**
   e cole no editor SQL do Supabase.
7. Clique em **"Run"** (ou Ctrl+Enter). Deve aparecer "Success. No rows returned."
   - Se der erro, copie a mensagem de erro e volte ao chat.
8. Agora vá em **Settings (ícone de engrenagem) → API**. Você vai precisar de 3 valores
   nesta tela, guarde-os anotados:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key (uma chave longa)
   - **service_role** key (outra chave longa — esta é SECRETA, nunca compartilhe)

### Ativar o login por e-mail (importante)

9. No menu lateral, vá em **Authentication → Providers**.
10. Confirme que **Email** está habilitado (geralmente já vem ativado por padrão).
11. Em **Authentication → URL Configuration**, depois de publicar o site (Parte 3),
    volte aqui e coloque o link do seu site em "Site URL".
12. (Recomendado para começar) Em **Authentication → Providers → Email**, desative
    temporariamente "Confirm email" para que o cadastro de novas barbearias funcione
    sem precisar confirmar e-mail — você pode reativar depois quando quiser mais segurança.

---

## PARTE 2 — Preparar o código

1. Você vai precisar de uma conta no **GitHub** (github.com — gratuita). Crie uma se
   não tiver.
2. Crie um novo repositório (botão verde "New").
   - Nome: `barberflow`
   - Pode deixar como privado
3. Faça upload de todos os arquivos deste projeto (que o Claude gerou) para esse
   repositório. A forma mais simples: na página do repositório recém-criado, clique em
   "uploading an existing file" e arraste a pasta inteira.

---

## PARTE 3 — Publicar o site (Vercel)

1. Acesse **vercel.com** e crie conta gratuita — escolha **"Continue with GitHub"**
   para já conectar direto.
2. Clique em **"Add New" → "Project"**.
3. Selecione o repositório `barberflow` que você criou no GitHub.
4. Antes de clicar em Deploy, abra a seção **"Environment Variables"** e adicione,
   uma por uma (nome à esquerda, valor à direita):

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | o Project URL que você anotou na Parte 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave "anon public" |
   | `SUPABASE_SERVICE_ROLE_KEY` | a chave "service_role" (a secreta) |
   | `ADMIN_EMAIL` | o e-mail que **você** vai usar para se cadastrar e administrar o sistema |

5. Clique em **"Deploy"**. Aguarde 1-3 minutos.
6. Quando terminar, a Vercel te dá um link tipo `barberflow-seu-nome.vercel.app` —
   esse já é seu site funcionando.

---

## PARTE 4 — Testar tudo

1. Abra o link gerado pela Vercel.
2. Clique em **"Criar minha barbearia"**, cadastre-se usando **o mesmo e-mail** que
   você colocou em `ADMIN_EMAIL`.
3. Você deve cair no painel (dashboard) da sua barbearia de teste.
4. Cadastre um profissional, um serviço, e teste criar um agendamento.
5. Vá em **Ajustes** dentro do painel e copie o "link de agendamento" — abra ele numa
   aba anônima do navegador para simular um cliente marcando horário (sem precisar
   de login). Teste o fluxo completo.
6. Acesse `seu-link.vercel.app/admin` — como você usou o `ADMIN_EMAIL`, deve conseguir
   ver e gerenciar todas as barbearias cadastradas (vai aparecer só a sua, de teste,
   por enquanto).

---

## PARTE 5 — Vendendo para barbearias de verdade

Para cada nova barbearia cliente:

1. Você manda o link do site (`seu-site.vercel.app`).
2. O dono da barbearia clica em "Criar minha barbearia" e se cadastra sozinho —
   ele já entra automaticamente com **14 dias de teste grátis**.
3. Quando ele combinar o pagamento com você (Pix, por exemplo) e você confirmar
   o recebimento, vá em `seu-site.vercel.app/admin`, encontre a barbearia na lista
   e clique em **"Ativar (pago)"**. Isso libera o acesso dele permanentemente
   (até você decidir suspender).
4. Se algum cliente atrasar o pagamento, clique em **"Suspender"** — o sistema dele
   mostra uma tela avisando que precisa regularizar, mas os dados ficam guardados,
   nada se perde.

---

## Quando crescer (upgrade de planos)

Quando você tiver ~15-25 barbearias ativas e notar (a Vercel e o Supabase avisam por
e-mail) que está perto do limite gratuito, basta:
- No Supabase: Settings → Billing → fazer upgrade do plano.
- Na Vercel: Settings → Billing → fazer upgrade do plano.

Nenhum dado se move, nenhuma barbearia perde acesso, é só um clique de upgrade.

---

## Domínio próprio (opcional, mais profissional)

Se quiser um link tipo `barberflow.com.br` em vez de `.vercel.app`:
1. Compre o domínio em um registrador (Registro.br para `.com.br`, ou Namecheap/GoDaddy
   para `.com`) — geralmente R$ 40/ano.
2. Na Vercel, vá em **Settings → Domains** do seu projeto e siga as instruções para
   conectar o domínio (eles te dão registros DNS para configurar no registrador).

---

## Problemas comuns

- **"Erro ao criar barbearia" no cadastro**: confira se rodou o `schema.sql` corretamente
  no Supabase (Parte 1, passo 6-7).
- **Login não funciona**: confira se desativou "Confirm email" (Parte 1, passo 12) ou
  se o usuário confirmou o e-mail recebido.
- **Painel /admin diz "Acesso restrito"**: confira se `ADMIN_EMAIL` na Vercel é
  exatamente o mesmo e-mail que você usou para se cadastrar.
