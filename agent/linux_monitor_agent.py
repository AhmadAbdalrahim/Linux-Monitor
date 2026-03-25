#!/usr/bin/env python3
"""
Linux OS Monitor Agent — Comprehensive Edition
Collects and sends: OS Health, Services, User Activity, Audit, Security.

Requirements:
  pip install psutil requests

For full feature coverage (user activity, audit, security), run as root:
  sudo python3 linux_monitor_agent.py

Env vars:
  LINUX_MONITOR_API_URL      — default: http://localhost:3000
  LINUX_MONITOR_AGENT_KEY    — required (get from dashboard)
  LINUX_MONITOR_INTERVAL     — seconds between pushes, default: 60
  LINUX_MONITOR_SERVER_NAME  — optional display name override
"""

import hashlib
import json
import os
import platform
import re
import subprocess
import sys
import time

try:
    import psutil
    import requests
except ImportError:
    print("Install dependencies: pip install psutil requests")
    sys.exit(1)

IS_ROOT = os.geteuid() == 0 if hasattr(os, "geteuid") else False


# ─────────────────────────────────────────────
# A. OS & SYSTEM HEALTH
# ─────────────────────────────────────────────

def get_system_info():
    info = {
        "hostname": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "kernel": platform.release(),
        "cpuModel": None,
        "cpuCores": psutil.cpu_count(logical=True) or 0,
        "memoryTotal": psutil.virtual_memory().total,
    }
    try:
        with open("/proc/cpuinfo") as f:
            for line in f:
                if "model name" in line:
                    info["cpuModel"] = line.split(":")[-1].strip()
                    break
    except (IOError, OSError):
        info["cpuModel"] = platform.processor() or "Unknown"
    return info


def get_primary_ip():
    try:
        for addrs in psutil.net_if_addrs().values():
            for addr in addrs:
                if addr.family == 2 and not addr.address.startswith("127."):
                    return addr.address
    except Exception:
        pass
    return None


def collect_disk_mounts():
    mounts = []
    for part in psutil.disk_partitions():
        if not part.fstype or "loop" in part.device or "tmpfs" in part.fstype:
            continue
        try:
            usage = psutil.disk_usage(part.mountpoint)
            inodes_used = inodes_total = 0
            try:
                st = os.statvfs(part.mountpoint)
                inodes_total = st.f_files
                inodes_used = st.f_files - st.f_ffree
            except Exception:
                pass
            mounts.append({
                "mount": part.mountpoint,
                "device": part.device,
                "fstype": part.fstype,
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent,
                "inodesUsed": inodes_used,
                "inodesTotal": inodes_total,
            })
        except (PermissionError, OSError):
            pass
    return mounts


def collect_network_interfaces():
    ifaces = []
    counters = psutil.net_io_counters(pernic=True)
    stats = psutil.net_if_stats()
    for name, c in counters.items():
        s = stats.get(name)
        ifaces.append({
            "name": name,
            "isUp": s.isup if s else False,
            "speed": s.speed if s else 0,
            "bytesSent": c.bytes_sent,
            "bytesRecv": c.bytes_recv,
            "packetsSent": c.packets_sent,
            "packetsRecv": c.packets_recv,
            "errin": c.errin,
            "errout": c.errout,
            "dropin": c.dropin,
            "dropout": c.dropout,
        })
    return ifaces


def collect_metrics():
    vm = psutil.virtual_memory()
    swap = psutil.swap_memory()
    load = os.getloadavg() if hasattr(os, "getloadavg") else (0, 0, 0)

    # CPU with iowait / steal from /proc/stat
    cpu_iowait = cpu_steal = 0.0
    try:
        with open("/proc/stat") as f:
            line = f.readline()
        fields = line.split()
        # user nice system idle iowait irq softirq steal guest guest_nice
        total_raw = sum(float(x) for x in fields[1:])
        if total_raw > 0:
            cpu_iowait = float(fields[5]) / total_raw * 100 if len(fields) > 5 else 0
            cpu_steal = float(fields[8]) / total_raw * 100 if len(fields) > 8 else 0
    except Exception:
        pass

    per_core = psutil.cpu_percent(interval=1, percpu=True)
    cpu_overall = sum(per_core) / len(per_core) if per_core else 0

    # Disk totals
    disk_total = disk_used = 0
    for part in psutil.disk_partitions():
        if part.fstype and "loop" not in part.device and "tmpfs" not in part.fstype:
            try:
                u = psutil.disk_usage(part.mountpoint)
                disk_total += u.total
                disk_used += u.used
            except (PermissionError, OSError):
                pass
    disk_percent = (disk_used / disk_total * 100) if disk_total else 0

    net = psutil.net_io_counters()
    zombie_count = sum(1 for p in psutil.process_iter(["status"]) if p.info.get("status") == "zombie")

    return {
        "cpuPercent": round(cpu_overall, 2),
        "cpuPerCore": per_core,
        "cpuIowait": round(cpu_iowait, 2),
        "cpuSteal": round(cpu_steal, 2),
        "loadAvg1": load[0],
        "loadAvg5": load[1],
        "loadAvg15": load[2],
        "memoryTotal": vm.total,
        "memoryUsed": vm.used,
        "memoryPercent": vm.percent,
        "memBuffers": getattr(vm, "buffers", 0),
        "memCached": getattr(vm, "cached", 0),
        "swapTotal": swap.total,
        "swapUsed": swap.used,
        "swapPercent": swap.percent if swap.total else 0,
        "diskTotal": disk_total,
        "diskUsed": disk_used,
        "diskPercent": round(disk_percent, 2),
        "diskMounts": collect_disk_mounts(),
        "networkBytesSent": net.bytes_sent if net else 0,
        "networkBytesRecv": net.bytes_recv if net else 0,
        "networkInterfaces": collect_network_interfaces(),
        "processCount": len(psutil.pids()),
        "zombieCount": zombie_count,
        "uptimeSeconds": time.time() - psutil.boot_time(),
    }


# ─────────────────────────────────────────────
# B. SERVICES & PROCESSES
# ─────────────────────────────────────────────

def collect_systemd_services():
    services = []
    try:
        out = subprocess.check_output(
            ["systemctl", "list-units", "--type=service", "--all", "--no-pager", "--no-legend"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        for line in out.strip().splitlines():
            parts = line.split(None, 4)
            if len(parts) >= 4:
                name = parts[0].replace("●", "").strip()
                services.append({
                    "name": name,
                    "loadState": parts[1],
                    "activeState": parts[2],
                    "subState": parts[3],
                    "description": parts[4] if len(parts) > 4 else "",
                })
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        pass
    return services


def collect_open_ports():
    ports = []
    try:
        for conn in psutil.net_connections(kind="inet"):
            if conn.status == "LISTEN" or conn.type == 2:  # TCP LISTEN or UDP
                proc_name = ""
                try:
                    if conn.pid:
                        proc_name = psutil.Process(conn.pid).name()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
                laddr = conn.laddr
                ports.append({
                    "port": laddr.port if laddr else 0,
                    "ip": laddr.ip if laddr else "",
                    "proto": "tcp" if conn.type == 1 else "udp",
                    "state": conn.status,
                    "pid": conn.pid,
                    "process": proc_name,
                })
    except (psutil.AccessDenied, Exception):
        pass
    # Deduplicate by port+proto
    seen = set()
    unique = []
    for p in sorted(ports, key=lambda x: x["port"]):
        key = (p["port"], p["proto"])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    return unique


def collect_cron_jobs():
    crons = []
    # System-wide crontabs
    cron_dirs = ["/etc/cron.d", "/var/spool/cron/crontabs", "/var/spool/cron"]
    for d in cron_dirs:
        if not os.path.isdir(d):
            continue
        try:
            for fname in os.listdir(d):
                fpath = os.path.join(d, fname)
                if not os.path.isfile(fpath):
                    continue
                try:
                    with open(fpath, errors="replace") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and len(line.split()) >= 6:
                                crons.append({"source": fname, "entry": line[:200]})
                except (PermissionError, OSError):
                    pass
        except (PermissionError, OSError):
            pass
    return crons


# ─────────────────────────────────────────────
# C. USER ACTIVITY
# ─────────────────────────────────────────────

def collect_active_sessions():
    sessions = []
    try:
        out = subprocess.check_output(["who", "-u"], stderr=subprocess.DEVNULL, timeout=5).decode(errors="replace")
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5:
                sessions.append({
                    "user": parts[0],
                    "tty": parts[1],
                    "date": parts[2],
                    "time": parts[3],
                    "idle": parts[4] if len(parts) > 4 else ".",
                    "from": parts[5] if len(parts) > 5 else "local",
                })
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        pass
    return sessions


def collect_login_history():
    history = []
    try:
        out = subprocess.check_output(
            ["last", "-n", "50", "-F", "-w"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        for line in out.strip().splitlines():
            if not line or line.startswith("wtmp") or line.startswith("btmp"):
                continue
            parts = line.split()
            if len(parts) >= 4:
                history.append({
                    "user": parts[0],
                    "tty": parts[1],
                    "from": parts[2] if len(parts) > 5 else "local",
                    "date": " ".join(parts[3:7]) if len(parts) > 6 else "",
                    "status": "still logged in" if "still logged in" in line else "logged out",
                })
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        pass
    return history[:50]


def _parse_auth_log(pattern, label, max_lines=100):
    events = []
    log_files = ["/var/log/auth.log", "/var/log/secure"]
    for lf in log_files:
        if not os.path.isfile(lf):
            continue
        try:
            with open(lf, errors="replace") as f:
                lines = f.readlines()
            for line in reversed(lines[-2000:]):
                if re.search(pattern, line, re.IGNORECASE):
                    events.append({"raw": line.strip()[:300]})
                    if len(events) >= max_lines:
                        break
        except (PermissionError, OSError):
            pass
        break
    # Fallback to journalctl if file results are empty or incomplete
    if len(events) < 5:
        try:
            # For sudo, we search the full journal. For ssh, we can target the unit.
            cmd = ["journalctl", "-n", "200", "--no-pager", "--output=short"]
            if label == "ssh":
                cmd.extend(["-u", "ssh", "-u", "sshd"])
            
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=8).decode(errors="replace")
            for line in reversed(out.splitlines()):
                if re.search(pattern, line, re.IGNORECASE):
                    events.append({"raw": line.strip()[:300]})
                    if len(events) >= max_lines:
                        break
        except Exception:
            pass
    return events


def collect_sudo_events():
    # Broader pattern to catch variations like "ahmad : TTY=... ; COMMAND=..."
    return _parse_auth_log(r"(sudo.*COMMAND=| : TTY=.*COMMAND=)", "sudo", 50)


def collect_ssh_events():
    return _parse_auth_log(r"(sshd.*(accepted|failed|invalid|disconnect)|session opened for user.*by \(uid=0\))", "ssh", 50)


# ─────────────────────────────────────────────
# D. COMMAND AUDITING
# ─────────────────────────────────────────────

def collect_audit_events():
    events = []
    try:
        out = subprocess.check_output(
            ["ausearch", "-m", "execve", "-ts", "recent", "--interpret"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        current = {}
        for line in out.splitlines():
            if line.startswith("----"):
                if current:
                    events.append(current)
                current = {}
            elif "type=EXECVE" in line:
                m = re.search(r'a0="?([^" ]+)"?', line)
                if m:
                    current["command"] = m.group(1)[:200]
            elif "type=SYSCALL" in line:
                m_pid = re.search(r'\bpid=(\d+)', line)
                m_uid = re.search(r'\bauid=(\S+)', line)
                m_ts = re.search(r'msg=audit\(([^)]+)\)', line)
                if m_pid:
                    current["pid"] = m_pid.group(1)
                if m_uid:
                    current["user"] = m_uid.group(1)
                if m_ts:
                    current["time"] = m_ts.group(1)
        if current:
            events.append(current)
    except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
        pass
    return events[-100:]


def collect_kernel_msgs():
    msgs = []
    try:
        out = subprocess.check_output(
            ["dmesg", "--level=emerg,alert,crit,err,warn", "-T", "--color=never"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        for line in reversed(out.strip().splitlines()[-200:]):
            m = re.match(r'\[(.+?)\]\s*(.*)', line)
            if m:
                msgs.append({"time": m.group(1).strip(), "message": m.group(2).strip()[:300]})
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        pass
    return msgs[:100]


def collect_syslog():
    lines = []
    try:
        out = subprocess.check_output(
            ["journalctl", "-p", "err", "-n", "100", "--no-pager", "--output=short"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        for line in out.strip().splitlines():
            if line.strip() and not line.startswith("--") and not line.startswith("Hint:"):
                lines.append({"raw": line.strip()[:300]})
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        # Fallback to syslog file
        for lf in ["/var/log/syslog", "/var/log/messages"]:
            if os.path.isfile(lf):
                try:
                    with open(lf, errors="replace") as f:
                        all_lines = f.readlines()
                    for line in reversed(all_lines[-500:]):
                        if re.search(r'\b(error|crit|emerg|alert)\b', line, re.IGNORECASE):
                            lines.append({"raw": line.strip()[:300]})
                            if len(lines) >= 100:
                                break
                except (PermissionError, OSError):
                    pass
                break
    return lines[:100]


# ─────────────────────────────────────────────
# E. SECURITY & INTEGRITY
# ─────────────────────────────────────────────

FIM_FILES = [
    "/etc/passwd", "/etc/shadow", "/etc/sudoers", "/etc/hosts",
    "/etc/ssh/sshd_config", "/etc/crontab",
]
_fim_state = {}


def collect_fim_events():
    events = []
    global _fim_state
    for path in FIM_FILES:
        try:
            stat = os.stat(path)
            with open(path, "rb") as f:
                digest = hashlib.md5(f.read()).hexdigest()
            key = path
            old = _fim_state.get(key)
            if old is None:
                _fim_state[key] = {"digest": digest, "mtime": stat.st_mtime, "size": stat.st_size}
            elif old["digest"] != digest or old["mtime"] != stat.st_mtime:
                events.append({
                    "file": path,
                    "changeType": "modified",
                    "time": time.strftime("%Y-%m-%dT%H:%M:%S"),
                    "oldSize": old["size"],
                    "newSize": stat.st_size,
                })
                _fim_state[key] = {"digest": digest, "mtime": stat.st_mtime, "size": stat.st_size}
        except (PermissionError, OSError):
            pass
    return events


def collect_firewall():
    rules = []
    # Try iptables
    for cmd in [["iptables", "-L", "-n", "--line-numbers"], ["ip6tables", "-L", "-n", "--line-numbers"]]:
        try:
            out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL, timeout=8).decode(errors="replace")
            rules.append({"tool": cmd[0], "output": out[:3000]})
        except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
            pass
    # Try nft
    if not rules:
        try:
            out = subprocess.check_output(["nft", "list", "ruleset"], stderr=subprocess.DEVNULL, timeout=8).decode(errors="replace")
            rules.append({"tool": "nft", "output": out[:3000]})
        except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
            pass
    return rules


def collect_selinux_events():
    events = []
    try:
        out = subprocess.check_output(
            ["ausearch", "-m", "AVC", "-ts", "recent", "--interpret"],
            stderr=subprocess.DEVNULL, timeout=10
        ).decode(errors="replace")
        for line in out.splitlines():
            if "AVC" in line and "denied" in line:
                events.append({"raw": line.strip()[:300]})
    except (FileNotFoundError, subprocess.TimeoutExpired, subprocess.CalledProcessError):
        pass
    return events[:50]


def collect_apparmor_events():
    events = []
    try:
        for lf in ["/var/log/syslog", "/var/log/kern.log"]:
            if not os.path.isfile(lf):
                continue
            with open(lf, errors="replace") as f:
                lines = f.readlines()
            for line in reversed(lines[-3000:]):
                if "apparmor" in line.lower() and "denied" in line.lower():
                    events.append({"raw": line.strip()[:300]})
                    if len(events) >= 50:
                        break
            if events:
                break
    except (PermissionError, OSError):
        pass
    # Journalctl fallback
    if not events:
        try:
            out = subprocess.check_output(
                ["journalctl", "-k", "-n", "500", "--no-pager"],
                stderr=subprocess.DEVNULL, timeout=8
            ).decode(errors="replace")
            for line in out.splitlines():
                if "apparmor" in line.lower() and "denied" in line.lower():
                    events.append({"raw": line.strip()[:300]})
        except Exception:
            pass
    return events[:50]


# ─────────────────────────────────────────────
# PROCESS COLLECTION
# ─────────────────────────────────────────────

def collect_processes():
    procs = list(psutil.process_iter(["pid", "ppid", "name", "status", "username", "create_time", "cmdline", "exe"]))
    for p in procs:
        try:
            p.cpu_percent(interval=None)
        except Exception:
            pass
    time.sleep(0.5)
    processes = []
    for proc in procs:
        try:
            pinfo = proc.info
            cpu = proc.cpu_percent(interval=None)
            mem = proc.memory_percent()
            mem_rss = proc.memory_info().rss
            cmdline = pinfo.get("cmdline") or []
            cmd = " ".join(str(c) for c in cmdline)[:500] if cmdline else pinfo.get("name") or ""
            processes.append({
                "pid": pinfo.get("pid"),
                "ppid": pinfo.get("ppid"),
                "name": pinfo.get("name") or "?",
                "status": pinfo.get("status") or "?",
                "username": pinfo.get("username") or "?",
                "cpuPercent": round(cpu, 2),
                "memoryPercent": round(mem, 2),
                "memoryRss": mem_rss,
                "createTime": pinfo.get("create_time"),
                "cmdline": cmd,
                "exe": pinfo.get("exe") or "",
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return processes


# ─────────────────────────────────────────────
# SEND FUNCTIONS
# ─────────────────────────────────────────────

def _post(api_url, path, payload, label):
    try:
        r = requests.post(f"{api_url}{path}", json=payload, timeout=30)
        r.raise_for_status()
        return True
    except requests.RequestException as e:
        print(f"[{label}] Send failed: {e}")
        return False


def register_server(api_url, agent_key, name=None):
    info = get_system_info()
    payload = {
        "agentKey": agent_key,
        "name": name or info["hostname"],
        "hostname": info["hostname"],
        "ip": get_primary_ip(),
        "os": info["os"],
        "kernel": info["kernel"],
        "cpuModel": info["cpuModel"],
        "cpuCores": info["cpuCores"],
        "memoryTotal": info["memoryTotal"],
    }
    try:
        r = requests.post(f"{api_url}/api/agent/register", json=payload, timeout=10)
        r.raise_for_status()
        return r.json().get("agentKey", agent_key)
    except requests.RequestException as e:
        print(f"Registration failed: {e}")
        return None


def send_all(api_url, agent_key):
    ts = time.strftime("%H:%M:%S")

    # --- Metrics ---
    metrics = collect_metrics()
    metrics_payload = {"agentKey": agent_key, **metrics}
    # Convert lists to JSON strings for the API
    metrics_payload["diskMounts"] = json.dumps(metrics_payload.get("diskMounts", []))
    metrics_payload["networkInterfaces"] = json.dumps(metrics_payload.get("networkInterfaces", []))
    ok = _post(api_url, "/api/agent/metrics", metrics_payload, "metrics")
    print(f"[{ts}] Metrics {'OK' if ok else 'FAILED'}")

    # --- Processes ---
    processes = collect_processes()
    ok = _post(api_url, "/api/agent/processes", {"agentKey": agent_key, "processes": processes}, "processes")
    print(f"[{ts}] Processes {'OK' if ok else 'FAILED'}")

    # --- Services ---
    services_payload = {
        "agentKey": agent_key,
        "services": collect_systemd_services(),
        "ports": collect_open_ports(),
        "cronJobs": collect_cron_jobs(),
    }
    ok = _post(api_url, "/api/agent/services", services_payload, "services")
    print(f"[{ts}] Services {'OK' if ok else 'FAILED'}")

    # --- User Activity ---
    activity_payload = {
        "agentKey": agent_key,
        "isRoot": IS_ROOT,
        "activeSessions": collect_active_sessions(),
        "loginHistory": collect_login_history(),
        "sudoEvents": collect_sudo_events() if IS_ROOT else [],
        "sshEvents": collect_ssh_events() if IS_ROOT else [],
    }
    ok = _post(api_url, "/api/agent/user-activity", activity_payload, "user-activity")
    print(f"[{ts}] User Activity {'OK' if ok else 'FAILED'}")

    # --- Audit (root only) ---
    audit_payload = {
        "agentKey": agent_key,
        "auditEvents": collect_audit_events() if IS_ROOT else [],
        "kernelMsgs": collect_kernel_msgs(),
        "syslogLines": collect_syslog(),
    }
    ok = _post(api_url, "/api/agent/audit", audit_payload, "audit")
    print(f"[{ts}] Audit {'OK' if ok else 'FAILED'}")

    # --- Security ---
    security_payload = {
        "agentKey": agent_key,
        "fimEvents": collect_fim_events() if IS_ROOT else [],
        "firewallRules": collect_firewall() if IS_ROOT else [],
        "selinuxEvents": collect_selinux_events() if IS_ROOT else [],
        "appArmorEvents": collect_apparmor_events() if IS_ROOT else [],
    }
    ok = _post(api_url, "/api/agent/security", security_payload, "security")
    print(f"[{ts}] Security {'OK' if ok else 'FAILED'}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    api_url = os.environ.get("LINUX_MONITOR_API_URL", "http://localhost:3000")
    agent_key = os.environ.get("LINUX_MONITOR_AGENT_KEY")
    interval = int(os.environ.get("LINUX_MONITOR_INTERVAL", "60"))
    name = os.environ.get("LINUX_MONITOR_SERVER_NAME")

    if not agent_key:
        print("No LINUX_MONITOR_AGENT_KEY set. Registering new server...")
        result = register_server(api_url, str(time.time_ns()), name)
        if result:
            agent_key = result
            print(f"Registered! Set this env var:\n  LINUX_MONITOR_AGENT_KEY={agent_key}")
        else:
            print("Could not register. Set LINUX_MONITOR_AGENT_KEY from the dashboard.")
            sys.exit(1)

    register_server(api_url, agent_key, name)

    if not IS_ROOT:
        print("⚠️  WARNING: Not running as root. User Activity, Audit (auditd), and Security")
        print("   collectors require root privileges to function. Basic metrics will still work.")
    print(f"\n✓ Linux Monitor Agent started. Sending all metrics every {interval}s → {api_url}\n")

    while True:
        send_all(api_url, agent_key)
        time.sleep(interval)


if __name__ == "__main__":
    main()
