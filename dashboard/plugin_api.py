# Standard Imports
import json

# External Imports
from fastapi import APIRouter


from .utils import _read_monitors, _write_monitors, _add_monitor

# Router
router = APIRouter()











@router.post("/add")
async def addshit(request):
    body = await request.json()

    monitor_type = body.get("type", "website")
    name = body.get("name", "").strip()
    app = body.get("application", "").strip()
    configuration = body.get("configuration", "").strip()


    monitors = _read_monitors()

    _add_monitor(monitors, app, name, monitor_type, configuration)

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