"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
    Check,
    ChevronsUpDown,
    Loader2,
    CreditCard,
    User,
    Building2,
    Home,
    X,
    ArrowLeft,
    Receipt,
    History,
    Calendar,
    Smartphone,
    Building,
    Coins,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Wallet,
    Search,
    ArrowRight,
    BadgePercent,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { tenantAPI, financeAPI, superAdminAPI, authAPI } from "@/data/apis";
import { toast } from "sonner";
import MpesaPaymentModal from "@/components/MpesaPaymentModal";

// Zod Schema for Payment Form
const paymentSchema = z.object({
    amount: z.string().min(1, "Amount is required"),
    method: z.string().min(1, "Payment method is required"),
    reference: z.string().optional(),
});

interface Tenant {
    id: number;
    name: string;
    id_number: string;
    phone: string;
    email?: string;
    unit_number?: string;
    property_name?: string;
    balance: number;
    unit?: { unit_number: string };
    property?: { name: string };
}

interface Invoice {
    id: number;
    invoice_number: string;
    tenant_id: number;
    amount: number;
    paid_amount: number;
    balance: number;
    status: string;
    type: string;
    description: string;
    month: number;
    year: number;
    due_date?: string;
    created_at?: string;
    month_year?: string;
    tenant?: { name: string };
    unit_number?: string;
    property_name?: string;
}

export default function CashierPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const invoiceIdParam = searchParams.get("invoice_id");

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [open, setOpen] = useState(false);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

    const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        setCurrentUser(authAPI.getUser());
    }, []);

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: "",
            method: "M-Pesa",
            reference: "",
        },
    });

    const watchedAmount = form.watch("amount");

    // Fetch invoice if invoice_id is in URL
    useEffect(() => {
        if (invoiceIdParam) {
            fetchInvoiceDetails(invoiceIdParam);
        }
    }, [invoiceIdParam]);

    const fetchInvoiceDetails = async (invoiceId: string) => {
        setLoadingInvoice(true);
        try {
            const invoice = await financeAPI.getInvoice(invoiceId);
            setTargetInvoice(invoice);

            const res = await tenantAPI.getAll();
            const tenantsData = Array.isArray(res) ? res : (res.data || []);
            setTenants(tenantsData);
            const tenant = tenantsData.find((t: Tenant) => t.id === invoice.tenant_id);
            if (tenant) {
                setSelectedTenant(tenant);
                setSelectedInvoices([invoice.id]);

                const balance = invoice.amount - invoice.paid_amount;
                form.setValue("amount", balance.toString());
            }
        } catch (error) {
            console.error("Failed to fetch invoice:", error);
            toast.error("Failed to load invoice details");
        } finally {
            setLoadingInvoice(false);
        }
    };

    // Fetch Tenants on Mount
    useEffect(() => {
        if (!invoiceIdParam) {
            const fetchTenants = async () => {
                setLoadingTenants(true);
                try {
                    const res = await tenantAPI.getAll();
                    const data = Array.isArray(res) ? res : (res.data || []);
                    setTenants(data);
                } catch (error) {
                    console.error("Failed to fetch tenants", error);
                    toast.error("Failed to load tenants list");
                } finally {
                    setLoadingTenants(false);
                }
            };
            fetchTenants();
        }
    }, [invoiceIdParam]);

    // Fetch pending invoices & payments when tenant is selected
    useEffect(() => {
        if (selectedTenant) {
            fetchPendingInvoices(selectedTenant.id);
            fetchPaymentHistory(selectedTenant.id);
        } else {
            setPendingInvoices([]);
            setPaymentHistory([]);
            setSelectedInvoices([]);
        }
    }, [selectedTenant]);

    const fetchPendingInvoices = async (tenantId: number) => {
        setLoadingInvoices(true);
        try {
            const res = await financeAPI.getInvoices({ tenant_id: tenantId });
            const invoices = Array.isArray(res) ? res : (res.data || []);
            const pending = invoices.filter(
                (inv: Invoice) => inv.status === "PENDING" || inv.status === "PARTIAL"
            );
            setPendingInvoices(pending);
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        } finally {
            setLoadingInvoices(false);
        }
    };

    const fetchPaymentHistory = async (tenantId: number) => {
        try {
            const history = await tenantAPI.getPaymentHistory(tenantId);
            setPaymentHistory(Array.isArray(history) ? history : (history?.data || []));
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const onTenantSelect = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setOpen(false);
        form.reset({
            amount: "",
            method: "M-Pesa",
            reference: ""
        });
        setSelectedInvoices([]);
    };

    const toggleInvoiceSelection = (invoiceId: number) => {
        setSelectedInvoices(prev => {
            if (prev.includes(invoiceId)) {
                return prev.filter(id => id !== invoiceId);
            } else {
                return [...prev, invoiceId];
            }
        });
    };

    const calculateSelectedTotal = () => {
        return pendingInvoices
            .filter(inv => selectedInvoices.includes(inv.id))
            .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paid_amount)), 0);
    };

    // Update form amount when selection changes
    useEffect(() => {
        const total = calculateSelectedTotal();
        if (total > 0) {
            form.setValue("amount", total.toString());
        }
    }, [selectedInvoices, pendingInvoices]);

    const handleSelectAllInvoices = () => {
        if (selectedInvoices.length === pendingInvoices.length) {
            setSelectedInvoices([]);
        } else {
            setSelectedInvoices(pendingInvoices.map(inv => inv.id));
        }
    };

    const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
        if (!selectedTenant) return;
        const amountNum = parseFloat(values.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error("Please enter a valid payment amount");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                tenant_id: selectedTenant.id,
                amount: amountNum,
                method: values.method,
                reference: values.reference,
                invoice_ids: selectedInvoices,
            };

            await financeAPI.recordPayment(payload);
            toast.success("Payment recorded successfully");

            // Refresh data
            const res = await tenantAPI.getAll();
            const updatedTenants = Array.isArray(res) ? res : (res.data || []);
            setTenants(updatedTenants);

            const updatedSelectedTenant = updatedTenants.find((t: any) => t.id === selectedTenant.id);
            if (updatedSelectedTenant) {
                setSelectedTenant(updatedSelectedTenant);
            }

            await fetchPendingInvoices(selectedTenant.id);
            await fetchPaymentHistory(selectedTenant.id);

            form.reset({
                amount: "",
                method: "M-Pesa",
                reference: ""
            });
            setSelectedInvoices([]);

            if (invoiceIdParam) {
                setTimeout(() => router.push("/finance"), 1000);
            }
        } catch (error: any) {
            console.error("Payment failed", error);
            const msg = error.response?.data?.message || "Payment processing failed";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for Type Badges
    const renderTypeBadge = (typeRaw?: string) => {
        const type = (typeRaw || 'Rent').toLowerCase().trim();

        if (type.includes('opening')) {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold text-xs">
                    Opening Balance
                </Badge>
            );
        }

        if (type.includes('agr') || type.includes('agreement')) {
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-semibold text-xs">
                    Agreement
                </Badge>
            );
        }

        if (type.includes('deposit')) {
            return (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-xs">
                    Deposit
                </Badge>
            );
        }

        if (type.includes('maint') || type.includes('repair')) {
            return (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold text-xs">
                    Repair / Maintenance
                </Badge>
            );
        }

        // Default to Rent (Blue)
        return (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold text-xs">
                Rent
            </Badge>
        );
    };

    // Helper for Method Badges
    const renderMethodBadge = (methodRaw?: string) => {
        const method = (methodRaw || 'Cash').toLowerCase().trim();

        if (method.includes('mpesa') || method.includes('m-pesa')) {
            return (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-xs inline-flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>M-Pesa</span>
                </Badge>
            );
        }

        if (method.includes('credit') || method.includes('overpayment') || method.includes('auto') || method.includes('wallet')) {
            return (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-semibold text-xs inline-flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>{methodRaw || 'Credit Balance'}</span>
                </Badge>
            );
        }

        if (method.includes('bank') || method.includes('transfer') || method.includes('cheque') || method.includes('check')) {
            return (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold text-xs inline-flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>{methodRaw || 'Bank Transfer'}</span>
                </Badge>
            );
        }

        if (method.includes('cash')) {
            return (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold text-xs inline-flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span>Cash</span>
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-semibold text-xs">
                {methodRaw || 'Payment'}
            </Badge>
        );
    };

    if (loadingInvoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">Loading cashier workspace...</p>
                </div>
            </div>
        );
    }

    const tenantBalance = selectedTenant ? Number(selectedTenant.balance || 0) : 0;
    const paymentAmountNum = parseFloat(watchedAmount) || 0;
    const selectedInvoicesTotal = calculateSelectedTotal();

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-muted/30 min-h-screen transition-colors duration-300 text-foreground">
            {/* Header & Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/finance")}
                            className="text-muted-foreground hover:text-foreground p-0 h-auto gap-1 text-xs font-semibold"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Finance</span>
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Cashier Workspace</h1>
                    <p className="text-sm text-muted-foreground">
                        {targetInvoice
                            ? `Recording payment for Invoice #${targetInvoice.invoice_number}`
                            : "Record rent payments, issue receipts, and allocate funds to tenant invoices."}
                    </p>
                </div>

                {invoiceIdParam && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground hover:bg-muted font-medium"
                        onClick={() => router.push("/finance")}
                    >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel
                    </Button>
                )}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN: Tenant Search & Payment Entry */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tenant Selector Card */}
                    {!targetInvoice && (
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    Select Tenant
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between h-12 text-sm bg-background border-border text-foreground rounded-lg hover:bg-muted/50 transition-all font-medium"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                                                {selectedTenant ? (
                                                    <span className="font-bold text-foreground truncate">
                                                        {selectedTenant.name} — Unit {selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'N/A'} ({selectedTenant.property?.name || selectedTenant.property_name || 'Property'})
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">Search tenant by name, unit, or phone...</span>
                                                )}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[420px] p-0 bg-popover border-border shadow-xl rounded-xl" align="start">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Type tenant name, unit or phone..." className="text-sm" />
                                            <CommandEmpty className="py-6 text-center text-muted-foreground text-sm">No tenant found.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto p-1.5">
                                                {loadingTenants ? (
                                                    <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        Loading tenants...
                                                    </div>
                                                ) : (
                                                    tenants.map((tenant) => (
                                                        <CommandItem
                                                            key={tenant.id}
                                                            value={`${tenant.name} ${tenant.unit?.unit_number || tenant.unit_number || ''} ${tenant.phone || ''}`}
                                                            onSelect={() => onTenantSelect(tenant)}
                                                            className="cursor-pointer py-2.5 px-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <Check
                                                                    className={cn(
                                                                        "h-4 w-4 text-primary shrink-0",
                                                                        selectedTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="truncate">
                                                                    <p className="font-bold text-sm text-foreground truncate">{tenant.name}</p>
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        Unit {tenant.unit?.unit_number || tenant.unit_number || 'N/A'} • {tenant.property?.name || tenant.property_name || 'Property'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-[10px] uppercase font-bold shrink-0 ${
                                                                    tenant.balance < 0
                                                                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                                }`}
                                                            >
                                                                {tenant.balance < 0 ? `Due: ${Math.abs(tenant.balance).toLocaleString()}` : 'Cleared'}
                                                            </Badge>
                                                        </CommandItem>
                                                    ))
                                                )}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Invoices Card (Selectable) */}
                    {selectedTenant && (
                        <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6 flex flex-row items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                                            <Receipt className="w-4 h-4" />
                                        </div>
                                        Pending Invoices
                                        {loadingInvoices ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-1 inline" />
                                        ) : (
                                            <span className="text-xs font-semibold text-muted-foreground">({pendingInvoices.length})</span>
                                        )}
                                    </CardTitle>
                                </div>
                                {!loadingInvoices && pendingInvoices.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSelectAllInvoices}
                                        className="text-xs font-semibold border-border hover:bg-muted h-8"
                                    >
                                        {selectedInvoices.length === pendingInvoices.length ? "Deselect All" : "Select All"}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-6 space-y-3">
                                {loadingInvoices ? (
                                    <div className="space-y-2 py-1">
                                        {[...Array(2)].map((_, i) => (
                                            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20 animate-pulse">
                                                <div className="space-y-1.5">
                                                    <div className="h-4 w-36 bg-muted rounded" />
                                                    <div className="h-3 w-48 bg-muted rounded" />
                                                </div>
                                                <div className="h-4 w-16 bg-muted rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : pendingInvoices.length === 0 ? (
                                    <div className="text-center py-8 border border-dashed border-border rounded-xl">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                                        <p className="text-sm font-semibold text-foreground">No Pending Invoices</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">This tenant has cleared all invoices. You can still record an advance overpayment below.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {pendingInvoices.map((invoice) => {
                                            const balance = invoice.amount - invoice.paid_amount;
                                            const isSelected = selectedInvoices.includes(invoice.id);

                                            return (
                                                <div
                                                    key={invoice.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer",
                                                        isSelected
                                                            ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500 shadow-sm"
                                                            : "bg-background border-border hover:bg-muted/40"
                                                    )}
                                                    onClick={() => toggleInvoiceSelection(invoice.id)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={cn(
                                                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                                                            isSelected
                                                                ? "bg-blue-600 border-blue-600 text-white"
                                                                : "border-border bg-background"
                                                        )}>
                                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <div className="space-y-0.5 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-mono text-xs font-bold text-foreground">
                                                                    {invoice.invoice_number}
                                                                </span>
                                                                {renderTypeBadge(invoice.type)}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {invoice.description || 'Monthly Rent Invoice'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 pl-3">
                                                        <p className="font-extrabold text-sm text-foreground">
                                                            KES {balance.toLocaleString()}
                                                        </p>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Total: KES {Number(invoice.amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {selectedInvoices.length > 0 && (
                                            <div className="mt-4 p-3.5 bg-muted/40 rounded-xl border border-border flex justify-between items-center">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Selected Invoices Total:
                                                </span>
                                                <span className="text-base font-extrabold text-primary">
                                                    KES {selectedInvoicesTotal.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Form Card */}
                    {selectedTenant && (
                        <Card className="bg-card border-border shadow-sm rounded-xl">
                            <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    Record Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* Amount Input */}
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                                                            Amount to Pay (KES)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">
                                                                    KES
                                                                </div>
                                                                <Input
                                                                    placeholder="0.00"
                                                                    className="pl-12 h-11 text-lg font-bold bg-background border-border text-foreground rounded-lg"
                                                                    type="number"
                                                                    step="any"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Payment Method Select */}
                                            <FormField
                                                control={form.control}
                                                name="method"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                                                            Payment Method
                                                        </FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-11 bg-background border-border text-foreground rounded-lg text-sm font-medium">
                                                                    <SelectValue placeholder="Select method" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                                <SelectItem value="Cash">Cash</SelectItem>
                                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                                <SelectItem value="Card">Credit / Debit Card</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {/* Reference Code */}
                                        <FormField
                                            control={form.control}
                                            name="reference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">
                                                        Reference Code / Transaction ID (Optional)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. M-Pesa Code (QA892X123), Bank Slip No."
                                                            className="h-11 bg-background border-border text-foreground font-mono text-sm rounded-lg"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-muted-foreground">
                                                        Attaches an audit trail reference code to this payment transaction.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Submit Action */}
                                        <div className="flex items-center justify-end gap-3 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.push("/finance")}
                                                className="border-border text-foreground hover:bg-muted text-xs font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={submitting || paymentAmountNum <= 0}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 h-10 shadow-sm"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing Payment...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CreditCard className="mr-1.5 h-4 w-4" />
                                                        Record Payment of KES {paymentAmountNum.toLocaleString()}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN: Tenant Snapshot & Payment History */}
                <div className="space-y-6">
                    {selectedTenant ? (
                        <>
                            {/* Tenant Profile Snapshot Card */}
                            <Card className="bg-card border-border shadow-sm rounded-xl">
                                <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-base shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <CardTitle className="text-base font-bold text-foreground truncate">
                                                {selectedTenant.name}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {selectedTenant.email || selectedTenant.phone || 'No contact email'}
                                            </p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {/* Current Balance Box */}
                                    <div className={cn(
                                        "p-4 rounded-xl border transition-all",
                                        tenantBalance < 0
                                            ? "bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-900/50"
                                            : tenantBalance > 0
                                            ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                            : "bg-muted/40 border-border"
                                    )}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Current Balance</span>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {tenantBalance < 0 ? 'Total outstanding arrears' : tenantBalance > 0 ? 'Advance credit balance' : 'Account is cleared'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-2xl font-black",
                                                    tenantBalance < 0 ? "text-red-600 dark:text-red-400" : tenantBalance > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                                                )}>
                                                    KES {Math.abs(tenantBalance).toLocaleString()}
                                                </div>
                                                <Badge
                                                    className={cn(
                                                        "text-[10px] uppercase font-bold px-2 py-0.5 border",
                                                        tenantBalance < 0
                                                            ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300"
                                                            : tenantBalance > 0
                                                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300"
                                                            : "bg-muted text-muted-foreground border-border"
                                                    )}
                                                >
                                                    {tenantBalance < 0 ? "Due" : tenantBalance > 0 ? "Credit" : "Cleared"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Property & Unit Chips */}
                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                        <div className="p-3 bg-muted/30 border border-border/70 rounded-lg">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                                <Home className="w-3 h-3 text-indigo-500" />
                                                Unit
                                            </span>
                                            <p className="font-bold text-sm text-foreground mt-0.5">
                                                Unit {selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-muted/30 border border-border/70 rounded-lg">
                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                                <Building2 className="w-3 h-3 text-blue-500" />
                                                Property
                                            </span>
                                            <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                                                {selectedTenant.property?.name || selectedTenant.property_name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Live Payment Impact Calculator */}
                                    {paymentAmountNum > 0 && (
                                        <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs space-y-2">
                                            <p className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                                <BadgePercent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                Estimated Balance After Payment
                                            </p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">New Balance:</span>
                                                <span className="font-bold text-foreground">
                                                    KES {Math.max(0, Math.abs(tenantBalance) - paymentAmountNum).toLocaleString()} {tenantBalance + paymentAmountNum >= 0 ? '(Cleared/Credit)' : '(Remaining Due)'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Payment History */}
                            <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
                                <CardHeader className="bg-muted/40 border-b border-border py-4 px-6">
                                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                                        <History className="w-4 h-4 text-primary" />
                                        Recent Payments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 max-h-[320px] overflow-y-auto">
                                    {paymentHistory.length === 0 ? (
                                        <div className="text-center py-8 text-xs text-muted-foreground italic">
                                            No recent payments found for this tenant.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border/60">
                                            {paymentHistory.slice(0, 5).map((payment: any) => (
                                                <div key={payment.id} className="p-3.5 hover:bg-muted/30 transition-colors flex justify-between items-center">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5">
                                                            {renderMethodBadge(payment.method)}
                                                            {payment.reference && (
                                                                <span className="font-mono text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/40">
                                                                    {payment.reference}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{format(new Date(payment.date || payment.created_at), "MMM dd, yyyy")}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 inline-block">
                                                            +KES {Number(payment.amount).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        /* Empty State Sidebar */
                        <div className="h-full min-h-[350px] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-card shadow-sm">
                            <div className="w-14 h-14 bg-muted/60 rounded-xl flex items-center justify-center mb-3 text-muted-foreground border border-border">
                                <User className="h-7 w-7" />
                            </div>
                            <h3 className="font-bold text-base text-foreground">No Tenant Selected</h3>
                            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                                Search and select a tenant from the left to view their pending invoices and process payments.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* M-Pesa Modal */}
            {selectedTenant && isMpesaModalOpen && (
                <MpesaPaymentModal
                    isOpen={isMpesaModalOpen}
                    onClose={() => setIsMpesaModalOpen(false)}
                    tenant={selectedTenant}
                    amount={calculateSelectedTotal()}
                    invoiceId={selectedInvoices.length === 1 ? selectedInvoices[0] : undefined}
                    onSuccess={() => {
                        setIsMpesaModalOpen(false);
                        if (selectedTenant) {
                            fetchPendingInvoices(selectedTenant.id);
                            fetchPaymentHistory(selectedTenant.id);
                        }
                    }}
                />
            )}
        </div>
    );
}
