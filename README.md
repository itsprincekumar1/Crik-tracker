# Live Match Scoring Backend (TypeScript + Express + Socket.IO)

## Prerequisites
- Node.js 18+
- MongoDB (local or cloud)

## Build
- `npm run build`
- Outputs compiled code to `dist/`

## Start (production build)
- `npm run start`
- Requires a built `dist/`

## Formatting and Pre-Commit
- Format all source files: `npm run format`
- Pre-commit hook automatically formats staged files and runs `npm run build`

## API Base
- All REST endpoints are under `API_PREFIX` (default `/api/v1`)

## API Docs
- Swagger: `http://localhost:5050/api-docs`
- Shows Auth, Match, and Socket Test endpoints with detailed summaries and examples
