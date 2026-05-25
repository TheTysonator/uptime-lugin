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
                headers: { "Content-Type": "application/json" },
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

            SDK.fetchJSON("/api/plugins/monitoring/get").then(data => {
                if (data && data.success) {
                    setMonitors(data.monitors || {});
                } else {
                    setMessage("Failed to load: backend returned unsuccessful response.");
                }
            }).catch(err => {
                setMessage("Failed to load monitors: " + (err ? (err.message || String(err)) : "Unknown Exception"));
                console.error("Website Monitor load error:", err);
            }).finally(() => {
                setLoading(false);
            });
        }

        function removeMonitor(monitorId) {
            if (!confirm("Are you sure you want to stop monitoring " + monitorId + "?")) return;

            setLoading(true);

            SDK.fetchJSON("/api/plugins/monitoring/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: monitorId })
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
            return () => clearInterval(interval);
        }, []);

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
            const graphWidth = 160;
            const graphHeight = 32;

            const validPings = pingHistory.filter(value => typeof value === "number" && value >= 0);

            const averagePing = validPings.length > 0
                ? Math.round(validPings.reduce((sum, value) => sum + value, 0) / validPings.length)
                : null;

            const maxPing = validPings.length > 0 ? Math.max.apply(null, validPings) : 100;
            const safeMaxPing = maxPing <= 0 ? 100 : maxPing;

            const points = pingHistory.map(function (ping, index) {
                const x = pingHistory.length <= 1 ? 0 : (index / (pingHistory.length - 1)) * graphWidth;
                const value = typeof ping === "number" && ping >= 0 ? ping : 0;
                const y = graphHeight - ((value / safeMaxPing) * graphHeight);
                return x + "," + y;
            }).join(" ");

            return React.createElement("div", { className: "flex flex-col gap-1 w-40" },
                React.createElement("div", { className: "flex items-center justify-between" },
                    React.createElement("span", { className: "text-[10px] text-muted-foreground" },
                        averagePing !== null ? "Avg " + averagePing + "ms" : "No data"
                    ),
                    React.createElement("span", { className: "text-[10px] text-muted-foreground" },
                        hoveredLatency !== null ? hoveredLatency + "ms" : ""
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
                        if (typeof ping !== "number" || ping < 0) return null;

                        const x = pingHistory.length <= 1 ? 0 : (index / (pingHistory.length - 1)) * graphWidth;
                        const y = graphHeight - ((ping / safeMaxPing) * graphHeight);

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
                        }, React.createElement("title", null, ping + "ms"));
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

        overviewStats.incidents = overviewStats.down;

        const groupedMonitors = monitorIds.reduce(function (groups, monitorId) {
            const monitorInfo = monitorsSafe[monitorId] || {};
            const appName = monitorInfo.app || "Unassigned";

            if (!groups[appName]) groups[appName] = [];

            groups[appName].push(monitorId);
            return groups;
        }, {});

        const appNames = Object.keys(groupedMonitors).sort();

function renderOverviewStat(label, value, colourClass) {

    let backgroundClass = "bg-background/40";
    let borderClass = "border-border";

    if (label === "Total") {
        backgroundClass = "bg-cyan-500/10";
        borderClass = "border-cyan-500/20";
    } else if (label === "Online") {
        backgroundClass = "bg-emerald-500/10";
        borderClass = "border-emerald-500/20";
    } else if (label === "Down") {
        backgroundClass = "bg-rose-500/10";
        borderClass = "border-rose-500/20";
    } else if (label === "Unknown") {
        backgroundClass = "bg-amber-500/10";
        borderClass = "border-amber-500/20";
    }

    return React.createElement("div", {
        className:
            "flex-1 min-w-[260px] rounded-3xl border border-border px-8 py-7 shadow-sm overflow-hidden relative" +
            backgroundClass + " " + borderClass
    },

        React.createElement("div", {
            className: "flex items-center justify-between gap-10"
        },

            React.createElement("div", {
                className: "flex flex-col z-10"
            },

                React.createElement("span", {
                    className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground"
                }, label),

                React.createElement("span", {
                    className: "text-sm text-muted-foreground mt-3"
                },
                    label === "Total"
                        ? "Tracked services"
                        : label === "Online"
                            ? "Healthy services"
                            : label === "Down"
                                ? "Active outages"
                                : "Pending state"
                )
            ),

            React.createElement("div", {
                className: "pr-4 flex items-center justify-center z-10"
            },

                React.createElement("span", {
                    className: "font-black leading-none " + colourClass,
                    style: {
                        fontSize: "96px",
                        lineHeight: "0.85",
                        letterSpacing: "-0.08em"
                    }
                }, value)
            )
        )
    );
}

        return React.createElement("div", { className: "flex flex-col gap-6 p-4" },

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(CardTitle, {
                            className: "text-2xl font-black tracking-tight"
                        }, "Overview"),

                        React.createElement(Button, {
                            onClick: getMonitors,
                            disabled: loading,
                            className: "text-xs border border-border px-3 py-1 cursor-pointer"
                        }, loading ? "Refreshing..." : "Refresh")
                    )
                ),

                React.createElement(CardContent, {
                    className: "flex flex-col gap-6"
                },
                    React.createElement("div", {
                        className: overviewStats.down > 0
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
                                    className: overviewStats.down > 0
                                        ? "text-4xl md:text-5xl font-black tracking-tight text-rose-400"
                                        : overviewStats.unknown > 0
                                            ? "text-4xl md:text-5xl font-black tracking-tight text-amber-300"
                                            : "text-4xl md:text-5xl font-black tracking-tight text-emerald-400"
                                },
                                    overviewStats.total === 0
                                        ? "No Services Monitored"
                                        : overviewStats.down > 0
                                            ? overviewStats.down + " Active Incident" + (overviewStats.down === 1 ? "" : "s")
                                            : overviewStats.unknown > 0
                                                ? overviewStats.unknown + " Unknown Status" + (overviewStats.unknown === 1 ? "" : "es")
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
                                    "border border-border"
                                ),

                                renderOverviewStat(
                                    "Online",
                                    overviewStats.up,
                                    "text-cyan-400",
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
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement(CardTitle, { className: "text-xl font-bold" }, "Website Uptime Monitor")
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
                                onChange: e => setNewMonitorName(e.target.value),
                                disabled: loading,
                                className: "border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            }),

                            React.createElement("select", {
                                value: newMonitorType,
                                onChange: e => setNewMonitorType(e.target.value),
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
                                onChange: e => setNewMonitorApplication(e.target.value),
                                disabled: loading,
                                className: "border border-border rounded-md px-3 py-2 text-sm bg-background/50 h-9 outline-none focus:ring-1 focus:ring-ring"
                            })
                        ),

                        React.createElement("div", { className: "flex items-center gap-3" },
                            React.createElement("input", {
                                type: "text",
                                placeholder: newMonitorType === "proxy" ? "Proxy URL / configuration" : "https://mywebsite.com",
                                value: newMonitorConfiguration,
                                onChange: e => setNewMonitorConfiguration(e.target.value),
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
                    React.createElement(CardTitle, { className: "text-base font-semibold" }, "Live Monitor Statuses")
                ),

                React.createElement(CardContent, null,
                    appNames.length === 0
                        ? React.createElement("div", {
                            className: "text-sm text-muted-foreground text-center py-6 border border-dashed border-border"
                        }, "No monitors are currently active. Add one above to get started!")
                        : React.createElement("div", { className: "flex flex-col gap-6" },
                            appNames.map(function (appName) {
                                const monitorIdsForApp = groupedMonitors[appName] || [];

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
                                        }, monitorIdsForApp.length + " monitor" + (monitorIdsForApp.length === 1 ? "" : "s"))
                                    ),

                                    React.createElement("div", {
                                        className: "divide-y divide-border rounded-md border border-border"
                                    },
                                        monitorIdsForApp.map(function (monitorId) {
                                            const monitorInfo = monitorsSafe[monitorId] || {};
                                            const monitorName = getMonitorName(monitorId, monitorInfo);
                                            const monitorType = getMonitorType(monitorInfo);
                                            const status = monitorInfo.last_status || "UNKNOWN";

                                            const isUp = status === "UP";
                                            const isDown = status === "DOWN";
                                            const badgeVariant = isUp ? "success" : (isDown ? "destructive" : "secondary");
                                            const badgeText = isUp ? "ONLINE" : (isDown ? "DOWN" : "UNKNOWN");

                                            const typeLabel = monitorType === "proxy" ? "Proxy" : "Website";
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
                                                            }, typeLabel)
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
                                                                removeMonitor(monitorId);
                                                            },
                                                            disabled: loading,
                                                            className: "text-xs border border-destructive/30 hover:bg-destructive/10 text-destructive px-3 py-1 cursor-pointer"
                                                        }, "Delete"),

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

    window.__HERMES_PLUGINS__.register("monitoring", PluginPage);
})();