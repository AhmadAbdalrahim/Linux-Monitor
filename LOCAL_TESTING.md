# Local Testing Guide

Follow these steps to verify the entire system in your local environment.

## Step 1: Start the Web Application
Open a terminal in the project root and run:
```bash
npm run dev
```
The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Step 2: Access the Dashboard
1. Open your browser to [http://localhost:3000](http://localhost:3000).
2. Login or Sign up (if using the local SQLite DB, any test email will work).
3. Click on the **"Add Server"** button.
4. Give your server a name (e.g., "My Laptop").
5. **Copy the Agent Key** (looks like a UUID).

## Step 3: Run the Agent
Open a **new terminal** and run the following:

1. Create a test configuration:
   ```bash
   export LINUX_MONITOR_AGENT_KEY="YOUR_COPIED_KEY"
   export LINUX_MONITOR_API_URL="http://localhost:3000"
   export LINUX_MONITOR_INTERVAL=10
   ```
2. Run the agent script:
   ```bash
   python linux_monitor_agent.py
   ```
   *Note: If you want to see User Activity/Security/Audit data, run it as root:*
   ```bash
   sudo -E python3 linux_monitor_agent.py
   ```

## Step 4: Verify the Results
1. Go back to your browser.
2. The "Test Server" card should change from **Offline** to **Online** within a few seconds.
3. Click on the server name to view:
   - **Overview**: Real-time CPU, RAM, and Disk graphs.
   - **Services**: Active systemd services and listening ports.
   - **User Activity**: (If run as root) Current SSH sessions and sudo history.
   - **Security**: (If run as root) File integrity and firewall rules.

## Step 5: Test UI Features
- **View Toggle**: Try the **Grid/List** buttons in the header to see layout switching.
- **Drag-and-Drop**: If you have multiple servers, try reordering them on the dashboard.
- **Rate Limiting**: If you set `LINUX_MONITOR_INTERVAL` to `1` and run multiple agents, you should start seeing `429 Too Many Requests` in the agent output, verifying the SaaS protection.
