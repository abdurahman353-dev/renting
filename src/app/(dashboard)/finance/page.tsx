"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { FileText, CreditCard, Plus, Download, Send, Eye, DollarSign, BanknoteArrowDown, TrendingUp, Wallet } from "lucide-react"
import { financeAPI, propertyAPI, unitAPI, tenantAPI } from "@/data/apis"
import { formatDate } from "@/lib/utils"
import FilterComponent from "./FilterComponent"

interface Invoice {
    id: string;
    invoice_number: string;
    tenant: string;
    unit: string;
    amount: number;
    status: string;
    date: string;
    // Map from backend fields
    tenant_name?: string;
    unit_number?: string;
    property_name?: string;
    created_at?: string;
    paid_amount?: number;
    due_date?: string;
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
    created_at?: string;
}

export default function FinancePage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        revenue: 0,
        pending: 0,
        arrears: 0
    });

    const [properties, setProperties] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("invoices");

    // Filter states
    const [filters, setFilters] = useState({
        property_id: "all",
        unit_id: "all",
        status: "all",
        tenant_id: "all",
        month: "",
        year: new Date().getFullYear().toString()
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

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                ...filters,
                property_id: filters.property_id !== 'all' ? filters.property_id : undefined,
                unit_id: filters.unit_id !== 'all' ? filters.unit_id : undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                tenant_id: filters.tenant_id !== 'all' ? filters.tenant_id : undefined,
                month: filters.month || undefined,
                year: filters.year || undefined
            };

            const [invRes, payRes] = await Promise.all([
                financeAPI.getInvoices(params),
                financeAPI.getPayments(params),
            ]);

            // Revenue report is a separate call that shouldn't block the main table loading
            financeAPI.getRevenueReport().then(revRes => {
                const revenueData = revRes.revenue !== undefined ? revRes : (revRes.data || {});
                setStats(prev => ({
                    ...prev,
                    revenue: revenueData.revenue ?? 0,
                }));
            }).catch(console.error);

            const invoiceData = Array.isArray(invRes) ? invRes : (invRes.data || []);
            const paymentData = Array.isArray(payRes) ? payRes : (payRes.data || []);

            setInvoices(invoiceData);
            setPayments(paymentData);

            // Calculate pending amount from invoices
            const pendingAmount = invoiceData
                .filter(inv => inv.status === 'PENDING' || inv.status === 'PARTIAL')
                .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paid_amount || 0)), 0);

            // Calculate arrears (overdue invoices)
            const today = new Date();
            const arrearsAmount = invoiceData
                .filter(inv => {
                    if (inv.status === 'PAID') return false;
                    const rawDate = inv.due_date || inv.created_at || inv.date || new Date().toISOString();
                    const dueDate = new Date(rawDate);
                    const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                    return daysDiff > 30;
                })
                .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paid_amount || 0)), 0);

            setStats(prev => ({
                ...prev,
                pending: pendingAmount,
                arrears: arrearsAmount
            }));
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
            setInvoices([]);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch only, subsequent controlled by refresh button in filter
        fetchData();
    }, []); // Only on mount

    const onFilterChange = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleGenerateInvoices = async () => {
        try {
            const res = await financeAPI.generateInvoice({});
            const message = res.message || res.data?.message || "Invoices generated successfully";
            alert(message);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to generate invoices");
        }
    };

    const handleExport = () => {
        // Simple CSV Export of current view
        const headers = ["ID", "Tenant", "Unit", "Property", "Amount", "Paid", "Status", "Date"];
        const rows = invoices.map(inv => [
            inv.id,
            inv.tenant_name || inv.tenant || 'Unknown',
            inv.unit_number || inv.unit || 'N/A',
            inv.property_name || '-',
            inv.amount,
            inv.paid_amount || 0,
            inv.status,
            inv.created_at || inv.date
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "invoices_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && invoices.length === 0) return <div className="p-8">Loading finance data...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Finance</h2>
                    <p className="text-slate-500 font-medium">Manage invoices, payments, and financial overview.</p>
                </div>
                <div className="flex space-x-3">
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
                        onClick={handleExport}
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        onClick={handleGenerateInvoices}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Generate Monthly Invoices
                    </Button>
                </div>
            </div>

            {/* Advanced Filters */}
            <FilterComponent
                properties={properties}
                units={units}
                onFilterChange={onFilterChange}
                onRefresh={fetchData}
            />

            <Tabs defaultValue="invoices" onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-auto inline-flex gap-2">
                    <TabsTrigger
                        value="invoices"
                        className="data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm px-6 py-2 rounded-lg transition-all duration-300 font-bold border border-transparent data-[state=active]:border-indigo-100"
                    >
                        <FileText className={`w-4 h-4 mr-2 ${activeTab === 'invoices' ? 'text-indigo-600' : 'text-slate-500'}`} />
                        Invoices
                    </TabsTrigger>
                    <TabsTrigger
                        value="payments"
                        className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm px-6 py-2 rounded-lg transition-all duration-300 font-bold border border-transparent data-[state=active]:border-emerald-100"
                    >
                        <Wallet className={`w-4 h-4 mr-2 ${activeTab === 'payments' ? 'text-emerald-600' : 'text-slate-500'}`} />
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
                    <div className="rounded-md border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">No invoices found.</TableCell>
                                    </TableRow>
                                ) : invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                                        <TableCell>{inv.tenant_name || inv.tenant}</TableCell>
                                        <TableCell>{inv.property_name || '-'}</TableCell>
                                        <TableCell>{inv.unit_number || inv.unit}</TableCell>
                                        <TableCell>{inv.created_at ? formatDate(inv.created_at) : formatDate(inv.date)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`px-3 py-1 font-bold rounded-full ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : inv.status === "PENDING" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : inv.status === "PARTIAL" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                                            >
                                                {inv.status === "OVERDUE" ? "NOT PAID" : inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-slate-700">KES {Number(inv.amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="View Invoice"
                                                    onClick={() => router.push(`/invoices/${inv.id}`)}
                                                >
                                                    <Eye className="h-4 w-4 text-slate-500" />
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
                </TabsContent>
                <TabsContent value="payments" className="space-y-4">
                    <div className="rounded-md border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Payment ID</TableHead>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">No payments found.</TableCell>
                                    </TableRow>
                                ) : payments.map((pay) => (
                                    <TableRow key={pay.id}>
                                        <TableCell className="font-medium">{pay.id}</TableCell>
                                        <TableCell>{pay.tenant_name || pay.tenant}</TableCell>
                                        <TableCell>{pay.method}</TableCell>
                                        <TableCell className="font-mono text-xs">{pay.reference}</TableCell>
                                        <TableCell>{pay.created_at ? formatDate(pay.created_at) : formatDate(pay.date)}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">+KES {Number(pay.amount).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}