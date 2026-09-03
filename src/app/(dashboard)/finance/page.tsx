"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    FileText,
    Plus,
    Download,
    Eye,
    Banknote,
    Wallet,
    Search,
    Loader2,
    Calendar,
    Smartphone,
    CreditCard,
    Building,
    RotateCcw,
    Coins,
    Home,
} from "lucide-react";
import { financeAPI, propertyAPI, unitAPI } from "@/data/apis";
import { formatDate } from "@/lib/utils";
import FilterComponent from "./FilterComponent";
import { toast } from "sonner";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useDebounce } from "@/hooks/use-debounce";

interface Invoice {
    id: string;
    invoice_number: string;
    tenant: string;
    unit: string;
    amount: number;
    status: string;
    date: string;
    month?: number;
    year?: number;
    type?: string;
    tenant_name?: string;
    unit_number?: string;
    property_name?: string;
    created_at?: string;
    paid_amount?: number;
    due_date?: string;
    property_id?: string;
    property?: { name: string };
}

interface Payment {
    id: string;
    tenant: string;
    amount: number;
    method: string;
    reference: string;
    date: string;
    status?: string;
    tenant_name?: string;
    unit_number?: string;
    property_name?: string;
    created_at?: string;
}

export default function FinancePage() {
    const router = useRouter();
    const [invoicesLoading, setInvoicesLoading] = useState(true);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination States
    const [invoicePage, setInvoicePage] = useState(1);
    const [invoiceLastPage, setInvoiceLastPage] = useState(1);
    const [invoiceTotal, setInvoiceTotal] = useState(0);

    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentLastPage, setPaymentLastPage] = useState(1);
    const [paymentTotal, setPaymentTotal] = useState(0);

    const [perPage] = useState(15);
    const debouncedSearch = useDebounce(searchQuery, 200);

    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("invoices");
    const [confirmGenerateOpen, setConfirmGenerateOpen] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        property_id: "all",
        unit_id: "all",
        status: "all",
        tenant_id: "all",
        month: "",
        year: ""
    });

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [propRes, unitRes] = await Promise.all([
                    propertyAPI.getAll(),
                    unitAPI.getAll()
                ]);

                const propertyData = Array.isArray(propRes) ? propRes : (propRes.data || []);
                const unitData = Array.isArray(unitRes) ? unitRes : (unitRes.data || []);

                setProperties(propertyData);
                setUnits(unitData);
            } catch (e) {
                console.error("Failed to fetch filters:", e);
                setProperties([]);
                setUnits([]);
            }
        };
        fetchFilters();
    }, []);

    const fetchInvoices = async (page = 1) => {
        setInvoicesLoading(true);
        try {
            const params = {
                page,
                per_page: perPage,
                search: debouncedSearch,
                year: filters.year || undefined,
                month: filters.month || undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                property_id: filters.property_id !== 'all' ? filters.property_id : undefined,
                unit_id: filters.unit_id !== 'all' ? filters.unit_id : undefined,
            };

            const response = await financeAPI.getInvoices(params);

            if (response && Array.isArray(response.data)) {
                const validInvoices = response.data.filter((inv: Invoice) => inv.tenant_name && inv.tenant_name !== 'Unknown');
                setAllInvoices(validInvoices);
                setInvoicePage(response.current_page || 1);
                setInvoiceLastPage(response.last_page || 1);
                setInvoiceTotal(response.total || 0);
            } else {
                const raw = Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : []) : []);
                setAllInvoices(raw.filter((inv: Invoice) => inv.tenant_name && inv.tenant_name !== 'Unknown'));
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
            toast.error("Failed to load invoices");
        } finally {
            setInvoicesLoading(false);
        }
    };

    const fetchPayments = async (page = 1) => {
        setPaymentsLoading(true);
        try {
            const params = {
                page,
                per_page: perPage,
                search: debouncedSearch,
                year: filters.year || undefined,
                month: filters.month || undefined,
                property_id: filters.property_id !== 'all' ? filters.property_id : undefined,
                unit_id: filters.unit_id !== 'all' ? filters.unit_id : undefined,
            };

            const response = await financeAPI.getPayments(params);

            if (response && Array.isArray(response.data)) {
                setAllPayments(response.data);
                setPaymentPage(response.current_page || 1);
                setPaymentLastPage(response.last_page || 1);
                setPaymentTotal(response.total || 0);
            } else {
                setAllPayments(Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : []) : []));
            }
        } catch (error) {
            console.error("Failed to fetch payments:", error);
            toast.error("Failed to load payments");
        } finally {
            setPaymentsLoading(false);
        }
    };

    const handleInvoicePageChange = (page: number) => {
        fetchInvoices(page);
    };

    const handlePaymentPageChange = (page: number) => {
        fetchPayments(page);
    };

    useEffect(() => {
        fetchInvoices(1);
        fetchPayments(1);
    }, [debouncedSearch, filters.year, filters.month, filters.status, filters.property_id, filters.unit_id]);

    const onFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleGenerateMonthlyInvoices = async () => {
        const date = new Date();
        const year = filters.year && filters.year !== 'all' ? parseInt(filters.year) : date.getFullYear();
        const month = filters.month && filters.month !== 'all' ? parseInt(filters.month) : (date.getMonth() + 1);

        try {
            const res = await financeAPI.generateMonthlyInvoices({
                month: month,
                year: year
            });
            const message = res.message || "Invoices generated successfully";
            if (res.count > 0) {
                toast.success(message);
            } else {
                toast.info(message);
            }
            fetchInvoices(1);
            fetchPayments(1);
        } catch (error: any) {
            console.error("Generate error:", error);
            toast.error(error.response?.data?.message || "Failed to generate invoices");
        }
    };

    const handleExport = () => {
        const headers = ["ID", "Tenant", "Unit", "Property", "Amount", "Paid", "Status", "Date"];
        const rows = (allInvoices || []).map((inv: Invoice) => [
            inv.id,
            inv.tenant_name || inv.tenant || 'Unknown',
            inv.unit_number || inv.unit || 'N/A',
            inv.property_name || '-',
            inv.amount,
            inv.paid_amount || 0,
            inv.status,
            (inv.date || (inv.month && inv.year ? `${inv.year}-${String(inv.month).padStart(2, '0')}-01` : inv.created_at)) ? new Date(inv.date || (inv.month && inv.year ? `${inv.year}-${String(inv.month).padStart(2, '0')}-01` : inv.created_at)!).toISOString().replace('T', ' ').substring(0, 16) : '-'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "invoices_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFilters = () => {
        setFilters({
            property_id: "all",
            unit_id: "all",
            status: "all",
            tenant_id: "all",
            month: "",
            year: ""
        });
        setSearchQuery("");
        toast.info("Filters reset to default");
    };

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    // Function to render Colorable Type Badges
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

        if (type.includes('water') || type.includes('electric') || type.includes('util')) {
            return (
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 font-semibold text-xs">
                    Utility
                </Badge>
            );
        }

        if (type.includes('maint') || type.includes('repair')) {
            return (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-semibold text-xs">
                    Maintenance
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

    // Function to render Colorable Payment Method Badges
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

        if (method.includes('card') || method.includes('visa') || method.includes('mastercard')) {
            return (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 font-semibold text-xs inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Card</span>
                </Badge>
            );
        }

        // Default
        return (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-semibold text-xs">
                {methodRaw || 'Payment'}
            </Badge>
        );
    };

    // Function to render Status Badges
    const renderStatusBadge = (statusRaw?: string) => {
        const status = (statusRaw || 'PENDING').toUpperCase();

        if (status === 'PAID') {
            return (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold text-xs">
                    PAID
                </Badge>
            );
        }

        if (status === 'PARTIAL') {
            return (
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold text-xs">
                    PARTIAL
                </Badge>
            );
        }

        if (status === 'REVERSED') {
            return (
                <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 font-semibold text-xs">
                    REVERSED
                </Badge>
            );
        }

        // Pending
        return (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-semibold text-xs">
                PENDING
            </Badge>
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-muted/30 min-h-screen transition-colors duration-300 text-foreground">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Overview</h1>
                    <p className="text-sm text-muted-foreground">Manage invoices, payments, and financial records.</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Professional Emerald Outline Export Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/60 dark:text-emerald-400 dark:hover:bg-emerald-950/30 font-semibold transition-colors"
                        onClick={handleExport}
                    >
                        <Download className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Export Report
                    </Button>

                    {/* Professional Indigo/Blue Generate Button */}
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
                        onClick={() => setConfirmGenerateOpen(true)}
                    >
                        <Plus className="mr-1.5 h-4 w-4 text-white" />
                        Generate {currentMonthName} Invoices
                    </Button>
                </div>
            </div>

            {/* Semantic Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                <Input
                    type="text"
                    placeholder="Search by Invoice ID, Tenant, Property or Unit..."
                    className="pl-9 h-10 bg-card border-border text-sm focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground hover:text-foreground"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Semantic Filter Component */}
            <FilterComponent
                properties={properties}
                units={units}
                currentFilters={filters}
                onFilterChange={onFilterChange}
                onRefresh={handleResetFilters}
            />

            {/* Tabs */}
            <Tabs defaultValue="invoices" onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/60 p-1 rounded-xl border border-border inline-flex gap-1.5">
                    {/* Invoices Tab (Blue theme when active) */}
                    <TabsTrigger
                        value="invoices"
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border data-[state=active]:border-blue-200 dark:data-[state=active]:bg-blue-950/40 dark:data-[state=active]:text-blue-300 dark:data-[state=active]:border-blue-800/60 data-[state=active]:shadow-sm"
                    >
                        <FileText className={`w-3.5 h-3.5 mr-1.5 ${activeTab === 'invoices' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                        Invoices
                        {invoiceTotal > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                activeTab === 'invoices'
                                    ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {invoiceTotal}
                            </span>
                        )}
                    </TabsTrigger>

                    {/* Payments Tab (Emerald theme when active) */}
                    <TabsTrigger
                        value="payments"
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg transition-all data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border data-[state=active]:border-emerald-200 dark:data-[state=active]:bg-emerald-950/40 dark:data-[state=active]:text-emerald-300 dark:data-[state=active]:border-emerald-800/60 data-[state=active]:shadow-sm"
                    >
                        <Wallet className={`w-3.5 h-3.5 mr-1.5 ${activeTab === 'payments' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                        Payments
                        {paymentTotal > 0 && (
                            <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                activeTab === 'payments'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-muted text-muted-foreground'
                            }`}>
                                {paymentTotal}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Invoices Tab */}
                <TabsContent value="invoices" className="space-y-4">
                    <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Invoice ID</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Tenant</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Property</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Unit</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Date</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Type</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Status</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Amount</TableHead>
                                            <TableHead className="text-right font-semibold text-muted-foreground py-3 text-xs">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoicesLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={`inv-skel-${i}`} className="border-b border-border/50">
                                                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell className="text-right"><div className="h-5 w-14 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : (!allInvoices || allInvoices.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                                                    No invoices found matching your filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (allInvoices || []).map((inv) => (
                                            <TableRow key={inv.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                                                <TableCell>
                                                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                                                        {inv.invoice_number}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-bold text-sm text-foreground">
                                                    {inv.tenant_name || inv.tenant}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {inv.property_name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/60 inline-flex items-center gap-1">
                                                        <Home className="w-3 h-3 text-indigo-500 shrink-0" />
                                                        <span>Unit {inv.unit_number || inv.unit}</span>
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span>{inv.date ? formatDate(inv.date) : (inv.month && inv.year ? formatDate(`${inv.year}-${String(inv.month).padStart(2, '0')}-01`) : (inv.created_at ? formatDate(inv.created_at) : '-'))}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {renderTypeBadge(inv.type)}
                                                </TableCell>
                                                <TableCell>
                                                    {renderStatusBadge(inv.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-xs text-foreground bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
                                                        <span className="text-[10px] text-muted-foreground font-semibold">KES</span>
                                                        <span>{Number(inv.amount).toLocaleString()}</span>
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                            title="View Invoice"
                                                            onClick={() => router.push(`/invoices/${inv.id}`)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {(inv.status === 'PENDING' || inv.status === 'PARTIAL') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Process Payment"
                                                                onClick={() => router.push(`/finance/cashier?invoice_id=${inv.id}`)}
                                                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                            >
                                                                <Banknote className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <PaginationControls
                        currentPage={invoicePage}
                        totalPages={invoiceLastPage}
                        onPageChange={handleInvoicePageChange}
                        totalItems={invoiceTotal}
                        itemsPerPage={perPage}
                    />
                </TabsContent>

                {/* Payments Tab */}
                <TabsContent value="payments" className="space-y-4">
                    <Card className="bg-card border-border shadow-sm rounded-xl overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Payment ID</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Tenant</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Property</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Unit</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Method</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Reference</TableHead>
                                            <TableHead className="font-semibold text-muted-foreground py-3 text-xs">Date</TableHead>
                                            <TableHead className="text-right font-semibold text-muted-foreground py-3 text-xs">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentsLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <TableRow key={`pay-skel-${i}`} className="border-b border-border/50">
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-32 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-24 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded" /></TableCell>
                                                    <TableCell className="text-right"><div className="h-5 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : (!allPayments || allPayments.length === 0) ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                                                    No payments found matching your filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (allPayments || []).map((pay) => {
                                            const isReversed = pay.status === 'REVERSED';
                                            return (
                                            <TableRow key={pay.id} className={`border-b border-border transition-colors ${isReversed ? 'bg-red-50/40 dark:bg-red-950/10' : 'hover:bg-muted/40'}`}>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                                                            PAY-{pay.id}
                                                        </span>
                                                        {isReversed && (
                                                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
                                                                REVERSED
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-sm text-foreground">
                                                    <span className={isReversed ? 'line-through opacity-70' : ''}>
                                                        {pay.tenant_name || pay.tenant}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {pay.property_name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/60 inline-flex items-center gap-1">
                                                        <Home className="w-3 h-3 text-indigo-500 shrink-0" />
                                                        <span>Unit {pay.unit_number || '-'}</span>
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {renderMethodBadge(pay.method)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`font-mono text-xs text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/40 ${isReversed ? 'line-through opacity-60' : ''}`}>
                                                        {pay.reference || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className={isReversed ? 'line-through opacity-60' : ''}>{pay.created_at ? formatDate(pay.created_at) : formatDate(pay.date)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {isReversed ? (
                                                        <span className="font-extrabold text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-800/60 inline-flex items-center gap-1 line-through opacity-70">
                                                            <span className="text-[10px] font-bold text-red-500 dark:text-red-400">-KES</span>
                                                            <span>{Number(pay.amount).toLocaleString()}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">+KES</span>
                                                            <span>{Number(pay.amount).toLocaleString()}</span>
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <PaginationControls
                        currentPage={paymentPage}
                        totalPages={paymentLastPage}
                        onPageChange={handlePaymentPageChange}
                        totalItems={paymentTotal}
                        itemsPerPage={perPage}
                    />
                </TabsContent>
            </Tabs>

            {/* Monthly Invoice Generation Confirmation Dialog */}
            <AlertDialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
                <AlertDialogContent className="rounded-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Generate {currentMonthName} Invoices?</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground">
                            This will generate monthly rent invoices for all eligible active leases for {currentMonthName} {new Date().getFullYear()}.
                            Tenants whose initial billing month was cleared/skipped will not be billed prematurely.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleGenerateMonthlyInvoices}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                            Generate Invoices
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}