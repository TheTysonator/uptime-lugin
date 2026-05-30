# Standard Imports
import importlib.util
import pathlib

# External Imports
from fastapi import APIRouter, Request

# Import Utils
spec = importlib.util.spec_from_file_location("utils", pathlib.Path(__file__).resolve().parent.parent / "utils.py")
utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(utils)

# Imported Functions
_write_monitors = utils._write_monitors
_read_monitors = utils._read_monitors
_add_monitor = utils._add_monitor
_remove_monitor = utils._remove_monitor



# Router
router = APIRouter()



# Add Monitor
@router.post("/add_monitor")
async def _handle_add_monitor ( request: Request ):
    # Get Request JSON
    request_json = await request.json()
    # Input Data
    monitor_application = request_json.get("application", "")
    monitor_name = request_json.get("name", "")
    monitor_type = request_json.get("type", "")
    monitor_configuration = request_json.get("configuration", "")
    # Read Monitors
    monitors = _read_monitors()
    # Add Monitor
    monitors, error_message = _add_monitor(monitors, monitor_application, monitor_name, monitor_type, monitor_configuration)
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

# List Monitors
@router.get("/list_monitors")
async def _handle_list_monitors ():
    # Read Monitors
    monitors = _read_monitors()
    # Response
    return {
        "success": True,
        "message": "",
        "monitors": monitors
    }

# Remove Monitor
@router.post("/remove_monitor")
async def _handle_remove_monitor ( request: Request ):
    # Get Request JSON
    request_json = await request.json()
    # Input Data
    monitor_application = request_json.get("application", "")
    monitor_name = request_json.get("name", "")
    # Read Monitors
    monitors = _read_monitors()
    # Remove Monitor
    monitors, error_message = _remove_monitor(monitors, monitor_application, monitor_name)
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