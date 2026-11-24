# Portal de Aprovação · Philar

Site onde a Philar sobe posts e vídeos e cada cliente aprova, pede ajuste ou comenta por um link secreto.

- **Você (agência):** `seusite.vercel.app/admin` → entra com senha, cria clientes, sobe conteúdos, responde comentários, envia novas versões.
- **Cliente:** recebe um link tipo `seusite.vercel.app/c/8f3a...` → vê lista e calendário, aprova ou pede ajuste. Não precisa de login.

---

## Colocar no ar (uns 20 minutos, tudo gratuito)

### 1. Supabase (banco de dados + arquivos)
1. Crie uma conta em supabase.com e clique em **New project**. Anote a senha do banco num lugar seguro. Escolha a região **South America (São Paulo)**.
2. No menu lateral, abra **SQL Editor → New query**, cole todo o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**. Deve aparecer "Success".
3. Vá em **Project Settings → API** e deixe a aba aberta. Você vai copiar 3 coisas: **Project URL**, a chave **anon public** e a chave **service_role** (essa é secreta).

### 2. GitHub (onde o código fica guardado)
1. Crie uma conta em github.com e clique em **New repository**. Nome: `philar-aprovacao`, deixe como **Private** e clique em **Create**.
2. Na página do repositório vazio, clique em **uploading an existing file**, arraste **todo o conteúdo** desta pasta (não a pasta em si) e clique em **Commit changes**.

### 3. Vercel (o site)
1. Crie uma conta em vercel.com usando **Continue with GitHub**.
2. Clique em **Add New → Project** e importe `philar-aprovacao`.
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione estas 4 variáveis:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | chave service_role |
| `ADMIN_PASSWORD` | uma senha forte que só você sabe |

4. Clique em **Deploy**. Em 1 ou 2 minutos aparece o link do site. Acesse `/admin`.

---

## Uso no dia a dia
1. Em `/admin`, crie o cliente e copie o link dele para enviar no WhatsApp.
2. Suba o conteúdo: título, formato, data, legenda e arquivos (para carrossel, selecione as imagens na ordem).
3. Quando o cliente pedir ajuste, use **Enviar nova versão** no card. O conteúdo volta a aparecer como "Aguardando aprovação".
4. Se um link vazar, use **Gerar link novo**. O antigo para de funcionar na hora.

## Limites do plano gratuito
- **Supabase:** 1 GB de arquivos e até 50 MB por arquivo. Exporte os vídeos em 1080p, H.264. Apague conteúdos antigos já publicados para liberar espaço.
- Projetos gratuitos do Supabase entram em pausa depois de 7 dias sem acesso. É só reativar no painel.

## Personalizar
As cores estão no começo de `app/globals.css` (`--marca`, `--destaque`, `--fundo`).
