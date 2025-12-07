"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";

// Mock Data
const TENANTS = [
    {
        id: "1",
        name: "John Doe",
        unit: "101",
        property: "Sunset Heights Apartments",
        leaseStart: "2024-01-15",
        leaseEnd: "2025-01-14",
        status: "Active",
        balance: "$0.00",
    },
    {
        id: "2",
        name: "Alice Smith",
        unit: "A1",
        property: "Green Valley Estate",
        leaseStart: "2023-06-01",
        leaseEnd: "2024-05-31",
        status: "Active",
        balance: "$4,500.00",
    },
    {
        id: "3",
        name: "Robert Johnson",
        unit: "205",
        property: "Ocean View Residency",
        leaseStart: "2023-03-10",
        leaseEnd: "2024-03-09",
        status: "Late",
        balance: "$1,200.00",
    },
    {
        id: "4",
        name: "Emily Davis",
        unit: "B2",
        property: "Green Valley Estate",
        leaseStart: "2022-11-01",
        leaseEnd: "2023-10-31",
        status: "Past",
        balance: "$0.00",
    },
];

export default function TenantsReportPage() {
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenants Report</h2>
                    <p className="text-muted-foreground">
                        View detailed reports and analytics for your tenants.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> Export All
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tenants
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">40</div>
                        <p className="text-xs text-muted-foreground">+3 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Leases
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">38</div>
                        <p className="text-xs text-muted-foreground">+2 from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">$5,700</div>
                        <p className="text-xs text-muted-foreground">Across 3 tenants</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search tenants..."
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Lease Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {TENANTS.map((tenant) => (
                                <TableRow
                                    key={tenant.id}
                                    className="cursor-pointer hover:bg-slate-50"
                                    onClick={() => router.push(`/reports/tenants/${tenant.id}`)}
                                >
                                    <TableCell className="font-medium">{tenant.name}</TableCell>
                                    <TableCell>{tenant.property}</TableCell>
                                    <TableCell>{tenant.unit}</TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {tenant.leaseStart} - {tenant.leaseEnd}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                tenant.status === "Active"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : tenant.status === "Late"
                                                        ? "bg-red-50 text-red-700 border-red-200"
                                                        : "bg-slate-100 text-slate-700"
                                            }
                                        >
                                            {tenant.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell
                                        className={
                                            tenant.balance !== "$0.00"
                                                ? "text-red-600 font-medium"
                                                : ""
                                        }
                                    >
                                        {tenant.balance}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
