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
        if (selectedInvoices.length === 0) {
            toast.error("Please select at least one invoice to pay");
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
        <div className="p-8 space-y-8 min-h-screen bg-slate-50/50">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Cashier</h2>
                    <p className="text-muted-foreground mt-2">
                        {targetInvoice
                            ? `Processing payment for Invoice #${targetInvoice.invoice_number}`
                            : "Process rent payments and view tenant balances."}
                    </p>
                </div>
                {invoiceIdParam && (
                    <Button variant="outline" onClick={() => router.push("/finance")}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                )}
            </div>

            {/* Target Invoice Card (if coming from invoice) */}
            {targetInvoice && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-blue-600" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Invoice Number</p>
                            <p className="font-semibold">{targetInvoice.invoice_number}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Type</p>
                            <Badge variant="secondary">{targetInvoice.type}</Badge>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Amount</p>
                            <p className="font-semibold">KES {targetInvoice.amount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Balance Due</p>
                            <p className="font-semibold text-red-600">
                                KES {(targetInvoice.amount - targetInvoice.paid_amount).toLocaleString()}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: Tenant Selection & Payment Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Tenant Selector */}
                    {!targetInvoice && (
                        <Card className="border-slate-200 shadow-sm overflow-hidden">
                            <CardHeader className="bg-white border-b border-slate-100 pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-indigo-600" />
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
                                            className="w-full justify-between h-12 text-base"
                                        >
                                            {selectedTenant
                                                ? `${selectedTenant.name} - ${selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'No Unit'}`
                                                : "Search tenant by name..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search tenant..." />
                                            <CommandEmpty>No tenant found.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                                {loadingTenants ? (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        Loading...
                                                    </div>
                                                ) : (
                                                    tenants.map((tenant) => (
                                                        <CommandItem
                                                            key={tenant.id}
                                                            value={tenant.name}
                                                            onSelect={() => onTenantSelect(tenant)}
                                                            className="cursor-pointer py-3 px-4"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedTenant?.id === tenant.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{tenant.name}</span>
                                                                <span className="text-xs text-muted-foreground">
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
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-white border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Ticket className="w-5 h-5 text-slate-600" />
                                        Pending Invoices
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePayAllInvoices}
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    {pendingInvoices.map((invoice) => {
                                        const balance = invoice.amount - invoice.paid_amount;
                                        const isSelected = selectedInvoices.includes(invoice.id);

                                        return (
                                            <div
                                                key={invoice.id}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                                    isSelected ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200 hover:bg-slate-50"
                                                )}
                                                onClick={() => toggleInvoiceSelection(invoice.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">{invoice.invoice_number}</p>
                                                        <p className="text-xs text-slate-600">{invoice.description}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-sm">KES {balance.toLocaleString()}</p>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {invoice.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {selectedInvoices.length > 0 && (
                                    <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Selected Total:</span>
                                            <span className="text-lg font-bold text-indigo-600">
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
                        <Card className="border-indigo-100 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50">
                                <CardTitle className="flex items-center gap-2 text-indigo-900">
                                    <CreditCard className="w-5 h-5 text-indigo-600" />
                                    Record Payment
                                </CardTitle>
                                <CardDescription>
                                    Enter payment details for <strong>{selectedTenant.name}</strong>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Amount (KES)</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="0.00"
                                                                    className="pl-9 h-11 text-lg font-medium bg-slate-50 cursor-not-allowed"
                                                                    type="number"
                                                                    readOnly
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
                                                        <FormLabel>Payment Method</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-11">
                                                                    <SelectValue placeholder="Select method" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
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
                                                    <FormLabel>Reference Code (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. M-Pesa Code, Receipt No." {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Transaction ID or receipt number for tracking.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="flex justify-end pt-4 gap-3">
                                            {/* <Button
                                                type="button"
                                                variant="outline"
                                                size="lg"
                                                onClick={() => {
                                                    if (selectedInvoices.length === 0) {
                                                        toast.error("Please select at least one invoice to pay");
                                                        return;
                                                    }
                                                    setIsMpesaModalOpen(true);
                                                }}
                                                className="border-green-600 text-green-700 hover:bg-green-50"
                                            >
                                                Pay via M-Pesa
                                            </Button> */}
                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={submitting}
                                                className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Record Payment
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

                {/* RIGHT COLUMN: Tenant Overview & History */}
                <div className="space-y-6">
                    {selectedTenant ? (
                        <>
                            {/* Tenant Snapshot */}
                            <Card className="bg-slate-900 text-white border-0 shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Building2 className="w-32 h-32" />
                                </div>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-lg">
                                            {getInitials(selectedTenant.name)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">{selectedTenant.name}</CardTitle>
                                            <p className="text-indigo-200 text-sm">{selectedTenant.email || selectedTenant.phone}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-indigo-300 text-xs uppercase tracking-wider font-semibold">Current Balance</p>
                                            <p className={cn(
                                                "text-2xl font-bold mt-1",
                                                selectedTenant.balance < 0 ? "text-red-400" : "text-emerald-400"
                                            )}>
                                                {formatCurrency(selectedTenant.balance.toString())}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {selectedTenant.balance < 0 ? "Arrears" : "Credit / Clear"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-indigo-300 text-xs uppercase tracking-wider font-semibold">Unit Details</p>
                                            <p className="text-lg font-bold mt-1 text-white">
                                                {selectedTenant.unit?.unit_number || selectedTenant.unit_number || 'N/A'}
                                            </p>
                                            <p className="text-xs text-slate-400 line-clamp-1">
                                                {selectedTenant.property?.name || selectedTenant.property_name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Transactions */}
                            <Card className="border-slate-200 shadow-sm h-full max-h-[600px] flex flex-col">
                                <CardHeader className="pb-3 border-b">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Ticket className="w-4 h-4 text-slate-500" />
                                        Recent Transactions
                                    </CardTitle>
                                </CardHeader>
                                <div className="flex-1 overflow-auto p-0">
                                    {paymentHistory.length === 0 ? (
                                        <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <CreditCard className="w-6 h-6 text-slate-300" />
                                            </div>
                                            <p>No payment history found</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {paymentHistory.map((payment: any, i) => (
                                                <div key={payment.id || i} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                                                    <div>
                                                        <p className="font-medium text-slate-900">{formatCurrency(payment.amount.toString())}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-indigo-50 text-indigo-700">
                                                                {payment.method}
                                                            </Badge>
                                                            <span className="text-xs text-slate-400">
                                                                {format(new Date(payment.date), "MMM dd, yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {payment.reference && (
                                                        <div className="text-right flex flex-col items-end gap-2">
                                                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                                                {payment.reference}
                                                            </span>
                                                            {isSuperAdmin && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </>
                    ) : (
                        // Placeholder when no tenant selected
                        <div className="h-full rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-slate-50/50">
                            <User className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="font-semibold text-lg text-slate-700">No Tenant Selected</h3>
                            <p className="text-sm mt-2 max-w-[200px]">
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
