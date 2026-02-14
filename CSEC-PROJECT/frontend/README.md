# አሳሽ AI Frontend

React + Vite frontend for the አሳሽ AI platform.

## Environment

Create `.env.local` (or copy `.env.example`) and set:

```env
VITE_API_URL=http://localhost:5000/api
```

## Local Development

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Production Build

```bash
npm run type-check
npm run build
npm run preview
```

Use a production API URL in your deployment environment:

```env
VITE_API_URL=https://your-api-domain/api
```
