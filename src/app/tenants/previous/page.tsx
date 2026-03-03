"use client"

import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Search, Phone, Mail, FileText, Download, Trash2, ArrowLeft, MoreVertical, RotateCcw, User } from "lucide-react"
import { tenantAPI } from "@/data/apis"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import * as XLSX from 'xlsx'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    created_at?: string;
    deactivated_at?: string;
    leases?: Array<{
        start_date?: string;
        rent_amount?: number;
        deposit_amount?: number;
        deposit_2_amount?: number;
    }>;
}

export default function PreviousTenantsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <PreviousTenantsContent />
        </Suspense>
    );
}

function PreviousTenantsContent() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Action dialog states
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmReactivateOpen, setConfirmReactivateOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const response = await tenantAPI.getHistory();
            setTenants(response);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
            toast.error("Failed to load previous tenants");
        } finally {
            setLoading(false);
        }
    };

    const handleReactivate = async (tenantId: number) => {
        try {
            await tenantAPI.toggleStatus(tenantId, { status: 'Active' });
            toast.success("Tenant Reactivated Successfully");
            fetchTenants(); // Refresh
        } catch (error: any) {
            console.error("Failed to reactivate tenant:", error);
            const msg = error?.response?.data?.message || "Tenant Reactivation Failed";
            toast.error(msg, {
                style: {
                    background: '#ef4444',
                    color: '#fff',
                }
            });
        } finally {
            setConfirmReactivateOpen(false);
            setSelectedTenantId(null);
        }
    };

    const handleDownloadStatement = (tenantId: number) => {
        // Navigate to statement page for preview
        router.push(`/tenants/${tenantId}/statement`);
    };

    const handleDelete = async (tenantId: number) => {
        try {
            await tenantAPI.delete(tenantId);
            toast.success("Tenant deleted successfully");
            fetchTenants(); // Refresh
        } catch (error: any) {
            console.error("Failed to delete tenant:", error);
            const msg = error?.response?.data?.message || "Failed to delete tenant";
            toast.error(msg);
        } finally {
            setConfirmDeleteOpen(false);
            setSelectedTenantId(null);
        }
    };

    const handleExportExcel = () => {
        const data = filteredTenants.map(t => ({
            Name: t.name,
            Phone: t.phone,
            'ID Number': t.id_number || 'N/A',
            Email: t.email || 'N/A',
            'Last Unit': t.unit?.unit_number || t.unit_number || 'N/A',
            'Joined Date': t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
            'Left Date': t.deactivated_at ? new Date(t.deactivated_at).toLocaleDateString() : 'N/A',
            'Balance (KES)': t.balance,
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Previous Tenants");
        XLSX.writeFile(wb, "Previous_Tenants.xlsx");
    };

    const filteredTenants = tenants.filter(tenant => {
        const searchLower = searchQuery.toLowerCase();
        return !searchQuery ||
            tenant.name.toLowerCase().includes(searchLower) ||
            tenant.id_number?.toLowerCase().includes(searchLower) ||
            tenant.phone.includes(searchLower);
    });

    if (loading) return <div className="p-8">Loading previous tenants...</div>;

    return (
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/tenants')}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Current Tenants
                        </Button>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Previous Tenants</h2>
                    <p className="text-muted-foreground">Archive of deactivated tenants.</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Search Previous Tenants
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                type="search"
                                placeholder="Search by name, ID number, or phone..."
                                className="pl-12 pr-4 h-12 text-base border-input focus:border-ring focus:ring-ring rounded-lg shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-md border border-border bg-card shadow-sm">
                    <div className="max-h-[600px] overflow-y-auto relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="bg-card">Name</TableHead>
                                    <TableHead className="bg-card">ID Number</TableHead>
                                    <TableHead className="bg-card">Contact</TableHead>
                                    <TableHead className="bg-card">Last Unit</TableHead>
                                    <TableHead className="bg-card">Joined Date</TableHead>
                                    <TableHead className="bg-card">Left Date</TableHead>
                                    <TableHead className="text-right bg-card">Balance (KES)</TableHead>
                                    <TableHead className="bg-card text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTenants.length > 0 ? filteredTenants.map((tenant) => {
                                    // Try to find start date from leases if created_at is not enough
                                    const leaseStart = tenant.leases?.[0]?.start_date;
                                    const joinedDate = leaseStart
                                        ? new Date(leaseStart).toLocaleDateString()
                                        : (tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : 'N/A');

                                    const leftDate = tenant.deactivated_at
                                        ? new Date(tenant.deactivated_at).toLocaleDateString()
                                        : 'N/A';

                                    return (
                                        <TableRow key={tenant.id} className="hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                <div>{tenant.name}</div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {tenant.id_number || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Phone className="mr-2 h-3 w-3" /> {tenant.phone}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {tenant.unit?.unit_number || tenant.unit_number || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {joinedDate}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {leftDate}
                                            </TableCell>
                                            <TableCell className={`text-right font-semibold ${tenant.balance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {tenant.balance.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedTenantId(tenant.id);
                                                            setConfirmReactivateOpen(true);
                                                        }}>
                                                            <RotateCcw className="mr-2 h-4 w-4 text-green-600" />
                                                            Reactivate
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.id}`)}>
                                                            <User className="mr-2 h-4 w-4 text-slate-600" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownloadStatement(tenant.id)}>
                                                            <FileText className="mr-2 h-4 w-4 text-blue-600" />
                                                            View Statement
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTenantId(tenant.id);
                                                                setConfirmDeleteOpen(true);
                                                            }}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Permanently
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            No previous tenants found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the tenant
                            account and all associated data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedTenantId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedTenantId && handleDelete(selectedTenantId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete Permanently
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reactivate Confirmation Dialog */}
            <AlertDialog open={confirmReactivateOpen} onOpenChange={setConfirmReactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reactivate Tenant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to reactivate this tenant? They will be moved back to the active tenants list.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedTenantId(null)}>No, Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedTenantId && handleReactivate(selectedTenantId)}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Yes, Reactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
