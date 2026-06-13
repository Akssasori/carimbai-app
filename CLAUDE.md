# carimbai-app — frontend

PWA do cartão de fidelidade carimbai. Dois públicos:
- **Cliente** (`/`): vê o cartão, exibe o QR para receber selos, resgata recompensa.
- **Lojista/staff** (`/staff`, `/staff/dashboard`): faz login e escaneia o QR do
  cliente para aplicar selos.

> Backend consumido por este app: `../carimbai` (Spring Boot, porta 1234).

## Stack

- **React 19**, **TypeScript ~5.9**, **Vite 7**.
- **react-router-dom 7** (rotas), **html5-qrcode** (leitura de QR),
  **react-qr-code** (exibição), login social (`@react-oauth/google`,
  `react-apple-signin-auth`, `@greatsumini/react-facebook-login`).

## Como rodar

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build
npm run lint       # eslint
npm run preview    # serve o build
```

Suba o backend `../carimbai` antes (a API default é `http://localhost:1234/api`).

## Arquitetura

```
src/
├── App.tsx            # rotas: / (cliente), /staff, /staff/dashboard
├── components/        # CustomerScreen, CustomerLogin, StaffScreen, StaffLogin, QRCodeModal
├── hooks/             # useCustomer (estado/login do cliente), usePushNotifications
├── services/api.ts    # ApiService — TODAS as chamadas HTTP passam aqui
└── types/index.ts     # tipos de request/response compartilhados
```

- **Rotas** em `App.tsx`: `/` decide entre onboarding (`CustomerOnboarding`) e
  `HomeScreen` conforme `useCustomer`; `*` redireciona para `/`.
- **Estado do cliente**: `hooks/useCustomer` (`customer`, `loading`,
  `loginOrRegister`, `socialLogin`).
- **HTTP**: `services/api.ts` expõe a classe `ApiService`. Envia
  `Authorization: Bearer <token>` e trata `!response.ok` lançando `Error`.
- **QR**: `html5-qrcode` lê (staff), `react-qr-code` exibe (cliente, em
  `QRCodeModal`).

## Integração com o backend

- Base da API: `VITE_API_BASE_URL` (default `http://localhost:1234/api`).
- Login Google: `VITE_GOOGLE_CLIENT_ID`.
- Variáveis ficam em `.env` (prefixo **`VITE_`** para serem expostas ao bundle).
  ⚠️ Tudo com prefixo `VITE_` vai para o JS público — **não** coloque segredos
  de verdade ali (client-id público é ok; secret de servidor não).

## Convenções

- Componentes funcionais + hooks. Sem `any` em props/estado.
- **Toda chamada de rede passa por `services/api.ts`** — não espalhar `fetch`
  pelos componentes.
- Respeitar a estrutura `components/ hooks/ services/ types/`.
- Regras detalhadas em `.claude/rules/react.md`.

## MCP

`.mcp.json` define um servidor **Playwright** opcional para verificação
browser-driven (abrir `npm run dev` e validar fluxos de cliente/staff). Se não
usar, apague `.mcp.json`.

## Deploy

Vercel (`vercel.json` com SPA rewrites → `index.html`). Antes: `npm run build`
local deve passar e as variáveis `VITE_*` precisam estar configuradas no painel
da Vercel. Veja `/deploy`.
