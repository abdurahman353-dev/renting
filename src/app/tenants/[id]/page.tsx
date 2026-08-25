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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    FileText,
    Mail,
    MapPin,
    Phone,
    User,
    Building2,
    RotateCcw,
    RotateCw,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Receipt,
    MessageSquare,
    PhoneCall,
    Send,
} from "lucide-react";
import { toast } from "sonner";

export default function TenantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reverseModalOpen, setReverseModalOpen] = useState(false);
    const [unreverseModalOpen, setUnreverseModalOpen] = useState(false);

    const fetchTenant = async () => {
        try {
            const tenantRes = await api.get(`/tenants/${params.id}`);
            setTenant(tenantRes.data);
        } catch (error) {
            console.error("Failed to fetch tenant:", error);
            toast.error("Failed to load tenant details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params.id) {
            fetchTenant();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">Loading tenant profile...</p>
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-3">
                    <User className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-foreground text-lg font-semibold">Tenant not found</p>
                    <Button variant="outline" size="sm" onClick={() => router.push('/tenants')}>
                        <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Tenants
                    </Button>
                </div>
            </div>
        );
    }

    const currentLease = tenant.leases?.find((l: any) => l.status === 'Active') || tenant.leases?.[0];
    const unit = tenant.unit;
    const property = unit?.property;
    const balanceNum = Number(tenant.balance || 0);

    const cleanPhone = tenant.phone ? tenant.phone.replace(/[^0-9]/g, '') : '';
    const formattedWaPhone = cleanPhone.startsWith('0')
        ? '254' + cleanPhone.substring(1)
        : cleanPhone.startsWith('254')
        ? cleanPhone
        : cleanPhone;

    return (
        <div className="min-h-screen bg-muted/30 text-foreground transition-colors duration-300">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Back link */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/tenants')}
                        className="text-muted-foreground hover:text-foreground gap-1.5 px-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Tenants</span>
                    </Button>
                </div>

                {/* Header Card */}
                <Card className="bg-card border-border shadow-sm rounded-xl">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-sm">
                                    <User className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{tenant.name}</h1>
                                        <Badge
                                            className={`font-semibold text-xs border ${
                                                tenant.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                                    : 'bg-muted text-muted-foreground border-border'
                                            }`}
                                        >
                                            {tenant.status || 'Active'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>{unit ? `Unit ${unit.unit_number}, ${property?.name || 'Property'}` : 'No unit assigned'}</span>
                                        </div>
                                        {tenant.id_number && (
                                            <div className="flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>ID: {tenant.id_number}</span>
                                            </div>
                                        )}
                                        {tenant.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span>{tenant.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/tenants/${tenant.id}/statement`)}
                                    className="border-border text-foreground hover:bg-muted font-medium"
                                >
                                    <Receipt className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                                    Financial Statement
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReverseModalOpen(true)}
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 font-medium"
                                >
                                    <RotateCcw className="w-4 h-4 mr-1.5 text-red-600 dark:text-red-400" />
                                    Reverse Invoice
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setUnreverseModalOpen(true)}
                                    className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-medium"
                                >
                                    <RotateCw className="w-4 h-4 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                                    Restore Invoice
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Financial Summary Card */}
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                    Financial Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className={`p-4 rounded-lg border transition-all ${
                                    balanceNum < 0
                                        ? 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
                                        : balanceNum > 0
                                        ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                                        : 'bg-muted/40 border-border'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Current Balance</span>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {balanceNum < 0 ? 'Outstanding amount due' : balanceNum > 0 ? 'Advance credit balance' : 'Account is cleared'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-black ${
                                                balanceNum < 0 ? 'text-red-600 dark:text-red-400' : balanceNum > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
                                            }`}>
                                                KES {Math.abs(balanceNum).toLocaleString()}
                                            </div>
                                            <Badge
                                                className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                                                    balanceNum < 0
                                                        ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800'
                                                        : balanceNum > 0
                                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                }`}
                                            >
                                                {balanceNum < 0 ? 'Due' : balanceNum > 0 ? 'Credit' : 'Cleared'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-2">
                                    <div className="flex justify-between items-center py-2 border-b border-border/60 text-sm">
                                        <span className="text-muted-foreground font-medium">Monthly Rent</span>
                                        <span className="font-bold text-foreground">
                                            KES {Number(currentLease?.rent_amount || unit?.price || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/60 text-sm">
                                        <span className="text-muted-foreground font-medium">Total Security Deposits</span>
                                        <span className="font-bold text-foreground">
                                            KES {((Number(currentLease?.deposit_amount) || 0) + (Number(currentLease?.deposit_2_amount) || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 text-sm">
                                        <span className="text-muted-foreground font-medium">Last Payment</span>
                                        <span className="font-bold text-foreground">
                                            {tenant.payments?.[0] ? `KES ${Number(tenant.payments[0].amount).toLocaleString()}` : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Details Card */}
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4">
                                    {/* Email */}
                                    <div className="flex items-start justify-between gap-2 p-3 bg-muted/20 border border-border/70 rounded-lg">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase">Email Address</p>
                                                <p className="text-sm font-medium text-foreground truncate">{tenant.email || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        {tenant.email && (
                                            <a
                                                href={`mailto:${tenant.email}`}
                                                className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-border transition-colors inline-flex items-center gap-1 shrink-0"
                                            >
                                                <Send className="w-3 h-3" />
                                                Email
                                            </a>
                                        )}
                                    </div>

                                    {/* Phone & WhatsApp */}
                                    <div className="space-y-2 p-3 bg-muted/20 border border-border/70 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase">Phone Number</p>
                                                <p className="text-sm font-medium text-foreground">{tenant.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        {tenant.phone && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <a
                                                    href={`tel:${tenant.phone}`}
                                                    className="flex-1 text-xs font-semibold py-1.5 px-2.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50 flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <PhoneCall className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    Call
                                                </a>
                                                <a
                                                    href={`https://wa.me/${formattedWaPhone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 text-xs font-semibold py-1.5 px-2.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                                    WhatsApp
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Lease Information Card */}
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    Lease Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {currentLease ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="pb-3 border-b border-border/60">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Start Date</p>
                                                <p className="text-foreground font-bold text-base">
                                                    {new Date(currentLease.start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                                </p>
                                            </div>
                                            <div className="pb-3 border-b border-border/60">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Monthly Rent</p>
                                                <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                                                    KES {Number(currentLease.rent_amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="pb-3 border-b border-border/60">
                                                <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Security Deposit</p>
                                                <div className="space-y-0.5">
                                                    <p className="text-foreground font-bold text-base">
                                                        KES {((Number(currentLease.deposit_amount) || 0) + (Number(currentLease.deposit_2_amount) || 0)).toLocaleString()}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {(() => {
                                                            const d1 = Number(currentLease.deposit_amount) || 0;
                                                            const d2 = Number(currentLease.deposit_2_amount) || 0;
                                                            if (d1 > 0 && d2 > 0) return `(1st: KES ${d1.toLocaleString()} + 2nd: KES ${d2.toLocaleString()})`;
                                                            if (d1 > 0) return `(1st Deposit: KES ${d1.toLocaleString()})`;
                                                            if (d2 > 0) return `(2nd Deposit: KES ${d2.toLocaleString()})`;
                                                            return "(No Deposit)";
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="pb-3 border-b border-border/60 flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Rent Cycle</p>
                                                    <Badge variant="outline" className="font-semibold text-xs border-border bg-muted/40">
                                                        Monthly
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-semibold uppercase mb-1 text-right">Lease Status</p>
                                                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 font-semibold text-xs">
                                                        {currentLease.status || 'Active'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm italic py-4">No active lease found.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Transactions Card */}
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    Recent Transactions
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:bg-primary/10 font-semibold gap-1 text-xs"
                                    onClick={() => router.push(`/tenants/${tenant.id}/statement`)}
                                >
                                    <span>View All</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                                                <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Date</TableHead>
                                                <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Reference</TableHead>
                                                <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Method</TableHead>
                                                <TableHead className="text-right font-semibold text-muted-foreground py-3 text-xs">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tenant.payments && tenant.payments.length > 0 ? (
                                                tenant.payments.slice(0, 5).map((payment: any) => {
                                                    const method = String(payment.method || '').toLowerCase();
                                                    const isMpesa = method.includes('mpesa') || method.includes('m-pesa');
                                                    const isCredit = method.includes('credit') || method.includes('auto');

                                                    return (
                                                        <TableRow key={payment.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                                                            <TableCell className="text-foreground font-medium text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    {new Date(payment.date || payment.created_at).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-xs text-muted-foreground">{payment.reference || 'N/A'}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`font-semibold text-xs border ${
                                                                        isMpesa
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                            : isCredit
                                                                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                                                    }`}
                                                                >
                                                                    {payment.method}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                                KES {Number(payment.amount).toLocaleString()}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
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

                {/* Modals */}
                <ReverseInvoiceModal
                    open={reverseModalOpen}
                    onOpenChange={setReverseModalOpen}
                    tenantId={tenant.id}
                    invoices={tenant.invoices?.filter((inv: any) => inv.status !== 'REVERSED') || []}
                    onSuccess={() => {
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
                        fetchTenant();
                        setUnreverseModalOpen(false);
                    }}
                />
            </div>
        </div>
    );
}

function ReverseInvoiceModal({ open, onOpenChange, tenantId, invoices, onSuccess }: any) {
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [reversalMode, setReversalMode] = useState<'payment_only' | 'full_invoice'>('payment_only');
    const [loading, setLoading] = useState(false);

    const targetInvObj = invoices?.find((i: any) => i.id === selectedInvoice);
    const isPaidOrPartial = targetInvObj && (targetInvObj.status === 'PAID' || Number(targetInvObj.paid_amount || 0) > 0);

    const handleReverse = async () => {
        if (!selectedInvoice) return;

        setLoading(true);
        try {
            const endpoint = (isPaidOrPartial && reversalMode === 'payment_only')
                ? `/finance/invoices/${selectedInvoice}/reverse-payment-only`
                : `/finance/invoices/${selectedInvoice}/reverse`;

            const res = await api.post(endpoint);
            toast.success(res.data?.message || "Invoice reversal processed successfully");
            onSuccess();
        } catch (error: any) {
            console.error("Failed to reverse invoice:", error);
            toast.error(error.response?.data?.message || "Failed to process reversal");
        } finally {
            setLoading(false);
            setSelectedInvoice(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-xl">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">Reverse Invoice / Payment</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Select an active invoice to void or revert its payments.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3 py-3">
                    {invoices.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">No active invoices available to reverse.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        selectedInvoice === inv.id
                                            ? 'bg-red-50/60 dark:bg-red-950/30 border-red-500 ring-1 ring-red-500'
                                            : 'border-border hover:bg-muted/50'
                                    }`}
                                    onClick={() => setSelectedInvoice(inv.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-foreground">{inv.invoice_number}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{inv.description || 'Rent Invoice'}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Date: {new Date(inv.created_at || inv.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-foreground">KES {Number(inv.amount).toLocaleString()}</p>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] uppercase font-semibold mt-1 ${
                                                    inv.status === 'PAID'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                                }`}
                                            >
                                                {inv.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedInvoice && isPaidOrPartial && (
                        <div className="space-y-2 pt-2 border-t">
                            <label className="text-xs font-bold text-foreground">Select Reversal Type:</label>
                            <div className="grid grid-cols-1 gap-2">
                                <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                                    reversalMode === 'payment_only'
                                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500'
                                        : 'border-border hover:bg-muted/50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="reversal_mode"
                                        checked={reversalMode === 'payment_only'}
                                        onChange={() => setReversalMode('payment_only')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="font-bold text-amber-900 dark:text-amber-300 block">1. Reverse Payment Only (Revert to Pending)</span>
                                        <span className="text-[11px] text-muted-foreground">Money bounced or not received. Voids the payment credit, leaving the invoice pending so tenant still owes.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                                    reversalMode === 'full_invoice'
                                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-500 ring-1 ring-red-500'
                                        : 'border-border hover:bg-muted/50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="reversal_mode"
                                        checked={reversalMode === 'full_invoice'}
                                        onChange={() => setReversalMode('full_invoice')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <span className="font-bold text-red-900 dark:text-red-300 block">2. Reverse Full Invoice (Void Charge & Payments)</span>
                                        <span className="text-[11px] text-muted-foreground">Invoice was a mistake. Completely erases both the billed invoice charge and payments from tenant.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleReverse}
                        disabled={!selectedInvoice || loading}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1.5 h-4 w-4" />}
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

        setLoading(true);
        try {
            await api.post(`/finance/invoices/${selectedInvoice}/unreverse`);
            toast.success("Invoice restored successfully");
            onSuccess();
        } catch (error: any) {
            console.error("Failed to unreverse invoice:", error);
            toast.error(error.response?.data?.message || "Failed to restore invoice");
        } finally {
            setLoading(false);
            setSelectedInvoice(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-xl">
                <DialogHeader>
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <RotateCw className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-foreground">Restore Invoice</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                Select a previously reversed invoice to restore back to the tenant's balance.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-3 py-3">
                    {invoices.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-lg">
                            <p className="text-sm text-muted-foreground">No reversed invoices available to restore.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {invoices.map((inv: any) => (
                                <div
                                    key={inv.id}
                                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                        selectedInvoice === inv.id
                                            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500'
                                            : 'border-border hover:bg-muted/50'
                                    }`}
                                    onClick={() => setSelectedInvoice(inv.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-foreground">{inv.invoice_number}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{inv.description || 'Rent Invoice'}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Reversed on: {new Date(inv.updated_at || inv.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold text-sm text-foreground">KES {Number(inv.amount).toLocaleString()}</p>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] uppercase font-semibold mt-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300"
                                            >
                                                REVERSED
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedInvoice && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                            <span>This will unvoid the invoice, restore any associated payments, and update the tenant's ledger.</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleUnreverse}
                        disabled={!selectedInvoice || loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCw className="mr-1.5 h-4 w-4" />}
                        Confirm Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
