# አሳሽ AI Backend

Express + TypeScript API for authentication, RAG document ingestion, and chatbot queries.

## Environment

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=<long-random-secret>
VOYAGE_API_KEY=<voyage-api-key>
GEMINI_API_KEY=<gemini-api-key>
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain
```

`ALLOWED_ORIGINS` supports comma-separated origins and is used by CORS.

## Run

```bash
npm install
npm run dev
```

## Admin User Setup

To create a default admin user for testing:

```bash
npm run create-admin
```

This will create an admin account with the following credentials:

- **Email:** `admin@astu.edu.et`
- **Password:** `Admin@123`

Use these credentials to login to the admin dashboard. If the user already exists, the script will update its role to admin.

## Build / Start

```bash
npm run type-check
npm run build
npm start
```

## API Base

`http://localhost:5000/api`

Reference: `backend/API_REFERENCE.md`

## Route Summary

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/chat/ask`
- `POST /api/chat/upload/text`
- `POST /api/chat/upload/file`
- `GET /api/chat/documents`
- `DELETE /api/chat/documents/:id`
