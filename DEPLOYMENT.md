# CIX-AI Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+ and pnpm 10.15.1+
- MySQL 8.0+ database
- Forge API key (for LLM and storage)

### Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Initialize database:**
   ```bash
   pnpm db:push
   ```

4. **Start development server:**
   ```bash
   pnpm dev
   ```
   Server runs on http://localhost:3000

### Development Commands

- `pnpm dev` - Start development server with hot reload
- `pnpm check` - Check TypeScript types
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests with Vitest
- `pnpm db:push` - Generate and run database migrations

## Production Build

### Build the application:
```bash
pnpm build
```

This creates:
- `dist/public/` - React frontend bundle (Vite)
- `dist/index.js` - Express server bundle (esbuild)

### Run production server:
```bash
NODE_ENV=production node dist/index.js
```

The server will:
1. Check for available ports starting from PORT env var (default 3000)
2. Serve static React app from `dist/public/`
3. Serve tRPC API from `/api/trpc`
4. Setup OAuth routes at `/auth/*`
5. Setup storage proxy at `/manus-storage/*`

## Render Deployment

### Automatic Deployment

Push to main branch to trigger automatic deployment:

1. **Build Phase:**
   - Install dependencies: `pnpm install`
   - Build: `pnpm build`

2. **Start Phase:**
   - Start: `pnpm start`
   - Port: Automatically assigned by Render

### Manual Deployment

1. **Connect repository:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure service:**
   - Environment: Node
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start`

3. **Set environment variables:**
   In Render dashboard, set all variables from `.env.example`:
   - `DATABASE_URL` - Your MySQL connection string
   - `JWT_SECRET` - Random secure string (min 32 chars)
   - `VITE_APP_ID` - Your app ID
   - `OAUTH_SERVER_URL` - Your OAuth provider
   - `OWNER_OPEN_ID` - Owner's OpenID from OAuth
   - `BUILT_IN_FORGE_API_URL` - Forge API endpoint
   - `BUILT_IN_FORGE_API_KEY` - Forge API key

4. **Database setup:**
   - Create MySQL database on your hosting
   - Copy connection string to `DATABASE_URL`
   - Render will auto-migrate on first deploy

### Environment Variables Required for Production

```
NODE_ENV=production
PORT=3000 (automatically set by Render)
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=<random-secure-string-32chars-min>
VITE_APP_ID=<your-app-id>
OAUTH_SERVER_URL=<your-oauth-url>
OWNER_OPEN_ID=<owner-openid>
BUILT_IN_FORGE_API_URL=<forge-api-url>
BUILT_IN_FORGE_API_KEY=<forge-api-key>
```

## Database Setup

### MySQL Connection

The app uses Drizzle ORM with MySQL 2 driver. Connection string format:
```
mysql://username:password@host:port/database
```

### Migrations

- Migrations run automatically on first connection via `getDb()`
- Manual migration: `pnpm db:push`
- Migrations stored in `drizzle/` directory
- Schema defined in `drizzle/schema.ts`

### Schema

The database includes:
- **users** - User authentication (OpenID-based)
- **memories** - User memories/notes
- **tasks** - User tasks and goals
- **agents** - AI agents
- **events** - System event log
- **insights** - AI-generated insights
- **chatSessions** - Chat history
- **chatMessages** - Individual messages

## Troubleshooting

### Port already in use
The app automatically tries ports starting from `PORT` env var. Check available ports.

### Database connection failed
- Verify `DATABASE_URL` format
- Check MySQL server is running
- Verify network access to database host
- Ensure database exists

### OAuth redirect fails
- Verify `OAUTH_SERVER_URL` is accessible
- Check callback URL in OAuth provider settings
- Ensure `JWT_SECRET` is set (used for session cookies)

### Build fails
- Check Node version: `node -v` (should be 18+)
- Clear cache: `rm -rf node_modules dist; pnpm install`
- Check disk space for builds
- Review build logs for specific errors

### Production server won't start
- Check all required environment variables are set
- Verify database connection works
- Check for port conflicts
- Review server logs for errors

## Monitoring

### Health Check
The app automatically handles port discovery. Check:
```bash
curl http://localhost:3000/
```

### Logs
Development:
```bash
pnpm dev
```

Production:
Monitor via Render dashboard or:
```bash
NODE_ENV=production node dist/index.js 2>&1 | tee app.log
```

### Database Logs
Enable drizzle logging in `server/db.ts` for debugging.

## Performance Optimization

### Build Optimization
- Uses Vite for client bundling (fast, tree-shaken)
- Uses esbuild for server bundling (optimized for Node)
- All code is typed with TypeScript for safety

### Runtime Optimization
- Automatic port fallback prevents startup delays
- Connection pooling via MySQL2
- tRPC batch requests for API efficiency
- Static file serving for client assets

## Security Notes

1. **JWT_SECRET** - Must be random, 32+ characters, different per environment
2. **DATABASE_URL** - Use SSL connection in production
3. **BUILT_IN_FORGE_API_KEY** - Keep secret, never commit to repo
4. **OAUTH tokens** - Handled via HTTPOnly cookies (secure)

## Maintenance

### Dependencies
Update regularly:
```bash
pnpm update
pnpm up
```

### Database Backups
Recommended backup strategy for production MySQL.

### Logs Rotation
Consider log rotation for long-running instances.
