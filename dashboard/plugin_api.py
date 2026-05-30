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








# Add Monitor
@router.post("/add_monitor")
async def _handle_add_monitor ( request: Request ):
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