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
import { Search, Plus, MapPin, Home, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { propertyAPI, authAPI } from "@/data/apis"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useDebounce } from "../../../hooks/use-debounce"

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
    units_count?: number;
    path?: string
}

export default function PropertiesPage() {
    const router = useRouter()
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [perPage] = useState(9); // 3x3 grid looks best
    const [deletionError, setDeletionError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 500);

    useEffect(() => {
        const currentUser = authAPI.getUser();
        setUser(currentUser);
    }, []);

    useEffect(() => {
        fetchProperties(1);
    }, [debouncedSearch]);

    const fetchProperties = async (page = 1) => {
        setLoading(true);
        try {
            const response = await propertyAPI.getAll({ 
                page, 
                per_page: perPage,
                search: debouncedSearch
            });
            
            if (response && response.data) {
                setProperties(response.data);
                setCurrentPage(response.current_page);
                setLastPage(response.last_page);
                setTotalItems(response.total);
            } else {
                setProperties(Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error("Failed to fetch properties:", error);
            toast.error("Failed to load properties");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        fetchProperties(page);
    };

    const handleDelete = async () => {
        if (!propertyToDelete) return;

        setIsDeleting(true);
        try {
            await propertyAPI.delete(propertyToDelete.id);
            // Refresh properties
            fetchProperties();
            setPropertyToDelete(null);
            toast.success("Property deleted successfully");
        } catch (error: any) {
            console.error("Failed to delete property:", error);
            if (error.response && error.response.status === 422 && error.response.data.tenants) {
                const tenantNames = error.response.data.tenants.map((t: any) => `${t.name} (KES ${t.balance})`).join(', ');
                setDeletionError(`Cannot delete property. The following tenants have pending balances:\n\n${tenantNames}\n\nPlease clear these balances before deleting.`);
            } else {
                setDeletionError("Failed to delete property. Please try again.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading && properties.length === 0) return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="p-8 space-y-8 bg-slate-50 dark:bg-[#0F1115] min-h-screen transition-colors duration-300">
            <div className="border-b border-slate-200 dark:border-[#1F2630] pb-6 mb-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-[#FFFFFF]">Properties</h2>
                        <p className="text-slate-500 dark:text-[#9CA3AF] text-lg font-medium">Manage your houses and residential units.</p>
                    </div>

                    <Button
                        onClick={() => router.push('/properties/new')}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="mr-2 h-6 w-6" /> Add Property
                    </Button>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 dark:text-[#9CA3AF]" />
                    <Input
                        type="search"
                        placeholder="Search by name or location..."
                        className="pl-12 h-12 bg-white dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] text-slate-900 dark:text-[#F9FAFB] placeholder:text-slate-400 dark:placeholder:text-[#9CA3AF] rounded-xl shadow-sm dark:shadow-inner focus:border-primary dark:focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.length > 0 ? (
                    properties.map((property) => (
                        <Card
                            key={property.id}
                            onClick={() => router.push(`/properties/${property.id}`)}
                            className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-500 group cursor-pointer transform hover:-translate-y-2"
                        >
                            <div className="h-56 overflow-hidden relative">
                                <img
                                    src={property.featured_image_url || property.images || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&auto=format&fit=crop&q=60"}
                                    alt={property.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 left-4">
                                    {(() => {
                                        const total = property.units?.length || property.total_units || 0;
                                        const occupied = property.occupied_units || 0;
                                        const rate = total > 0 ? (occupied / total) : 0;

                                        let badgeColor = "bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                                        if (rate < 0.5) badgeColor = "bg-rose-500/15 text-rose-500 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
                                        else if (rate < 1) badgeColor = "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]";

                                        return (
                                            <Badge className={`${badgeColor} backdrop-blur-md px-3 py-1.5 rounded-xl border text-sm font-black shadow-lg transition-all duration-300`}>
                                                {occupied}/{total} Occupied
                                            </Badge>
                                        );
                                    })()}
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
                            <CardHeader className="pb-2">
                                <CardTitle className="text-2xl font-bold text-slate-800 dark:text-[#FFFFFF] group-hover:text-primary transition-colors">
                                    {property.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center text-slate-600 dark:text-[#9CA3AF] font-medium">
                                        <MapPin className="mr-3 h-5 w-5 text-primary" />
                                        {property.location}
                                    </div>
                                    <div className="flex items-center text-slate-600 dark:text-[#9CA3AF] font-medium">
                                        <Home className="mr-3 h-5 w-5 text-primary" />
                                        {property.units_count ?? property.units?.length ?? property.total_units ?? 0} Units Total
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#2A2F3A] flex justify-between items-center">
                                    <div className="text-sm font-bold text-slate-400 dark:text-[#9CA3AF] uppercase tracking-wider">
                                        Occupancy Rate
                                    </div>
                                    <div className="text-xl font-black text-primary">
                                        {(() => {
                                            const total = property.units?.length || property.total_units || 0;
                                            const occupied = property.occupied_units || 0;
                                            return total > 0 ? Math.round((occupied / total) * 100) : 0;
                                        })()}%
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="bg-muted p-6 rounded-full">
                            <Home className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">
                            {debouncedSearch ? "No properties found matching your search" : "Create a Property by clicking add property button"}
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            {debouncedSearch ? "Try adjusting your search query or filters." : "Start by adding your first property to manage units and tenants effectively."}
                        </p>
                    </div>
                )}
            </div>

            {lastPage > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={lastPage}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={perPage}
                />
            )}


            <Dialog open={!!propertyToDelete} onOpenChange={(open) => !open && !isDeleting && setPropertyToDelete(null)}>
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
                        <Button variant="outline" onClick={() => setPropertyToDelete(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : "Delete Property"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deletionError} onOpenChange={(open) => !open && setDeletionError(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Cannot Delete Property
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                        {deletionError}
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => setDeletionError(null)}
                        >
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}