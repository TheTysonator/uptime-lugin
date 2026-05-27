

import json
import re



import importlib.util
import pathlib


# Import Utils
spec = importlib.util.spec_from_file_location("monitoring_utils", pathlib.Path(__file__).resolve().parent / "utils.py")
utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(utils)

# Imported Functions
_write_monitors = utils._write_monitors
_read_monitors = utils._read_monitors
_get_lock_path = utils._get_lock_path
_add_monitor = utils._add_monitor
_remove_monitor = utils._remove_monitor

# --- SCHEMAS ---






# Add Website Monitor Schema
ADD_MONITOR_SCHEMA = {
    "name": "add_website_monitor",
    "description": "Add a website to be monitored.",
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
                "description": "The configuration for the monitor. For website monitoring, this should be the URL of the website to monitor. For proxy monitoring, this should be a JSON configuration for hiddify."
            }
        },
        "required": [ "application", "name", "type", "configuration" ]
    }
}



# List Monitors Schema
LIST_MONITORS_SCHEMA = {
    "name": "list_monitors",
    "description": "List all monitored websites and proxies.",
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
            "name": {
                "type": "STRING",
                "description": "The name of the monitor to remove."
            },
            "application": {
                "type": "STRING",
                "description": "The application associated with the monitor to remove."
            }
        },
        "required": [ "name", "application" ]
    }
}



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
        return {
            "success": False,
            "message": json.dumps(error_message)
        }
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return {
        "success": True,
        "message": ""
    }



# Handle List Monitors
def _handle_list_monitors ( args: dict, **kw ) -> str :
    # Load Monitors
    monitors = _read_monitors()
    # Return Monitors
    return {
        "success": True,
        "monitors": json.dumps(monitors)
    }


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
        return {
            "success": False,
            "message": json.dumps(error_message)
        }
    # Write Monitors
    _write_monitors(monitors)
    # Response
    return {
        "success": True,
        "message": ""
    }




