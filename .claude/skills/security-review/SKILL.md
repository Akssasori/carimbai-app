---
name: security-review
description: Revisão de segurança das mudanças do branch atual no frontend carimbai-app (segredos no bundle, manuseio de token, entrada de QR, libs externas).
---

# Security review — carimbai-app (frontend)

Use ao revisar mudanças antes de commitar/abrir PR. Foco no que é sensível em um
frontend que lida com login social, tokens e QR.

## Passos

1. **Diff em foco**: `git diff` (ou `git diff main...HEAD`); revisar só o que mudou.

2. **Segredos no bundle**: nenhuma chave/secret de servidor em código ou em
   variável `VITE_*` (tudo `VITE_*` vai para o JS público). Client-ids públicos
   (Google) são ok; secrets de servidor, não. Conferir `.env` não está commitado.

3. **Manuseio de token**: token JWT guardado de forma consistente com o resto do
   app; **não logar `Bearer`/token no console**; não vazar em URLs.

4. **Entrada de QR**: dados lidos do QR (`html5-qrcode`) são validados antes de
   enviar à API; não confiar cegamente no payload escaneado.

5. **Rede**: chamadas passam por `services/api.ts`; tratam `!response.ok`; sem
   `fetch` solto que ignore erros. Sem desabilitar verificação de TLS.

6. **Render perigoso**: evitar `dangerouslySetInnerHTML`; se usado, conteúdo é
   sanitizado. Cuidado com render de dados vindos da API/usuário.

7. **Dependências**: libs externas novas são necessárias e de fonte confiável;
   conferir `npm` warnings de vulnerabilidade quando relevante.

## Saída

Lista priorizada (Alta/Média/Baixa) com `arquivo:linha` e correção. Se nada
crítico, dizer explicitamente.
