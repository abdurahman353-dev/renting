"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
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
    Edit,
    Loader2
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { unitAPI } from "@/data/apis";
import { toast } from "sonner";

export default function UnitDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [unit, setUnit] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [openEdit, setOpenEdit] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        unit_number: "",
        price: "",
        type: "",
        status: "",
        features: ""
    });

    useEffect(() => {
        fetchUnit();
    }, [params.id]);

    const fetchUnit = async () => {
        try {
            const data = await unitAPI.getById(params.id);
            setUnit(data);
            setEditForm({
                unit_number: data.unit_number || "",
                price: data.price || "",
                type: data.type || "",
                status: data.status || "Available",
                features: data.features || ""
            });
        } catch (error) {
            console.error("Failed to fetch unit:", error);
            toast.error("Failed to load unit details");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            await unitAPI.update(params.id, editForm);
            toast.success("Unit updated successfully");
            setOpenEdit(false);
            fetchUnit(); // Refresh data
        } catch (error) {
            console.error("Failed to update unit:", error);
            toast.error("Failed to update unit");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (!unit) return <div className="p-8">Unit not found</div>;

    const lease = unit.active_lease;
    const tenant = lease?.tenant;

    // Status Badge Logic
    const isOccupied = unit.status?.toUpperCase() === 'OCCUPIED';
    const isAvailable = unit.status?.toUpperCase() === 'AVAILABLE';

    // Explicit color mapping as requested
    const statusColorClass = isAvailable
        ? "bg-green-500 hover:bg-green-600 text-white border-0"
        : isOccupied
            ? "bg-red-500 hover:bg-red-600 text-white border-0"
            : "bg-slate-500 text-white"; // Default for maintenance etc

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                            {unit.property?.name || "Property Name"}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Unit {unit.unit_number}
                    </h1>
                    <div className="flex items-center text-slate-500 mt-2">
                        <span className="flex items-center mr-4">
                            <Home className="w-4 h-4 mr-1" /> {unit.type}
                        </span>
                        {/* Placeholder for size/beds if available in future schema */}
                        {/* <span className="flex items-center mr-4"><Maximize className="w-4 h-4 mr-1" /> 750 sqft</span> */}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={`text-base px-4 py-1 ${statusColorClass}`}>
                        {unit.status}
                    </Badge>

                    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                        <DialogTrigger asChild>
                            <Button>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Unit
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Unit Details</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Unit Number</Label>
                                    <Input
                                        value={editForm.unit_number}
                                        onChange={(e) => setEditForm({ ...editForm, unit_number: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Type</Label>
                                    <Input
                                        value={editForm.type}
                                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                        className="col-span-3"
                                        placeholder="e.g. 1 Bedroom"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Rent (KES)</Label>
                                    <Input
                                        value={editForm.price}
                                        onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                        className="col-span-3"
                                        type="number"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Status</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Occupied">Occupied</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Vacant">Vacant</option>
                                    </select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenEdit(false)}>Cancel</Button>
                                <Button onClick={handleUpdate} disabled={submitting}>
                                    {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                                    <span className="font-semibold">{Number(unit.price).toLocaleString()} KES</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Unit Type</span>
                                    <span className="font-semibold">{unit.type || "N/A"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-slate-500">Property</span>
                                    <span className="font-semibold">{unit.property?.name || "N/A"}</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-3 text-slate-900">Features</h4>
                                {unit.features ? (
                                    <ul className="space-y-2">
                                        {/* Assuming features is a comma separated string or simple string for now */}
                                        <li className="flex items-center text-slate-600">
                                            <Home className="w-4 h-4 mr-2 text-primary" />
                                            {unit.features}
                                        </li>
                                    </ul>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No specific features listed.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* History - Placeholder for future real history */}
                    <Card>
                        <CardHeader>
                            <CardTitle>History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {lease ? (
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <History className="w-4 h-4 text-blue-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Lease Active</p>
                                            <p className="text-slate-500 text-sm">
                                                Current tenant: {tenant?.name}
                                            </p>
                                            <p className="text-slate-400 text-xs mt-1">
                                                Since {new Date(lease.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No recent history available.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Current Tenant */}
                    {isOccupied && tenant ? (
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
                                        <p className="font-semibold">{tenant.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {tenant.email || tenant.phone}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" /> Start Date
                                        </span>
                                        <span className="font-medium">{lease.start_date}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500 flex items-center">
                                            <Calendar className="w-4 h-4 mr-2" /> Lease End
                                        </span>
                                        <span className="font-medium">{lease.end_date || "N/A"}</span>
                                    </div>
                                    <div className="pt-4">
                                        <Button variant="outline" className="w-full">
                                            View Lease Agreement
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Tenant</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm">This unit is currently available.</p>
                                <Button className="w-full mt-4" variant="default" onClick={() => router.push('/tenants')}>
                                    Register Tenant
                                </Button>
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
