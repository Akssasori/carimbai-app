---
name: "source-command-deploy"
description: "Checklist de deploy do carimbai-app na Vercel"
---

# source-command-deploy

Use this skill when the user asks to run the migrated source command `deploy`.

## Command Template

# Deploy — carimbai-app (Vercel)

O app é servido pela **Vercel** com `vercel.json` reescrevendo todas as rotas
para `index.html` (SPA). O deploy normalmente acontece pela integração Git da
Vercel (push na branch conectada) ou pelo `vercel` CLI.

## Antes do deploy

1. Build local passa: `npm run build` (`tsc -b && vite build` — corrige erros de
   tipo antes de subir).
2. Lint limpo: `npm run lint`.
3. (Opcional) `npm run preview` para validar o build localmente.
4. `git status` limpo, na branch certa; revisar `git diff`.
5. Rodar a skill `security-review` se mexeu em auth/token/chamadas de API.

## Variáveis de ambiente (Vercel)

Conferir no painel da Vercel (Project → Settings → Environment Variables):
- `VITE_API_BASE_URL` apontando para o backend de produção (não `localhost`).
- `VITE_GOOGLE_CLIENT_ID` correto para o ambiente.

⚠️ Lembre: `VITE_*` fica público no bundle — nunca colocar secret de servidor.

## Deploy

- Push na branch conectada à Vercel (deploy automático), **ou**
- `vercel --prod` via CLI.

## Pós-deploy

- Abrir a URL de produção e validar o fluxo do cliente (`/`) e do staff
  (`/staff`). Confirmar que as chamadas à API resolvem (sem CORS/404).
