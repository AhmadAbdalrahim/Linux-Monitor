# Production Deployment Guide

> [!IMPORTANT]
> **CRITICAL**: Vercel does not support SQLite. To fix "Failed to login/register" errors on Vercel, you **MUST** follow Step 1 below to switch to PostgreSQL.

## 1. Database (PostgreSQL) - REQUIRED FOR VERCEL
For a public SaaS, you need a database that lives in the cloud (unlike SQLite which is just a file on your computer). **PostgreSQL** is the industry standard.

### Step-by-Step setup:
1.  **Get a Free Database**: Go to [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) and create a free account.
2.  **Create a Project**: Click "New Project" and name it `linux-monitor`.
3.  **Copy Connection String**: You will get a long URL that looks like this:
    `postgresql://user:password@hostname:5432/dbname?sslmode=require`
4.  **Update your Code**:
    - In your `.env` file, replace your old `DATABASE_URL` with this new URL.
    - In `prisma/schema.prisma`, change line 6:
      ```prisma
      provider = "postgresql"
      ```
5.  **Initialize the Database**: Run this command in your terminal:
    ```bash
    npm run db:push
    ```
    *This creates all your tables in the new cloud database.*

> [!TIP]
> **Supabase Connection Pooling**: For Vercel (Serverless), use the **Transaction Mode** connection string (Port 6543) in your `DATABASE_URL` to avoid connection limits. You can find this in your Supabase Dashboard settings.

## 2. Platform Hosting (Vercel)
Vercel is the easiest place to host a Next.js app.
1.  **GitHub**: Upload your project to a private GitHub repository.
2.  **Vercel Connect**: Go to [Vercel](https://vercel.com), click "Add New", and select your repository.
3.  **Environment Variables**: During the Vercel setup, add these:
    - `DATABASE_URL`: Your Supabase connection string (Port 6543 recommended).
    - `NEXTAUTH_SECRET`: A secure random string (matching your `.env`).
    - `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://your-app.vercel.app`).
    - `NEXT_PUBLIC_APP_URL`: Same as `NEXTAUTH_URL`.
4.  **Deploy**: Click "Deploy". Vercel will build your app and make it public!

## 2. Environment Variables
Ensure these variables are set in your production environment (e.g., Vercel, Railway, or AWS):

- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A long, random string for session encryption.
- `NEXTAUTH_URL`: The public URL of your application (e.g., `https://monitor.your-saas.com`).
- `GITHUB_ID` / `GITHUB_SECRET`: (Optional) For OAuth.

## 3. Deployment Platforms
### Vercel (Recommended)
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Vercel will automatically detect Next.js and run `npm run build`.

### Docker (Alternative)
A standard Dockerfile for Next.js can be used to containerize the application for deployment on AWS ECS or DigitalOcean.

## 4. Scaling the Agent
To onboard a new Linux server globally:

1. Copy the `scripts/install-agent.sh` to the target server.
2. Run it as root with your agent key:
   ```bash
   sudo ./install-agent.sh "YOUR_AGENT_KEY" "https://monitor.your-saas.com"
   ```
3. The script will automatically:
   - Install Python dependencies.
   - Set up a virtual environment.
   - Configure a `systemd` service for 24/7 monitoring.
   - Start the agent immediately.

## 6. Troubleshooting: "Failed to Login/Register" on Vercel
If you see a red error message when trying to sign in on your Vercel URL:
1.  **Check your Database URL**: Ensure `DATABASE_URL` in Vercel settings is a valid `postgres://` string.
2.  **Sync the Schema**: Run `npx prisma db push` from your local terminal.
    - **Note**: If you get a validation error about `url` not being supported, it's because of a conflict with Prisma 7 CLI. Use `npx prisma@6.19.2 db push` instead.
3.  **Redeploy**: Go to Vercel, click "Deployments", select the latest one, and click "Redeploy".

## 7. Production Readiness Checklist
Before going live, ensure:
- [ ] **Database**: Prisma `provider` is set to `"postgresql"` and `npx prisma db push` has been run against your cloud DB.
- [ ] **Security**: `NEXTAUTH_SECRET` is a unique, random 32+ character string.
- [ ] **App URL**: `NEXT_PUBLIC_APP_URL` is set to your production domain (e.g., `https://monitor.yourdomain.com`).
- [ ] **Agent Keys**: Every server has a unique `LINUX_MONITOR_AGENT_KEY`.
- [ ] **Email**: A real SMTP/Email provider is configured (currently using console logs).
- [ ] **HTTPS**: Your dashboard and agent API are running behind SSL (standard on Vercel/Cloudflare).
- [ ] **Clean Data**: Old development servers are deleted from the dashboard.
