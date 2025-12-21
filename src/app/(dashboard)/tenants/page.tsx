"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MoreVertical, Phone, Mail, Loader2, Building2, Home } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { propertyAPI, tenantAPI } from "@/data/apis"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Tenant {
    id: number;
    name: string;
    id_number?: string;
    email?: string;
    phone: string;
    unit?: { unit_number: string };
    property?: { name: string };
    // Handling flat structure or relations
    unit_number?: string;
    property_name?: string;
    status: string;
    balance: number;
    leases?: Array<{
        start_date?: string;
        rent_amount?: number;
        deposit_amount?: number;
        deposit_2_amount?: number;
    }>;
}

export default function TenantsPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Search and Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [filterProperty, setFilterProperty] = useState("");
    const [filterUnit, setFilterUnit] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        id_number: "",
        phone: "",
        email: "",
        property_id: "",
        unit_id: "",
        start_date: "",
        rent_amount: "",
        deposit_amount: "",
        deposit_2_amount: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTenantId, setEditingTenantId] = useState<number | null>(null);













    useEffect(() => {
        fetchTenants();
        fetchProperties();
    }, []);

    const fetchTenants = async () => {
        try {
            const response = await tenantAPI.getAll();
            setTenants(response);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            // const response = await api.get('/properties');
            const response = await propertyAPI.getAll()
            setProperties(response);
        } catch (error) {
            console.error("Failed to fetch properties:", error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill rent if unit changes
            if (name === 'unit_id') {
                const selectedProperty = properties.find(p => p.id.toString() === prev.property_id);
                const selectedUnit = selectedProperty?.units?.find((u: any) => u.id.toString() === value);
                if (selectedUnit) {
                    newData.rent_amount = selectedUnit.price?.toString() || "";
                }
            }
            return newData;
        });
    };

    const handleRegisterTenant = async () => {
        if (!formData.name || !formData.id_number || !formData.phone) {
            alert("Please fill in all required fields (Name, ID Number, Phone)");
            return;
        }

        if (!formData.property_id || !formData.unit_id || !formData.start_date || !formData.rent_amount) {
            alert("Please complete the unit assignment details (Property, Unit, Start Date, Rent Amount)");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                id_number: formData.id_number,
                phone: formData.phone,
                email: formData.email || null,
                property_id: formData.property_id,
                unit_id: formData.unit_id,
                start_date: formData.start_date,
                rent_amount: formData.rent_amount,
                deposit_amount: formData.deposit_amount || null,
                deposit_2_amount: formData.deposit_2_amount || null
            };

            if (isEditing && editingTenantId) {
                await tenantAPI.update(editingTenantId, payload);
                toast.success("successfully updated the desired tenant");
            } else {
                await tenantAPI.create(payload);
                toast.success("Tenant registered successfully");
            }

            // Refresh list
            await Promise.all([fetchTenants(), fetchProperties()]);

            // Close dialog
            setOpen(false);
            // Reset form
            resetForm();
        } catch (error: any) {
            console.error("Failed to save tenant:", error);
            const errorMsg = error?.response?.data?.message || error?.message || "Failed to save tenant";
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "", id_number: "", phone: "", email: "",
            property_id: "", unit_id: "", start_date: "", rent_amount: "",
            deposit_amount: "", deposit_2_amount: ""
        });
        setIsEditing(false);
        setEditingTenantId(null);
    };

    const handleEditClick = (tenant: any) => {
        const lease = tenant.leases?.[0];
        setFormData({
            name: tenant.name,
            id_number: tenant.id_number || "",
            phone: tenant.phone,
            email: tenant.email || "",
            property_id: tenant.property?.id?.toString() || "",
            unit_id: tenant.unit?.id?.toString() || "",
            start_date: lease?.start_date ? new Date(lease.start_date).toISOString().split('T')[0] : "",
            rent_amount: lease?.rent_amount?.toString() || "",
            deposit_amount: lease?.deposit_amount?.toString() || "",
            deposit_2_amount: lease?.deposit_2_amount?.toString() || ""
        });
        setIsEditing(true);
        setEditingTenantId(tenant.id);
        setOpen(true);
    };













































    // Filter units based on selected property - only show VACANT units
    const selectedProperty = properties.find(p => p.id.toString() === formData.property_id);
    const availableUnits = selectedProperty?.units?.filter((u: any) => u.status?.toUpperCase() !== 'OCCUPIED') || [];

    // Filter tenants based on search and filters
    const filteredTenants = tenants.filter(tenant => {
        // Search filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            tenant.name.toLowerCase().includes(searchLower) ||
            tenant.id_number?.toLowerCase().includes(searchLower) ||
            tenant.unit?.unit_number?.toLowerCase().includes(searchLower) ||
            tenant.unit_number?.toLowerCase().includes(searchLower);

        // Property filter
        const matchesProperty = !filterProperty ||
            tenant.property?.name === filterProperty ||
            tenant.property_name === filterProperty;

        // Unit filter
        const matchesUnit = !filterUnit ||
            tenant.unit?.unit_number === filterUnit ||
            tenant.unit_number === filterUnit;

        return matchesSearch && matchesProperty && matchesUnit;
    });

    // Get unique units for the selected property filter
    const filterPropertyObj = properties.find(p => p.name === filterProperty);
    const availableFilterUnits = filterPropertyObj?.units || [];

    const handleDeactivate = async (tenantId: number) => {
        if (!confirm("Are you sure you want to deactivate this tenant? This will make the unit vacant.")) return;

        try {
            await tenantAPI.toggleStatus(tenantId, { status: 'Inactive' });
            toast.success("Tenant deactivated successfully");
            // Refresh both to show new status and updated unit vacancy
            await Promise.all([fetchTenants(), fetchProperties()]);
        } catch (error: any) {
            console.error("Failed to deactivate tenant:", error);
            const msg = error?.response?.data?.message || "Failed to deactivate tenant";
            alert(msg);
        }
    };

    if (loading) return <div className="p-8">Loading tenants...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tenants</h2>
                    <p className="text-muted-foreground">Manage tenant profiles and lease agreements.</p>
                </div>

                <Dialog open={open} onOpenChange={(val) => {
                    setOpen(val);
                    if (!val) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                            resetForm();
                            setOpen(true);
                        }}>
                            <Plus className="mr-2 h-4 w-4" /> Register Tenant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? "Edit Tenant" : "Register New Tenant"}</DialogTitle>
                            <DialogDescription>
                                {isEditing ? "Update tenant profile details." : "Create a new tenant profile."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="sm:text-right">Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    className="sm:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="id_number" className="sm:text-right">ID No *</Label>
                                <Input
                                    id="id_number"
                                    name="id_number"
                                    value={formData.id_number}
                                    onChange={handleInputChange}
                                    placeholder="National ID / Passport"
                                    className="sm:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="sm:text-right">Phone *</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="07..."
                                    className="sm:col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="sm:text-right">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Optional"
                                    className="sm:col-span-3"
                                />
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <p className="text-sm font-medium text-muted-foreground mb-4">Unit Assignment (Optional)</p>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                        <Label htmlFor="property_id" className="sm:text-right">Property</Label>
                                        <select
                                            id="property_id"
                                            name="property_id"
                                            value={formData.property_id}
                                            onChange={handleInputChange}
                                            className="sm:col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select Property...</option>
                                            {properties.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                        <Label htmlFor="unit_id" className="sm:text-right">Unit</Label>
                                        <select
                                            id="unit_id"
                                            name="unit_id"
                                            value={formData.unit_id}
                                            onChange={handleInputChange}
                                            disabled={!formData.property_id}
                                            className="sm:col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">Select Unit...</option>
                                            {availableUnits.map((u: any) => (
                                                <option key={u.id} value={u.id}>Unit {u.unit_number} (KES {u.price})</option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.unit_id && (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                                <Label htmlFor="start_date" className="sm:text-right">Start Date</Label>
                                                <Input
                                                    id="start_date"
                                                    name="start_date"
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={handleInputChange}
                                                    className="sm:col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                                <Label htmlFor="rent_amount" className="sm:text-right">Rent (KES)</Label>
                                                <Input
                                                    disabled
                                                    id="rent_amount"
                                                    name="rent_amount"
                                                    type="number"
                                                    value={formData.rent_amount}
                                                    onChange={handleInputChange}
                                                    className="sm:col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                                <Label htmlFor="deposit_amount" className="sm:text-right">Deposit 1 (KES)</Label>
                                                <Input
                                                    id="deposit_amount"
                                                    name="deposit_amount"
                                                    type="number"
                                                    value={formData.deposit_amount}
                                                    onChange={handleInputChange}
                                                    placeholder="Optional"
                                                    className="sm:col-span-3"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
                                                <Label htmlFor="deposit_2_amount" className="sm:text-right">Deposit 2 (KES)</Label>
                                                <Input
                                                    id="deposit_2_amount"
                                                    name="deposit_2_amount"
                                                    type="number"
                                                    value={formData.deposit_2_amount}
                                                    onChange={handleInputChange}
                                                    placeholder="Optional"
                                                    className="sm:col-span-3"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleRegisterTenant} disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {isEditing ? "Update" : "Register"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Professional Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Enhanced Search Bar */}
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Search Tenants
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search by name, ID number, or unit..."
                                className="pl-12 pr-4 h-12 text-base border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-lg shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Property Filter */}
                    <div className="lg:w-64">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Building2 className="inline w-4 h-4 mr-1" />
                            Property
                        </label>
                        <select
                            value={filterProperty}
                            onChange={(e) => {
                                setFilterProperty(e.target.value);
                                setFilterUnit(""); // Reset unit filter when property changes
                            }}
                            className="w-full h-12 px-4 text-base rounded-lg border border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-400"
                        >
                            <option value="">All Properties</option>
                            {properties.map((p: any) => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Unit Filter */}
                    <div className="lg:w-64">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            <Home className="inline w-4 h-4 mr-1" />
                            Unit
                        </label>
                        <select
                            value={filterUnit}
                            onChange={(e) => setFilterUnit(e.target.value)}
                            disabled={!filterProperty}
                            className="w-full h-12 px-4 text-base rounded-lg border border-slate-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer hover:border-slate-400 disabled:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">All Units</option>
                            {availableFilterUnits.map((u: any) => (
                                <option key={u.id} value={u.unit_number}>{u.unit_number}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || filterProperty || filterUnit) && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-600">Active Filters:</span>
                            {searchQuery && (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                                    Search: "{searchQuery}"
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="ml-2 hover:text-blue-900"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {filterProperty && (
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0">
                                    Property: {filterProperty}
                                    <button
                                        onClick={() => {
                                            setFilterProperty("");
                                            setFilterUnit("");
                                        }}
                                        className="ml-2 hover:text-purple-900"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            {filterUnit && (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                                    Unit: {filterUnit}
                                    <button
                                        onClick={() => setFilterUnit("")}
                                        className="ml-2 hover:text-green-900"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterProperty("");
                                    setFilterUnit("");
                                }}
                                className="text-sm text-slate-600 hover:text-slate-900 underline ml-2"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>ID Number</TableHead>
                            <TableHead>Property / Unit</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Rent (KES)</TableHead>
                            <TableHead>Deposit (Total)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Balance (KES)</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTenants.map((tenant) => {
                            // Get lease information
                            const lease = tenant.leases?.[0];
                            const startDate = lease?.start_date ? new Date(lease.start_date).toLocaleDateString() : 'N/A';
                            const rentAmount = lease?.rent_amount || 'N/A';

                            return (
                                <TableRow key={tenant.id} className="cursor-pointer hover:bg-slate-50">
                                    <TableCell className="font-medium">
                                        <div>{tenant.name}</div>
                                        <div className="text-xs text-muted-foreground">ID: {tenant.id}</div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {tenant.id_number || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <div>{tenant.property?.name || tenant.property_name || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{tenant.unit?.unit_number || tenant.unit_number || 'No Unit'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Phone className="mr-2 h-3 w-3" /> {tenant.phone}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {tenant.email ? (
                                            <div className="flex items-center text-muted-foreground">
                                                <Mail className="mr-2 h-3 w-3" />
                                                {tenant.email}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {startDate}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {typeof rentAmount === 'number' ? rentAmount.toLocaleString() : rentAmount}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-700">
                                            {((Number(lease?.deposit_amount) || 0) + (Number(lease?.deposit_2_amount) || 0)).toLocaleString()}
                                        </div>
                                        {(Number(lease?.deposit_2_amount) > 0) && (
                                            <div className="text-[10px] text-muted-foreground">
                                                ({Number(lease?.deposit_amount).toLocaleString()} + {Number(lease?.deposit_2_amount).toLocaleString()})
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                tenant.status?.toUpperCase() === "ACTIVE"
                                                    ? "bg-green-500 hover:bg-green-600 text-white border-0"
                                                    : tenant.status?.toUpperCase() === "INACTIVE"
                                                        ? "bg-red-500 hover:bg-red-600 text-white border-0"
                                                        : tenant.status === "Notice"
                                                            ? "bg-orange-500 hover:bg-orange-600 text-white border-0"
                                                            : ""
                                            }
                                        >
                                            {tenant.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${tenant.balance < 0 ? "text-red-600" :
                                        tenant.balance > 0 ? "text-green-600" : ""
                                        }`}>
                                        {tenant.balance === 0 ? "Cleared" :
                                            tenant.balance < 0 ? (tenant.balance ?? 0).toLocaleString() :
                                                `+${(tenant.balance ?? 0).toLocaleString()}`}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEditClick(tenant)}>
                                                    Edit Tenant
                                                </DropdownMenuItem>


                                                <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}/statement`)}>
                                                    View Statement
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    onClick={() => handleDeactivate(tenant.id)}
                                                >
                                                    Deactivate
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}