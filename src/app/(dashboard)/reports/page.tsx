"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
} from "recharts"

const revenueData = [
    { name: "Jan", total: 120000 },
    { name: "Feb", total: 135000 },
    { name: "Mar", total: 128000 },
    { name: "Apr", total: 142000 },
    { name: "May", total: 150000 },
    { name: "Jun", total: 165000 },
    { name: "Jul", total: 170000 },
    { name: "Aug", total: 155000 },
    { name: "Sep", total: 180000 },
    { name: "Oct", total: 195000 },
    { name: "Nov", total: 210000 },
    { name: "Dec", total: 230000 },
]

const occupancyData = [
    { name: "Jan", rate: 85 },
    { name: "Feb", rate: 88 },
    { name: "Mar", rate: 87 },
    { name: "Apr", rate: 90 },
    { name: "May", rate: 92 },
    { name: "Jun", rate: 95 },
    { name: "Jul", rate: 94 },
    { name: "Aug", rate: 93 },
    { name: "Sep", rate: 96 },
    { name: "Oct", rate: 97 },
    { name: "Nov", rate: 98 },
    { name: "Dec", rate: 98 },
]

export default function ReportsPage() {
    return (
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-muted-foreground">Visualize your business performance.</p>
                </div>
                <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" /> Last 12 Months
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `KES ${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`KES ${value.toLocaleString()}`, "Revenue"]}
                                        contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'var(--muted)' }}
                                    />
                                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Occupancy Rate (%)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={occupancyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="var(--muted-foreground)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value}%`, "Occupancy"]}
                                        contentStyle={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--background)', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
