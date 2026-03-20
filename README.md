# Team-Up — Migração Payload → Supabase

## O que mudou

O backend foi migrado do **Payload CMS** para o **Supabase**. O frontend React/Vite não mudou visualmente.

Arquivos alterados:
- `services/supabaseService.ts` — novo (substitui payloadService.ts)
- `hooks/useReservations.ts` — atualizado
- `components/Login.tsx` — atualizado
- `App.tsx` — atualizado
- `package.json` — adicionado `@supabase/supabase-js`
- `.env` — variáveis do Supabase

---

## Passo 1 — Criar a tabela no Supabase

1. Acesse supabase.com → seu projeto
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase-setup.sql` e clique em **Run**

---

## Passo 2 — Criar os usuários (professores)

1. Supabase → **Authentication → Users → Add user → Create new user**
2. Preencha email e senha de cada professor
3. Clique no usuário criado e edite `user_metadata`:
   - Professor: `{ "name": "Nome do Professor", "role": "professor" }`
   - Admin: `{ "name": "Samila Porto", "role": "admin" }`

---

## Passo 3 — Instalar e rodar localmente

```bash
npm install
npm run dev
```

---

## Passo 4 — Deploy no Vercel

Adicione em Settings → Environment Variables:

| Nome | Valor |
|------|-------|
| `VITE_SUPABASE_URL` | `https://vywkdlexzgkpnebcgmnm.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | sua anon key completa |

Faça um novo deploy e pronto.

---

## Gerenciar dados

O Supabase tem um **Table Editor** nativo — acesse `supabase.com → Table Editor → reservations` para visualizar, editar e deletar reservas diretamente, sem painel extra.
