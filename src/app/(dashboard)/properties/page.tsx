"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MapPin, Home, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { propertyAPI, authAPI } from "@/data/apis"

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
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const currentUser = authAPI.getUser();
        setUser(currentUser);
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

    const handleDelete = async () => {
        if (!propertyToDelete) return;

        try {
            await propertyAPI.delete(propertyToDelete.id);
            // Refresh properties
            fetchProperties();
            setPropertyToDelete(null);
        } catch (error: any) {
            console.error("Failed to delete property:", error);
            if (error.response && error.response.status === 422 && error.response.data.tenants) {
                const tenantNames = error.response.data.tenants.map((t: any) => `${t.name} (KES ${t.balance})`).join(', ');
                alert(`Cannot delete property. The following tenants have pending balances:\n\n${tenantNames}\n\nPlease clear these balances before deleting.`);
            } else {
                alert("Failed to delete property. Please try again.");
            }
        }
    };

    if (loading) return <div className="p-8">Loading properties...</div>;

    const filteredProperties = properties.filter(property => {
        const query = searchQuery.toLowerCase();
        return property.name.toLowerCase().includes(query) ||
            property.location.toLowerCase().includes(query);
    });

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
                    <p className="text-muted-foreground">Manage your houses and residential units.</p>
                </div>

                <Button
                    onClick={() => router.push('/properties/new')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Property
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name or location..."
                        className="pl-8 h-10 border-slate-300 focus:border-indigo-500 rounded-lg shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.length > 0 ? (
                    filteredProperties.map((property) => (
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
                                <div className="absolute top-2 left-2">
                                    <Badge variant={property.occupied_units === property.total_units ? "secondary" : "default"} className="bg-white/90 text-black hover:bg-white">
                                        {(property.occupied_units || 0)}/{property.units?.length || 0} Occupied
                                    </Badge>
                                </div>
                                {user?.role === 'super_admin' && (
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPropertyToDelete(property);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
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
                                        {property.total_units > 0 ? Math.round(((property.occupied_units || 0) / property.total_units) * 100) : 0}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No properties found matching your search.
                    </div>
                )}
            </div>


            <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && setPropertyToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete
                            <span className="font-semibold text-foreground"> {propertyToDelete?.name} </span>
                            and remove all its associated data including units, tenants, leases, and financial records.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPropertyToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete Property</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}