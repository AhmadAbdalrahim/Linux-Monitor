# Linux Monitor SaaS

A SaaS application to monitor Linux servers in detail. Collects CPU, memory, disk, network, processes, load average, and uptime metrics from Linux machines via a lightweight Python agent.

## Features

- **Real-time monitoring**: CPU, memory, disk, network I/O, process count
- **Load averages**: 1m, 5m, 15m
- **Historical charts**: 24-hour time-series for CPU, memory, load
- **Multi-server dashboard**: Monitor multiple Linux hosts
- **Lightweight agent**: Python script using psutil, minimal footprint

## Quick Start

### 1. Run the dashboard

```bash
npm install
npm run db:push    # if not done
npm run db:seed    # creates demo user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Add a Linux server

1. Click **Add Server** in the dashboard
2. Generate an agent key
3. On your Linux server:

```bash
cd agent
pip install -r requirements.txt
export LINUX_MONITOR_AGENT_KEY="your-key-from-dashboard"
export LINUX_MONITOR_API_URL="http://your-dashboard-url:3000"
python linux_monitor_agent.py
```

### 3. View metrics

The dashboard will show live metrics and historical charts for each server.

## Project Structure

```
linux-monitor-saas/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── agent/     # Agent registration & metrics
│   │   │   └── servers/   # Server list & metrics
│   │   ├── servers/[id]/  # Server detail page with charts
│   │   └── page.tsx       # Dashboard
│   ├── components/
│   └── lib/
├── agent/
│   ├── linux_monitor_agent.py
│   ├── requirements.txt
│   └── README.md
└── prisma/
    └── schema.prisma
```

## Environment Variables

| Variable       | Description                    | Default           |
|----------------|--------------------------------|-------------------|
| DATABASE_URL   | SQLite/Postgres connection     | `file:./dev.db`   |

## Agent Environment Variables

| Variable                   | Description               | Default              |
|----------------------------|---------------------------|----------------------|
| LINUX_MONITOR_API_URL      | Dashboard API URL         | `http://localhost:3000` |
| LINUX_MONITOR_AGENT_KEY    | Agent key from dashboard  | (required)           |
| LINUX_MONITOR_INTERVAL     | Seconds between reports   | 60                   |
| LINUX_MONITOR_SERVER_NAME  | Custom server name        | hostname             |

## Production Deployment

- Replace SQLite with PostgreSQL for production
- Add authentication (e.g. NextAuth) for multi-tenant SaaS
- Run agent as systemd service (see `agent/README.md`)
- Use HTTPS for the dashboard API

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Recharts
- **Backend**: Next.js API routes, Prisma
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Agent**: Python 3, psutil, requests
