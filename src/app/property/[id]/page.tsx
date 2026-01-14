'use client';

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
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { propertyAPI, publicAPI } from "@/data/apis";
import { useRouter } from "next/navigation";
import { BulkUnitModal } from "@/components/properties/BulkUnitModal";
import { LandingNavbar } from "@/components/landing-navbar";
import { LandingFooter } from "@/components/landing-footer";
import { formatText, formatTextType, formatCurrency } from "@/lib/utils";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import Link from "next/link";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const normalizeType = (type: string | null | undefined): string => {
    if (!type) return "";
    const t = type.toLowerCase().trim();
    if (t === "one bedroom" || t === "1 bedroom" || t === "studio" || t === "bedsitter") return "1 Bedroom";
    if (t === "two bedroom" || t === "2 bedroom") return "2 Bedroom";
    if (t === "three bedroom" || t === "3 bedroom" || t === "four bedroom" || t === "penthouse") return "3 Bedroom";
    if (t === "shop") return "Shop";
    if (t === "office") return "Office";
    return type;
};

// Enhanced icon mapping with vibrant colors
// Simplified professional icon mapping
const AMENITY_ICONS: Record<string, { icon: any; color: string; bgColor: string }> = {
    "High-Speed WiFi": { icon: Wifi, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Covered Parking": { icon: Car, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Fitness Center": { icon: Dumbbell, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Modern Kitchen": { icon: Utensils, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Pet Friendly": { icon: Home, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Generator/Backup Power": { icon: Zap, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Air Conditioning": { icon: Wind, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Security": { icon: Shield, color: "text-slate-600", bgColor: "bg-slate-100" },
    "24/7 Concierge Service": { icon: Users, color: "text-slate-600", bgColor: "bg-slate-100" },
    "Rooftop Pool": { icon: Droplets, color: "text-slate-600", bgColor: "bg-slate-100" },
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
    const [settings, setSettings] = useState<any>();
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [bulkModalOpen, setBulkModalOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("overview");

    const fetchProperty = async () => {
        try {
            const response = await publicAPI.getProperty(params.id);
            setProperty(response.data);
        } catch (error) {
            console.error("Failed to fetch property:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await publicAPI.getSettings();
            setSettings(data)
        } catch (error) {
            toast.warning('error fetching');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchProperty();
        }
        fetchSettings();
    }, [params.id]);

    const handleEditSuccess = () => {
        fetchProperty();
        setEditModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <LandingNavbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading property details...</p>
                    </div>
                </div>
                <LandingFooter />
            </div>
        );
    }

    if (!property) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <LandingNavbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 text-xl font-semibold">Property not found</p>
                    </div>
                </div>
                <LandingFooter />
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

    const unitPrices = property.units?.map(u => Number(u.price)).filter(p => !isNaN(p) && p > 0) || [];
    const minRent = unitPrices.length > 0 ? Math.min(...unitPrices) : 0;
    const maxRent = unitPrices.length > 0 ? Math.max(...unitPrices) : 0;

    const priceRange = minRent && maxRent
        ? minRent === maxRent
            ? `KES ${minRent.toLocaleString()}`
            : `KES ${minRent.toLocaleString()} - ${maxRent.toLocaleString()}`
        : minRent
            ? `KES ${minRent.toLocaleString()}`
            : "Contact for pricing";

    const totalUnitsCount = property.units?.length || 0;
    const occupiedUnits = property.units?.filter(u => u.status?.toLowerCase() === 'occupied').length || 0;
    const vacantUnits = property.units?.filter(u => u.status?.toLowerCase() === 'vacant' || u.status?.toLowerCase() === 'available').length || 0;
    const repairUnits = property.units?.filter(u => u.status?.toLowerCase() === 'maintenance' || u.status?.toLowerCase() === 'repair' || u.status?.toLowerCase() === 'under maintenance').length || 0;

    const occupancyRate = totalUnitsCount > 0
        ? Math.round((occupiedUnits / totalUnitsCount) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-slate-50">
            <LandingNavbar />

            <main className="pt-28 pb-12">
                <div className="max-w-7xl mx-auto px-6 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <Button variant="outline" onClick={() => router.push('/property')} className="rounded-xl border-slate-200 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-all">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Listings
                        </Button>
                    </div>

                    {/* Premium Hero Section with Gradient Overlay */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[550px]">
                            <div className="md:col-span-2 h-full relative group">
                                <img
                                    src={images[0]}
                                    alt={property.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                    onClick={() => {
                                        setGalleryIndex(0);
                                        setGalleryOpen(true);
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                        <span className="text-yellow-400 font-semibold text-sm">Premium Listing</span>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 border-0"
                                        onClick={() => {
                                            setGalleryIndex(0);
                                            setGalleryOpen(true);
                                        }}
                                    >
                                        View All {images.length} Photos
                                    </Button>
                                </div>
                            </div>
                            {images.length > 1 && (
                                <>
                                    <div className="hidden md:grid grid-rows-2 gap-3">
                                        <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(1); setGalleryOpen(true); }}>
                                            <img
                                                src={images[1]}
                                                alt="Interior"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        {images.length > 2 && (
                                            <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(2); setGalleryOpen(true); }}>
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
                                            <div className="relative group overflow-hidden rounded-xl cursor-pointer" onClick={() => { setGalleryIndex(3); setGalleryOpen(true); }}>
                                                <img
                                                    src={images[3]}
                                                    alt="Bedroom"
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                            </div>
                                            {images.length > 4 && (
                                                <div
                                                    className="relative bg-gray-400 flex items-center justify-center cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300 rounded-xl group"
                                                    onClick={() => { setGalleryIndex(4); setGalleryOpen(true); }}
                                                >
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
                    <div className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
                                    {property.name}
                                </h1>
                                <div className="flex items-center text-slate-500 gap-2">
                                    <MapPin className="w-5 h-5 text-blue-500" />
                                    <span className="text-lg font-medium">{fullAddress}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    className={`text-base px-6 py-2 font-bold shadow-sm rounded-full ${property.status === "active"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-slate-50 text-slate-700 border-slate-100"
                                        }`}
                                >
                                    {formatTextType(property.status) || "Available"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <Tabs id="property-tabs" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1.5 rounded-2xl h-14">
                                    <TabsTrigger
                                        value="overview"
                                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl font-bold transition-all text-slate-600"
                                    >
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="units"
                                        className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl font-bold transition-all text-slate-600"
                                    >
                                        Units & Availability
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-6 mt-8">
                                    {/* Description */}
                                    {property.description && (
                                        <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                                                <CardTitle className="text-xl font-bold text-slate-900">About this Property</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-8">
                                                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                                                    {property.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Property Details Grid */}
                                    <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                                            <CardTitle className="text-xl font-bold text-slate-900">Property Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-8 pb-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {[
                                                    { label: "Type", value: property.property_type },
                                                    { label: "Year Built", value: property.year_built },
                                                    { label: "Floors", value: property.floors },
                                                    { label: "Parking", value: property.parking_spaces ? `${property.parking_spaces} Spaces` : null },
                                                    { label: "Pet Policy", value: property.pet_policy, wide: true },
                                                ].map((item, i) => item.value && (
                                                    <div key={i} className={`flex justify-between items-center py-4 px-6 bg-slate-50 rounded-2xl border border-slate-100 ${item.wide ? 'md:col-span-2' : ''}`}>
                                                        <span className="text-slate-500 font-semibold">{item.label}</span>
                                                        <span className="font-bold text-slate-900">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Amenities */}
                                    {property.amenities && property.amenities.length > 0 && (
                                        <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
                                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                                                <CardTitle className="text-xl font-bold text-slate-900">Amenities & Features</CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-8 pb-8">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-slate-900">
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
                                                                className={`flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 hover:border-blue-200 group`}
                                                            >
                                                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                                                    <IconComponent className={`w-5 h-5 ${amenityConfig.color}`} />
                                                                </div>
                                                                <span className="text-slate-700 font-bold text-sm">
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

                                <TabsContent value="units" className="mt-8">
                                    <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                                            <CardTitle className="text-xl font-bold text-slate-900 text-slate-900">Available Units</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            {property.units && property.units.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b border-slate-100 hover:bg-transparent">
                                                                <TableHead className="font-bold text-slate-500 py-4">Unit #</TableHead>
                                                                <TableHead className="font-bold text-slate-500 py-4">Type</TableHead>
                                                                <TableHead className="font-bold text-slate-500 py-4">Status</TableHead>
                                                                <TableHead className="font-bold text-slate-500 py-4">Monthly Rent</TableHead>
                                                                <TableHead className="font-bold text-slate-500 py-4">Deposit 1</TableHead>
                                                                <TableHead className="font-bold text-slate-500 py-4">Deposit 2</TableHead>
                                                                <TableHead className="text-right font-bold text-slate-500 py-4">Action</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {property.units.map((unit: any) => (
                                                                <TableRow key={unit.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                                                    <TableCell className="font-extrabold text-slate-900 py-5">
                                                                        {unit.unit_number}
                                                                    </TableCell>
                                                                    <TableCell className="font-bold text-slate-700 py-5">
                                                                        {normalizeType(unit.type)}
                                                                    </TableCell>
                                                                    <TableCell className="py-5">
                                                                        <Badge
                                                                            className={`font-bold px-3 py-1 rounded-full ${['vacant', 'available'].includes(unit.status?.toLowerCase())
                                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                                : unit.status?.toLowerCase() === "occupied"
                                                                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                                                                    : ["maintenance", "repair", "under maintenance"].includes(unit.status?.toLowerCase())
                                                                                        ? "bg-red-50 text-red-700 border-red-100"
                                                                                        : "bg-slate-50 text-slate-700 border-slate-100"
                                                                                }`}
                                                                        >
                                                                            {unit.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="font-bold text-slate-900 py-5">
                                                                        KES {unit.price?.toLocaleString() || 'N/A'}
                                                                    </TableCell>
                                                                    <TableCell className="font-bold text-slate-900 py-5">
                                                                        KES {Number(unit.deposit_1 || 0).toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="font-bold text-slate-900 py-5">
                                                                        KES {Number(unit.deposit_2 || 0).toLocaleString()}
                                                                    </TableCell>
                                                                    <TableCell className="text-right py-5">
                                                                        <Link
                                                                            href={`/unit/${unit.id}`}
                                                                            className="rounded-xl font-bold text-blue-600 hover:bg-blue-100"
                                                                        >
                                                                            view
                                                                        </Link>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-16">
                                                    <Home className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                                    <p className="text-slate-500 text-lg font-medium">No units currently listed.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-6">
                            {/* Rental Summary Card */}
                            <Card className="bg-white shadow-lg border border-slate-100 rounded-3xl overflow-hidden">
                                <CardHeader className="bg-slate-50/80 border-b border-slate-100 py-6">
                                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        Property Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6 pt-8 pb-8">
                                    {/* Price Range */}
                                    <div className="flex justify-between items-center py-2 px-1 border-b border-slate-50 pb-6">
                                        <span className="text-slate-500 text-lg font-semibold">Price Range</span>
                                        <span className="text-xl font-extrabold text-slate-900">
                                            {priceRange}
                                        </span>
                                    </div>

                                    {/* Total Units */}
                                    <div className="flex justify-between items-center py-2 px-1 border-b border-slate-50 pb-6">
                                        <span className="text-slate-500 text-lg font-semibold">Total Units</span>
                                        <span className="text-xl font-extrabold text-slate-900">{totalUnitsCount}</span>
                                    </div>

                                    {/* Occupancy */}
                                    <div className="py-2 px-1 border-b border-slate-50 pb-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-slate-500 text-lg font-semibold">Occupancy</span>
                                            <span className="text-xl font-extrabold text-slate-900">{occupancyRate}%</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {occupiedUnits} OCCUPIED / {totalUnitsCount} TOTAL
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Boxes */}
                                    <div className="grid grid-cols-3 gap-3 pt-2">
                                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center transition-all hover:shadow-md group">
                                            <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">Vacant</p>
                                            <p className="text-2xl font-black text-emerald-700">{vacantUnits}</p>
                                        </div>
                                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-center transition-all hover:shadow-md group">
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Repair</p>
                                            <p className="text-2xl font-black text-slate-700">{repairUnits}</p>
                                        </div>
                                        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center transition-all hover:shadow-md group">
                                            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mb-1">Occupied</p>
                                            <p className="text-2xl font-black text-blue-700">{occupiedUnits}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold h-12 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] group flex items-center justify-center gap-2"
                                            onClick={() => {
                                                setActiveTab("units");
                                                const element = document.getElementById('property-tabs');
                                                if (element) {
                                                    const offset = 100; // offset for navbar
                                                    const bodyRect = document.body.getBoundingClientRect().top;
                                                    const elementRect = element.getBoundingClientRect().top;
                                                    const elementPosition = elementRect - bodyRect;
                                                    const offsetPosition = elementPosition - offset;

                                                    window.scrollTo({
                                                        top: offsetPosition,
                                                        behavior: 'smooth'
                                                    });
                                                }
                                            }}
                                        >
                                            View All Units
                                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Property Contact */}
                            <Card className="bg-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden p-6">
                                <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-blue-500" />
                                    Contact Agency
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Building2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{settings?.company_name}</p>
                                            <p className="text-xs text-slate-500 font-bold">verified Agency</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-slate-700 hover:text-blue-600 transition-colors">
                                        <Phone className="w-4 h-4 mr-3" /> {settings?.company_phone}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 rounded-xl text-slate-700 hover:text-blue-600 transition-colors"
                                        onClick={() => {
                                            const phone = settings?.company_phone || property.owner_contact || '0745621158';
                                            const digitsOnly = phone.replace(/\D/g, '');
                                            let cleanPhone = digitsOnly;
                                            if (digitsOnly.startsWith('0')) {
                                                cleanPhone = '254' + digitsOnly.substring(1);
                                            } else if (digitsOnly.length === 9 && (digitsOnly.startsWith('7') || digitsOnly.startsWith('1'))) {
                                                cleanPhone = '254' + digitsOnly;
                                            }
                                            const message = `Hi, I am interested in ${property.name} located at ${fullAddress}`;
                                            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        <WhatsAppIcon className="w-5 h-5 mr-3 text-emerald-500" /> WhatsApp Agent
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start h-12 rounded-xl text-slate-700 hover:text-blue-600 transition-colors">
                                        <Mail className="w-4 h-4 mr-3" /> {settings?.company_email}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <ImageGalleryModal
                images={images}
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                initialIndex={galleryIndex}
            />
            <LandingFooter />
        </div>
    );
}
