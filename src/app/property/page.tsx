"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MapPin, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import AddPropertyModal from "@/components/AddPropertyModal"
import { propertyAPI } from "@/data/apis"

interface Property {
    id: number;
    name: string;
    location: string;
    total_units: number;
    occupied_units: number;
    image?: string;
    property?: string;
    units?: any[];
    featured_image_url?: string;
    images?: string;
    path?: string
}

export default function PropertiesPage() {
    const router = useRouter()
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            // const response = await api.get('/properties');
            const response = await propertyAPI.getAll();
            setProperties(response || response.data);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Loading properties...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
                    <p className="text-muted-foreground">Manage your houses and residential units.</p>
                </div>

                <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Property
                </Button>
            </div>

            <AddPropertyModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={fetchProperties}
            />

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search properties..."
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <Card
                        key={property.id}
                        onClick={() => router.push(`/properties/${property.id}`)}
                        className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group cursor-pointer border-slate-200"
                    >
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={property.featured_image_url || property.images || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60"}
                                alt={property.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute top-2 right-2">
                                <Badge variant={property.occupied_units === property.units?.length ? "secondary" : "default"} className="bg-white/90 text-black hover:bg-white">
                                    {(property.occupied_units || 0)}/{property.units?.length || 0} Occupied
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span>{property.name}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4 text-indigo-500" />
                                    {property.location}
                                </div>
                                <div className="flex items-center">
                                    <Home className="mr-2 h-4 w-4 text-indigo-500" />
                                    {property.units?.length || 0} Units Total
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                <div className="text-xs font-medium text-slate-500">
                                    Occupancy Rate
                                </div>
                                <div className="text-sm font-bold text-indigo-600">
                                    {(property.units?.length || 0) > 0 ? Math.round(((property.occupied_units || 0) / (property.units?.length || 1)) * 100) : 0}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}