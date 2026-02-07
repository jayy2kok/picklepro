# PicklePro Frontend

Reactive Pickleball Match Tracker - Frontend Application

## Run with Docker (Recommended)

From the project root:
```bash
docker compose up
```

The frontend will be available at `http://localhost:3000`

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the API URL in `.env.local`:
   ```
   VITE_API_URL=http://localhost:8080
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
