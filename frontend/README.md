# Forge Frontend

Interface web oficial do Forge, construída com React, TanStack Start, TypeScript e Tailwind CSS.
O Django em `../backend/` é a fonte de verdade para autenticação, planos, sessões e progresso.

Os fluxos de cadastro, login, recuperação e troca de senha, onboarding, exclusão de conta,
execução de treino e acompanhamento de progresso usam a API Django real.

## Desenvolvimento

Na raiz do repositório:

```powershell
npm install
npm run dev
```

Ou dentro desta pasta:

```powershell
npm run dev -- --host 127.0.0.1 --port 5175
```

A URL padrão é `http://127.0.0.1:5175/`. A API deve estar disponível em
`http://127.0.0.1:8000/api/`. Em produção, use `VITE_API_URL=/api` e configure
`FORGE_API_ORIGIN=https://<backend-host>` no Worker para manter a autenticação no mesmo domínio.

## Verificação

```powershell
npm run lint
npx tsc --noEmit
npm run test
npm run test:e2e
npm run build
npm run test:pwa
```

`test:e2e` covers authentication, registration, accessibility and viewport overflow on desktop and
mobile Chromium. `test:pwa` starts the generated Cloudflare worker and verifies an offline reload.

See `../docs/DEPLOYMENT.md` for the production runbook.

## Estrutura

- `src/routes/`: páginas e rotas da aplicação.
- `src/components/forge/`: componentes compartilhados do produto.
- `src/lib/forge/api.ts`: cliente HTTP da API Django.
- `src/lib/forge/store.tsx`: estado da sessão e integração offline.
- `public/`: recursos públicos.
