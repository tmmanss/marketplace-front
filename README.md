# Marketplace Frontend

React application with Vite, featuring JWT authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to `http://localhost:3000/api`):
```
VITE_API_BASE_URL=http://localhost:3000/api
```

3. Start development server:
```bash
npm run dev
```

## Project Structure

- `src/pages/` - Login and Register pages
- `src/context/` - AuthContext for authentication state
- `src/services/` - API client and auth service
- `src/App.jsx` - Main app with routing and protected routes

## Features

- JWT authentication (login/register)
- Protected routes (redirects to /login if not authenticated)
- Token stored in context state
- User and role stored from backend response
- Axios configured with base URL and automatic token injection

