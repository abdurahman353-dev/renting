"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Wifi,
    Car,
    Dumbbell,
    Utensils,
    MapPin,
    Phone,
    Mail,
    CheckCircle2,
    XCircle,
    BedDouble,
    Bath,
    Maximize,
    Home,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";

// Mock Data
const MOCK_PROPERTY = {
    id: "1",
    name: "Sunset Heights Apartments",
    address: "123 Sunset Blvd, Los Angeles, CA 90026",
    description:
        "Experience luxury living at Sunset Heights. Our modern apartments feature high-end finishes, spacious layouts, and breathtaking views of the city. Residents enjoy access to a state-of-the-art fitness center, rooftop pool, and 24/7 concierge service. Located in the heart of Silver Lake, you're just steps away from trendy cafes, boutiques, and nightlife.",
    priceRange: "$2,500 - $4,200",
    status: "Active",
    images: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512918760532-3ed4627771bd?q=80&w=2070&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1484154218962-a1c00207099b?q=80&w=2074&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop",
    ],
    amenities: [
        { icon: Wifi, label: "High-Speed Wifi" },
        { icon: Car, label: "Covered Parking" },
        { icon: Dumbbell, label: "Fitness Center" },
        { icon: Utensils, label: "Modern Kitchen" },
        { icon: Maximize, label: "Spacious Layouts" },
        { icon: Home, label: "Pet Friendly" },
    ],
    units: [
        {
            id: "101",
            number: "101",
            type: "1 Bedroom",
            status: "Occupied",
            price: "$2,500",
            bedrooms: 1,
            bathrooms: 1,
            sqft: 750,
        },
        {
            id: "102",
            number: "102",
            type: "2 Bedroom",
            status: "Vacant",
            price: "$3,200",
            bedrooms: 2,
            bathrooms: 2,
            sqft: 1100,
        },
        {
            id: "201",
            number: "201",
            type: "Studio",
            status: "Available",
            price: "$1,800",
            bedrooms: 0,
            bathrooms: 1,
            sqft: 500,
        },
        {
            id: "202",
            number: "202",
            type: "Penthouse",
            status: "Maintenance",
            price: "$4,200",
            bedrooms: 3,
            bathrooms: 2.5,
            sqft: 1800,
        },
    ],
};

export default function PropertyViewPage() {
    const params = useParams();
    // In a real app, fetch property by params.id
    const property = MOCK_PROPERTY;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px] rounded-xl overflow-hidden">
                <div className="md:col-span-2 h-full relative group cursor-pointer">
                    <img
                        src={property.images[0]}
                        alt={property.name}

                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <Button variant="secondary" size="sm">
                            View All Photos
                        </Button>
                    </div>
                </div>
                <div className="hidden md:grid grid-rows-2 gap-4 h-full">
                    <div className="relative h-full group cursor-pointer overflow-hidden">
                        <img
                            src={property.images[1]}
                            alt="Interior"

                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="relative h-full group cursor-pointer overflow-hidden">
                        <img
                            src={property.images[2]}
                            alt="Kitchen"

                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                </div>
                <div className="hidden md:grid grid-rows-2 gap-4 h-full">
                    <div className="relative h-full group cursor-pointer overflow-hidden">
                        <img
                            src={property.images[3]}
                            alt="Bedroom"

                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                    <div className="relative h-full bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                        <span className="text-slate-500 font-medium">+5 More</span>
                    </div>
                </div>
            </div>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{property.name}</h1>
                    <div className="flex items-center text-slate-500 mt-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{property.address}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge
                        variant={property.status === "Active" ? "default" : "secondary"}
                        className="text-base px-4 py-1"
                    >
                        {property.status}
                    </Badge>
                    <Button>Edit Property</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Details */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="units">Units</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-8">
                            {/* Description */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>About this Property</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed">
                                        {property.description}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Amenities */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Amenities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {property.amenities.map((amenity, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center p-3 bg-slate-50 rounded-lg border border-slate-100"
                                            >
                                                <amenity.icon className="w-5 h-5 text-primary mr-3" />
                                                <span className="text-slate-700 font-medium">
                                                    {amenity.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="units">
                            {/* Units List */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Units</CardTitle>
                                    <Button variant="outline" size="sm">
                                        Add Unit
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Details</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {property.units.map((unit) => (
                                                <TableRow key={unit.id}>
                                                    <TableCell className="font-medium">
                                                        {unit.number}
                                                    </TableCell>
                                                    <TableCell>{unit.type}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                unit.status === "Available"
                                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                                    : unit.status === "Occupied"
                                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                        : "bg-slate-100 text-slate-700"
                                                            }
                                                        >
                                                            {unit.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{unit.price}</TableCell>
                                                    <TableCell className="text-slate-500 text-sm">
                                                        {unit.bedrooms} Bed • {unit.bathrooms} Bath •{" "}
                                                        {unit.sqft} sqft
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
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Quick Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-slate-500">Price Range</span>
                                <span className="font-semibold">{property.priceRange}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-slate-500">Total Units</span>
                                <span className="font-semibold">{property.units.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-slate-500">Occupancy</span>
                                <span className="font-semibold">75%</span>
                            </div>
                            <div className="pt-4">
                                <Button className="w-full mb-2">Manage Tenants</Button>
                                <Button variant="outline" className="w-full">
                                    Financial Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Property Manager</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-slate-500" />
                                </div>
                                <div>
                                    <p className="font-semibold">Sarah Johnson</p>
                                    <p className="text-sm text-slate-500">Senior Property Manager</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-slate-600"
                                >
                                    <Phone className="w-4 h-4 mr-2" />
                                    (555) 123-4567
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-slate-600"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    sarah.j@rentsys.com
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

