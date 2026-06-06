# Standard Imports



import fcntl
import json
import logging
import subprocess
import tempfile
import threading
import time
import urllib.request

from concurrent.futures import ThreadPoolExecutor, as_completed
import pathlib

# Custom Imports 

from .tools import (
    ADD_MONITOR_SCHEMA,
    REMOVE_MONITOR_SCHEMA,
    LIST_MONITORS_SCHEMA,
    _handle_add_monitor,
    _handle_remove_monitor,
    _handle_list_monitors,
)



from .utils import _write_monitors, _read_monitors, _get_lock_path




logger = logging.getLogger(__name__)


def _check_website(url):
    start_time = time.time()

    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Hermes-Website-Monitor/1.0"},
        )

        with urllib.request.urlopen(req, timeout=5) as response:
            latency_ms = int((time.time() - start_time) * 1000)
            return 200 <= response.status < 300, latency_ms

    except Exception:
        return False, -1


def _build_proxy_runtime_config(config, socks_port):
    outbounds = config.get("outbounds", [])

    if not outbounds:
        raise ValueError("Proxy config has no outbounds")

    final_tag = outbounds[0].get("tag")

    if not final_tag:
        raise ValueError("First proxy outbound has no tag")

    return {
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
        "route": {"final": final_tag},
    }


def _check_proxy(name, config):
    test_url = config.get("test_url", "https://api.ipify.org")
    socks_port = int(config.get("socks_port", 12334))

    temp_path = None
    proc = None

    try:
        runtime_config = _build_proxy_runtime_config(config, socks_port)

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
            logger.error(f"Proxy monitor {name}: SOCKS port {socks_port} never opened")
            return False, -1

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
            logger.error(f"Proxy monitor {name}: curl failed: {result.stderr.strip()}")
            return False, -1

        logger.info(
            f"Proxy monitor {name}: test succeeded via port {socks_port}: "
            f"{result.stdout.strip()[:120]}"
        )

        return True, latency_ms

    except Exception:
        logger.exception(f"Proxy monitor failed for {name}")
        return False, -1

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


def _send_alert(context, target_room, message) -> None:
    try:
        result = context.dispatch_tool(
            "send_message",
            {
                "target": target_room,
                "message": message,
            },
        )

        logger.info(f"Website monitor alert dispatched: {result}")

    except Exception:
        logger.exception("Failed to dispatch website monitor alert")



def _check_monitor(monitor_id, monitor):

    monitor_type = monitor.get("type", "")

    if monitor_type == "proxy":
        name = monitor.get("name", monitor_id.replace("proxy:", ""))
        config = monitor.get("config", {})

        is_up, latency_ms = _check_proxy(name, config)

    elif monitor_type == "website":
        configuration = monitor.get("configuration")

        if not isinstance(configuration, str) or not configuration.startswith(("http://", "https://")):
            logger.warning(
                f"Skipping invalid website monitor configuration for {monitor_id}: {configuration}"
            )

            return {
                "id": monitor_id,
                "name": monitor.get("name", monitor_id),
                "application": monitor.get("application", ""),
                "ping": -1
            }

        is_up, latency_ms = _check_website(configuration)

    else:
        logger.warning(
            f"Skipping unknown monitor type for {monitor_id}: {monitor_type}"
        )

        return {
            "id": monitor_id,
            "name": monitor.get("name", monitor_id),
            "application": monitor.get("application", ""),
            "ping": -1
        }

    return {
        "id": monitor_id,
        "name": monitor.get("name", monitor_id),
        "application": monitor.get("application", ""),
        "ping": latency_ms if is_up else -2
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
                # Get Result Data
                monitor_id = future.result().get("id", "")
                monitor_name = future.result().get("name", "")
                monitor_application = future.result().get("application", "")
                monitor_ping = future.result().get("ping", -2)
                # Monitor
                monitor = monitors[monitor_id]
                # Update Monitor
                ping_history = monitor.get("ping_history", [])
                ping_history.append(monitor_ping)
                monitor["ping_history"] = ping_history[-30:]



                # Check Ping History, number of entries and if last entry was not recorded

                if (monitor_ping >= 0 and ping_history[-2] < 0) or (monitor_ping < 0 and ping_history[-2] >= 0):

                    logger.info(
                        f"Monitor status changed for {monitor_name}: "
                        f"{ping_history[-2]} -> {monitor_ping}"
                    )

                    if ping_history[-2] != "UNKNOWN":
                        alert_icon = "🟢" if monitor_ping >= 0 else "🔴"

                        alert_msg = (
                            f"{alert_icon} **{'Alert'}**\n\n"
                            f"**{monitor_name}** went from "
                            f"**{ping_history[-2]}** ➡️ **{monitor_ping}**!"
                        )

                        _send_alert(context, "matrix:!RCoAgzyLWmmeLSIfPF:hmx.sh", alert_msg)



        _write_monitors(monitors)

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