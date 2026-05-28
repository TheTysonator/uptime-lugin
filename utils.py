# Standard Imports
import hashlib
import json

# Hermes Imports
from hermes_cli.config import get_hermes_home



# Generate ID
def __generate_id ( data ):
    return hashlib.blake2s(data.lower().strip().encode(), digest_size = 32).hexdigest()

# Get Monitors Path
def __get_monitors_path ():
    return get_hermes_home() / "plugins" / "monitoring" / "monitors.json"

# Get Lock Path
def __get_lock_path ():
    return get_hermes_home() / "plugins" / "monitoring" / "monitors.lock"



# Write Monitors
def _write_monitors ( monitors ):
    # Get Path
    path = __get_monitors_path()
    # Write Monitors
    path.write_text(json.dumps(monitors, indent = 4), encoding = "utf-8")

# Read Monitors
def _read_monitors ():
    # Get Path
    path = __get_monitors_path()
    # Read Monitors
    return json.loads(path.read_text(encoding = "utf-8"))

# Add Monitor
def _add_monitor ( monitors, application, name, monitor_type, configuration ):
    # Validate Application
    if application.strip() != "":
        if application.replace(" ", "").isalnum() == False:
            return monitors, "Application name must be alphanumeric."
    else:
        application = "Uncategorized"
    # Validate Name
    if name.strip() == "":
        return monitors, "Name can not be empty."
    # Validate Monitor Type
    if monitor_type not in ("website", "proxy"):
        return monitors, "Invalid monitor type."
    # Validate Configuration
    if not configuration.strip():
        return monitors, "Configuration can not be empty."
    # Check If The Monitor Already Exists
    if __generate_id(f"{ application.strip() }:{ name.strip() }") in monitors:
        return monitors, f"{ name.strip() } is already being monitored under { application.strip() }."
    # Add Monitor
    monitors[__generate_id(f"{ application.strip() }:{ name.strip() }")] = {
        "application": application.strip(),
        "name": name.strip(),
        "type": monitor_type,
        "configuration": configuration.strip(),
        "ping_history": [-1] * 30
    }
    # Return Monitors
    return monitors, ""

# Remove Monitor
def _remove_monitor ( monitors, application, name ):
    # Check if Monitor Exists
    if __generate_id(f"{ application.strip() }:{ name.strip() }") not in monitors:
        return monitors, "Not monitored."
    # Remove Monitor
    del monitors[__generate_id(f"{ application.strip() }:{ name.strip() }")]
    return monitors, ""