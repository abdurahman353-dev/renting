"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BedDouble,
    Bath,
    Maximize,
    Home,
    User,
    History,
    FileText,
    Wrench,
    DollarSign,
    Calendar,
} from "lucide-react";
import { useParams } from "next/navigation";

// Mock Data
const MOCK_UNIT = {
    id: "101",
    number: "101",
    property: "Sunset Heights Apartments",
    type: "1 Bedroom",
    status: "Occupied",
    price: "$2,500",
    deposit: "$2,500",
    size: "750 sqft",
    bedrooms: 1,
    bathrooms: 1,
    features: [
        "Balcony",
        "In-unit Washer/Dryer",
        "City View",
        "Recently Renovated",
    ],
    tenant: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "(555) 987-6543",
        moveInDate: "Jan 15, 2024",
        leaseEnd: "Jan 14, 2025",
    },
    history: [
        {
            date: "2024-01-15",
            type: "Lease Started",
            description: "John Doe moved in",
        },
        {
            date: "2023-12-20",
            type: "Maintenance",
            description: "Painted walls and replaced carpet",
        },
        {
            date: "2023-12-01",
            type: "Lease Ended",
            description: "Previous tenant moved out",
        },
    ],
};

export default function UnitDetailsPage() {
    const params = useParams();
    const unit = MOCK_UNIT;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                            {unit.property}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Unit {unit.number}
                    </h1>
                    <div className="flex items-center text-slate-500 mt-2">
                        <span className="flex items-center mr-4">
                            <BedDouble className="w-4 h-4 mr-1" /> {unit.bedrooms} Bed
                        </span>
                        <span className="flex items-center mr-4">
                            <Bath className="w-4 h-4 mr-1" /> {unit.bathrooms} Bath
                        </span>
                        <span className="flex items-center">
                            <Maximize className="w-4 h-4 mr-1" /> {unit.size}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge
                        variant={unit.status === "Occupied" ? "default" : "secondary"}
                        className="text-base px-4 py-1"
                    >
                        {unit.status}
                    </Badge>
                    <Button>Edit Unit</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Unit Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Unit Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Monthly Rent</span>
                                    <span className="font-semibold">{unit.price}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Security Deposit</span>
                                    <span className="font-semibold">{unit.deposit}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Unit Type</span>
                                    <span className="font-semibold">{unit.type}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3 text-slate-900">Features</h4>
                                <ul className="space-y-2">
                                    {unit.features.map((feature, index) => (
                                        <li key={index} className="flex items-center text-slate-600">
                                            <Home className="w-4 h-4 mr-2 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {unit.history.map((event, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="mt-1">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <History className="w-4 h-4 text-slate-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{event.type}</p>
                                            <p className="text-slate-500 text-sm">
                                                {event.description}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                {event.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Current Tenant */}
                    {unit.status === "Occupied" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Tenant</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{unit.tenant.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {unit.tenant.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" /> Move In
                                        </span>
                                        <span className="font-medium">{unit.tenant.moveInDate}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" /> Lease End
                                        </span>
                                        <span className="font-medium">{unit.tenant.leaseEnd}</span>
                                    </div>
                                    <div className="pt-4">
                                        <Button variant="outline" className="w-full">
                                            View Lease Agreement
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button className="w-full justify-start" variant="outline">
                                <FileText className="w-4 h-4 mr-2" /> Create Lease
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <Wrench className="w-4 h-4 mr-2" /> Request Maintenance
                            </Button>
                            <Button className="w-full justify-start" variant="outline">
                                <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
