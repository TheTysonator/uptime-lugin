"""Website Monitor Dashboard Backend API routes.
Mounted at /api/plugins/website-monitor/ by the plugin system.
"""

import json
from pathlib import Path
from fastapi import APIRouter, Query, Request
# 🟢 CORRECT CANONICAL IMPORT FOR DASHBOARD ROUTING
from hermes_cli.config import get_hermes_home
from typing import Dict, Any

router = APIRouter()

def _get_config_path() -> Path:
    return get_hermes_home() / "website_monitors.json"

def _load_monitors() -> dict:
    path = _get_config_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

def _save_monitors(monitors: dict) -> None:
    path = _get_config_path()
    try:
        path.write_text(json.dumps(monitors, indent=2), encoding="utf-8")
    except Exception:
        pass


@router.get("/status")
async def status():
    """Returns monitors with normalized 30-point ping history."""

    monitors = _load_monitors()

    for monitor_id, monitor_data in monitors.items():

        # Ensure ping_history exists
        ping_history = monitor_data.get("ping_history", [])

        # Ensure it's a list
        if not isinstance(ping_history, list):
            ping_history = []

        # Keep only last 30 values
        ping_history = ping_history[-30:]

        # Pad missing values with -1
        while len(ping_history) < 30:
            ping_history.insert(0, -1)

        # Save normalized history back
        monitor_data["ping_history"] = ping_history

    return {
        "success": True,
        "monitors": monitors
    }





@router.post("/add")
async def addshit(request: Request) -> Dict[str, Any]:
    body = await request.json()
    url = body.get("url", "").strip()

    if not url.startswith(("http://", "https://")):
        return {"success": False, "error": "URL must begin with http:// or https://"}
    monitors = _load_monitors()
    if url in monitors:
        return {"success": True, "message": "Already monitored."}
    monitors[url] = {"last_status": "UNKNOWN"}
    _save_monitors(monitors)
    return {"success": True, "message": f"Added {url}."}


@router.get("/remove")
async def remove(url: str = Query(...)):
    """Remove a URL from monitoring."""
    url = url.strip()
    monitors = _load_monitors()
    if url not in monitors:
        return {"success": False, "error": "Not monitored."}
    del monitors[url]
    _save_monitors(monitors)
    return {"success": True, "message": f"Removed {url}."}
