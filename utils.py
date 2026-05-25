


# Standard Imports
import json


# Hermes Imports
from hermes_cli.config import get_hermes_home




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



def _add_monitor ( monitors, application, name, type, configuration ):
    # Check if Monitor Already Exists
    if f"{ application }:{ name }" in monitors:
        return json.dumps({
            "success": False,
            "message": f"{ name } is already being monitored under { application }."
        })
    # Add Monitor
    monitors[f"{ application }:{ name }"] = {
        "type": type,
        "configuration": configuration,
        "last_status": "Unknown",
        "ping_history": [-1] * 30
    }
    return monitors