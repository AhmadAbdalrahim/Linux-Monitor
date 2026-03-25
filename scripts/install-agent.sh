#!/bin/bash

# Linux Monitor Agent - One-line Installer
# Usage: curl -sS http://your-saas.com/api/agent/install | sudo bash -s "YOUR_AGENT_KEY"

set -e

AGENT_KEY=$1
API_URL=${2:-"http://localhost:3000"}  # Change this to your production URL
INSTALL_DIR="/opt/linux-monitor-agent"

if [ -z "$AGENT_KEY" ]; then
    echo "Error: Agent Key is required."
    echo "Usage: sudo ./install-agent.sh <AGENT_KEY> [API_URL]"
    exit 1
fi

echo "--- Installing Linux Monitor Agent ---"

# 1. Install dependencies
echo "Installing Python dependencies..."
apt-get update -y
apt-get install -y python3 python3-venv python3-pip psutil requests || true

# 2. Create directory
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR

# 3. Create virtual environment
echo "Setting up virtual environment..."
python3 -m venv venv
./venv/bin/pip install psutil requests

# 4. Download agent script (Placeholder - in production this would be a curl)
# For now we assume the script is already available or created by this installer
cat << 'EOF' > linux_monitor_agent.py
import os
import time
import psutil
import requests
import socket
import platform
import json
import logging
from datetime import datetime

# Configuration
API_URL = os.getenv("LINUX_MONITOR_API_URL", "http://localhost:3000")
AGENT_KEY = os.getenv("LINUX_MONITOR_AGENT_KEY")
INTERVAL = int(os.getenv("LINUX_MONITOR_INTERVAL", 60))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def collect_metrics():
    cpu = psutil.cpu_times_percent(interval=1)
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "agentKey": AGENT_KEY,
        "cpuPercent": psutil.cpu_percent(),
        "loadAvg1": os.getloadavg()[0],
        "memoryTotal": mem.total,
        "memoryUsed": mem.used,
        "memoryPercent": mem.percent,
        "diskTotal": disk.total,
        "diskUsed": disk.used,
        "diskPercent": disk.percent,
        "os": f"{platform.system()} {platform.release()}",
        "hostname": socket.gethostname(),
        "isRoot": os.getuid() == 0
    }

def main():
    if not AGENT_KEY:
        logging.error("AGENT_KEY not set")
        return

    logging.info(f"Agent started. Monitoring every {INTERVAL}s")
    while True:
        try:
            payload = collect_metrics()
            requests.post(f"{API_URL}/api/agent/metrics", json=payload, timeout=10)
            logging.info("Metrics sent successfully")
        except Exception as e:
            logging.error(f"Failed to send metrics: {e}")
        time.sleep(INTERVAL)

if __name__ == "__main__":
    main()
EOF

# 5. Create environment file
echo "LINUX_MONITOR_API_URL=\"$API_URL\"" > .env
echo "LINUX_MONITOR_AGENT_KEY=\"$AGENT_KEY\"" >> .env
echo "LINUX_MONITOR_INTERVAL=60" >> .env

# 6. Create systemd service
echo "Creating systemd service..."
cat << EOF > /etc/systemd/system/linux-monitor-agent.service
[Unit]
Description=Linux Monitor SaaS Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$INSTALL_DIR/venv/bin/python3 $INSTALL_DIR/linux_monitor_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 7. Start service
systemctl daemon-reload
systemctl enable linux-monitor-agent
systemctl start linux-monitor-agent

echo "--- Installation Complete ---"
echo "Agent is now running as a systemd service."
echo "Check status with: sudo systemctl status linux-monitor-agent"
