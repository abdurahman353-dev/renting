"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    Download,
    FileText,
    Mail,
    MapPin,
    Phone,
    User,
    Home,
    TrendingUp,
} from "lucide-react";

export default function TenantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reverseModalOpen, setReverseModalOpen] = useState(false);
    const [unreverseModalOpen, setUnreverseModalOpen] = useState(false);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // Fetch tenant details
                const tenantRes = await api.get(`/tenants/${params.id}`);
                setTenant(tenantRes.data);
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTenant();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground font-medium">Loading tenant details...</p>
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <User className="w-20 h-20 text-muted mx-auto mb-4" />
                    <p className="text-muted-foreground text-xl font-semibold">Tenant not found</p>
                </div>
            </div>
        );
    }

    const currentLease = tenant.leases?.find((l: any) => l.status === 'Active') || tenant.leases?.[0];
    const unit = tenant.unit;
    const property = unit?.property;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1115] text-foreground transition-colors duration-300">
            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-[#6366F1] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-[#FFFFFF]">{tenant.name}</h1>
                                <Badge className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm transition-all duration-300 ${tenant.status === 'ACTIVE'
                                    ? 'bg-emerald-500/15 text-[#22C55E] border border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                    : 'bg-slate-100 text-slate-700 dark:bg-[#1F2633] dark:text-slate-400 border-0'
                                    }`}>
                                    {tenant.status || 'Active'}
                                </Badge>
                            </div>
                            <div className="flex items-center text-slate-500 dark:text-[#9CA3AF] gap-4 font-medium">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1.5 text-[#6366F1]" />
                                    <span>{unit ? `Unit ${unit.unit_number}, ${property?.name}` : 'No unit assigned'}</span>
                                </div>
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-1.5 text-[#6366F1]" />
                                    <span>ID: {tenant.id_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            className="bg-[#6366F1] hover:bg-[#4f46e5] text-white shadow-xl px-6 py-2 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                            onClick={() => router.push(`/tenants/${tenant.id}/statement`)}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" /> Financial Statement
                        </Button>
                        <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white shadow-xl px-6 py-2 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                            onClick={() => setReverseModalOpen(true)}
                        >
                            <History className="mr-2 h-4 w-4" /> Reverse Invoice
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl px-6 py-2 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95"
                            onClick={() => setUnreverseModalOpen(true)}
                        >
                            <History className="mr-2 h-4 w-4" /> Unreverse Invoice
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Essential Info */}
                    <div className="space-y-6">
                        {/* Financial Summary Card */}
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.7)]">
                            <div className="h-2 bg-[#6366F1]"></div>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-[#6366F1]" />
                                    Financial Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-[#1B2230] rounded-xl border border-transparent dark:border-[#2A3242]/50 transition-all">
                                    <span className="text-slate-600 dark:text-[#9CA3AF] font-bold text-xs uppercase tracking-wider">Current Balance</span>
                                    <span className={`text-2xl font-black ${Number(tenant.balance) < 0 ? 'text-rose-500' : 'text-[#22C55E]'}`}>
                                        KES {Math.abs(Number(tenant.balance)).toLocaleString()}
                                        <span className="text-xs ml-1 font-bold opacity-80">{Number(tenant.balance) < 0 ? 'Due' : 'Credit'}</span>
                                    </span>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-[#9CA3AF]">Monthly Rent</span>
                                        <span className="font-semibold text-slate-900 dark:text-[#E5E7EB]">KES {Number(unit?.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-[#9CA3AF]">Last Payment</span>
                                        <span className="font-semibold text-slate-900 dark:text-[#E5E7EB]">
                                            {tenant.payments?.[0] ? `KES ${Number(tenant.payments[0].amount).toLocaleString()}` : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Details */}
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.7)]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-[#6366F1]" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-[#1E2430] flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-[#6366F1]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-0.5">Email Address</p>
                                            <p className="text-slate-900 dark:text-[#E5E7EB] font-medium">{tenant.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-[#1E2430] flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-[#6366F1]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-0.5">Phone Number</p>
                                            <p className="text-slate-900 dark:text-[#E5E7EB] font-medium">{tenant.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Lease & Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Lease Information */}
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.7)]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    Lease Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentLease ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="pb-4 border-b border-slate-50 dark:border-[#2A2F3A]">
                                                <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-1">Start Date</p>
                                                <p className="text-slate-900 dark:text-[#E5E7EB] font-bold text-lg">{new Date(currentLease.start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                            </div>
                                            <div className="pb-4 border-b border-slate-50 dark:border-[#2A2F3A]">
                                                <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-1">Monthly Rent</p>
                                                <p className="text-[#6366F1] font-black text-xl">KES {Number(currentLease.rent_amount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="pb-4 border-b border-slate-50 dark:border-[#2A2F3A] flex flex-col items-end">
                                                <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-1">Security Deposit</p>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-slate-900 dark:text-[#E5E7EB] font-black text-xl">
                                                        KES {((Number(currentLease.deposit_amount) || 0) + (Number(currentLease.deposit_2_amount) || 0)).toLocaleString()}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 dark:text-[#9CA3AF] font-bold">
                                                        {(() => {
                                                            const d1 = Number(currentLease.deposit_amount) || 0;
                                                            const d2 = Number(currentLease.deposit_2_amount) || 0;
                                                            if (d1 > 0 && d2 > 0) return `(1st & 2nd Deposit: ${d1.toLocaleString()} + ${d2.toLocaleString()})`;
                                                            if (d1 > 0) return `(1st Deposit: ${d1.toLocaleString()})`;
                                                            if (d2 > 0) return `(2nd Deposit: ${d2.toLocaleString()})`;
                                                            return "(No Deposit)";
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <p className="text-xs text-slate-400 dark:text-[#9CA3AF] font-bold uppercase mb-1">Rent Cycle</p>
                                                <Badge variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#2A2F3A] font-bold px-3 py-1">Monthly</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 dark:text-[#9CA3AF] italic py-4">No active lease found.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 hover:shadow-md dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.7)]">
                            <CardHeader className="flex flex-row justify-between items-center border-b border-slate-50 dark:border-[#2A2F3A] pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF]">Recent Transactions</CardTitle>
                                <Button variant="ghost" size="sm" className="text-[#6366F1] font-bold hover:bg-indigo-50 dark:hover:bg-[#1E2430]" onClick={() => router.push(`/tenants/${tenant.id}/statement`)}>
                                    View All
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[300px] overflow-y-auto relative">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-50 dark:bg-[#1B2230] z-10 shadow-sm border-b border-slate-100 dark:border-[#2A3242]">
                                            <TableRow className="hover:bg-transparent border-0">
                                                <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Date</TableHead>
                                                <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Reference</TableHead>
                                                <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Method</TableHead>
                                                <TableHead className="text-right font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tenant.payments && tenant.payments.length > 0 ? (
                                                tenant.payments.slice(0, 5).map((payment: any) => (
                                                    <TableRow key={payment.id} className="border-b border-slate-50 dark:border-[#2A3242] hover:bg-slate-50 dark:hover:bg-[#1F2633] transition-colors">
                                                        <TableCell className="text-slate-600 dark:text-[#E5E7EB] font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3.5 h-3.5 text-[#6366F1]" />
                                                                {new Date(payment.date || payment.created_at).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs text-slate-500 dark:text-[#9CA3AF] lowercase">{payment.reference || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="bg-white dark:bg-transparent border-slate-200 dark:border-[#2A2F3A] text-slate-600 dark:text-slate-400 font-bold">
                                                                {payment.method}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                                                            KES {Number(payment.amount).toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-10 text-slate-400 dark:text-[#9CA3AF] italic">
                                                        No recent transactions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <ReverseInvoiceModal
                    open={reverseModalOpen}
                    onOpenChange={setReverseModalOpen}
                    tenantId={tenant.id}
                    invoices={tenant.invoices?.filter((inv: any) => inv.status !== 'REVERSED') || []}
                    onSuccess={() => {
                        // Refresh tenant data
                        const fetchTenant = async () => {
                            try {
                                const tenantRes = await api.get(`/tenants/${params.id}`);
                                setTenant(tenantRes.data);
                            } catch (error) {
                                console.error("Failed to fetch tenant:", error);
                            }
                        };
                        fetchTenant();
                        setReverseModalOpen(false);
                    }}
                />

                <UnreverseInvoiceModal
                    open={unreverseModalOpen}
                    onOpenChange={setUnreverseModalOpen}
                    tenantId={tenant.id}
                    invoices={tenant.invoices?.filter((inv: any) => inv.status === 'REVERSED') || []}
                    onSuccess={() => {
                        // Refresh tenant data
                        const fetchTenant = async () => {
                            try {
                                const tenantRes = await api.get(`/tenants/${params.id}`);
                                setTenant(tenantRes.data);
                            } catch (error) {
                                console.error("Failed to fetch tenant:", error);
                            }
                        };
                        fetchTenant();
                        setUnreverseModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, History } from "lucide-react";

function ReverseInvoiceModal({ open, onOpenChange, tenantId, invoices, onSuccess }: any) {
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleReverse = async () => {
        if (!selectedInvoice) return;

        if (!confirm("Are you sure you want to reverse this invoice? It will be removed from the tenant's balance.")) {
            return;
        }

        setLoading(true);
        try {
            await api.post(`/finance/invoices/${selectedInvoice}/reverse`);
            toast.success("Invoice reversed successfully");
            onSuccess();
        } catch (error) {
            console.error("Failed to reverse invoice:", error);
            toast.error("Failed to reverse invoice");
        } finally {
            setLoading(false);
            setSelectedInvoice(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reverse Invoice</DialogTitle>
                    <DialogDescription>
                        Select an invoice to reverse. This action will void the invoice and remove it from the tenant's balance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {invoices.length === 0 ? (
                        <p className="text-center text-muted-foreground">No active invoices found to reverse.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedInvoice === inv.id ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedInvoice(inv.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm">{inv.invoice_number}</p>
                                            <p className="text-xs text-muted-foreground">{inv.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Date: {new Date(inv.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">KES {inv.amount.toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[10px] mt-1">{inv.status}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleReverse}
                        disabled={!selectedInvoice || loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Reversal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UnreverseInvoiceModal({ open, onOpenChange, tenantId, invoices, onSuccess }: any) {
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleUnreverse = async () => {
        if (!selectedInvoice) return;

        if (!confirm("Are you sure you want to unreverse this invoice? It will be added back to the tenant's balance along with any reversed payments.")) {
            return;
        }

        setLoading(true);
        try {
            await api.post(`/finance/invoices/${selectedInvoice}/unreverse`);
            toast.success("Invoice unreversed successfully");
            onSuccess();
        } catch (error) {
            console.error("Failed to unreverse invoice:", error);
            toast.error("Failed to unreverse invoice");
        } finally {
            setLoading(false);
            setSelectedInvoice(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unreverse Invoice</DialogTitle>
                    <DialogDescription>
                        Select an invoice to unreverse. This will restore the invoice and any associated payments, adding them back to the tenant's balance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {invoices.length === 0 ? (
                        <p className="text-center text-muted-foreground">No reversed invoices found.</p>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedInvoice === inv.id ? 'bg-emerald-50 border-emerald-500' : 'hover:bg-slate-50'}`}
                                    onClick={() => setSelectedInvoice(inv.id)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-sm">{inv.invoice_number}</p>
                                            <p className="text-xs text-muted-foreground">{inv.description}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Date: {new Date(inv.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">KES {inv.amount.toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[10px] mt-1 bg-red-100 text-red-800 border-red-200">{inv.status}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleUnreverse}
                        disabled={!selectedInvoice || loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm Unreversal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
