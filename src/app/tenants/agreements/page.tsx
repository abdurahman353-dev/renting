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
import { Search, ArrowLeft, FileText, Phone, Printer } from "lucide-react"
import { tenantAPI } from "@/data/apis"
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
    unit_number?: string;
    property_name?: string;
    status: string;
    balance: number;
    agreement_amount?: number;
    leases?: Array<{
        start_date?: string;
        rent_amount?: number;
    }>;
}

export default function AgreementsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <AgreementsContent />
        </Suspense>
    );
}

function AgreementsContent() {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        try {
            const response = await tenantAPI.getAll();
            // Filter tenants who have an agreement amount > 0
            const withAgreements = response.filter((t: Tenant) => t.agreement_amount && Number(t.agreement_amount) > 0);
            setTenants(withAgreements);
        } catch (error) {
            console.error("Failed to fetch tenants:", error);
            toast.error("Failed to load tenants");
        } finally {
            setLoading(false);
        }
    };

    const filteredTenants = tenants.filter(tenant => {
        const searchLower = searchQuery.toLowerCase();
        return !searchQuery ||
            tenant.name.toLowerCase().includes(searchLower) ||
            tenant.id_number?.toLowerCase().includes(searchLower) ||
            tenant.phone.includes(searchLower);
    });

    if (loading) return <div className="p-8">Loading agreements...</div>;

    return (
        <div className="p-8 space-y-8 bg-muted/40 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push('/tenants')}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tenants
                        </Button>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Tenant Agreements</h2>
                    <p className="text-muted-foreground">Manage and print lease agreements.</p>
                </div>
            </div>

            <div className="bg-card rounded-xl shadow-lg border border-border p-6">
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Search Tenants
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
                                    <TableHead className="bg-card">Property / Unit</TableHead>
                                    <TableHead className="bg-card">Agreement Fee</TableHead>
                                    <TableHead className="bg-card text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTenants.length > 0 ? filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div>{tenant.name}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {tenant.id_number || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <div>{tenant.property?.name || tenant.property_name || 'N/A'}</div>
                                            <div className="text-xs text-muted-foreground">{tenant.unit?.unit_number || tenant.unit_number || 'No Unit'}</div>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.agreement_amount ? Number(tenant.agreement_amount).toLocaleString() : "0"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/tenants/${tenant.id}/agreement`)}
                                                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <Printer className="mr-2 h-4 w-4" /> Print Agreement
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No tenants with agreements found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
