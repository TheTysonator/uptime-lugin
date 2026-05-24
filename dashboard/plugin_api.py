"""Website Monitor Dashboard Backend API routes.
Mounted at /api/plugins/website-monitor/ by the plugin system.
"""

import json
from pathlib import Path
from fastapi import APIRouter, Query, Request
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

    monitors = _load_monitors()

    for monitor_id, monitor_data in monitors.items():
        if not isinstance(monitor_data, dict):
            continue

        _normalise_ping_history(monitor_data)

    return {
        "success": True,
        "monitors": monitors
    }


@router.post("/add")
async def addshit(request: Request) -> Dict[str, Any]:
    body = await request.json()

    monitor_type = body.get("type", "website")
    name = body.get("name", "").strip()
    app = body.get("app", "").strip()
    configuration = body.get("configuration", "").strip()

    if not name:
        return {"success": False, "error": "Monitor name is required"}

    if not app:
        return {"success": False, "error": "Application name is required"}

    if monitor_type not in ("website", "proxy"):
        return {"success": False, "error": "Monitor type must be website or proxy"}

    monitors = _load_monitors()

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

    _save_monitors(monitors)

    return {
        "success": True,
        "message": f"Added {name}."
    }


@router.post("/remove")
async def remove(request: Request):
    """Remove a URL or monitor ID from monitoring."""

    body = await request.json()

    monitor_id = body.get("url", "").strip()

    if not monitor_id:
        return {
            "success": False,
            "error": "Monitor ID is required."
        }

    monitors = _load_monitors()

    if monitor_id not in monitors:
        return {
            "success": False,
            "error": "Not monitored."
        }

    del monitors[monitor_id]

    _save_monitors(monitors)

    return {
        "success": True,
        "message": f"Removed {monitor_id}."
    }