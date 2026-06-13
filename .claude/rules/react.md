# Regras — React / TypeScript (carimbai-app)

Carregadas ao editar `.ts`/`.tsx`. Seguir os padrões já presentes em `src/`.

## Componentes & hooks
- Componentes **funcionais** + hooks. Sem class components.
- Respeitar as regras do `eslint-plugin-react-hooks` (dependências de
  `useEffect`/`useCallback`, hooks no topo, sem condicional).
- Estado de cliente passa pelo hook `useCustomer` (não duplicar lógica de
  login/registro nos componentes).

## Tipagem
- **Sem `any`.** Tipar props, estado e retornos. Reusar tipos de
  `types/index.ts`; adicionar lá os novos tipos de request/response.
- Preferir `type`/`interface` explícitos para props.

## Rede
- **Toda chamada HTTP passa por `services/api.ts`** (classe `ApiService`). Não
  usar `fetch` solto em componentes/hooks.
- Novos endpoints viram métodos em `ApiService`, com tipos de
  request/response em `types/index.ts`, enviando `Authorization: Bearer <token>`
  quando autenticado e tratando `!response.ok`.

## Estrutura
- Manter a organização: `components/`, `hooks/`, `services/`, `types/`. CSS
  co-localizado por componente (`Foo.tsx` + `Foo.css`), como já é feito.
- Rotas centralizadas em `App.tsx`.

## UX
- Tratar estados de **loading** e **erro** explicitamente (como em `App.tsx` e
  `useCustomer`). Mensagens de erro amigáveis ao usuário.

## Env & segurança
- Variáveis de ambiente com prefixo `VITE_` ficam **públicas no bundle** — nunca
  colocar segredo de servidor ali. Ler via `import.meta.env.VITE_*`.
- Não logar tokens (`Bearer`) no console.
