# Standard Imports
import concurrent.futures
import fcntl
import json
import pathlib
import subprocess
import tempfile
import threading
import time
import urllib.request

# Custom Imports 
from .utils import _write_monitors, _read_monitors, _get_lock_path
from .tools import ADD_MONITOR_SCHEMA, REMOVE_MONITOR_SCHEMA, LIST_MONITORS_SCHEMA, _handle_add_monitor, _handle_remove_monitor, _handle_list_monitors

import logging
logger = logging.getLogger(__name__)

# Check Website
def _check_website ( configuration ):
    # Start Time
    start_time = time.time()
    # Catch Errors
    try:
        # Make Request
        with urllib.request.urlopen(urllib.request.Request(configuration, headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" }), timeout = 10) as response:
            # Ping
            ping = int((time.time() - start_time) * 1000)
            # Return Ping
            if 200 <= response.status < 300:
                return ping
            else:
                return -1
    except Exception:
        # Website Down
        return -1

# Check Proxy
def _check_proxy ( configuration ):
    # Try
    try:
        # Variables
        proxy_configuration_file = None
        proxy_process = None
        # Create Temporary Configuration File
        with tempfile.NamedTemporaryFile(mode = "w", suffix = ".json", delete = False, encoding = "utf-8") as f:
            f.write(configuration)
            proxy_configuration_file = f.name
        # Start Proxy Process
        proxy_process = subprocess.Popen(["hiddify-core", "run", "-c", proxy_configuration_file], stdout = subprocess.DEVNULL, stderr = subprocess.DEVNULL)
        # Wait For Proxy To Start
        for _ in range(20):
            if subprocess.run(["bash", "-lc", f"ss -ltn | grep -q ':{ json.loads(configuration).get('inbounds', [{}])[0].get('listen_port', '') } '"], stdout = subprocess.DEVNULL, stderr = subprocess.DEVNULL).returncode == 0:
                break
            time.sleep(0.25)
        else:
            # Proxy Failed To Start
            return -2
        # Start Time
        start_time = time.time()
        # Make Request
        if subprocess.run(["curl", "--silent", "--fail", "--location", "--retry", "1", "--retry-delay", "1", "--connect-timeout", "10", "--proxy", f"socks5h://{ json.loads(configuration).get('inbounds', [{}])[0].get('listen', '') }:{ json.loads(configuration).get('inbounds', [{}])[0].get('listen_port', '') }", "https://1.1.1.1/cdn-cgi/trace"], stdout = subprocess.DEVNULL, stderr = subprocess.DEVNULL).returncode != 0:
            # Return Ping
            return int((time.time() - start_time) * 1000)
    except Exception as e:
        logger.error(f"Error occurred while checking proxy: {e}")
    finally:
        # Cleanup Proxy Process
        if proxy_process:
            proxy_process.terminate()
            try:
                proxy_process.wait(timeout = 5)
            except subprocess.TimeoutExpired:
                proxy_process.kill()
        # Cleanup Proxy Configuration File
        if proxy_configuration_file:
            try:
                pathlib.Path(proxy_configuration_file).unlink(missing_ok = True)
            except Exception:
                pass



# Check Monitor
def _check_monitor ( monitor_id, monitor ):
    # Ping
    ping = -2
    # Checks
    if monitor.get("type", "") == "website":
        # Website Check
        ping = _check_website(monitor.get("configuration", ""))
    elif monitor.get("type", "") == "proxy":
        # Proxy Check
        ping = _check_proxy(monitor.get("configuration", ""))
    # Return Check Data
    return {
        "id": monitor_id,
        "ping": ping
    }

# Background Monitor Loop
def _background_monitor_loop ( context ):
    # Lock File
    lock_file = _get_lock_path().open("w")
    # Check Lock
    try:
        fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        return
    # Monitor Loop
    while True:
        # Wait
        time.sleep(60 - (time.time() % 60))
        # Read Monitors
        monitors = _read_monitors()
        # No Monitors
        if not monitors:
            time.sleep(60 - (time.time() % 60))
            continue
        # Thread Pool Executor
        with concurrent.futures.ThreadPoolExecutor(max_workers = min(10, len(monitors))) as executor:
            # Futures
            futures = [ executor.submit(_check_monitor, monitor_id, monitor) for monitor_id, monitor in monitors.items() ]
            # Process Results
            for future in concurrent.futures.as_completed(futures):
                # Get Result Data
                monitor_id = future.result().get("id", "")
                monitor_ping = future.result().get("ping", -2)
                # Monitor
                monitor = monitors[monitor_id]
                # Update Monitor
                ping_history = monitor.get("ping_history", [])
                ping_history.append(monitor_ping)
                monitor["ping_history"] = ping_history[-30:]
                # Check Ping
                if (monitor_ping >= 0 and monitor["ping_history"] [-2] < 0) or (monitor_ping < 0 and monitor["ping_history"] [-2] >= 0):
                    # Send Alert
                    context.dispatch_tool("send_message", {
                        "target": "matrix:!RCoAgzyLWmmeLSIfPF:hmx.sh",
                        "message": (
                            f"{ '🟢' if monitor_ping >= 0 else '🔴' } "
                            "**Monitoring Alert** "
                            f"For *{ monitor.get('name', '') }* in *{ monitor.get('application', '') }*"
                        )
                    })
        # Write Updated Monitors
        _write_monitors(monitors)



# Register
def register ( context ) :
    # Register Add Monitor Tool
    context.register_tool(
        toolset = "uptime",
        name = "add_monitor",
        schema = ADD_MONITOR_SCHEMA,
        handler = _handle_add_monitor,
        emoji = "🆕"
    )
    # Register List Monitors Tool
    context.register_tool(
        toolset = "uptime",
        name = "list_monitors",
        schema = LIST_MONITORS_SCHEMA,
        handler = _handle_list_monitors,
        emoji = "📋"
    )
    # Register Remove Monitor Tool
    context.register_tool(
        toolset = "uptime",
        name = "remove_monitor",
        schema = REMOVE_MONITOR_SCHEMA,
        handler = _handle_remove_monitor,
        emoji = "🗑️"
    )
    # Start Background Thread
    threading.Thread(
        target = _background_monitor_loop,
        args = (context,),
        daemon = True
    ).start()