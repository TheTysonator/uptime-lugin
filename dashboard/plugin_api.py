# Standard Imports
import json

# External Imports
from fastapi import APIRouter

# Hermes Imports
from hermes_cli.config import get_hermes_home


# Router
router = APIRouter()


# Get Montiors Path
def _get_monitors_path () :
    return get_hermes_home() / "plugins" / "monitoring" / "monitors.json"

# Read Monitors
def _read_monitors ():
    # Get Path
    path = _get_monitors_path()
    # Read Monitors
    return json.loads(path.read_text(encoding = "utf-8"))

# Write Monitors
def _write_monitors ( monitors ):
    # Get Path
    path = _get_monitors_path()
    # Write Monitors
    path.write_text(json.dumps(monitors, indent = 4), encoding = "utf-8")




import sys
from pathlib import Path

print("CURRENT FILE:", Path(__file__).resolve())
print("CURRENT WORKING DIR:", Path.cwd())
print("PYTHON PATH:")
for path in sys.path:
    print(" -", path)





@router.post("/add")
async def addshit(request):
    body = await request.json()

    monitor_type = body.get("type", "website")
    name = body.get("name", "").strip()
    app = body.get("application", "").strip()
    configuration = body.get("configuration", "").strip()

    if not name:
        return {"success": False, "error": "Monitor name is required"}

    if not app:
        return {"success": False, "error": "Application name is required"}

    if monitor_type not in ("website", "proxy"):
        return {"success": False, "error": "Monitor type must be website or proxy"}

    monitors = _read_monitors()

    if monitor_type == "website":
        url = configuration

        if not url.startswith(("http://", "https://")):
            return {"success": False, "error": "URL must begin with http:// or https://"}

        monitor_id = url

        if monitor_id in monitors:
            return {"success": True, "message": "Already monitored."}

        monitors[monitor_id] = {
            "type": "website",
            "name": name,
            "app": app,
            "url": url,
            "last_status": "UNKNOWN",
            "ping_history": [-1] * 30
        }

    elif monitor_type == "proxy":
        try:
            proxy_config = json.loads(configuration)
        except Exception:
            return {"success": False, "error": "Proxy configuration must be valid JSON"}

        monitor_id = "proxy:" + name

        if monitor_id in monitors:
            return {"success": True, "message": "Already monitored."}

        monitors[monitor_id] = {
            "type": "proxy",
            "name": name,
            "app": app,
            "config": proxy_config,
            "last_status": "UNKNOWN",
            "ping_history": [-1] * 30
        }

    _write_monitors(monitors)

    return {
        "success": True,
        "message": f"Added {name}."
    }



# overview section looks, this file, index, then dashboard done










def _normalise_ping_history(monitor_data: dict) -> None:
    ping_history = monitor_data.get("ping_history", [])

    if not isinstance(ping_history, list):
        ping_history = []

    ping_history = ping_history[-30:]

    while len(ping_history) < 30:
        ping_history.insert(0, -1)

    monitor_data["ping_history"] = ping_history


@router.get("/get")
async def status():
    """Returns monitors with normalized 30-point ping history."""

    monitors = _read_monitors()

    for monitor_id, monitor_data in monitors.items():
        if not isinstance(monitor_data, dict):
            continue

        _normalise_ping_history(monitor_data)

    return {
        "success": True,
        "monitors": monitors
    }





@router.post("/remove")
async def remove(request):
    """Remove a URL or monitor ID from monitoring."""

    body = await request.json()

    monitor_id = body.get("url", "").strip()

    if not monitor_id:
        return {
            "success": False,
            "error": "Monitor ID is required."
        }

    monitors = _read_monitors()

    if monitor_id not in monitors:
        return {
            "success": False,
            "error": "Not monitored."
        }

    del monitors[monitor_id]

    _write_monitors(monitors)

    return {
        "success": True,
        "message": f"Removed {monitor_id}."
    }