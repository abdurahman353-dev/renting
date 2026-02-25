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
import { Search, Plus, MoreVertical, Phone, Mail, Loader2, Building2, Home, Users, FileText } from "lucide-react"
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
import { propertyAPI, tenantAPI, communicationAPI } from "@/data/apis"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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
    previous_balance?: number;
    remaining_previous_balance?: number;
    agreement_amount?: number;
    unallocated_balance?: number;
    leases?: Array<{
        start_date?: string;
        rent_amount?: number;
        deposit_amount?: number;
        deposit_2_amount?: number;
    }>;
}

export default function TenantsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <TenantsContent />
        </Suspense>
    );
}

function TenantsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
        previous_balance: "",
        deposit_amount: "",
        deposit_2_amount: "",
        agreement_amount: "",
        overpaid_amount: "",
        include_deposit_1: false,
        include_deposit_2: false,
        include_rent: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTenantId, setEditingTenantId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // SMS State
    const [smsOpen, setSmsOpen] = useState(false);
    const [smsData, setSmsData] = useState({ phone: "", name: "" });
    const [smsMessage, setSmsMessage] = useState("");
    const [sendingSms, setSendingSms] = useState(false);

    const handleSendSms = async () => {
        if (!smsMessage.trim()) return;

        setSendingSms(true);
        try {
            await communicationAPI.send({
                phone: smsData.phone,
                message: smsMessage
            });
            toast.success("SMS sent successfully");
            setSmsOpen(false);
            setSmsMessage("");
        } catch (error: any) {
            console.error("Failed to send SMS:", error);
            const msg = error?.response?.data?.message || "Failed to send SMS";
            toast.error(msg);
        } finally {
            setSendingSms(false);
        }
    };

    const handleSendReminders = async () => {
        if (!confirm("Are you sure you want to send balance reminders to all tenants with outstanding balances?")) return;

        setSendingReminders(true);
        try {
            await tenantAPI.sendBalanceReminders();
            toast.success("Balance reminders sent successfully");
        } catch (error: any) {
            console.error("Failed to send reminders:", error);
            const msg = error?.response?.data?.message || "Failed to send reminders";
            toast.error(msg);
        } finally {
            setSendingReminders(false);
        }
    };













    // Fetch data
    useEffect(() => {
        fetchTenants();
        fetchProperties();
    }, []);

    // Handle query parameters for pre-filling
    useEffect(() => {
        const propertyId = searchParams.get('property_id');
        const unitId = searchParams.get('unit_id');

        if (propertyId && unitId && properties.length > 0) {
            const selectedProperty = properties.find(p => p.id.toString() === propertyId);
            const selectedUnit = selectedProperty?.units?.find((u: any) => u.id.toString() === unitId);

            if (selectedProperty && selectedUnit) {
                setFormData(prev => ({
                    ...prev,
                    property_id: propertyId,
                    unit_id: unitId,
                    rent_amount: selectedUnit.price?.toString() || "",
                    deposit_amount: selectedUnit.deposit_1?.toString() || "",
                    deposit_2_amount: selectedUnit.deposit_2?.toString() || "",
                    include_deposit_1: !!selectedUnit.deposit_1,
                    include_deposit_2: !!selectedUnit.deposit_2,
                    start_date: new Date().toISOString().split('T')[0] // Default to today
                }));
                setOpen(true);

                // Clear the query parameters from the URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [searchParams, properties]);

    const fetchTenants = async () => {
        try {
            const response = await tenantAPI.getActive();
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
        let { name, value } = e.target;

        if (name === 'id_number') {
            value = value.replace(/\D/g, '');
            if (value.length > 8) {
                value = value.slice(0, 8);
            }
        }

        if (name === 'phone') {
            value = value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
        }

        if (name === 'previous_balance') {
            value = value.replace(/\D/g, '');
        }

        if (name === 'agreement_amount') {
            value = value.replace(/\D/g, '');
        }

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Auto-fill rent and deposits if unit changes
            if (name === 'unit_id') {
                const selectedProperty = properties.find(p => p.id.toString() === prev.property_id);
                const selectedUnit = selectedProperty?.units?.find((u: any) => u.id.toString() === value);
                if (selectedUnit) {
                    newData.rent_amount = selectedUnit.price?.toString() || "";
                    newData.deposit_amount = selectedUnit.deposit_1?.toString() || "";
                    newData.deposit_2_amount = selectedUnit.deposit_2?.toString() || "";
                    newData.include_deposit_1 = !!selectedUnit.deposit_1;
                    newData.include_deposit_2 = !!selectedUnit.deposit_2;
                }
            }
            return newData;
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleCheckboxToggle = (name: 'include_deposit_1' | 'include_deposit_2') => {
        setFormData(prev => {
            const nextVal = !prev[name];
            const newData = { ...prev, [name]: nextVal };

            // If we are checking it, and the amount is 0/empty, try to fill it from the unit
            if (nextVal) {
                const depositField = name === 'include_deposit_1' ? 'deposit_amount' : 'deposit_2_amount';
                const currentAmount = parseFloat(prev[depositField] || '0');
                if (currentAmount <= 0) {
                    const selectedProperty = properties.find(p => p.id.toString() === prev.property_id);
                    const selectedUnit = selectedProperty?.units?.find((u: any) => u.id.toString() === prev.unit_id);
                    if (selectedUnit) {
                        const unitDepositField = name === 'include_deposit_1' ? 'deposit_1' : 'deposit_2';
                        newData[depositField] = selectedUnit[unitDepositField]?.toString() || "0";
                    }
                }
            }
            return newData;
        });
    };



    const resetForm = () => {
        setFormData({
            name: "", id_number: "", phone: "", email: "",
            property_id: "", unit_id: "", start_date: "", rent_amount: "", previous_balance: "", agreement_amount: "", overpaid_amount: "",
            deposit_amount: "", deposit_2_amount: "",
            include_deposit_1: false, include_deposit_2: false, include_rent: true
        });
        setErrors({});
        setIsEditing(false);
        setEditingTenantId(null);
    };

    const handleEditClick = (tenant: any) => {
        const lease = tenant.leases?.[0];

        // Find property and unit from the properties array to get original deposit values as fallback
        const selectedProperty = properties.find(p => p.id === tenant.property?.id);
        const selectedUnit = selectedProperty?.units?.find((u: any) => u.id === tenant.unit?.id);

        const d1 = (lease?.deposit_amount && Number(lease.deposit_amount) > 0)
            ? lease.deposit_amount.toString()
            : (selectedUnit?.deposit_1?.toString() || "0");

        const d2 = (lease?.deposit_2_amount && Number(lease.deposit_2_amount) > 0)
            ? lease.deposit_2_amount.toString()
            : (selectedUnit?.deposit_2?.toString() || "0");

        // Logic to determine Include Rent and Overpaid Amount
        // Check if there is a Rent invoice for the start date month/year
        let hasRentInvoice = false;
        if (lease?.start_date) {
            const startDate = new Date(lease.start_date);
            const startMonth = startDate.getMonth() + 1;
            const startYear = startDate.getFullYear();

            hasRentInvoice = tenant.invoices?.some((inv: any) =>
                inv.type === 'rent' &&
                inv.month === startMonth &&
                inv.year === startYear
            );
        }

        // Find Overpayment Credit payment
        const overpayment = tenant.payments?.find((p: any) => p.method === 'Overpayment Credit');

        setFormData({
            name: tenant.name,
            id_number: tenant.id_number || "",
            phone: tenant.phone,
            email: tenant.email || "",
            property_id: tenant.property?.id?.toString() || "",
            unit_id: tenant.unit?.id?.toString() || "",
            start_date: lease?.start_date ? new Date(lease.start_date).toISOString().split('T')[0] : "",
            rent_amount: lease?.rent_amount?.toString() || selectedUnit?.price?.toString() || "",
            previous_balance: tenant.previous_balance?.toString() || "",
            agreement_amount: tenant.agreement_amount?.toString() || "",
            deposit_amount: d1,
            deposit_2_amount: d2,
            include_deposit_1: !!(lease?.deposit_amount && Number(lease.deposit_amount) > 0),
            include_deposit_2: !!(lease?.deposit_2_amount && Number(lease.deposit_2_amount) > 0),
            overpaid_amount: overpayment ? overpayment.amount.toString() : "",
            include_rent: hasRentInvoice // Set based on actual invoice existence
        });
        setIsEditing(true);
        setEditingTenantId(tenant.id);
        setOpen(true);
    };

    // Filter units based on selected property - only show units that are NOT occupied and NOT under maintenance
    const selectedProperty = properties.find(p => p.id.toString() === formData.property_id);
    const availableUnits = selectedProperty?.units?.filter((u: any) =>
        (u.status?.toLowerCase() === 'available' || u.status?.toLowerCase() === 'vacant' || u.id.toString() === formData.unit_id) // Show currently selected unit even if occupied
    ) || [];

    const handlePropertyChange = (value: string) => {
        setFormData(prev => ({ ...prev, property_id: value, unit_id: "" }));
        if (errors.property_id) setErrors(prev => ({ ...prev, property_id: "" }));
    }

    const handleUnitChange = (value: string) => {
        const unit = selectedProperty?.units?.find((u: any) => u.id.toString() === value);
        if (unit) {
            setFormData(prev => ({
                ...prev,
                unit_id: value,
                rent_amount: unit.price?.toString() || prev.rent_amount,
                deposit_amount: unit.deposit_1?.toString() || prev.deposit_amount, // Auto-fill deposit 1
                deposit_2_amount: unit.deposit_2?.toString() || prev.deposit_2_amount // Auto-fill deposit 2
            }));
        } else {
            setFormData(prev => ({ ...prev, unit_id: value }));
        }
        if (errors.unit_id) setErrors(prev => ({ ...prev, unit_id: "" }));
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Enter name";
        // ID Validation: 7 or 8 digits
        // ID Validation: 7 or 8 digits
        if (!formData.id_number.trim()) {
            newErrors.id_number = "Enter ID";
        } else if (!/^\d{7,8}$/.test(formData.id_number)) {
            newErrors.id_number = "Invalid ID";
        }

        if (!formData.phone.trim()) {
            newErrors.phone = "Enter phone number";
        } else if (!/^(07|01)\d{8}$/.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = "Enter phone number starting with 07 or 01........";
        }

        if (!formData.property_id) newErrors.property_id = "Select property";
        if (!formData.unit_id) newErrors.unit_id = "Select unit";
        if (!formData.start_date) newErrors.start_date = "Pick date";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegisterTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            // ... (rest of logic same)
            const payload = {
                name: formData.name,
                id_number: formData.id_number,
                phone: formData.phone,
                email: formData.email || null,
                property_id: formData.property_id,
                unit_id: formData.unit_id,
                start_date: formData.start_date,
                rent_amount: formData.rent_amount,
                previous_balance: formData.previous_balance || 0,
                agreement_amount: formData.agreement_amount || 0,
                overpaid_amount: formData.overpaid_amount || 0,
                include_rent: formData.include_rent, // Ensure boolean is sent

                deposit_amount: formData.include_deposit_1 ? (formData.deposit_amount || 0) : null,
                deposit_2_amount: formData.include_deposit_2 ? (formData.deposit_2_amount || 0) : null
            };

            if (isEditing && editingTenantId) {
                await tenantAPI.update(editingTenantId, payload);
                toast.success("Tenant updated successfully");
            } else {
                await tenantAPI.create(payload);
                toast.success("Tenant registered successfully");
            }
            fetchTenants(); // Refresh list to get updated data
            setOpen(false);
            resetForm();
        } catch (error: any) {
            console.error("Error registering tenant:", error);
            const errorMsg = error?.response?.data?.message || error?.message || "Failed to save tenant";
            alert(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

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
        if (!confirm("Are you sure you want to deactivate this tenant? This will make the unit vacant. Any outstanding balance will be preserved.")) return;

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
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Tenants</h2>
                    <p className="text-muted-foreground">Manage tenant profiles and lease agreements.</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/tenants/previous')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Users className="mr-2 h-4 w-4" /> Previous Tenants
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push('/tenants/agreements')}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                        <FileText className="mr-2 h-4 w-4" /> Agreements
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSendReminders}
                        disabled={sendingReminders}
                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    >
                        {sendingReminders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                        Send Reminders
                    </Button>

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
                        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{isEditing ? "Edit Tenant" : "Register New Tenant"}</DialogTitle>
                                <DialogDescription>
                                    {isEditing ? "Update tenant details." : "Create a new tenant profile."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col gap-6 py-4">
                                {/* Personal Information Section */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="name" className={errors.name ? "text-red-500" : ""}>Name *</Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="John Doe"
                                                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                                            />
                                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="id_number" className={errors.id_number ? "text-red-500" : ""}>ID No *</Label>
                                            <Input
                                                id="id_number"
                                                name="id_number"
                                                value={formData.id_number}
                                                onChange={handleInputChange}
                                                placeholder="National ID / Passport"
                                                className={errors.id_number ? "border-red-500 focus-visible:ring-red-500" : ""}
                                            />
                                            {errors.id_number && <p className="text-sm text-red-500">{errors.id_number}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="phone" className={errors.phone ? "text-red-500" : ""}>Phone *</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="07..."
                                                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                                            />
                                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Unit Assignment Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">Unit Assignment (Optional)</h3>
                                    <div className="space-y-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="property_id" className={errors.property_id ? "text-red-500" : ""}>Property</Label>
                                            <Select name="property_id" value={formData.property_id} onValueChange={handlePropertyChange}>
                                                <SelectTrigger className={errors.property_id ? "border-red-500 focus:ring-red-500" : ""}>
                                                    <SelectValue placeholder="Select Property..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {properties.map((property) => (
                                                        <SelectItem key={property.id} value={property.id.toString()}>
                                                            {property.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.property_id && <p className="text-sm text-red-500">{errors.property_id}</p>}
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="unit_id" className={errors.unit_id ? "text-red-500" : ""}>Unit</Label>
                                            <Select name="unit_id" value={formData.unit_id} onValueChange={handleUnitChange}>
                                                <SelectTrigger className={errors.unit_id ? "border-red-500 focus:ring-red-500" : ""}>
                                                    <SelectValue placeholder="Select Unit..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableUnits.map((unit: any) => (
                                                        <SelectItem key={unit.id} value={unit.id.toString()}>
                                                            {unit.unit_number} - {unit.type} (KES {unit.price})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.unit_id && <p className="text-sm text-red-500">{errors.unit_id}</p>}
                                        </div>

                                        {/* Start Date - Keeping it here as part of assignment */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="start_date" className={errors.start_date ? "text-red-500" : ""}>Start Date</Label>
                                            <Input
                                                id="start_date"
                                                name="start_date"
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => {
                                                    handleInputChange(e);
                                                    if (errors.start_date) setErrors(prev => ({ ...prev, start_date: "" }));
                                                }}
                                                className={errors.start_date ? "border-red-500 focus-visible:ring-red-500" : ""}
                                                required
                                            />
                                            {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Financials Section - Scroll down to see these */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-muted-foreground">Financials</h3>
                                    <div className="space-y-4">
                                        {/* Rent */}
                                        <div className="space-y-2">
                                            <Label htmlFor="rent_amount">Rent Amount (KES)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="rent_amount"
                                                    name="rent_amount"
                                                    type="number"
                                                    value={formData.rent_amount}
                                                    onChange={handleInputChange}
                                                    disabled
                                                    className="flex-1"
                                                />
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center space-x-2">
                                                        <Input
                                                            id="include_rent"
                                                            type="checkbox"
                                                            className="w-4 h-4"
                                                            checked={formData.include_rent !== false}
                                                            onChange={(e) => setFormData({ ...formData, include_rent: e.target.checked })}
                                                        />
                                                        <Label htmlFor="include_rent" className="text-sm font-normal cursor-pointer">
                                                            Include Initial Month
                                                        </Label>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground text-right w-full max-w-[120px]">
                                                        {formData.include_rent !== false ? "Initial month invoice created" : "Initial month skipped"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deposit 1 */}
                                        <div className="space-y-2">
                                            <Label htmlFor="deposit_amount">Deposit 1 (KES)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="deposit_amount"
                                                    name="deposit_amount"
                                                    type="number"
                                                    value={formData.deposit_amount}
                                                    onChange={handleInputChange} // Allow manual edit if needed? Usually read-only from unit but can edit? Assuming disabled based on previous code.
                                                    disabled
                                                    className="flex-1"
                                                    placeholder="0"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        id="include_deposit_1"
                                                        type="checkbox"
                                                        className="w-4 h-4"
                                                        checked={formData.include_deposit_1}
                                                        onChange={() => handleCheckboxToggle('include_deposit_1')}
                                                    />
                                                    <Label htmlFor="include_deposit_1" className="text-sm font-normal cursor-pointer">Include</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deposit 2 */}
                                        <div className="space-y-2">
                                            <Label htmlFor="deposit_2_amount">Deposit 2 (KES)</Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    id="deposit_2_amount"
                                                    name="deposit_2_amount"
                                                    type="number"
                                                    value={formData.deposit_2_amount}
                                                    onChange={handleInputChange}
                                                    disabled
                                                    className="flex-1"
                                                    placeholder="0"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <Input
                                                        id="include_deposit_2"
                                                        type="checkbox"
                                                        className="w-4 h-4"
                                                        checked={formData.include_deposit_2}
                                                        onChange={() => handleCheckboxToggle('include_deposit_2')}
                                                    />
                                                    <Label htmlFor="include_deposit_2" className="text-sm font-normal cursor-pointer">Include</Label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Opening Balance */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="previous_balance">Opening Balance (Optional)</Label>
                                            <Input
                                                id="previous_balance"
                                                name="previous_balance"
                                                type="text"
                                                value={formData.previous_balance}
                                                onChange={handleInputChange}
                                                disabled={!!formData.overpaid_amount && Number(formData.overpaid_amount) > 0}
                                                placeholder="Enter amount..."
                                            />
                                        </div>

                                        {/* Overpaid Amount */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="overpaid_amount">Overpaid Amount (Optional)</Label>
                                            <Input
                                                id="overpaid_amount"
                                                name="overpaid_amount"
                                                type="number"
                                                value={formData.overpaid_amount}
                                                onChange={handleInputChange}
                                                disabled={!!formData.previous_balance && Number(formData.previous_balance) > 0}
                                                placeholder="Enter amount..."
                                            />
                                        </div>

                                        {/* Agreement Amount */}
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="agreement_amount">Agreement Amount (Optional)</Label>
                                            <Input
                                                id="agreement_amount"
                                                name="agreement_amount"
                                                type="number"
                                                value={formData.agreement_amount}
                                                onChange={handleInputChange}
                                                placeholder="Enter agreement cost..."
                                            />
                                        </div>
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

                        </DialogContent >
                    </Dialog >
                </div >
            </div >

            {/* Professional Search and Filters */}
            < div className="bg-card rounded-xl shadow-lg border border-border p-6" >
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
                                className="pl-12 pr-4 h-12 text-base border-input focus:border-ring focus:ring-ring rounded-lg shadow-sm"
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
                            className="w-full h-12 px-4 text-base rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer hover:border-input"
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
                            className="w-full h-12 px-4 text-base rounded-lg border border-input bg-background shadow-sm focus:border-ring focus:ring-2 focus:ring-ring focus:outline-none transition-all cursor-pointer hover:border-input disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">All Units</option>
                            {availableFilterUnits.map((u: any) => (
                                <option key={u.id} value={u.unit_number}>{u.unit_number}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                {
                    (searchQuery || filterProperty || filterUnit) && (
                        <div className="mt-4 pt-4 border-t border-border">
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
                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-300 border-0">
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
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300 border-0">
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
                                    className="text-sm text-muted-foreground hover:text-foreground underline ml-2"
                                >
                                    Clear all
                                </button>
                            </div>
                        </div>
                    )
                }
            </div >



            <div className="rounded-md border border-border bg-card shadow-sm">
                <div className="max-h-[600px] overflow-y-auto relative">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="bg-card">Name</TableHead>
                                <TableHead className="bg-card">ID Number</TableHead>
                                <TableHead className="bg-card">Property / Unit</TableHead>
                                <TableHead className="bg-card">Contact</TableHead>
                                <TableHead className="bg-card">Email</TableHead>
                                <TableHead className="bg-card">Start Date</TableHead>
                                <TableHead className="bg-card">Rent (KES)</TableHead>
                                <TableHead className="bg-card">Deposit (Total)</TableHead>
                                <TableHead className="bg-card">Opening Balance</TableHead>
                                <TableHead className="bg-card">Agreement Fee</TableHead>
                                <TableHead className="bg-card">Status</TableHead>
                                <TableHead className="text-right bg-card">Balance (KES)</TableHead>
                                <TableHead className="w-[50px] bg-card"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTenants.length > 0 ? filteredTenants.map((tenant) => {
                                // Get lease information
                                const lease = tenant.leases?.[0];
                                const startDate = lease?.start_date ? new Date(lease.start_date).toLocaleDateString() : 'N/A';
                                const rentAmount = lease?.rent_amount || 'N/A';

                                return (
                                    <TableRow key={tenant.id} className="cursor-pointer hover:bg-muted/50">
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
                                            {tenant.remaining_previous_balance !== undefined
                                                ? tenant.remaining_previous_balance.toLocaleString()
                                                : (tenant.previous_balance ? tenant.previous_balance.toLocaleString() : "0")}
                                        </TableCell>
                                        <TableCell>
                                            {tenant.agreement_amount ? Number(tenant.agreement_amount).toLocaleString() : "0"}
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
                                            tenant.balance >= 0 ? "text-green-600" : ""
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
                                                    <DropdownMenuItem onClick={() => {
                                                        setSmsData({
                                                            phone: tenant.phone,
                                                            name: tenant.name
                                                        });
                                                        setSmsMessage("");
                                                        setSmsOpen(true);
                                                    }}>
                                                        <Mail className="mr-2 h-4 w-4" /> Send SMS
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
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="bg-muted p-6 rounded-full">
                                                <Users className="h-12 w-12 text-muted-foreground" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-foreground">Assign Tenants to Properties by clicking Register Tenant button</h3>
                                            <p className="text-muted-foreground max-w-sm mx-auto">Start by registering your first tenant and assigning them to a property unit.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Send SMS Dialog */}
                <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Send SMS to {smsData.name}</DialogTitle>
                            <DialogDescription>
                                Send a direct text message to {smsData.phone}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 px-4">
                            <Label className="mb-4" htmlFor="sms-message">Message</Label>
                            <textarea
                                id="sms-message"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Type your message here..."
                                value={smsMessage}
                                onChange={(e) => setSmsMessage(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSmsOpen(false)}>Cancel</Button>
                            <Button onClick={handleSendSms} disabled={sendingSms || !smsMessage.trim()}>
                                {sendingSms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Send SMS
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    )
}