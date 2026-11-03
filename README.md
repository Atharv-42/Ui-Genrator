# PixelForge AI

PixelForge AI turns a UI screenshot into editable React and Tailwind CSS code. Refine the result with AI, preview it at desktop, tablet, and mobile sizes, inspect its component tree and design tokens, save projects, and download a standalone Vite project.

## Features

- Generate a React UI from a PNG, JPEG, or WEBP screenshot and a text prompt.
- Edit generated code in a Monaco editor and preview the result live.
- Ask AI to make follow-up changes in plain language.
- Inspect the component tree and detected design tokens; adjust colors, typography, and spacing tokens.
- Sign up or sign in, save projects, and download them as ZIP archives.
- Keep project data, versions, and reference screenshots in Supabase.

## Requirements

- Node.js 22.18+ (or 24.11+) and npm.
- A [Supabase](https://supabase.com/) project for authentication and saved projects.
- A [Groq API key](https://console.groq.com/keys) for screenshot generation and AI modifications.

## Setup

### 1. Configure Supabase

In the Supabase SQL Editor, run [`server/supabase/schema.sql`](server/supabase/schema.sql). Create a **private** Storage bucket named `project-references`. Configure Storage policies so authenticated users can access only objects under their own `<user-id>/` prefix.

Enable Email authentication in Supabase. The app supports email and password sign-in and sign-up.

### 2. Configure the server

Copy `server/.env.example` to `server/.env` and set:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
```

`GROQ_MODEL` is optional. Keep the service role key and Groq key in the server environment only; never put them in client variables or commit real secrets.

### 3. Configure the client

Create `client/.env` with your Supabase project URL and public anon key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000
```

The app requires the first two values to show the sign-in screen and access saved projects. `VITE_API_URL` is optional for local development; it defaults to `http://localhost:5000`.

### 4. Install and run

Open two terminals from the repository root:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The API listens on port 5000 by default; its health endpoint is `http://localhost:5000/api/health`.

## Production build

Build the frontend from `client/`:

```bash
npm run build
npm run preview
```

Run the API from `server/` with `npm start`. Set `VITE_API_URL` to the deployed API URL when building the client. The API currently allows browser requests from `http://localhost:5173`; update the CORS origin in `server/src/index.ts` when deploying the frontend elsewhere.

## API overview

- `GET /api/health` — server health check.
- `POST /api/generate` — generate a UI from a multipart `image` and optional `prompt`.
- `POST /api/modify` — modify code with an `instruction`.
- `/api/projects` — create, list, update, delete, export, and manage saved project versions. Project endpoints require a Supabase bearer token.

Screenshot uploads are limited to 5 MB and PNG, JPEG, or WEBP. Generated code is rendered in the browser preview; treat AI-generated code as untrusted before using it outside the app.

## Project structure

```text
client/   React, TypeScript, Vite frontend
server/   Express API, AI integration, Supabase project storage
```

