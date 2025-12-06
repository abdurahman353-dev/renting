'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Activity, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuperAdminDashboard() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/super-admin/admins">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create New Admin
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            +2 from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">
                            Currently online
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">245</div>
                        <p className="text-xs text-muted-foreground">
                            +19% from last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { admin: "Alice Smith", action: "Created new property 'Sunset Villa'", time: "2 hours ago" },
                                { admin: "Bob Jones", action: "Suspended tenant 'John Doe'", time: "5 hours ago" },
                                { admin: "Alice Smith", action: "Updated financial settings", time: "1 day ago" },
                                { admin: "System", action: "Backup completed", time: "1 day ago" },
                            ].map((log, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{log.admin}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {log.action}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm text-muted-foreground">{log.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Admins
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <Activity className="mr-2 h-4 w-4" />
                            View System Logs
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Security Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
