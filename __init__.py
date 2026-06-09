# Standard Imports
import fcntl
import json
import pathlib
import subprocess
import tempfile
import threading
import time
import urllib.request





from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
logger = logging.getLogger(__name__)




# Custom Imports 
from .utils import _write_monitors, _read_monitors, _get_lock_path
from .tools import ADD_MONITOR_SCHEMA, REMOVE_MONITOR_SCHEMA, LIST_MONITORS_SCHEMA, _handle_add_monitor, _handle_remove_monitor, _handle_list_monitors



# Check Website
def _check_website ( configuration ):
    # Start Time
    start_time = time.time()
    # Make Request
    with urllib.request.urlopen(urllib.request.Request(configuration, headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" }), timeout = 10) as response:
        # Ping
        ping = int((time.time() - start_time) * 1000)
        # Return Ping
        if 200 <= response.status < 300:
            return ping
        else:
            return -1








def _check_proxy(configuration):
    test_url = configuration.get("test_url", "https://api.ipify.org")
    socks_port = int(configuration.get("socks_port", 12334))

    temp_path = None
    proc = None

    try:
        outbounds = configuration.get("outbounds", [])

        if not outbounds:
            raise ValueError("Proxy config has no outbounds")

        final_tag = outbounds[0].get("tag")

        if not final_tag:
            raise ValueError("First proxy outbound has no tag")

        runtime_config = {
            "log": {"level": "info"},
            "inbounds": [
                {
                    "type": "socks",
                    "tag": "socks-in",
                    "listen": "127.0.0.1",
                    "listen_port": socks_port,
                }
            ],
            "outbounds": outbounds,
            "route": {
                "final": final_tag,
            },
        }

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".json",
            delete=False,
            encoding="utf-8",
        ) as f:
            json.dump(runtime_config, f)
            temp_path = f.name

        proc = subprocess.Popen(
            ["hiddify-core", "run", "-c", temp_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        for _ in range(30):
            result = subprocess.run(
                ["bash", "-lc", f"ss -ltn | grep -q ':{socks_port} '"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )

            if result.returncode == 0:
                break

            time.sleep(1)
        else:
            return -2

        time.sleep(2)

        start_time = time.time()

        result = subprocess.run(
            [
                "curl",
                "--silent",
                "--show-error",
                "--fail",
                "--location",
                "--retry",
                "2",
                "--retry-delay",
                "1",
                "--connect-timeout",
                "10",
                "--max-time",
                "25",
                "--proxy",
                f"socks5h://127.0.0.1:{socks_port}",
                test_url,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )

        latency_ms = int((time.time() - start_time) * 1000)

        if result.returncode != 0:
            return -2


        return latency_ms

    except Exception:
        return -2

    finally:
        if proc:
            proc.terminate()

            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

        if temp_path:
            try:
                pathlib.Path(temp_path).unlink(missing_ok=True)
            except Exception:
                pass







# Check Monitor
def _check_monitor ( monitor_id, monitor ):
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
        # Read Monitors
        monitors = _read_monitors()
        # No Monitors
        if not monitors:
            time.sleep(60)
            continue
        # Thread Pool Executor
        with ThreadPoolExecutor(max_workers = min(10, len(monitors))) as executor:
            # Futures
            futures = [ executor.submit(_check_monitor, monitor_id, monitor) for monitor_id, monitor in monitors.items() ]
            # Process Results
            for future in as_completed(futures):

                try:
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
                    if len(ping_history) >= 2:
                        if (monitor_ping >= 0 and ping_history[-2] < 0) or (monitor_ping < 0 and ping_history[-2] >= 0):
                            # Send Alert
                            context.dispatch_tool("send_message", {
                                "target": "matrix:!RCoAgzyLWmmeLSIfPF:hmx.sh",
                                "message": (
                                    f"{ '🟢' if monitor_ping >= 0 else '🔴' } "
                                    "**Monitoring Alert** "
                                    f"For *{ monitor.get('name', '') }* in *{ monitor.get('application', '') }*"
                                )
                            })
                    else:
                        # Send Alert
                        context.dispatch_tool("send_message", {
                            "target": "matrix:!RCoAgzyLWmmeLSIfPF:hmx.sh",
                            "message": (
                                f"{ '🟢' if monitor_ping >= 0 else '🔴' } "
                                "**Monitoring Alert** "
                                f"For *{ monitor.get('name', '') }* in *{ monitor.get('application', '') }*"
                            )
                        })
                except Exception as error:
                    logger.error(f"Error processing monitor check result: {error} {future.result()}")
                    continue
        # Write Updated Monitors
        _write_monitors(monitors)
        # Wait
        time.sleep(60)



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