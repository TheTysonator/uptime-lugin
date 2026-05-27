


# Standard Imports
import json


# Hermes Imports
from hermes_cli.config import get_hermes_home


# functions with validation, strip, alphanumeric, duplicates

# Get Montiors Path
def _get_monitors_path () :
    return get_hermes_home() / "plugins" / "monitoring" / "monitors.json"

def _get_lock_path() :
    return get_hermes_home() / "plugins" / "monitoring" / "monitor.lock"

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



def _add_monitor ( monitors, application, name, monitor_type, configuration ):
    # Check if Monitor Already Exists
    if f"{ application }:{ name }" in monitors:
        return monitors, f"{ name } is already being monitored under { application }."
    # Add Monitor
    monitors[f"{ application }:{ name }"] = {
        "application": application,
        "name": name,
        "type": monitor_type,
        "configuration": configuration,
        "ping_history": [-1] * 30
    }
    return monitors, ""


def _remove_monitor ( monitors, application, name ):
    # Check if Monitor Exists
    if f"{ application }:{ name }" not in monitors:
        return monitors, "Not monitored."
    # Remove Monitor
    del monitors[f"{ application }:{ name }"]
    return monitors, ""