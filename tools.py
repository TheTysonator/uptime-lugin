# Standard Imports
import json

# Custom Imports
from .utils import _write_monitors, _read_monitors, _add_monitor, _remove_monitor



# Add Monitor Schema
ADD_MONITOR_SCHEMA = {
    "name": "add_monitor",
    "description": "Add a service to be monitored.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "application": {
                "type": "STRING",
                "description": "This is the name of the application this monitor is associated with."
            },
            "name": {
                "type": "STRING",
                "description": "This is the name of the monitor."
            },
            "type": {
                "type": "STRING",
                "description": "The type of monitor to add. For website monitoring, this should be 'website'. For proxy monitoring, this should be 'proxy'."
            },
            "configuration": {
                "type": "STRING",
                "description": "The configuration for the monitor. For website monitoring, this should be the URL of the service to monitor. For proxy monitoring, this should be a JSON configuration for hiddify."
            }
        },
        "required": [ "name", "type", "configuration" ]
    }
}

# List Monitors Schema
LIST_MONITORS_SCHEMA = {
    "name": "list_monitors",
    "description": "List all monitored services.",
    "parameters": {
        "type": "OBJECT",
        "properties": {}
    }
}

# Remove Monitor Schema
REMOVE_MONITOR_SCHEMA = {
    "name": "remove_monitor",
    "description": "Remove a service from being monitored.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "application": {
                "type": "STRING",
                "description": "The application associated with the monitor to remove."
            },
            "name": {
                "type": "STRING",
                "description": "The name of the monitor to remove."
            }
        },
        "required": [ "application", "name" ]
    }
}



# Handle Add Monitor
def _handle_add_monitor ( args: dict, **kw ) -> str:
    # Input Data
    monitor_application = args.get("application")
    monitor_name = args.get("name")
    monitor_type = args.get("type")
    monitor_configuration = args.get("configuration")
    # Read Monitors
    monitors = _read_monitors()
    # Add Monitor
    monitors, error_message = _add_monitor(monitors, monitor_application, monitor_name, monitor_type, monitor_configuration)
    # Handle Error
    if error_message != "":
        return json.dumps({
            "success": False,
            "message": error_message
        })
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return json.dumps({
        "success": True,
        "message": ""
    })

# Handle List Monitors
def _handle_list_monitors ( args: dict, **kw ) -> str :
    # Load Monitors
    monitors = _read_monitors()
    # Return Monitors
    return json.dumps({
        "success": True,
        "monitors": monitors
    })

# Handle Remove Monitor
def _handle_remove_monitor ( args: dict, **kw ) -> str :
    # Input Data
    monitor_application = args.get("application")
    monitor_name = args.get("name")
    # Read Monitors
    monitors = _read_monitors()
    # Remove Monitor
    monitors, error_message = _remove_monitor(monitors, monitor_application, monitor_name)
    # Handle Error
    if error_message != "":
        return json.dumps({
            "success": False,
            "message": error_message
        })
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return json.dumps({
        "success": True,
        "message": ""
    })