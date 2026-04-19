"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
import { FileText, CreditCard, Plus, Download, Send, Eye, DollarSign, BanknoteArrowDown, TrendingUp, Wallet, Search, Loader2 } from "lucide-react"
import { financeAPI, propertyAPI, unitAPI, tenantAPI } from "@/data/apis"
import { formatDate } from "@/lib/utils"
import FilterComponent from "./FilterComponent"
import { toast } from "sonner"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useDebounce } from "@/hooks/use-debounce"

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
    // Map from backend fields
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
    // Map from backend fields
    tenant_name?: string;
    unit_number?: string;
    property_name?: string;
    created_at?: string;
}

export default function FinancePage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        revenue: 0,
        totalInvoiced: 0,
        pending: 0,
        arrears: 0
    });

    const [loading, setLoading] = useState(true);

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
    const debouncedSearch = useDebounce(searchQuery, 500);

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

    // Fetch filter properties and units
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
        setLoading(true);
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
                setAllInvoices(response.data);
                setInvoicePage(response.current_page || 1);
                setInvoiceLastPage(response.last_page || 1);
                setInvoiceTotal(response.total || 0);
            } else {
                setAllInvoices(Array.isArray(response) ? response : (response?.data ? (Array.isArray(response.data) ? response.data : []) : []));
            }
        } catch (error) {
            console.error("Failed to fetch invoices:", error);
            toast.error("Failed to load invoices");
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async (page = 1) => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const revRes: any = await financeAPI.getRevenueReport();
            const revenueData = revRes.revenue !== undefined ? revRes : (revRes.data || {});
            setStats(prev => ({
                ...prev,
                revenue: revenueData.revenue ?? 0,
            }));
        } catch (e) {
            console.error("Failed to fetch revenue report:", e);
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
        fetchStats();
    }, [debouncedSearch, filters.year, filters.month, filters.status, filters.property_id, filters.unit_id]);

    const onFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleGenerateInvoices = async () => {
        try {
            const res = await financeAPI.generateInvoice({});
            const message = res.message || res.data?.message || "Invoices generated successfully";
            toast.success(message);
            fetchInvoices(1);
            fetchPayments(1);
            fetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate invoices");
        }
    };

    const handleGenerateMonthlyInvoices = async () => {
        const date = new Date();
        const year = date.getFullYear();

        try {
            const res = await financeAPI.generateMonthlyInvoices({
                month: date.getMonth() + 1,
                year: year
            });
            const message = res.message || "Invoices generated successfully";
            if (res.count > 0) {
                toast.success(message);
            } else {
                toast.error(message);
            }
            fetchInvoices(1);
            fetchPayments(1);
            fetchStats();
        } catch (error: any) {
            console.error("Generate error:", error);
            toast.error(error.response?.data?.message || "Failed to generate invoices");
        }
    };

    const handleExport = () => {
        // Simple CSV Export of current view
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
            year: new Date().getFullYear().toString()
        });
        setSearchQuery("");
        toast.info("Filters reset to default");
    };

    // if (loading && allInvoices.length === 0) return <div className="p-8">Loading finance data...</div>;

    // Dynamic button label
    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    return (
        <div className="p-8 space-y-8 bg-slate-50 dark:bg-[#0F1115] min-h-screen transition-colors duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-[#FFFFFF]">Financial Overview</h2>
                    <p className="text-slate-500 dark:text-[#9CA3AF] text-lg font-medium">Manage invoices, payments, and financial overview.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => setConfirmGenerateOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Generate {currentMonthName} Invoices
                    </Button>
                </div>
            </div>

            {/* Lightning Fast Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#2563EB] transition-colors duration-300" />
                </div>
                <Input
                    type="text"
                    placeholder="Search by Invoice ID, Tenant, Property or Unit..."
                    className="pl-12 h-14 w-full bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#2A3242] rounded-2xl shadow-lg focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 text-lg font-medium placeholder:text-slate-400 dark:placeholder:text-[#9CA3AF] dark:text-[#F9FAFB]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            {/* Advanced Filters */}
            <FilterComponent
                properties={properties}
                units={units}
                currentFilters={filters}
                onFilterChange={onFilterChange}
                onRefresh={handleResetFilters}
            />

            <Tabs defaultValue="invoices" onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 dark:bg-[#1B2230] p-1.5 rounded-2xl w-auto inline-flex gap-2 border border-slate-200 dark:border-[#2A3242] shadow-inner transition-all">
                    <TabsTrigger
                        value="invoices"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#161B22] data-[state=active]:text-[#2563EB] dark:data-[state=active]:text-[#2563EB] data-[state=active]:shadow-md px-6 py-2.5 rounded-xl transition-all duration-300 font-bold border border-transparent data-[state=active]:border-slate-100 dark:data-[state=active]:border-[#2A3242]"
                    >
                        <FileText className={`w-4 h-4 mr-2 ${activeTab === 'invoices' ? 'text-[#2563EB]' : 'text-slate-500 dark:text-[#9CA3AF]'}`} />
                        Invoices
                    </TabsTrigger>
                    <TabsTrigger
                        value="payments"
                        className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#161B22] data-[state=active]:text-[#22C55E] dark:data-[state=active]:text-[#22C55E] data-[state=active]:shadow-md px-6 py-2.5 rounded-xl transition-all duration-300 font-bold border border-transparent data-[state=active]:border-slate-100 dark:data-[state=active]:border-[#2A3242]"
                    >
                        <Wallet className={`w-4 h-4 mr-2 ${activeTab === 'payments' ? 'text-[#22C55E]' : 'text-slate-500 dark:text-[#9CA3AF]'}`} />
                        Payments
                    </TabsTrigger>
                </TabsList>

                {/* <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue (Dec)</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES {stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Collected this month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">KES {stats.pending.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Unpaid rent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Arrears</CardTitle>
                        <FileText className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">KES {stats.arrears.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Overdue &gt; 30 days</p>
                    </CardContent>
                </Card>
            </div> */}


                <TabsContent value="invoices" className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-[#2A3242] bg-white dark:bg-[#161B22] shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden transition-all">
                        <div className="max-h-[600px] overflow-y-auto relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-[#1B2230] z-10 shadow-sm border-b border-slate-200 dark:border-[#2A3242]">
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Invoice ID</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Tenant</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Property</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Unit</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Date</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Type</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Status</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <span className="text-muted-foreground font-medium">Loading invoices...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (!allInvoices || allInvoices.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground font-medium">No invoices found matching your filters.</TableCell>
                                        </TableRow>
                                    ) : (allInvoices || []).map((inv) => (
                                        <TableRow key={inv.id} className="dark:border-[#2A3242] hover:bg-slate-50 dark:hover:bg-[#1F2633] transition-colors">
                                            <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                            <TableCell>{inv.tenant_name || inv.tenant}</TableCell>
                                            <TableCell>{inv.property_name || '-'}</TableCell>
                                            <TableCell>{inv.unit_number || inv.unit}</TableCell>
                                            <TableCell>{inv.date ? formatDate(inv.date) : (inv.month && inv.year ? formatDate(`${inv.year}-${String(inv.month).padStart(2, '0')}-01`) : (inv.created_at ? formatDate(inv.created_at) : '-'))}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {inv.type?.replace('_', ' ') || 'Invoice'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`px-3 py-1 font-bold rounded-full transition-all duration-300 ${inv.status === "PAID"
                                                        ? "bg-emerald-500/15 text-[#22C55E] border border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:bg-emerald-500/20"
                                                        : inv.status === "REVERSED"
                                                            ? "bg-red-500/15 text-red-500 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:bg-red-500/20"
                                                            : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 dark:border dark:border-amber-500/40 hover:bg-amber-200"}`}
                                                >
                                                    {inv.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="View Invoice"
                                                        onClick={() => router.push(`/invoices/${inv.id}`)}
                                                    >
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    {(inv.status === 'PENDING' || inv.status === 'PARTIAL') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            title="Process Payment"
                                                            onClick={() => router.push(`/finance/cashier?invoice_id=${inv.id}`)}
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        >
                                                            <BanknoteArrowDown className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <PaginationControls
                            currentPage={invoicePage}
                            totalPages={invoiceLastPage}
                            onPageChange={handleInvoicePageChange}
                            totalItems={invoiceTotal}
                            itemsPerPage={perPage}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="payments" className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-[#2A3242] bg-white dark:bg-[#161B22] shadow-sm dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] overflow-hidden transition-all">
                        <div className="max-h-[600px] overflow-y-auto relative">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-[#1B2230] z-10 shadow-sm border-b border-slate-200 dark:border-[#2A3242]">
                                    <TableRow className="hover:bg-transparent border-0">
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Payment ID</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Tenant</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Property</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Unit</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Method</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Reference</TableHead>
                                        <TableHead className="font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Date</TableHead>
                                        <TableHead className="text-right font-bold text-slate-900 dark:text-[#CBD5E1] py-4 bg-slate-50 dark:bg-[#1B2230]">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <span className="text-muted-foreground font-medium">Loading payments...</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (!allPayments || allPayments.length === 0) ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground font-medium">No payments found matching your filters.</TableCell>
                                        </TableRow>
                                    ) : (allPayments || []).map((pay) => (
                                        <TableRow key={pay.id} className="dark:border-[#2A3242] hover:bg-slate-50 dark:hover:bg-[#1F2633] transition-colors">
                                            <TableCell className="font-medium">{pay.id}</TableCell>
                                            <TableCell>{pay.tenant_name || pay.tenant}</TableCell>
                                            <TableCell>{pay.property_name || '-'}</TableCell>
                                            <TableCell>{pay.unit_number || '-'}</TableCell>
                                            <TableCell>{pay.method}</TableCell>
                                            <TableCell className="font-mono text-xs">{pay.reference}</TableCell>
                                            <TableCell>{pay.created_at ? formatDate(pay.created_at) : formatDate(pay.date)}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">+KES {Number(pay.amount).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <PaginationControls
                            currentPage={paymentPage}
                            totalPages={paymentLastPage}
                            onPageChange={handlePaymentPageChange}
                            totalItems={paymentTotal}
                            itemsPerPage={perPage}
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* Monthly Invoice Generation Confirmation Dialog */}
            <AlertDialog open={confirmGenerateOpen} onOpenChange={setConfirmGenerateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Generate {currentMonthName} Invoices?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to generate monthly rent invoices for all active leases for {currentMonthName} {new Date().getFullYear()}?
                            This will also send SMS notifications to tenants about their new invoices.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleGenerateMonthlyInvoices}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Generate Invoices
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}