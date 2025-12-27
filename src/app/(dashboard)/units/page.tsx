"use client";

import { useState, useEffect } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, Loader2, RefreshCw, Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { unitAPI, propertyAPI, authAPI } from "@/data/apis";
import { toast } from "sonner"; // Add this import for toast notifications
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function UnitsPage() {
    const router = useRouter();
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [unitToDelete, setUnitToDelete] = useState<any>(null);
    const [deleting, setDeleting] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        const currentUser = authAPI.getUser();
        setUser(currentUser);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [unitsData, propertiesData] = await Promise.all([
                unitAPI.getAll(),
                propertyAPI.getAll()
            ]);
            setUnits(unitsData);
            setProperties(propertiesData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!unitToDelete) return;

        setDeleting(true);
        try {
            await unitAPI.delete(unitToDelete.id);
            toast.success("Unit deleted successfully");
            setUnitToDelete(null);
            fetchData();
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to delete unit";
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    const filteredUnits = units.filter((unit) => {
        const matchesSearch =
            unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unit.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (unit.active_lease?.tenant?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesProperty = selectedProperty === "all" || unit.property_id.toString() === selectedProperty;
        const matchesType = selectedType === "all" || unit.type === selectedType;
        const matchesStatus = selectedStatus === "all" || unit.status?.toLowerCase() === selectedStatus.toLowerCase();

        const price = parseFloat(unit.price);
        const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
        const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);

        return matchesSearch && matchesProperty && matchesType && matchesStatus && matchesMinPrice && matchesMaxPrice;
    });

    const formatCurrency = (amount: string | number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(Number(amount));
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "available": return "bg-green-50 text-green-700 border-green-200";
            case "occupied": return "bg-blue-50 text-blue-700 border-blue-200";
            case "vacant": return "bg-yellow-50 text-yellow-700 border-yellow-200";
            case "maintenance": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const handleExport = () => {
        // Fixed: Use filteredUnits instead of undefined reportData
        if (!filteredUnits || filteredUnits.length === 0) {
            toast.error("No data to export");
            return;
        }

        // CSV Generation - Fixed to use actual unit data structure
        const headers = ["Unit Number", "Property Name", "Type", "Status", "Price", "Tenant Name", "Contact"];
        const rows = filteredUnits.map((unit: any) => [
            `"${unit.unit_number}"`,
            `"${unit.property?.name || 'N/A'}"`,
            `"${unit.type || 'N/A'}"`,
            `"${unit.status || 'N/A'}"`,
            unit.price || 0,
            `"${unit.active_lease?.tenant?.name || 'N/A'}"`,
            `"${unit.active_lease?.tenant?.phone || 'N/A'}"`
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r: any[]) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `units_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Units exported successfully");
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Units</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage all residential units across properties.
                    </p>
                </div>
                <Button
                    onClick={handleExport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                </Button>
            </div>

            <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by unit, property, or tenant..."
                                className="pl-9 bg-slate-50 border-slate-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                className={showFilters ? "bg-slate-100" : ""}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="mr-2 h-4 w-4" /> Filters
                            </Button>
                            <Button variant="ghost" size="icon" onClick={fetchData} title="Refresh Data">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 mt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Property" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Properties</SelectItem>
                                    {properties.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unit Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="Studio">Studio</SelectItem>
                                    <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
                                    <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
                                    <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
                                    <SelectItem value="Penthouse">Penthouse</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Occupied">Occupied</SelectItem>
                                    <SelectItem value="Vacant">Vacant</SelectItem>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                placeholder="Min Price"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <Input
                                type="number"
                                placeholder="Max Price"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="font-semibold">Unit Number</TableHead>
                                <TableHead className="font-semibold">Property</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Price</TableHead>
                                <TableHead className="font-semibold">Tenant</TableHead>
                                <TableHead className="font-semibold">Contact</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Loading units...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        No units found matching your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-slate-900">{unit.unit_number}</TableCell>
                                        <TableCell className="text-slate-600">{unit.property?.name}</TableCell>
                                        <TableCell className="text-slate-600">{unit.type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(unit.status)}>
                                                {unit.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">{formatCurrency(unit.price)}</TableCell>
                                        <TableCell className="text-slate-600">
                                            {unit.active_lease?.tenant
                                                ? unit.active_lease.tenant.name
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-slate-600">
                                            {unit.active_lease?.tenant
                                                ? unit.active_lease.tenant.phone
                                                : "-"
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => router.push(`/units/${unit.id}`)}
                                                >
                                                    View
                                                </Button>
                                                {user?.role === 'super_admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => setUnitToDelete(unit)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {unitToDelete?.active_lease?.tenant ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold">A tenant is Assigned the unit</p>
                                    <p className="text-sm">Cannot delete occupied units. Please end the lease first.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-600">
                                This action cannot be undone. This will permanently delete unit <strong>{unitToDelete?.unit_number}</strong>
                                and remove all associated data.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnitToDelete(null)} disabled={deleting}>
                            Cancel
                        </Button>
                        {!unitToDelete?.active_lease?.tenant && (
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                {deleting ? "Deleting..." : "Delete Unit"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}