"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Sparkles, TrendingUp, Building2 } from "lucide-react";
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
    Home,
    Zap,
    Wind,
    Droplets,
    Shield,
    Users,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import AddPropertyModal from "@/components/AddPropertyModal";

// Enhanced icon mapping with vibrant colors
const AMENITY_ICONS: Record<string, { icon: any; color: string; bgColor: string }> = {
    "High-Speed WiFi": { icon: Wifi, color: "text-blue-600", bgColor: "bg-blue-50" },
    "Covered Parking": { icon: Car, color: "text-purple-600", bgColor: "bg-purple-50" },
    "Fitness Center": { icon: Dumbbell, color: "text-red-600", bgColor: "bg-red-50" },
    "Modern Kitchen": { icon: Utensils, color: "text-orange-600", bgColor: "bg-orange-50" },
    "Pet Friendly": { icon: Home, color: "text-green-600", bgColor: "bg-green-50" },
    "Generator/Backup Power": { icon: Zap, color: "text-yellow-600", bgColor: "bg-yellow-50" },
    "Air Conditioning": { icon: Wind, color: "text-cyan-600", bgColor: "bg-cyan-50" },
    "Security": { icon: Shield, color: "text-indigo-600", bgColor: "bg-indigo-50" },
    "24/7 Concierge Service": { icon: Users, color: "text-pink-600", bgColor: "bg-pink-50" },
    "Rooftop Pool": { icon: Droplets, color: "text-teal-600", bgColor: "bg-teal-50" },
};

interface Property {
    id: number;
    name: string;
    location: string;
    full_address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    description?: string;
    property_type?: string;
    year_built?: number;
    floors?: number;
    parking_spaces?: number;
    pet_policy?: string;
    min_rent?: number;
    max_rent?: number;
    security_deposit?: number;
    service_charge?: number;
    property_manager?: string;
    status?: string;
    owner_name?: string;
    owner_contact?: string;
    owner_email?: string;
    total_units: number;
    featured_image_url?: string;
    image_urls?: string[];
    images?: any[];
    amenities?: any[];
    units?: any[];
}

export default function PropertyViewPage() {
    const params = useParams();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const fetchProperty = async () => {
        try {
            const response = await api.get(`/properties/${params.id}`);
            setProperty(response.data);
        } catch (error) {
            console.error("Failed to fetch property:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchProperty();
        }
    }, [params.id]);

    const handleEditSuccess = () => {
        fetchProperty();
        setEditModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
                <div className="text-center">
                    <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-xl font-semibold">Property not found</p>
                </div>
            </div>
        );
    }

    const fullAddress = property.full_address ||
        [property.city, property.state, property.postal_code]
            .filter(Boolean)
            .join(", ") ||
        property.location;

    const images = property.image_urls && property.image_urls.length > 0
        ? property.image_urls
        : property.featured_image_url
            ? [property.featured_image_url]
            : ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"];

    const priceRange = property.min_rent && property.max_rent
        ? `KES ${property.min_rent.toLocaleString()} - ${property.max_rent.toLocaleString()}`
        : property.min_rent
            ? `KES ${property.min_rent.toLocaleString()}`
            : "Contact for pricing";

    const occupiedUnits = property.units?.filter(u => u.status === 'occupied').length || 0;
    const occupancyRate = property.total_units > 0
        ? Math.round((occupiedUnits / property.total_units) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Premium Hero Section with Gradient Overlay */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[550px]">
                        <div className="md:col-span-2 h-full relative group">
                            <img
                                src={images[0]}
                                alt={property.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <span className="text-yellow-400 font-semibold text-sm">Premium Property</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-white/90 backdrop-blur-sm hover:bg-white"
                                >
                                    View All {images.length} Photos
                                </Button>
                            </div>
                        </div>
                        {images.length > 1 && (
                            <>
                                <div className="hidden md:grid grid-rows-2 gap-3">
                                    <div className="relative group overflow-hidden rounded-xl">
                                        <img
                                            src={images[1]}
                                            alt="Interior"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    {images.length > 2 && (
                                        <div className="relative group overflow-hidden rounded-xl">
                                            <img
                                                src={images[2]}
                                                alt="Kitchen"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                    )}
                                </div>
                                {images.length > 3 && (
                                    <div className="hidden md:grid grid-rows-2 gap-3">
                                        <div className="relative group overflow-hidden rounded-xl">
                                            <img
                                                src={images[3]}
                                                alt="Bedroom"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        {images.length > 4 && (
                                            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300 rounded-xl group">
                                                <div className="text-center text-white">
                                                    <p className="text-4xl font-bold mb-2">+{images.length - 4}</p>
                                                    <p className="text-sm font-medium">More Photos</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Header with Glassmorphism */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-white/20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                                {property.name}
                            </h1>
                            <div className="flex items-center text-slate-600 gap-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <span className="text-lg">{fullAddress}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                className={`text-base px-6 py-2 font-semibold shadow-lg ${property.status === "active"
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                                    : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0"
                                    }`}
                            >
                                {property.status || "Active"}
                            </Badge>
                            <Button
                                onClick={() => setEditModalOpen(true)}
                                className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white shadow-xl px-8 py-6 text-base font-semibold"
                            >
                                Edit Property
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-xl p-2 rounded-xl shadow-lg border border-white/20">
                                <TabsTrigger
                                    value="overview"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="units"
                                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg font-semibold"
                                >
                                    Units
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 mt-6">
                                {/* Description with Premium Card */}
                                {property.description && (
                                    <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                                            <CardTitle className="text-2xl font-bold text-slate-800">About this Property</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <p className="text-slate-700 leading-relaxed text-lg">
                                                {property.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Property Details with Gradient Accents */}
                                <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                                        <CardTitle className="text-2xl font-bold text-slate-800">Property Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {property.property_type && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                                                    <span className="text-slate-600 font-medium">Type</span>
                                                    <span className="font-bold text-slate-900">{property.property_type}</span>
                                                </div>
                                            )}
                                            {property.year_built && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                                    <span className="text-slate-600 font-medium">Year Built</span>
                                                    <span className="font-bold text-slate-900">{property.year_built}</span>
                                                </div>
                                            )}
                                            {property.floors && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                                    <span className="text-slate-600 font-medium">Floors</span>
                                                    <span className="font-bold text-slate-900">{property.floors}</span>
                                                </div>
                                            )}
                                            {property.parking_spaces && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                                                    <span className="text-slate-600 font-medium">Parking Spaces</span>
                                                    <span className="font-bold text-slate-900">{property.parking_spaces}</span>
                                                </div>
                                            )}
                                            {property.pet_policy && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl col-span-2">
                                                    <span className="text-slate-600 font-medium">Pet Policy</span>
                                                    <span className="font-bold text-slate-900">{property.pet_policy}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Vibrant Amenities */}
                                {property.amenities && property.amenities.length > 0 && (
                                    <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                                            <CardTitle className="text-2xl font-bold text-slate-800">Premium Amenities</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {property.amenities.map((amenity: any, index: number) => {
                                                    const amenityConfig = AMENITY_ICONS[amenity.amenity_name] || {
                                                        icon: Home,
                                                        color: "text-slate-600",
                                                        bgColor: "bg-slate-50"
                                                    };
                                                    const IconComponent = amenityConfig.icon;
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`flex items-center gap-3 p-4 ${amenityConfig.bgColor} rounded-xl border-2 border-transparent hover:border-current hover:shadow-lg transition-all duration-300 group cursor-pointer`}
                                                        >
                                                            <IconComponent className={`w-6 h-6 ${amenityConfig.color} group-hover:scale-110 transition-transform duration-300`} />
                                                            <span className="text-slate-800 font-semibold text-sm">
                                                                {amenity.amenities}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="units" className="mt-6">
                                <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-2xl font-bold text-slate-800">Units</CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            + Add Unit
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {property.units && property.units.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50">
                                                            <TableHead className="font-bold text-slate-700">Unit</TableHead>
                                                            <TableHead className="font-bold text-slate-700">Status</TableHead>
                                                            <TableHead className="font-bold text-slate-700">Price</TableHead>
                                                            <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {property.units.map((unit: any) => (
                                                            <TableRow key={unit.id} className="hover:bg-blue-50/50 transition-colors">
                                                                <TableCell className="font-bold text-slate-900">
                                                                    {unit.unit_number}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        className={`font-semibold ${unit.status === "vacant"
                                                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                                                                            : unit.status === "occupied"
                                                                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
                                                                                : "bg-gradient-to-r from-slate-400 to-slate-500 text-white border-0"
                                                                            }`}
                                                                    >
                                                                        {unit.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-semibold text-slate-900">
                                                                    KES {unit.price?.toLocaleString() || 'N/A'}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="hover:bg-blue-100 hover:text-blue-700 font-semibold"
                                                                    >
                                                                        View
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-center py-12 text-lg">No units available</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column - Premium Sidebar */}
                    <div className="space-y-6">
                        {/* Property Summary with Gradient */}
                        <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl border-0 hover:shadow-3xl transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                    <TrendingUp className="w-6 h-6" />
                                    Property Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-white/20">
                                    <span className="text-blue-100 font-medium">Price Range</span>
                                    <span className="font-bold text-xl">{priceRange}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/20">
                                    <span className="text-blue-100 font-medium">Total Units</span>
                                    <span className="font-bold text-xl">{property.total_units}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-white/20">
                                    <span className="text-blue-100 font-medium">Occupancy</span>
                                    <span className="font-bold text-xl">{occupancyRate}%</span>
                                </div>
                                {property.security_deposit && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/20">
                                        <span className="text-blue-100 font-medium">Security Deposit</span>
                                        <span className="font-bold text-xl">KES {property.security_deposit.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 space-y-3">
                                    <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold py-6 text-base shadow-lg">
                                        Manage Tenants
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold py-6 text-base"
                                    >
                                        Financial Report
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Card with Glassmorphism */}
                        {(property.property_manager || property.owner_name) && (
                            <Card className="bg-white/80 backdrop-blur-xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                                    <CardTitle className="text-xl font-bold text-slate-800">
                                        {property.property_manager ? 'Property Manager' : 'Owner'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                            <User className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-slate-900">{property.property_manager || property.owner_name}</p>
                                            <p className="text-sm text-slate-600 font-medium">
                                                {property.property_manager ? 'Property Manager' : 'Owner'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {property.owner_contact && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 font-semibold py-6"
                                            >
                                                <Phone className="w-5 h-5 mr-3 text-blue-600" />
                                                {property.owner_contact}
                                            </Button>
                                        )}
                                        {property.owner_email && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 font-semibold py-6"
                                            >
                                                <Mail className="w-5 h-5 mr-3 text-purple-600" />
                                                {property.owner_email}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {property && (
                <AddPropertyModal
                    isOpen={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                    editMode={true}
                    propertyData={property}
                />
            )}
        </div>
    );
}
