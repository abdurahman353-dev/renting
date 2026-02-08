"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Loader2, DollarSign, CreditCard, User, Building2, Ticket, X, CheckSquare, Square, Trash2 } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

    // Invoice-specific state
    const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null);
    const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [loadingInvoice, setLoadingInvoice] = useState(false);
    const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false);
    const [reversingId, setReversingId] = useState<number | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        setCurrentUser(authAPI.getUser());
    }, []);

    const isSuperAdmin = currentUser?.role === 'super_admin';

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: "",
            method: "Cash",
            reference: "",
        },
    });

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

            // Auto-select tenant
            const tenantsData = await tenantAPI.getAll();
            setTenants(tenantsData);
            const tenant = tenantsData.find((t: Tenant) => t.id === invoice.tenant_id);
            if (tenant) {
                setSelectedTenant(tenant);
                setSelectedInvoices([invoice.id]);

                // Prefill amount with invoice balance
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
                    const data = await tenantAPI.getAll();
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

    // Fetch pending invoices when tenant is selected
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

    // const fetchPendingInvoices = async (tenantId: number) => {
    //     try {
    //         const invoices = await financeAPI.getInvoices({ tenant_id: tenantId });
    //         const pending = invoices.filter((inv: Invoice) =>
    //             inv.status === 'PENDING' || inv.status === 'PARTIAL'
    //         );
    //         setPendingInvoices(pending);
    //     } catch (error) {
    //         console.error("Failed to fetch invoices", error);
    //     }
    // };

    const fetchPendingInvoices = async (tenantId: number) => {
        try {
            const invoices = await financeAPI.getInvoices({
                tenant_id: tenantId,
            });

            const pending = invoices.filter(
                (inv: Invoice) => inv.status === "PENDING" || inv.status === "PARTIAL"
            );

            setPendingInvoices(pending);
        } catch (error) {
            console.error("Failed to fetch invoices", error);
        }
    };


    const fetchPaymentHistory = async (tenantId: number) => {
        try {
            const history = await tenantAPI.getPaymentHistory(tenantId);
            setPaymentHistory(history);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const onTenantSelect = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setOpen(false);
        form.reset();
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
        form.setValue("amount", total.toString());
    }, [selectedInvoices, pendingInvoices]);

    const handlePayAllInvoices = () => {
        const allInvoiceIds = pendingInvoices.map(inv => inv.id);
        setSelectedInvoices(allInvoiceIds);
    };

    const onSubmit = async (values: z.infer<typeof paymentSchema>) => {
        if (!selectedTenant) return;
        if (values.amount === "" || parseFloat(values.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                tenant_id: selectedTenant.id,
                amount: parseFloat(values.amount),
                method: values.method,
                reference: values.reference,
                invoice_ids: selectedInvoices, // Pass selected invoice IDs
            };

            await financeAPI.recordPayment(payload);

            toast.success("Payment recorded successfully");

            // Refresh data
            const updatedTenants = await tenantAPI.getAll();
            setTenants(updatedTenants);

            const updatedSelectedTenant = updatedTenants.find((t: any) => t.id === selectedTenant.id);
            if (updatedSelectedTenant) {
                setSelectedTenant(updatedSelectedTenant);
            }

            // Refresh invoices
            await fetchPendingInvoices(selectedTenant.id);

            form.reset({
                amount: "",
                method: "Cash",
                reference: ""
            });
            setSelectedInvoices([]);

            // If came from specific invoice, redirect back to finance page
            if (invoiceIdParam) {
                toast.success("Redirecting to finance page...");
                setTimeout(() => router.push("/finance"), 1500);
            }

            toast.success("Redirecting to finance page...");
            setTimeout(() => router.push("/finance"), 1500);

        } catch (error: any) {
            console.error("Payment failed", error);
            const msg = error.response?.data?.message || "Payment processing failed";
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReversePayment = async (paymentId: number) => {
        if (!window.confirm("Are you sure you want to reverse this payment? This will restore the tenant's balance and reopen the invoices. This action cannot be undone.")) {
            return;
        }

        setReversingId(paymentId);
        try {
            await superAdminAPI.deletePayment(paymentId);
            toast.success("Payment reversed successfully");

            // Refresh data
            if (selectedTenant) {
                fetchPendingInvoices(selectedTenant.id);
                fetchPaymentHistory(selectedTenant.id);

                // Refresh tenants to get updated balance
                tenantAPI.getAll().then(data => {
                    setTenants(data);
                    const updated = data.find((t: any) => t.id === selectedTenant.id);
                    if (updated) setSelectedTenant(updated);
                });
            }
        } catch (error: any) {
            console.error("Failed to reverse payment", error);
            toast.error(error.response?.data?.message || "Failed to reverse payment");
        } finally {
            setReversingId(null);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    if (loadingInvoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 min-h-screen bg-slate-50 dark:bg-[#0F1115] transition-colors duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-[#FFFFFF]">Cashier</h2>
                    <p className="text-slate-700 dark:text-[#9CA3AF] text-lg font-medium">
                        {targetInvoice
                            ? `Processing payment for Invoice #${targetInvoice.invoice_number}`
                            : "Process rent payments and view tenant balances."}
                    </p>
                </div>
                {invoiceIdParam && (
                    <Button
                        variant="ghost"
                        className="text-slate-500 dark:text-[#9CA3AF] hover:bg-slate-100 dark:hover:bg-[#1E2430] rounded-xl"
                        onClick={() => router.push("/finance")}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                )}
            </div>

            {/* Target Invoice Card (Show if targetInvoice exists OR if tenant is selected and has pending invoices) */}
            {(targetInvoice || (selectedTenant && pendingInvoices.length > 0)) && (
                <Card className="border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
                            <Ticket className="w-5 h-5 text-[#6366F1]" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {(() => {
                            // Determine which invoice to display
                            // Priority: targetInvoice -> First Selected Invoice -> First Pending Invoice
                            const displayInvoice = targetInvoice
                                || pendingInvoices.find(inv => selectedInvoices.includes(inv.id))
                                || pendingInvoices[0];

                            if (!displayInvoice) return null;

                            const invoiceBalance = displayInvoice.amount - displayInvoice.paid_amount;
                            // Calculate Arrears: Total Tenant Balance - Current Invoice Balance
                            // Tenant Balance is negative for debt. We take absolute value to represent debt magnitude.
                            const currentTenant = selectedTenant || tenants.find(t => t.id === displayInvoice.tenant_id);
                            const totalDebt = currentTenant ? Math.abs(currentTenant.balance) : 0;
                            const arrears = Math.max(0, totalDebt - invoiceBalance);

                            return (
                                <>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-[#9CA3AF]">Invoice Number</p>
                                        <p className="font-bold text-slate-900 dark:text-[#FFFFFF]">{displayInvoice.invoice_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-[#9CA3AF]">Type</p>
                                        <Badge className="bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20">{displayInvoice.type}</Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-[#9CA3AF]">Amount</p>
                                        <p className="font-bold text-slate-900 dark:text-[#FFFFFF]">KES {displayInvoice.amount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-[#9CA3AF]">Balance Due</p>
                                        <p className="font-black text-rose-500">
                                            KES {invoiceBalance.toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-[#9CA3AF]">Previous Balance</p>
                                        <p className="font-black text-orange-500">
                                            KES {arrears.toLocaleString()}
                                        </p>
                                    </div>
                                </>
                            );
                        })()}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Tenant Selection & Payment Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Tenant Selector */}
                    {!targetInvoice && (
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300">
                            <CardHeader className="bg-white dark:bg-[#161B22] border-b border-slate-100 dark:border-[#2A3242] pb-4">
                                <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    Select Tenant
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between h-14 text-base bg-white dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] text-slate-900 dark:text-[#F9FAFB] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1F2633]/80 transition-all font-medium"
                                        >
                                            {selectedTenant
                                                ? `${selectedTenant.name} - ${selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'No Unit'}`
                                                : "Search tenant by name..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-white dark:bg-[#161A22] border-slate-200 dark:border-[#2A2F3A] shadow-2xl" align="start">
                                        <Command className="dark:bg-[#161A22]">
                                            <CommandInput placeholder="Search tenant..." className="dark:text-[#E5E7EB]" />
                                            <CommandEmpty className="py-6 text-center text-[#9CA3AF]">No tenant found.</CommandEmpty>
                                            <CommandGroup className="max-h-[350px] overflow-auto p-2">
                                                {loadingTenants ? (
                                                    <div className="p-4 text-center text-sm text-[#9CA3AF]">
                                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                        Loading...
                                                    </div>
                                                ) : (
                                                    tenants.map((tenant) => (
                                                        <CommandItem
                                                            key={tenant.id}
                                                            value={tenant.name}
                                                            onSelect={() => onTenantSelect(tenant)}
                                                            className="cursor-pointer py-3 px-4 rounded-lg aria-selected:bg-indigo-50 dark:aria-selected:bg-[#1E2430] group transition-colors"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-3 h-4 w-4 text-[#6366F1]",
                                                                    selectedTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-900 dark:text-[#E5E7EB] group-aria-selected:text-[#6366F1]">{tenant.name}</span>
                                                                <span className="text-xs text-slate-500 dark:text-[#9CA3AF]">
                                                                    {tenant.unit?.unit_number || tenant.unit_number || 'No Unit'} • {tenant.property?.name || tenant.property_name || 'No Property'}
                                                                </span>
                                                            </div>
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

                    {/* Pending Invoices Selection */}
                    {selectedTenant && pendingInvoices.length > 0 && (
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)]">
                            <CardHeader className="bg-white dark:bg-[#161B22] border-b border-slate-100 dark:border-[#2A3242]">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-primary" />
                                        Pending Invoices
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePayAllInvoices}
                                        className="text-primary font-bold hover:bg-slate-50 dark:hover:bg-[#1F2633]"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    {pendingInvoices.map((invoice) => {
                                        const balance = invoice.amount - invoice.paid_amount;
                                        const isSelected = selectedInvoices.includes(invoice.id);

                                        return (
                                            <div
                                                key={invoice.id}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-300 transform active:scale-[0.98]",
                                                    isSelected
                                                        ? "bg-blue-50/50 dark:bg-primary/10 border-primary dark:border-primary shadow-sm"
                                                        : "bg-white dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-md cursor-pointer"
                                                )}
                                                onClick={() => toggleInvoiceSelection(invoice.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-md border flex items-center justify-center transition-all",
                                                        isSelected
                                                            ? "bg-[#6366F1] border-[#6366F1]"
                                                            : "bg-white dark:bg-transparent border-slate-300 dark:border-[#2A2F3A]"
                                                    )}>
                                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-[#E5E7EB]">{invoice.invoice_number}</p>
                                                        <p className="text-xs text-slate-700 dark:text-[#9CA3AF] font-medium">{invoice.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-primary">KES {balance.toLocaleString()}</p>
                                                    <Badge className="bg-emerald-500/15 text-[#22C55E] border border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)] text-[10px] font-bold">
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedInvoices.length > 0 && (
                                    <div className="mt-6 p-4 bg-slate-50 dark:bg-[#1B2230] rounded-xl border border-slate-200 dark:border-[#2A3242]">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-800 dark:text-[#9CA3AF]">Selected Total:</span>
                                            <span className="text-xl font-black text-primary">
                                                KES {calculateSelectedTotal().toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* 2. Payment Form (Only visible if tenant selected) */}
                    {selectedTenant && (
                        <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden">
                            <CardHeader className="bg-indigo-50/50 dark:bg-primary/5 border-b border-indigo-100 dark:border-[#2A3242]">
                                <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-[#F9FAFB] font-bold">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Record Payment
                                </CardTitle>
                                <CardDescription className="text-indigo-600/70 dark:text-[#9CA3AF] font-medium">
                                    Enter payment details for <strong className="text-indigo-900 dark:text-[#F9FAFB]">{selectedTenant.name}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-8">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-slate-700 dark:text-[#FFFFFF]">Amount (KES)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-primary">KES</div>
                                                                <Input
                                                                    placeholder="0.00"
                                                                    className="pl-14 h-14 text-2xl font-black bg-slate-50 dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] text-slate-900 dark:text-[#F9FAFB] rounded-xl"
                                                                    type="number"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="method"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-slate-700 dark:text-[#FFFFFF]">Payment Method</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-14 bg-white dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] text-slate-900 dark:text-[#F9FAFB] rounded-xl font-medium">
                                                                    <SelectValue placeholder="Select method" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="dark:bg-[#161B22] dark:border-[#2A3242]">
                                                                <SelectItem value="Cash">Cash</SelectItem>
                                                                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                                                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                                <SelectItem value="Cheque">Cheque</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="reference"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-slate-700 dark:text-[#FFFFFF]">Reference Code (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="e.g. M-Pesa Code, Receipt No."
                                                            className="h-14 bg-white dark:bg-[#1F2633] border-slate-200 dark:border-[#2A3242] text-slate-900 dark:text-[#F9FAFB] rounded-xl font-medium"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription className="text-slate-700 dark:text-[#9CA3AF]">
                                                        Transaction ID or receipt number for tracking.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex justify-end pt-4">
                                            <Button
                                                type="submit"
                                                disabled={submitting}
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    "Record Payment"
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* RIGHT COLUMN: Tenant Overview & History */}
                <div className="space-y-6">
                    {selectedTenant ? (
                        <>
                            {/* Tenant Snapshot */}
                            <Card className="bg-[#161A22] dark:bg-[#161A22] text-white border border-slate-200 dark:border-[#2A2F3A] shadow-xl rounded-[18px] overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Building2 className="w-32 h-32 text-white" />
                                </div>
                                <div className="h-1 bg-[#6366F1]"></div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-[#6366F1] flex items-center justify-center font-black text-xl shadow-lg">
                                            {getInitials(selectedTenant.name)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black">{selectedTenant.name}</CardTitle>
                                            <p className="text-[#9CA3AF] text-sm font-medium">{selectedTenant.email || selectedTenant.phone}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="mt-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-4 bg-[#1B2230] rounded-2xl border border-[#2A3242]">
                                            <p className="text-[#9CA3AF] text-[10px] uppercase font-black tracking-[0.1em]">Current Balance</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <p className={cn(
                                                    "text-3xl font-black",
                                                    selectedTenant.balance < 0 ? "text-rose-500" : "text-[#22C55E]"
                                                )}>
                                                    KES {Math.abs(selectedTenant.balance).toLocaleString()}
                                                </p>
                                                <span className="text-xs font-bold text-[#9CA3AF]">
                                                    {selectedTenant.balance < 0 ? "Due" : "Credit"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-[#1B2230]/40 rounded-2xl border border-[#2A3242]/50">
                                                <p className="text-[#9CA3AF] text-[10px] uppercase font-black tracking-[0.1em]">Unit</p>
                                                <p className="text-lg font-black mt-1 text-white">
                                                    {selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-[#1B2230]/40 rounded-2xl border border-[#2A3242]/50">
                                                <p className="text-[#9CA3AF] text-[10px] uppercase font-black tracking-[0.1em]">Property</p>
                                                <p className="text-sm font-bold mt-1 text-white line-clamp-1">
                                                    {selectedTenant.property?.name || selectedTenant.property_name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Transactions */}
                            <Card className="bg-white dark:bg-[#161B22] border border-slate-200 dark:border-[#2A3242] shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] h-full max-h-[600px] flex flex-col overflow-hidden transition-all duration-300">
                                <CardHeader className="pb-4 border-b border-slate-100 dark:border-[#2A3242]">
                                    <CardTitle className="text-lg font-bold text-slate-800 dark:text-[#FFFFFF] flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-primary" />
                                        Recent Transactions
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-auto">
                                    {paymentHistory.length === 0 ? (
                                        <div className="p-10 text-center text-[#9CA3AF] flex flex-col items-center">
                                            <div className="h-16 w-16 rounded-3xl bg-slate-50 dark:bg-[#1E2430] flex items-center justify-center mb-4">
                                                <CreditCard className="w-8 h-8 text-slate-300 dark:text-[#2A2F3A]" />
                                            </div>
                                            <p className="font-medium">No payment history found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50 dark:divide-[#2A2F3A]">
                                            {paymentHistory.map((payment: any) => (
                                                <div key={payment.id} className="p-5 hover:bg-slate-50 dark:hover:bg-[#1F2633] transition-colors flex justify-between items-center group border-b border-slate-50 dark:border-[#2A3242]">
                                                    <div>
                                                        <p className="font-black text-slate-900 dark:text-[#FFFFFF]">KES {Number(payment.amount).toLocaleString()}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                                                {payment.method}
                                                            </Badge>
                                                            <span className="text-xs text-slate-700 dark:text-[#9CA3AF] font-medium">
                                                                {format(new Date(payment.date || payment.created_at), "MMM dd, yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        {payment.reference && (
                                                            <span className="text-[10px] font-black text-slate-800 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#1B2230] px-2 py-1 rounded-md border border-slate-300 dark:border-[#2A3242] uppercase tracking-tighter shadow-sm">
                                                                {payment.reference}
                                                            </span>
                                                        )}
                                                        {isSuperAdmin && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReversePayment(payment.id);
                                                                }}
                                                                disabled={reversingId === payment.id}
                                                            >
                                                                {reversingId === payment.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    ) : (
                        // Placeholder when no tenant selected
                        <div className="h-full min-h-[400px] rounded-3xl border-2 border-dashed border-slate-200 dark:border-[#2A3242] flex flex-col items-center justify-center p-10 text-center bg-white dark:bg-[#161B22] shadow-inner transition-all">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-[#0E1117] rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <User className="h-10 w-10 text-slate-300 dark:text-[#2A3242]" />
                            </div>
                            <h3 className="font-black text-2xl text-slate-800 dark:text-[#F9FAFB]">No Tenant Selected</h3>
                            <p className="text-slate-700 dark:text-[#9CA3AF] mt-3 max-w-[240px] font-medium leading-relaxed">
                                Use the search box on the left to find a tenant and process payments.
                            </p>
                        </div>
                    )}
                </div>
            </div>
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
