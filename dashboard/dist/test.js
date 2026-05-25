(function () {
    "use strict";

    // Software Development Kit
    const SDK = window.__HERMES_PLUGIN_SDK__ || {};
    const { React } = SDK;

    // Defensive component loading with fallbacks
    const components = SDK.components || {};
    const {
        Card, CardHeader, CardTitle, CardContent,
        Badge, Button, Input, TextArea, Select, Checkbox, Switch, Slider,
        Table, TableRow, TableCell, Tabs, Tab,
        Alert, AlertTitle, AlertDescription, Progress,
        Spinner, Divider, Tooltip, Modal, Popover,
        Chart, LineChart, BarChart, Gauge, StatusIndicator,
        Grid, GridItem, Flex, Box, Container, Section,
        Breadcrumb, BreadcrumbItem, Pagination,
        IconButton, Label, List, ListItem
    } = components;

    // Hooks with defensive null checks
    const hooks = SDK.hooks || {};
    const { useState, useEffect, useRef } = hooks;

    // Fallback fetch function
    const fetchJSON = SDK.fetchJSON || function (url, options) {
        return fetch(url, options).then(res => res.json());
    };

    // Plugin Demo Page
    function PluginDemoPage() {
        const [activeTab, setActiveTab] = useState("components");
        const [showModal, setShowModal] = useState(false);
        const [progress, setProgress] = useState(0);
        const [alerts, setAlerts] = useState([]);
        const [formData, setFormData] = useState({
            name: "",
            email: "",
            subscribe: false,
            theme: "light"
        });

        // Simulate progress
        useEffect(() => {
            const interval = setInterval(() => {
                setProgress(prev => prev >= 100 ? 0 : prev + 10);
            }, 1000);
            return () => clearInterval(interval);
        }, []);

        // Add alert
        function addAlert(type) {
            const id = Date.now();
            setAlerts(prev => [...prev, {
                id, type, message: `This is a ${type}
alert` }]);
            setTimeout(() => {
                setAlerts(prev => prev.filter(alert => alert.id !== id));
            }, 5000);
        }
        // Handle form input
        function handleInputChange(e) {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        // Demo data for charts
        const chartData = [
            { month: 'Jan', value: 30 },
            { month: 'Feb', value: 45 },
            { month: 'Mar', value: 28 },
            { month: 'Apr', value: 60 },
            { month: 'May', value: 50 }
        ];

        return React.createElement("div", { className: "flex flex-col gap-6 p-4" },
            // Header
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, { className: "text-xl font-bold" }, "Hermes UI Components Demo")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("p", { className: "text-sm text-muted-foreground" },
                        "This demo showcases all available UI components in the Hermes dashboard framework."
                    )
                )
            ),

            // Alert Demos
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Alerts & Feedback")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-3" },
                    React.createElement(Flex, { className: "flex-wrap gap-2" },
                        React.createElement(Button, {
                            onClick: () => addAlert("success"),
                            variant: "success"
                        }, "Success Alert"),
                        React.createElement(Button, {
                            onClick: () => addAlert("destructive"),
                            variant: "destructive"
                        }, "Error Alert"),
                        React.createElement(Button, {
                            onClick: () => addAlert("warning"),
                            variant: "warning"
                        }, "Warning Alert"),
                        React.createElement(Button, {
                            onClick: () => addAlert("info"),
                            variant: "info"
                        }, "Info Alert")
                    ),
                    alerts.map(alert =>
                        React.createElement(Alert, {
                            key: alert.id,
                            variant: alert.type
                        },
                            React.createElement(AlertTitle, null,
                                alert.type.charAt(0).toUpperCase() + alert.type.slice(1)
                            ),
                            React.createElement(AlertDescription, null, alert.message)
                        )
                    )
                )
            ),

            // Form Components
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
                                value: formData.theme,
                                onChange: (e) => handleInputChange({ target: { name: "theme", value: e.target.value } })
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
                                onCheckedChange: (checked) => handleInputChange({ target: { name: "subscribe", type: "checkbox", checked } })
                            }),
                            React.createElement(Label, { htmlFor: "subscribe", className: "ml-2" }, "Subscribe to updates")
                        ),
                        React.createElement("div", null,
                            React.createElement(Label, null, "Comments"),
                            React.createElement(TextArea, {
                                value: formData.comments,
                                onChange: (e) => handleInputChange({ target: { name: "comments", value: e.target.value } }),
                                placeholder: "Enter your comments"
                            })
                        ),
                        React.createElement(Button, {
                            onClick: () => alert("Form submitted!"),
                            className: "mt-2"
                        }, "Submit Form")
                    )
                )
            ),
            // Data Display
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
                        React.createElement("span", null, `${progress}%`)
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(StatusIndicator, { status: "online" }, "Online"),
                        React.createElement(StatusIndicator, { status: "offline" }, "Offline"),
                        React.createElement(StatusIndicator, { status: "maintenance" }, "Maintenance")
                    )
                )
            ),
            // Table
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
                                React.createElement(TableCell, null,
                                    React.createElement(Badge, { variant: "success" }, "Active")
                                ),
                                React.createElement(TableCell, null, "100"),
                                React.createElement(TableCell, null,
                                    React.createElement(Button, { size: "sm", variant: "outline" }, "Edit")
                                )
                            ),
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, null, "Item 2"),
                                React.createElement(TableCell, null,
                                    React.createElement(Badge, { variant: "destructive" }, "Inactive")
                                ),
                                React.createElement(TableCell, null, "50"),
                                React.createElement(TableCell, null,
                                    React.createElement(Button, { size: "sm", variant: "outline" }, "Edit")
                                )
                            )
                        )
                    )
                )
            ),

            // Charts
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
            // Interactive Components
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Interactive Components")
                ),
                React.createElement(CardContent, { className: "flex flex-col gap-4" },
                    React.createElement("div", { className: "flex flex-wrap gap-2" },
                        React.createElement(Button, null, "Primary"),
                        React.createElement(Button, { variant: "outline" }, "Outline"),
                        React.createElement(Button, { variant: "secondary" }, "Secondary"),
                        React.createElement(Button, { variant: "ghost" }, "Ghost"),
                        React.createElement(Button, { variant: "link" }, "Link")
                    ),
                    React.createElement(Divider, null),
                    React.createElement("div", { className: "flex items-center gap-2" },
                        React.createElement(Switch, {
                            id: "theme-toggle",
                            checked: formData.theme === "dark",
                            onCheckedChange: (checked) => handleInputChange({ target: { name: "theme", value: checked ? "dark" : "light" } })
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

            // Navigation
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
                    React.createElement(Tabs, { value: activeTab, onValueChange: setActiveTab },
                        React.createElement(Tab, { value: "components" }, "Components"),
                        React.createElement(Tab, { value: "settings" }, "Settings"),
                        React.createElement(Tab, { value: "logs" }, "Logs")
                    ),
                    React.createElement(Pagination, {
                        currentPage: 1,
                        totalPages: 5,
                        onPageChange: (page) => console.log("Page:", page)
                    })
                )
            ),

            // Modal Example
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Modal & Popover")
                ),
                React.createElement(CardContent, { className: "flex flex-wrap gap-2" },
                    React.createElement(Button, {
                        onClick: () => setShowModal(true)
                    }, "Open Modal"),
                    React.createElement(Popover, {
                        trigger: React.createElement(Button, null, "Popover")
                    },
                        React.createElement("div", { className: "p-2" },
                            React.createElement("p", null, "This is a popover content")
                        )
                    )
                )
            ),

            // Spinner
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, "Loading States")
                ),
                React.createElement(CardContent, { className: "flex items-center justify-center h-20" },
                    React.createElement(Spinner, null, "Loading...")
                )
            ),

            // Modal
            showModal && React.createElement(Modal, {
                open: true,
                onOpenChange: setShowModal,
                title: "Example Modal",
                description: "This is an example of a modal dialog"
            },
                React.createElement("div", { className: "p-4" },
                    React.createElement("p", null, "Modal content goes here"),
                    React.createElement(Button, {
                        onClick: () => setShowModal(false),
                        className: "mt-4"
                    }, "Close")
                )
            )
        );
    }

    // Register the component
    const registrationTarget = window.__HERMES_PLUGINS__ || { register: function () { } };
    if (registrationTarget.register) {
        registrationTarget.register("monitoring", PluginDemoPage);
    }
})();
