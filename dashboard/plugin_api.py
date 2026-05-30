





# Standard Imports
import importlib.util
import pathlib

# External Imports
from fastapi import APIRouter, Request





from ..utils import _write_monitors, _read_monitors, _add_monitor, _remove_monitor


# Router
router = APIRouter()


# Add Monitor
@router.post("/add")
async def add_monitor ( request: Request ):
    # Get Request JSON
    request_json = await request.json()
    request_application = request_json.get("application", "")
    request_name = request_json.get("name", "")
    request_type = request_json.get("type", "")
    request_configuration = request_json.get("configuration", "")
    # Read Monitors
    monitors = _read_monitors()
    # Add Monitor
    monitors, error_message = _add_monitor(monitors, request_application, request_name, request_type, request_configuration)
    # Handle Error
    if error_message != "":
        return {
            "success": False,
            "message": error_message
        }
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return {
        "success": True,
        "message": ""
    }

# Get Monitors
@router.get("/get")
async def status ():
    # Read Monitors
    monitors = _read_monitors()
    # Response
    return {
        "success": True,
        "monitors": monitors
    }

# Remove Monitor
@router.post("/remove")
async def remove ( request: Request ):
    # Get Request JSON
    request_json = await request.json()
    request_application = request_json.get("application", "")
    request_name = request_json.get("name", "")
    # Read Monitors
    monitors = _read_monitors()
    # Remove Monitor
    monitors, error_message = _remove_monitor(monitors, request_application, request_name)
    # Handle Error
    if error_message != "":
        return {
            "success": False,
            "message": error_message
        }
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return {
        "success": True,
        "message": ""
    }