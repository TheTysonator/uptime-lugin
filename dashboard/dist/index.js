(function () {

    "use strict";


    // Software Development Kit
    const SDK = window.__HERMES_PLUGIN_SDK__;
    const { React } = SDK;

    const { Card, CardHeader, CardTitle, CardContent, Badge, Button } = SDK.components;

    const { useState, useEffect } = SDK.hooks;


    // Plugin Page
    function PluginPage() {

        // Variables
        const [loading, setLoading] = useState(false);
        const [message, setMessage] = useState(null);
        const [monitors, setMonitors] = useState({});
        const [newMonitorName, setNewMonitorName] = useState("");
        const [newMonitorApplication, setNewMonitorApplication] = useState("");
        const [newMonitorType, setNewMonitorType] = useState("website");
        const [newMonitorConfiguration, setNewMonitorConfiguration] = useState("");

        // Add Monitor
        function addMonitor(event) {
            // Prevent Default
            event.preventDefault();
            // Loading
            setLoading(true);
            // API Request
            SDK.fetchJSON("/api/plugins/uptime/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: newMonitorType,
                    name: newMonitorName,
                    app: newMonitorApplication,
                    configuration: newMonitorConfiguration
                })
            }).then(data => {
                if (data && data.success) {
                    setMessage("Successfully added " + newMonitorName);
                    setNewMonitorName("");
                    setNewMonitorApplication("");
                    setNewMonitorType("website");
                    setNewMonitorConfiguration("");
                    getMonitors();
                } else {
                    setMessage("Error: " + (data ? data.error : "Unknown Error"));
                }
            }).catch(err => {
                setMessage("API request failed: " + (err ? err.message : String(err)));
            }).finally(() => {
                setLoading(false);
            });
        };

        // Get Monitors
        function getMonitors () {
            // Loading
            setLoading(true);



            SDK.fetchJSON("/api/plugins/uptime/status")

            
                .then(function (data) {
                    if (data && data.success) {
                        setMonitors(data.monitors || {});
                    } else {
                        setMessage("Failed to load: backend returned unsuccessful response.");
                    }
                })
                .catch(function (err) {
                    const errMsg = err ? (err.message || String(err)) : "Unknown Exception";
                    setMessage("Failed to load monitors: " + errMsg);
                    console.error("Website Monitor load error:", err);
                })
                .finally(function () {
                    setLoading(false);
                });
        }




// delete, view history/ping, overall



        useEffect(function () {
            getMonitors();
            const interval = setInterval(getMonitors, 15000);
            return function () {
                clearInterval(interval);
            };
        }, []);



        function handleRemove(monitorId) {
            if (!confirm("Are you sure you want to stop monitoring " + monitorId + "?")) return;

            setLoading(true);

            SDK.fetchJSON("/api/plugins/uptime/remove?url=" + encodeURIComponent(monitorId))
                .then(function (data) {
                    if (data && data.success) {
                        setMessage("Removed " + monitorId);
                        getMonitors();
                    } else {
                        setMessage("Error: " + (data ? data.error : "Unknown Error"));
                    }
                })
                .catch(function (err) {
                    setMessage("API request failed: " + (err ? err.message : String(err)));
                })
                .finally(function () {
                    setLoading(false);
                });
        }

        function getMonitorName(monitorId, monitorInfo) {
            if (monitorInfo && monitorInfo.name) return monitorInfo.name;
            if (monitorInfo && monitorInfo.url) return monitorInfo.url;
            return monitorId;
        }

        function getMonitorType(monitorInfo) {
            return (monitorInfo && monitorInfo.type) ? monitorInfo.type : "website";
        }

        function getPingHistory(monitorInfo) {
            const history = monitorInfo && Array.isArray(monitorInfo.ping_history) ? monitorInfo.ping_history : [];
            return history.slice(-30);
        }

        function renderLatencyGraph(pingHistory) {
            const graphWidth = 300;
            const graphHeight = 60;
            const validPings = pingHistory.filter(function (value) {
                return typeof value === "number" && value >= 0;
            });

            const maxPing = validPings.length > 0 ? Math.max.apply(null, validPings) : 100;
            const safeMaxPing = maxPing <= 0 ? 100 : maxPing;

            const points = pingHistory.map(function (ping, index) {
                const x = pingHistory.length <= 1 ? 0 : (index / (pingHistory.length - 1)) * graphWidth;
                const value = typeof ping === "number" && ping >= 0 ? ping : 0;
                const y = graphHeight - ((value / safeMaxPing) * graphHeight);
                return x + "," + y;
            }).join(" ");

            return React.createElement("div", {
                className: "mt-3 w-full"
            },
                React.createElement("div", {
                    className: "flex items-center justify-between mb-1"
                },
                    React.createElement("span", {
                        className: "text-[10px] text-muted-foreground uppercase tracking-wide"
                    }, "Latency history"),

                    React.createElement("span", {
                        className: "text-[10px] text-muted-foreground"
                    }, validPings.length > 0 ? Math.round(validPings[validPings.length - 1]) + "ms" : "No data")
                ),

                React.createElement("svg", {
                    viewBox: "0 0 " + graphWidth + " " + graphHeight,
                    preserveAspectRatio: "none",
                    className: "w-full h-16 border border-border rounded-md bg-background/40"
                },
                    React.createElement("polyline", {
                        points: points,
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "text-primary"
                    })
                )
            );
        }

        const monitorsSafe = monitors || {};

        const groupedMonitors = Object.keys(monitorsSafe).reduce(function (groups, monitorId) {
            const monitorInfo = monitorsSafe[monitorId] || {};
            const appName = monitorInfo.app || "Unassigned";

            if (!groups[appName]) {
                groups[appName] = [];
            }

            groups[appName].push(monitorId);
            return groups;
        }, {});

        const appNames = Object.keys(groupedMonitors).sort();

        return React.createElement("div", { className: "flex flex-col gap-6 p-4" },

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(CardTitle, { className: "text-xl font-bold" }, "🌐 Website Uptime Monitor"),
                        React.createElement(Button, {
                            onClick: getMonitors,
                            disabled: loading,
                            className: "text-xs border border-border px-3 py-1 cursor-pointer"
                        }, loading ? "Refreshing..." : "↻ Refresh")
                    )
                ),

                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("p", { className: "text-sm text-muted-foreground" },
                        "Add and manage website and proxy monitors. Background checks occur silently every 60 seconds."
                    ),

                    React.createElement("form", { onSubmit: addMonitor, className: "flex flex-col gap-3 mt-2" },

                        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3" },

                            React.createElement("input", {
                                type: "text",
                                placeholder: "Monitor name",
                                value: newMonitorName,
                                onChange: function (e) {
                                    setNewMonitorName(e.target.value);
                                },
                                disabled: loading,
                                className: "border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            }),

                            React.createElement("select", {
                                value: newMonitorType,
                                onChange: function (e) {
                                    setNewMonitorType(e.target.value);
                                },
                                disabled: loading,
                                className: "border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            },
                                React.createElement("option", { value: "website" }, "Website"),
                                React.createElement("option", { value: "proxy" }, "Proxy")
                            ),

                            React.createElement("input", {
                                type: "text",
                                placeholder: "Application name",
                                value: newMonitorApplication,
                                onChange: function (e) {
                                    setNewMonitorApplication(e.target.value);
                                },
                                disabled: loading,
                                className: "border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            })
                        ),

                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement("input", {
                                type: "text",
                                placeholder: newMonitorType === "proxy" ? "Proxy URL / configuration" : "https://mywebsite.com",
                                value: newMonitorConfiguration,
                                onChange: function (e) {
                                    setNewMonitorConfiguration(e.target.value);
                                },
                                disabled: loading,
                                className: "flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            }),

                            React.createElement(Button, {
                                type: "submit",
                                disabled: loading || !newMonitorName.trim() || !newMonitorApplication.trim() || !newMonitorConfiguration.trim(),
                                className: "bg-primary text-primary-foreground font-semibold px-4 py-2 hover:bg-primary/90 text-sm cursor-pointer"
                            }, "＋ Add Monitor")
                        )
                    ),

                    message && React.createElement("div", {
                        className: "text-xs font-mono text-amber-500 mt-1"
                    }, message)
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, { className: "text-base font-semibold" }, "📺 Live Monitor Statuses")
                ),

                React.createElement(CardContent, null,
                    appNames.length === 0 ?
                        React.createElement("div", {
                            className: "text-sm text-muted-foreground text-center py-6 border border-dashed border-border"
                        }, "No monitors are currently active. Add one above to get started!")
                        :
                        React.createElement("div", { className: "flex flex-col gap-6" },
                            appNames.map(function (appName) {
                                const monitorIds = groupedMonitors[appName] || [];

                                return React.createElement("div", {
                                    key: appName,
                                    className: "flex flex-col gap-2"
                                },
                                    React.createElement("div", {
                                        className: "flex items-center justify-between border-b border-border pb-2"
                                    },
                                        React.createElement("h3", {
                                            className: "text-sm font-bold"
                                        }, appName),

                                        React.createElement("span", {
                                            className: "text-xs text-muted-foreground"
                                        }, monitorIds.length + " monitor" + (monitorIds.length === 1 ? "" : "s"))
                                    ),

                                    React.createElement("div", {
                                        className: "divide-y divide-border rounded-md border border-border"
                                    },
                                        monitorIds.map(function (monitorId) {
                                            const monitorInfo = monitorsSafe[monitorId] || {};
                                            const monitorName = getMonitorName(monitorId, monitorInfo);
                                            const monitorType = getMonitorType(monitorInfo);
                                            const status = monitorInfo.last_status || "UNKNOWN";

                                            const isUp = status === "UP";
                                            const isDown = status === "DOWN";
                                            const badgeVariant = isUp ? "success" : (isDown ? "destructive" : "secondary");
                                            const badgeText = isUp ? "● ONLINE" : (isDown ? "● DOWN" : "○ UNKNOWN");

                                            const typeLabel = monitorType === "proxy" ? "Proxy" : "Website";
                                            const typeIcon = monitorType === "proxy" ? "🧦" : "🌐";

                                            const pingHistory = getPingHistory(monitorInfo);

                                            return React.createElement("div", {
                                                key: monitorId,
                                                className: "flex flex-col px-4 py-4"
                                            },
                                                React.createElement("div", {
                                                    className: "flex items-center justify-between"
                                                },
                                                    React.createElement("div", {
                                                        className: "flex flex-col gap-1 pr-4 min-w-0"
                                                    },
                                                        React.createElement("div", {
                                                            className: "flex items-center gap-2 min-w-0"
                                                        },
                                                            React.createElement("span", {
                                                                className: "text-sm font-semibold truncate"
                                                            }, monitorName),

                                                            React.createElement(Badge, {
                                                                variant: "secondary",
                                                                className: "text-[10px] px-2 py-0.5 shrink-0"
                                                            }, typeIcon + " " + typeLabel)
                                                        ),

                                                        React.createElement("span", {
                                                            className: "text-xs text-muted-foreground truncate"
                                                        }, monitorId),

                                                        React.createElement("span", {
                                                            className: "text-xs text-muted-foreground"
                                                        }, "Polling status every 60 seconds")
                                                    ),

                                                    React.createElement("div", {
                                                        className: "flex items-center gap-4 shrink-0"
                                                    },
                                                        React.createElement(Badge, {
                                                            variant: badgeVariant,
                                                            className: "text-xs px-2 py-0.5"
                                                        }, badgeText),

                                                        React.createElement(Button, {
                                                            onClick: function () {
                                                                handleRemove(monitorId);
                                                            },
                                                            disabled: loading,
                                                            className: "text-xs border border-destructive/30 hover:bg-destructive/10 text-destructive px-3 py-1 cursor-pointer"
                                                        }, "🗑 Delete"),

                                                        renderLatencyGraph(pingHistory)
                                                    )
                                                )
                                            );
                                        })
                                    )
                                );
                            })
                        )
                )
            )
        );
    }

    window.__HERMES_PLUGINS__.register("uptime", PluginPage);
})();