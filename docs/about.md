# Carimbai App

Aplicação web de **cartão fidelidade digital**, feita com React 19 + TypeScript + Vite.

---

## Stack

- React 19 + React Router v7
- TypeScript
- Vite como bundler
- `html5-qrcode` para leitura de QR
- `react-qr-code` para geração de QR
- Sem CSS framework — CSS puro com arquivos `.css` por componente
- API REST via `fetch` nativo

---

## Perfis de Usuário

### 1. Cliente (`/`)

- Faz login/cadastro leve (nome, email, telefone) via `CustomerOnboarding`
- Sessão persistida no `localStorage` via hook `useCustomer`
- `CustomerScreen` exibe o cartão fidelidade: grade de carimbos, barra de progresso, recompensa disponível
- Gera QR Code do cartão para o lojista escanear
- Polling a cada 2s enquanto o QR está aberto — fecha o modal automaticamente ao detectar novo carimbo

### 2. Lojista (`/staff` e `/staff/dashboard`)

- Login com email/senha (`StaffLogin`) → token JWT salvo no `localStorage`
- `StaffScreen` escaneia o QR do cliente via câmera (`Html5QrcodeScanner`)
- Envia o carimbo para a API com `idempotencyKey`, `locationId` e o token JWT
- Mantém histórico local de carimbos aplicados na sessão

---

## Serviços (`api.ts`)

| Função | Descrição |
|---|---|
| `loginOrRegisterCustomer` | Login leve do cliente |
| `loginStaff` | Autenticação do lojista |
| `getCustomerCards` | Busca cartões do cliente |
| `getCardQR` | Gera token QR do cartão |
| `applyStamp` | Aplica carimbo (com idempotência) |
| `redeem` | Resgata recompensa |

---

## Fluxo Principal

```
Cliente abre QR
      ↓
Lojista escaneia
      ↓
API valida e aplica carimbo
      ↓
Polling do cliente detecta
      ↓
Modal fecha automaticamente
```