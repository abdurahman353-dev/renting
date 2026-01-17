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
import { propertyAPI } from "@/data/apis";
import { useRouter } from "next/navigation";
import { BulkUnitModal } from "@/components/properties/BulkUnitModal";
import { formatText, formatTextType } from "@/lib/utils";

// Enhanced icon mapping with vibrant colors
// Simplified professional icon mapping
const AMENITY_ICONS: Record<string, { icon: any; color: string; bgColor: string }> = {
    "High-Speed WiFi": { icon: Wifi, color: "text-primary", bgColor: "bg-primary/10" },
    "Covered Parking": { icon: Car, color: "text-primary", bgColor: "bg-primary/10" },
    "Fitness Center": { icon: Dumbbell, color: "text-primary", bgColor: "bg-primary/10" },
    "Modern Kitchen": { icon: Utensils, color: "text-primary", bgColor: "bg-primary/10" },
    "Pet Friendly": { icon: Home, color: "text-primary", bgColor: "bg-primary/10" },
    "Generator/Backup Power": { icon: Zap, color: "text-primary", bgColor: "bg-primary/10" },
    "Air Conditioning": { icon: Wind, color: "text-primary", bgColor: "bg-primary/10" },
    "Security": { icon: Shield, color: "text-primary", bgColor: "bg-primary/10" },
    "24/7 Concierge Service": { icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    "Rooftop Pool": { icon: Droplets, color: "text-primary", bgColor: "bg-primary/10" },
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
    const router = useRouter();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);

    const normalizeUnitType = (type: string) => {
        if (!type) return 'N/A';
        const t = type.toLowerCase();
        if (t.includes('one') || t === '1 bedroom') return '1 Bedroom';
        if (t.includes('two') || t === '2 bedroom') return '2 Bedroom';
        if (t.includes('three') || t === '3 bedroom') return '3 Bedroom';
        if (t.includes('shop')) return 'Shop';
        if (t.includes('office')) return 'Office';
        return type;
    };

    const fetchProperty = async () => {
        try {
            const data = await propertyAPI.getById(params.id);
            setProperty(data);
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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading property details...</p>
                </div>
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/40">
                <div className="text-center">
                    <Building2 className="w-20 h-20 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground text-xl font-semibold">Property not found</p>
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

    const unitPrices = property.units?.map(u => Number(u.price)).filter(p => !isNaN(p)) || [];
    const minRent = unitPrices.length > 0 ? Math.min(...unitPrices) : 0;
    const maxRent = unitPrices.length > 0 ? Math.max(...unitPrices) : 0;

    const priceRange = minRent && maxRent
        ? minRent === maxRent
            ? `KES ${minRent.toLocaleString()}`
            : `KES ${minRent.toLocaleString()} - ${maxRent.toLocaleString()}`
        : minRent
            ? `KES ${minRent.toLocaleString()}`
            : "Contact for pricing";

    const occupiedUnits = property.units?.filter(u => u.status?.toLowerCase() === 'occupied').length || 0;
    const vacantUnits = property.units?.filter(u => u.status?.toLowerCase() === 'vacant').length || 0;
    const maintenanceUnits = property.units?.filter(u => u.status?.toLowerCase() === 'maintenance').length || 0;

    const occupancyRate = property.total_units > 0
        ? Math.round((occupiedUnits / property.total_units) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-muted/40">
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
                            <div className="absolute inset-0 bg-black/60"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <span className="text-yellow-400 font-semibold text-sm">Premium Property</span>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="bg-black text-white hover:bg-black/90 border-0 shadow-sm font-semibold"
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
                                            <div className="relative bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-all duration-300 rounded-xl group">
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

                {/* Header */}
                <div className="bg-card rounded-2xl shadow-sm p-8 border border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground mb-3">
                                {property.name}
                            </h1>
                            <div className="flex items-center text-muted-foreground gap-2">
                                <MapPin className="w-5 h-5 text-muted-foreground" />
                                <span className="text-lg">{fullAddress}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                className={`text-base px-6 py-2 font-semibold shadow-sm ${property.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0"
                                    : "bg-secondary text-secondary-foreground border-0"
                                    }`}
                            >
                                {formatTextType(property.status) || "Active"}
                            </Badge>
                            <Button
                                onClick={() => router.push(`/properties/${property.id}/edit`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 py-2 text-base font-semibold"
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
                            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl">
                                <TabsTrigger
                                    value="overview"
                                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-medium"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="units"
                                    className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg font-medium"
                                >
                                    Units
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6 mt-6">
                                {/* Description with Premium Card */}
                                {property.description && (
                                    <Card className="bg-card shadow-sm border border-border">
                                        <CardHeader className="bg-muted/40 border-b border-border">
                                            <CardTitle className="text-xl font-bold text-foreground">About this Property</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <p className="text-muted-foreground leading-relaxed text-base">
                                                {property.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Property Details */}
                                <Card className="bg-card shadow-sm border border-border">
                                    <CardHeader className="bg-muted/40 border-b border-border">
                                        <CardTitle className="text-xl font-bold text-foreground">Property Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {property.property_type && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-muted/40 rounded-lg">
                                                    <span className="text-muted-foreground font-medium">Type</span>
                                                    <span className="font-semibold text-foreground">{property.property_type}</span>
                                                </div>
                                            )}
                                            {property.year_built && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-muted/40 rounded-lg">
                                                    <span className="text-muted-foreground font-medium">Year Built</span>
                                                    <span className="font-semibold text-foreground">{property.year_built}</span>
                                                </div>
                                            )}
                                            {property.floors && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-muted/40 rounded-lg">
                                                    <span className="text-muted-foreground font-medium">Floors</span>
                                                    <span className="font-semibold text-foreground">{property.floors}</span>
                                                </div>
                                            )}
                                            {property.parking_spaces && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-muted/40 rounded-lg">
                                                    <span className="text-muted-foreground font-medium">Parking Spaces</span>
                                                    <span className="font-semibold text-foreground">{property.parking_spaces}</span>
                                                </div>
                                            )}
                                            {property.pet_policy && (
                                                <div className="flex justify-between items-center py-4 px-4 bg-muted/40 rounded-lg col-span-2">
                                                    <span className="text-muted-foreground font-medium">Pet Policy</span>
                                                    <span className="font-semibold text-foreground">{property.pet_policy}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Amenities */}
                                {property.amenities && property.amenities.length > 0 && (
                                    <Card className="bg-card shadow-sm border border-border">
                                        <CardHeader className="bg-muted/40 border-b border-border">
                                            <CardTitle className="text-xl font-bold text-foreground">Amenities</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {property.amenities.map((amenity: any, index: number) => {
                                                    const name = (amenity.name || amenity.amenities || amenity.amenity_name || "").toString();

                                                    // Helper to find icon
                                                    const getIcon = (n: string) => {
                                                        // 1. Direct match
                                                        if (AMENITY_ICONS[n]) return AMENITY_ICONS[n];

                                                        // 2. Fuzzy match
                                                        const lower = n.toLowerCase();
                                                        if (lower.includes('wifi') || lower.includes('internet')) return AMENITY_ICONS['High-Speed WiFi'];
                                                        if (lower.includes('park') || lower.includes('garage')) return AMENITY_ICONS['Covered Parking'];
                                                        if (lower.includes('gym') || lower.includes('fitness')) return AMENITY_ICONS['Fitness Center'];
                                                        if (lower.includes('kitchen') || lower.includes('cooking')) return AMENITY_ICONS['Modern Kitchen'];
                                                        if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) return AMENITY_ICONS['Security'];
                                                        if (lower.includes('pool') || lower.includes('swim')) return AMENITY_ICONS['Rooftop Pool'];
                                                        if (lower.includes('power') || lower.includes('generator') || lower.includes('backup')) return AMENITY_ICONS['Generator/Backup Power'];
                                                        if (lower.includes('air') || lower.includes('ac ') || lower.includes('conditioning')) return AMENITY_ICONS['Air Conditioning'];
                                                        if (lower.includes('pet') || lower.includes('dog') || lower.includes('cat')) return AMENITY_ICONS['Pet Friendly'];

                                                        // 3. Default
                                                        return { icon: Home, color: "text-blue-600", bgColor: "bg-blue-50/50" };
                                                    };

                                                    const amenityConfig = getIcon(name);
                                                    const IconComponent = amenityConfig.icon;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`flex items-center gap-3 p-4 bg-muted/40 rounded-2xl border border-border transition-all duration-300 hover:border-primary/50 group`}
                                                        >
                                                            <div className="p-2 bg-card rounded-lg shadow-sm">
                                                                <IconComponent className={`w-5 h-5 ${amenityConfig.color}`} />
                                                            </div>
                                                            <span className="text-foreground font-medium text-sm">
                                                                {name}
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
                                <Card className="bg-card shadow-sm border border-border">
                                    <CardHeader className="bg-muted/40 border-b border-border flex flex-row items-center justify-between pb-4">
                                        <CardTitle className="text-xl font-bold text-foreground">Units</CardTitle>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setBulkModalOpen(true)}
                                                size="sm"
                                                className="bg-card text-primary border-primary/20 hover:bg-primary/10"
                                            >
                                                Bulk Add
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={() => router.push(`/units/new?property_id=${property.id}`)}
                                                size="sm"
                                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                + Add Unit
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {property.units && property.units.length > 0 ? (
                                            <div className="max-h-[500px] overflow-y-auto relative border border-border rounded-md">
                                                <Table>
                                                    <TableHeader className="sticky top-0 bg-card z-10 shadow-sm border-b border-border">
                                                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-border">
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Unit #</TableHead>
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Type</TableHead>
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Status</TableHead>
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Monthly Rent</TableHead>
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Deposit 1</TableHead>
                                                            <TableHead className="font-semibold text-muted-foreground bg-muted/50">Deposit 2</TableHead>
                                                            <TableHead className="text-right font-semibold text-muted-foreground bg-muted/50">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {property.units.map((unit: any) => (
                                                            <TableRow key={unit.id} className="hover:bg-muted/30 transition-colors border-border">
                                                                <TableCell className="font-bold text-foreground">
                                                                    {unit.unit_number}
                                                                </TableCell>
                                                                <TableCell className="font-medium text-muted-foreground">
                                                                    {normalizeUnitType(unit.type)}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge
                                                                        className={`font-semibold ${['vacant', 'available'].includes(unit.status?.toLowerCase())
                                                                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0"
                                                                            : unit.status?.toLowerCase() === "occupied"
                                                                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0"
                                                                                : unit.status?.toLowerCase() === "maintenance"
                                                                                    ? "bg-red-500/15 text-red-700 dark:text-red-400 border-0"
                                                                                    : "bg-secondary text-secondary-foreground border-0"
                                                                            }`}
                                                                    >
                                                                        {unit.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="font-semibold text-foreground">
                                                                    KES {unit.price?.toLocaleString() || 'N/A'}
                                                                </TableCell>
                                                                <TableCell className="font-medium text-muted-foreground">
                                                                    KES {Number(unit.deposit_1 || 0).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="font-medium text-muted-foreground">
                                                                    KES {Number(unit.deposit_2 || 0).toLocaleString()}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => router.push(`/units/${unit.id}`)}
                                                                        size="sm"
                                                                        className="hover:bg-blue-100 text-blue-500 hover:text-blue-700 font-semibold"
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
                                            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                                                <div className="bg-muted p-6 rounded-full">
                                                    <Home className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-foreground max-w-lg mx-auto leading-tight">
                                                    Add units in bulk by clicking Bulk Add button and click Add unit button when adding a single unit
                                                </h3>
                                                <p className="text-muted-foreground max-w-sm mx-auto">Populate this property with units to start assigning tenants and generating revenue.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="space-y-6">
                        {/* Property Summary */}
                        <Card className="bg-card shadow-sm border border-border">
                            <CardHeader className="bg-muted/40 border-b border-border pb-4">
                                <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <TrendingUp className="w-5 h-5 text-muted-foreground" />
                                    Property Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-muted-foreground font-medium">Price Range</span>
                                    <span className="font-bold text-foreground text-lg">{priceRange}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-muted-foreground font-medium">Total Units</span>
                                    <span className="font-bold text-foreground text-lg">{property.total_units}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-border">
                                    <span className="text-muted-foreground font-medium">Occupancy</span>
                                    <div className="text-right">
                                        <p className="font-bold text-foreground text-lg">{occupancyRate}%</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                            {occupiedUnits} Occupied / {property.total_units} Total
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter mb-1">Vacant</p>
                                        <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">{vacantUnits}</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-xl border border-border text-center">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tighter mb-1">Repair</p>
                                        <p className="text-xl font-extrabold text-foreground">{maintenanceUnits}</p>
                                    </div>
                                </div>
                                {property.security_deposit && (
                                    <div className="flex justify-between items-center py-3 border-b border-border">
                                        <span className="text-muted-foreground font-medium">Security Deposit</span>
                                        <span className="font-bold text-foreground text-lg">KES {property.security_deposit.toLocaleString()}</span>
                                    </div>
                                )}
                                {/* <div className="pt-4 space-y-3">
                                    <Button onClick={() => router.push(`/tenants?property_id=${property.id}`)} className="w-full bg-blue-600 text-white hover:bg-blue-700 font-semibold py-2">
                                        Manage Tenants
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/reports/property`)}
                                        className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2"
                                    >
                                        Financial Report
                                    </Button>
                                </div> */}
                            </CardContent>
                        </Card>

                        {/* Contact Card */}
                        {(property.property_manager || property.owner_name) && (
                            <Card className="bg-card shadow-sm border border-border">
                                <CardHeader className="bg-muted/40 border-b border-border pb-4">
                                    <CardTitle className="text-xl font-bold text-foreground">
                                        {property.property_manager ? 'Property Manager' : 'Owner'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-foreground">{property.property_manager || property.owner_name}</p>
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {property.property_manager ? 'Property Manager' : 'Owner'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {property.owner_contact && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-slate-700 hover:bg-slate-50 font-medium py-2"
                                            >
                                                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                                                {property.owner_contact}
                                            </Button>
                                        )}
                                        {property.owner_email && (
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-slate-700 hover:bg-slate-50 font-medium py-2"
                                            >
                                                <Mail className="w-4 h-4 mr-3 text-slate-500" />
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



            {property && (
                <BulkUnitModal
                    isOpen={bulkModalOpen}
                    onClose={() => setBulkModalOpen(false)}
                    propertyId={property.id}
                    onSuccess={() => {
                        fetchProperty();
                        setBulkModalOpen(false);
                    }}
                    existingUnits={property.units?.map(u => u.unit_number.toString()) || []}
                />
            )}
        </div>
    );
}
