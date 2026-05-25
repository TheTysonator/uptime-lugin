(function () {
    "use strict";

    const SDK = window.__HERMES_PLUGIN_SDK__ || {};
    const React = SDK.React;

    if (!React) {
        console.error("Hermes SDK React is not loaded");
        return;
    }

    const hooks = SDK.hooks || {};
    const useState = hooks.useState || React.useState;
    const useEffect = hooks.useEffect || React.useEffect;

    if (!useState || !useEffect) {
        console.error("React hooks are not available");
        return;
    }

    const components = SDK.components || {};

    function fallbackElement(tag, defaultClassName) {
        return function FallbackComponent(props) {
            props = props || {};
            const children = props.children;
            const finalProps = Object.assign({}, props);

            delete finalProps.children;

            finalProps.className = [defaultClassName, props.className]
                .filter(Boolean)
                .join(" ");

            return React.createElement(tag, finalProps, children);
        };
    }

    const Card = components.Card || fallbackElement("div", "rounded-2xl border border-white/10 bg-white/5 p-4");
    const CardHeader = components.CardHeader || fallbackElement("div", "mb-4");
    const CardTitle = components.CardTitle || fallbackElement("h2", "text-lg font-bold");
    const CardContent = components.CardContent || fallbackElement("div", "");

    const Badge = components.Badge || fallbackElement("span", "inline-flex rounded-full border border-white/10 px-2 py-1 text-xs");
    const Button = components.Button || fallbackElement("button", "rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10");
    const Input = components.Input || fallbackElement("input", "w-full rounded-xl border border-white/10 bg-transparent px-3 py-2");
    const TextArea = components.TextArea || components.Textarea || fallbackElement("textarea", "w-full rounded-xl border border-white/10 bg-transparent px-3 py-2");
    const Select = components.Select || fallbackElement("select", "w-full rounded-xl border border-white/10 bg-transparent px-3 py-2");
    const Label = components.Label || fallbackElement("label", "mb-1 block text-sm font-medium");

    const Checkbox = components.Checkbox || function CheckboxFallback(props) {
        return React.createElement("input", {
            id: props.id,
            name: props.name,
            type: "checkbox",
            checked: !!props.checked,
            onChange: function (e) {
                if (props.onCheckedChange) props.onCheckedChange(e.target.checked);
                if (props.onChange) props.onChange(e);
            }
        });
    };

    const Switch = components.Switch || Checkbox;

    const Slider = components.Slider || function SliderFallback(props) {
        return React.createElement("input", {
            type: "range",
            min: props.min || 0,
            max: props.max || 100,
            step: props.step || 1,
            value: Array.isArray(props.value) ? props.value[0] : props.value,
            className: props.className,
            onChange: function (e) {
                const value = Number(e.target.value);
                if (props.onValueChange) props.onValueChange(value);
            }
        });
    };

    const Table = components.Table || fallbackElement("table", "w-full border-collapse");
    const TableRow = components.TableRow || fallbackElement("tr", "border-b border-white/10");
    const TableCell = components.TableCell || fallbackElement("td", "p-2");

    const Alert = components.Alert || fallbackElement("div", "rounded-xl border border-white/10 p-3");
    const AlertTitle = components.AlertTitle || fallbackElement("div", "font-bold");
    const AlertDescription = components.AlertDescription || fallbackElement("div", "text-sm opacity-80");

    const Progress = components.Progress || function ProgressFallback(props) {
        return React.createElement("div", {
            className: "h-2 overflow-hidden rounded-full bg-white/10 " + (props.className || "")
        },
            React.createElement("div", {
                className: "h-full bg-white/60",
                style: { width: (props.value || 0) + "%" }
            })
        );
    };

    const Spinner = components.Spinner || fallbackElement("div", "animate-pulse text-sm opacity-70");
    const Divider = components.Divider || fallbackElement("hr", "border-white/10");

    const StatusIndicator = components.StatusIndicator || function StatusIndicatorFallback(props) {
        return React.createElement("span", {
            className: "inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs"
        }, props.children || props.status);
    };

    const Flex = components.Flex || fallbackElement("div", "flex");

    const Tabs = components.Tabs || fallbackElement("div", "flex gap-2");
    const Tab = components.Tab || function TabFallback(props) {
        return React.createElement("button", {
            className: "rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10",
            onClick: function () {
                if (props.onClick) props.onClick();
            }
        }, props.children);
    };

    const Breadcrumb = components.Breadcrumb || fallbackElement("div", "flex gap-2 text-sm opacity-80");
    const BreadcrumbItem = components.BreadcrumbItem || fallbackElement("span", "");

    const Pagination = components.Pagination || function PaginationFallback(props) {
        return React.createElement("div", { className: "flex gap-2" },
            React.createElement(Button, {
                onClick: function () {
                    if (props.onPageChange) props.onPageChange(Math.max(1, props.currentPage - 1));
                }
            }, "Previous"),
            React.createElement("span", { className: "px-3 py-2 text-sm" },
                "Page " + props.currentPage + " of " + props.totalPages
            ),
            React.createElement(Button, {
                onClick: function () {
                    if (props.onPageChange) props.onPageChange(Math.min(props.totalPages, props.currentPage + 1));
                }
            }, "Next")
        );
    };

    const Modal = components.Modal || function ModalFallback(props) {
        if (!props.open) return null;

        return React.createElement("div", {
            className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        },
            React.createElement("div", {
                className: "w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-xl"
            },
                React.createElement("h2", { className: "text-lg font-bold" }, props.title),
                React.createElement("p", { className: "mt-1 text-sm opacity-70" }, props.description),
                props.children
            )
        );
    };

    const Popover = components.Popover || function PopoverFallback(props) {
        return React.createElement("div", { className: "inline-flex flex-col gap-2" },
            props.trigger,
            React.createElement("div", {
                className: "rounded-xl border border-white/10 bg-white/5 p-2 text-sm"
            }, props.children)
        );
    };

    const LineChart = components.LineChart || function ChartFallback(props) {
        return React.createElement("div", {
            className: "flex h-full items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm opacity-70"
        }, props.title || "Chart unavailable");
    };

    const BarChart = components.BarChart || LineChart;

    const Gauge = components.Gauge || function GaugeFallback(props) {
        return React.createElement("div", {
            className: "rounded-full border border-white/10 px-6 py-4 text-center"
        },
            React.createElement("div", { className: "text-sm opacity-70" }, props.title || "Gauge"),
            React.createElement("div", { className: "text-2xl font-bold" }, props.value + "%")
        );
    };

    function PluginDemoPage() {
        const [activeTab, setActiveTab] = useState("components");
        const [showModal, setShowModal] = useState(false);
        const [progress, setProgress] = useState(0);
        const [alerts, setAlerts] = useState([]);
        const [formData, setFormData] = useState({
            name: "",
            email: "",
            subscribe: false,
            theme: "light",
            comments: ""
        });

        useEffect(function () {
            const interval = setInterval(function () {
                setProgress(function (prev) {
                    return prev >= 100 ? 0 : prev + 10;
                });
            }, 1000);

            return function () {
                clearInterval(interval);
            };
        }, []);

        function addAlert(type) {
            const id = Date.now();

            setAlerts(function (prev) {
                return prev.concat({
                    id: id,
                    type: type,
                    message: "This is a " + type + " alert"
                });
            });

            setTimeout(function () {
                setAlerts(function (prev) {
                    return prev.filter(function (alert) {
                        return alert.id !== id;
                    });
                });
            }, 5000);
        }

        function handleInputChange(e) {
            const target = e.target;
            const name = target.name;
            const value = target.value;
            const type = target.type;
            const checked = target.checked;

            setFormData(function (prev) {
                const next = Object.assign({}, prev);
                next[name] = type === "checkbox" ? checked : value;
                return next;
            });
        }

        const chartData = [
            { month: "Jan", value: 30 },
            { month: "Feb", value: 45 },
            { month: "Mar", value: 28 },
            { month: "Apr", value: 60 },
            { month: "May", value: 50 }
        ];

        return React.createElement("div", { className: "flex flex-col gap-6 p-4" },

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, { className: "text-xl font-bold" }, "Hermes UI Components Demo")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("p", { className: "text-sm text-muted-foreground" },
                        "This demo showcases available UI components in the Hermes dashboard framework."
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Alerts & Feedback")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-3" },
                    React.createElement(Flex, { className: "flex-wrap gap-2" },
                        React.createElement(Button, { onClick: function () { addAlert("success"); } }, "Success Alert"),
                        React.createElement(Button, { onClick: function () { addAlert("destructive"); } }, "Error Alert"),
                        React.createElement(Button, { onClick: function () { addAlert("warning"); } }, "Warning Alert"),
                        React.createElement(Button, { onClick: function () { addAlert("info"); } }, "Info Alert")
                    ),
                    alerts.map(function (alert) {
                        return React.createElement(Alert, { key: alert.id, variant: alert.type },
                            React.createElement(AlertTitle, null,
                                alert.type.charAt(0).toUpperCase() + alert.type.slice(1)
                            ),
                            React.createElement(AlertDescription, null, alert.message)
                        );
                    })
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Form Components")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("div", { className: "grid gap-4" },

                        React.createElement("div", { className: "grid grid-cols-2 gap-4" },
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "name" }, "Name"),
                                React.createElement(Input, {
                                    id: "name",
                                    name: "name",
                                    value: formData.name,
                                    onChange: handleInputChange,
                                    placeholder: "Enter your name"
                                })
                            ),
                            React.createElement("div", null,
                                React.createElement(Label, { htmlFor: "email" }, "Email"),
                                React.createElement(Input, {
                                    id: "email",
                                    name: "email",
                                    type: "email",
                                    value: formData.email,
                                    onChange: handleInputChange,
                                    placeholder: "Enter your email"
                                })
                            )
                        ),

                        React.createElement("div", null,
                            React.createElement(Label, null, "Theme"),
                            React.createElement(Select, {
                                name: "theme",
                                value: formData.theme,
                                onChange: handleInputChange
                            },
                                React.createElement("option", { value: "light" }, "Light"),
                                React.createElement("option", { value: "dark" }, "Dark"),
                                React.createElement("option", { value: "system" }, "System")
                            )
                        ),

                        React.createElement("div", { className: "flex items-center gap-2" },
                            React.createElement(Checkbox, {
                                id: "subscribe",
                                name: "subscribe",
                                checked: formData.subscribe,
                                onCheckedChange: function (checked) {
                                    handleInputChange({
                                        target: {
                                            name: "subscribe",
                                            type: "checkbox",
                                            checked: checked
                                        }
                                    });
                                }
                            }),
                            React.createElement(Label, { htmlFor: "subscribe", className: "ml-2" }, "Subscribe to updates")
                        ),

                        React.createElement("div", null,
                            React.createElement(Label, null, "Comments"),
                            React.createElement(TextArea, {
                                name: "comments",
                                value: formData.comments,
                                onChange: handleInputChange,
                                placeholder: "Enter your comments"
                            })
                        ),

                        React.createElement(Button, {
                            onClick: function () {
                                window.alert("Form submitted!");
                            },
                            className: "mt-2"
                        }, "Submit Form")
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Data Display")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("div", { className: "flex flex-wrap gap-2" },
                        React.createElement(Badge, null, "Default"),
                        React.createElement(Badge, { variant: "success" }, "Success"),
                        React.createElement(Badge, { variant: "destructive" }, "Error"),
                        React.createElement(Badge, { variant: "warning" }, "Warning"),
                        React.createElement(Badge, { variant: "info" }, "Info")
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", null, "Progress"),
                        React.createElement(Progress, { value: progress, className: "flex-1 mx-2" }),
                        React.createElement("span", null, progress + "%")
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(StatusIndicator, { status: "online" }, "Online"),
                        React.createElement(StatusIndicator, { status: "offline" }, "Offline"),
                        React.createElement(StatusIndicator, { status: "maintenance" }, "Maintenance")
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Table")
                ),
                React.createElement(CardContent, null,
                    React.createElement(Table, null,
                        React.createElement("thead", null,
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, { className: "font-bold" }, "Name"),
                                React.createElement(TableCell, { className: "font-bold" }, "Status"),
                                React.createElement(TableCell, { className: "font-bold" }, "Value"),
                                React.createElement(TableCell, { className: "font-bold" }, "Actions")
                            )
                        ),
                        React.createElement("tbody", null,
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, null, "Item 1"),
                                React.createElement(TableCell, null, React.createElement(Badge, { variant: "success" }, "Active")),
                                React.createElement(TableCell, null, "100"),
                                React.createElement(TableCell, null, React.createElement(Button, null, "Edit"))
                            ),
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, null, "Item 2"),
                                React.createElement(TableCell, null, React.createElement(Badge, { variant: "destructive" }, "Inactive")),
                                React.createElement(TableCell, null, "50"),
                                React.createElement(TableCell, null, React.createElement(Button, null, "Edit"))
                            )
                        )
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Charts")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("div", { className: "h-64" },
                        React.createElement(LineChart, {
                            data: chartData,
                            xField: "month",
                            yField: "value",
                            title: "Monthly Performance"
                        })
                    ),
                    React.createElement("div", { className: "h-64" },
                        React.createElement(BarChart, {
                            data: chartData,
                            xField: "month",
                            yField: "value",
                            title: "Monthly Values"
                        })
                    ),
                    React.createElement("div", { className: "flex justify-center" },
                        React.createElement(Gauge, {
                            value: progress,
                            max: 100,
                            title: "System Load"
                        })
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Interactive Components")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("div", { className: "flex flex-wrap gap-2" },
                        React.createElement(Button, null, "Primary"),
                        React.createElement(Button, null, "Outline"),
                        React.createElement(Button, null, "Secondary"),
                        React.createElement(Button, null, "Ghost"),
                        React.createElement(Button, null, "Link")
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Switch, {
                            id: "theme-toggle",
                            checked: formData.theme === "dark",
                            onCheckedChange: function (checked) {
                                handleInputChange({
                                    target: {
                                        name: "theme",
                                        value: checked ? "dark" : "light"
                                    }
                                });
                            }
                        }),
                        React.createElement(Label, { htmlFor: "theme-toggle" }, "Dark Mode")
                    ),
                    React.createElement(Slider, {
                        min: 0,
                        max: 100,
                        step: 1,
                        value: progress,
                        onValueChange: setProgress,
                        className: "w-full"
                    })
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Navigation")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement(Breadcrumb, null,
                        React.createElement(BreadcrumbItem, null, "Home"),
                        React.createElement(BreadcrumbItem, null, "Components"),
                        React.createElement(BreadcrumbItem, null, "Demo")
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex gap-2" },
                        ["components", "settings", "logs"].map(function (tab) {
                            return React.createElement(Button, {
                                key: tab,
                                onClick: function () {
                                    setActiveTab(tab);
                                },
                                className: activeTab === tab ? "bg-white/10" : ""
                            }, tab.charAt(0).toUpperCase() + tab.slice(1));
                        })
                    ),
                    React.createElement(Pagination, {
                        currentPage: 1,
                        totalPages: 5,
                        onPageChange: function (page) {
                            console.log("Page:", page);
                        }
                    })
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Modal & Popover")
                ),
                React.createElement(CardContent, { className: "flex flex-wrap gap-2" },
                    React.createElement(Button, {
                        onClick: function () {
                            setShowModal(true);
                        }
                    }, "Open Modal"),
                    React.createElement(Popover, {
                        trigger: React.createElement(Button, null, "Popover")
                    },
                        React.createElement("div", { className: "p-2" },
                            React.createElement("p", null, "This is popover content")
                        )
                    )
                )
            ),

            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Loading States")
                ),
                React.createElement(CardContent, { className: "flex items-center justify-center h-20" },
                    React.createElement(Spinner, null, "Loading...")
                )
            ),

            showModal && React.createElement(Modal, {
                open: true,
                onOpenChange: setShowModal,
                title: "Example Modal",
                description: "This is an example of a modal dialog"
            },
                React.createElement("div", { className: "p-4" },
                    React.createElement("p", null, "Modal content goes here"),
                    React.createElement(Button, {
                        onClick: function () {
                            setShowModal(false);
                        },
                        className: "mt-4"
                    }, "Close")
                )
            )
        );
    }

    const registrationTarget = window.__HERMES_PLUGINS__ || {
        register: function () {}
    };

    if (registrationTarget.register) {
        registrationTarget.register("monitoring", PluginDemoPage);
    }
})();