(function () {
    "use strict";

    const SDK = window.__HERMES_PLUGIN_SDK__;
    const { React } = SDK;
    const { Card, CardHeader, CardTitle, CardContent, Badge, Button } = SDK.components;
    const { useState, useEffect } = SDK.hooks;

    function PluginPage() {
        const [loading, setLoading] = useState(false);
        const [message, setMessage] = useState(null);
        const [monitors, setMonitors] = useState({});
        const [newMonitorName, setNewMonitorName] = useState("");
        const [newMonitorApplication, setNewMonitorApplication] = useState("");
        const [newMonitorType, setNewMonitorType] = useState("website");
        const [newMonitorConfiguration, setNewMonitorConfiguration] = useState("");
        const [hoveredLatency, setHoveredLatency] = useState(null);

        function addMonitor(event) {
            event.preventDefault();
            setLoading(true);

            SDK.fetchJSON("/api/plugins/monitoring/add", {
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
        }

        function getMonitors() {
            setLoading(true);

            SDK.fetchJSON("/api/plugins/monitoring/get")
                .then(data => {
                    if (data && data.success) {
                        setMonitors(data.monitors || {});
                    } else {
                        setMessage("Failed to load monitors.");
                    }
                })
                .catch(err => {
                    setMessage("Failed to load monitors: " + (err ? err.message : "Unknown Error"));
                })
                .finally(() => {
                    setLoading(false);
                });
        }

        function removeMonitor(monitorId) {
            if (!confirm("Are you sure you want to remove " + monitorId + "?")) {
                return;
            }

            setLoading(true);

            SDK.fetchJSON("/api/plugins/monitoring/remove", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: monitorId
                })
            }).then(data => {
                if (data && data.success) {
                    setMessage("Removed " + monitorId);
                    getMonitors();
                } else {
                    setMessage("Error: " + (data ? data.error : "Unknown Error"));
                }
            }).catch(err => {
                setMessage("API request failed: " + (err ? err.message : String(err)));
            }).finally(() => {
                setLoading(false);
            });
        }

        useEffect(() => {
            getMonitors();

            const interval = setInterval(getMonitors, 15000);

            return () => {
                clearInterval(interval);
            };
        }, []);

        function getMonitorName(monitorId, monitorInfo) {
            if (monitorInfo && monitorInfo.name) {
                return monitorInfo.name;
            }

            if (monitorInfo && monitorInfo.url) {
                return monitorInfo.url;
            }

            return monitorId;
        }

        function getMonitorType(monitorInfo) {
            return (monitorInfo && monitorInfo.type)
                ? monitorInfo.type
                : "website";
        }

        function getPingHistory(monitorInfo) {
            const history = (
                monitorInfo &&
                Array.isArray(monitorInfo.ping_history)
            )
                ? monitorInfo.ping_history
                : [];

            return history.slice(-30);
        }

        function renderLatencyGraph(pingHistory) {
            const graphWidth = 160;
            const graphHeight = 32;

            const validPings = pingHistory.filter(value => {
                return typeof value === "number" && value >= 0;
            });

            const averagePing = validPings.length > 0
                ? Math.round(
                    validPings.reduce((sum, value) => sum + value, 0) /
                    validPings.length
                )
                : null;

            const maxPing = validPings.length > 0
                ? Math.max.apply(null, validPings)
                : 100;

            const safeMaxPing = maxPing <= 0 ? 100 : maxPing;

            const points = pingHistory.map(function (ping, index) {
                const x = pingHistory.length <= 1
                    ? 0
                    : (index / (pingHistory.length - 1)) * graphWidth;

                const value = (
                    typeof ping === "number" &&
                    ping >= 0
                )
                    ? ping
                    : 0;

                const y = graphHeight - (
                    (value / safeMaxPing) * graphHeight
                );

                return x + "," + y;
            }).join(" ");

            return React.createElement("div", {
                className: "flex flex-col gap-1 w-40"
            },

                React.createElement("div", {
                    className: "flex items-center justify-between"
                },

                    React.createElement("span", {
                        className: "text-[10px] text-muted-foreground"
                    },
                        averagePing !== null
                            ? "Avg " + averagePing + "ms"
                            : "No data"
                    ),

                    React.createElement("span", {
                        className: "text-[10px] text-muted-foreground"
                    },
                        hoveredLatency !== null
                            ? hoveredLatency + "ms"
                            : ""
                    )
                ),

                React.createElement("svg", {
                    viewBox: "0 0 " + graphWidth + " " + graphHeight,
                    preserveAspectRatio: "none",
                    className: "w-40 h-8 border border-border rounded-md bg-background/40"
                },

                    React.createElement("polyline", {
                        points: points,
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2",
                        className: "text-primary"
                    }),

                    pingHistory.map(function (ping, index) {
                        if (typeof ping !== "number" || ping < 0) {
                            return null;
                        }

                        const x = pingHistory.length <= 1
                            ? 0
                            : (index / (pingHistory.length - 1)) * graphWidth;

                        const y = graphHeight - (
                            (ping / safeMaxPing) * graphHeight
                        );

                        return React.createElement("circle", {
                            key: index,
                            cx: x,
                            cy: y,
                            r: 5,
                            className: "fill-primary opacity-0 hover:opacity-100 cursor-pointer",
                            onMouseEnter: function () {
                                setHoveredLatency(ping);
                            },
                            onMouseLeave: function () {
                                setHoveredLatency(null);
                            }
                        },
                            React.createElement("title", null, ping + "ms")
                        );
                    })
                )
            );
        }

        const monitorsSafe = monitors || {};
        const monitorIds = Object.keys(monitorsSafe);

        const overviewStats = monitorIds.reduce(function (stats, monitorId) {
            const monitorInfo = monitorsSafe[monitorId] || {};
            const status = monitorInfo.last_status || "UNKNOWN";

            stats.total += 1;

            if (status === "UP") {
                stats.up += 1;
            } else if (status === "DOWN") {
                stats.down += 1;
            } else {
                stats.unknown += 1;
            }

            return stats;

        }, {
            total: 0,
            up: 0,
            down: 0,
            unknown: 0
        });

        const groupedMonitors = monitorIds.reduce(function (groups, monitorId) {
            const monitorInfo = monitorsSafe[monitorId] || {};
            const appName = monitorInfo.app || "Unassigned";

            if (!groups[appName]) {
                groups[appName] = [];
            }

            groups[appName].push(monitorId);

            return groups;
        }, {});

        const appNames = Object.keys(groupedMonitors).sort();

        function renderOverviewStat(label, value, colourClass, bgClass) {
            return React.createElement("div", {
                className:
                    "flex-1 min-w-[180px] rounded-2xl border px-6 py-6 shadow-sm backdrop-blur-sm " +
                    bgClass
            },

                React.createElement("div", {
                    className: "flex flex-col gap-3"
                },

                    React.createElement("span", {
                        className: "text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground"
                    }, label),

                    React.createElement("span", {
                        className:
                            "text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none " +
                            colourClass
                    }, value)
                )
            );
        }

        return React.createElement("div", {
            className: "flex flex-col gap-6 p-4"
        },

            React.createElement(Card, null,

                React.createElement(CardHeader, null,

                    React.createElement("div", {
                        className: "flex items-center justify-between"
                    },

                        React.createElement(CardTitle, {
                            className: "text-2xl font-black tracking-tight"
                        }, "Overview"),

                        React.createElement(Button, {
                            onClick: getMonitors,
                            disabled: loading,
                            className: "text-xs border border-border px-3 py-1 cursor-pointer"
                        },
                            loading ? "Refreshing..." : "Refresh"
                        )
                    )
                ),

                React.createElement(CardContent, {
                    className: "flex flex-col gap-6"
                },

                    React.createElement("div", {
                        className:
                            overviewStats.down > 0
                                ? "rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 via-background to-background p-8"
                                : overviewStats.unknown > 0
                                    ? "rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-background to-background p-8"
                                    : "rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-background to-background p-8"
                    },

                        React.createElement("div", {
                            className: "flex flex-col gap-8"
                        },

                            React.createElement("div", {
                                className: "flex flex-col gap-3"
                            },

                                React.createElement("span", {
                                    className: "text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground"
                                }, "Current Status"),

                                React.createElement("span", {
                                    className:
                                        overviewStats.down > 0
                                            ? "text-4xl md:text-5xl font-black tracking-tight text-rose-400"
                                            : overviewStats.unknown > 0
                                                ? "text-4xl md:text-5xl font-black tracking-tight text-amber-300"
                                                : "text-4xl md:text-5xl font-black tracking-tight text-emerald-400"
                                },

                                    overviewStats.total === 0
                                        ? "No Services Monitored"
                                        : overviewStats.down > 0
                                            ? overviewStats.down + " Active Incident" + (
                                                overviewStats.down === 1
                                                    ? ""
                                                    : "s"
                                            )
                                            : overviewStats.unknown > 0
                                                ? overviewStats.unknown + " Unknown Status" + (
                                                    overviewStats.unknown === 1
                                                        ? ""
                                                        : "es"
                                                )
                                                : "All Systems Operational"
                                ),

                                React.createElement("span", {
                                    className: "text-base text-muted-foreground max-w-3xl"
                                },

                                    overviewStats.total === 0
                                        ? "Add a monitor below to begin tracking uptime and latency."
                                        : overviewStats.down > 0
                                            ? "One or more monitored services are currently experiencing issues and require attention."
                                            : overviewStats.unknown > 0
                                                ? "No confirmed outages detected, but some services have not yet reported a healthy state."
                                                : "Every monitored service is currently healthy and responding normally."
                                )
                            ),

                            React.createElement("div", {
                                className: "flex flex-row flex-wrap items-stretch gap-4 w-full"
                            },

                                renderOverviewStat(
                                    "Total",
                                    overviewStats.total,
                                    "text-cyan-400",
                                    "border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5"
                                ),

                                renderOverviewStat(
                                    "Online",
                                    overviewStats.up,
                                    "text-emerald-400",
                                    "border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
                                ),

                                renderOverviewStat(
                                    "Down",
                                    overviewStats.down,
                                    "text-rose-400",
                                    "border-rose-500/30 bg-gradient-to-br from-rose-500/20 to-rose-500/5"
                                ),

                                renderOverviewStat(
                                    "Unknown",
                                    overviewStats.unknown,
                                    "text-amber-300",
                                    "border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-500/5"
                                )
                            )
                        )
                    )
                )
            )
        );
    }

    window.__HERMES_PLUGINS__.register("monitoring", PluginPage);
})();