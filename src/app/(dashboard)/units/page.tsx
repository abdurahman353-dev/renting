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
import { Search, Plus, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

// Mock Data
const UNITS = [
    {
        id: "101",
        number: "101",
        property: "Sunset Heights Apartments",
        type: "1 Bedroom",
        status: "Occupied",
        price: "$2,500",
        tenant: "John Doe",
    },
    {
        id: "102",
        number: "102",
        property: "Sunset Heights Apartments",
        type: "2 Bedroom",
        status: "Vacant",
        price: "$3,200",
        tenant: "-",
    },
    {
        id: "201",
        number: "201",
        property: "Sunset Heights Apartments",
        type: "Studio",
        status: "Available",
        price: "$1,800",
        tenant: "-",
    },
    {
        id: "A1",
        number: "A1",
        property: "Green Valley Estate",
        type: "3 Bedroom",
        status: "Occupied",
        price: "$4,500",
        tenant: "Alice Smith",
    },
    {
        id: "B2",
        number: "B2",
        property: "Green Valley Estate",
        type: "2 Bedroom",
        status: "Maintenance",
        price: "$3,000",
        tenant: "-",
    },
];

export default function UnitsPage() {
    const router = useRouter();

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Units</h2>
                    <p className="text-muted-foreground">
                        Manage all residential units across properties.
                    </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Unit
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search units..."
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Unit Number</TableHead>
                                <TableHead>Property</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {UNITS.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">{unit.number}</TableCell>
                                    <TableCell>{unit.property}</TableCell>
                                    <TableCell>{unit.type}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                unit.status === "Available"
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : unit.status === "Occupied"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : unit.status === "Vacant"
                                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                            : "bg-slate-100 text-slate-700"
                                            }
                                        >
                                            {unit.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{unit.price}</TableCell>
                                    <TableCell>{unit.tenant}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/units/${unit.id}`)}
                                        >
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
