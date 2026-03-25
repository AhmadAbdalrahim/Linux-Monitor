# Linux Monitor Agent

Lightweight Python agent that runs on Linux servers and sends system metrics to the SaaS dashboard.

## Quick Start

```bash
# On your Linux server
cd agent
pip install -r requirements.txt

# Option 1: Generate agent key from dashboard, then:
export LINUX_MONITOR_AGENT_KEY="your-key-from-dashboard"
export LINUX_MONITOR_API_URL="https://your-saas-url.com"  # or http://localhost:3000 for local dev
python linux_monitor_agent.py

# Option 2: Let agent auto-register (get key from first run output)
export LINUX_MONITOR_API_URL="https://your-saas-url.com"
python linux_monitor_agent.py
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LINUX_MONITOR_API_URL` | `http://localhost:3000` | Dashboard API URL |
| `LINUX_MONITOR_AGENT_KEY` | (required for existing server) | Agent key from dashboard |
| `LINUX_MONITOR_INTERVAL` | `60` | Seconds between metric reports |
| `LINUX_MONITOR_SERVER_NAME` | hostname | Custom display name |

## Run as systemd Service

Create `/etc/systemd/system/linux-monitor-agent.service`:

```ini
[Unit]
Description=Linux Monitor Agent
After=network.target

[Service]
Type=simple
User=root
Environment="LINUX_MONITOR_API_URL=https://your-dashboard.com"
Environment="LINUX_MONITOR_AGENT_KEY=your-agent-key"
ExecStart=/usr/bin/python3 /opt/linux-monitor-agent/linux_monitor_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable linux-monitor-agent
sudo systemctl start linux-monitor-agent
```
