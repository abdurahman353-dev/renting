"use client"

import { useEffect, useState } from "react"
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
import { FileText, CreditCard, Plus, Download, Send } from "lucide-react"
import { financeAPI, propertyAPI } from "@/data/apis"

interface Invoice {
    id: string;
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
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        revenue: 0,
        pending: 0,
        arrears: 0
    });

    const [properties, setProperties] = useState<any[]>([]);
    const [selectedProperty, setSelectedProperty] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");

    // Fetch filter options (properties)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await propertyAPI.getAll();
                // Handle both {data: [...]} and [...] response formats
                const propertyData = Array.isArray(res) ? res : (res.data || []);
                setProperties(propertyData);
            } catch (e) {
                console.error("Failed to fetch properties:", e);
                setProperties([]);
            }
        };
        fetchFilters();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = {
                property_id: selectedProperty !== 'all' ? selectedProperty : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            };

            const [invRes, payRes, revRes] = await Promise.all([
                financeAPI.getInvoices(params),
                financeAPI.getPayments(params),
                financeAPI.getRevenueReport()
            ]);

            // Handle response structure - could be direct array or {data: array}
            const invoiceData = Array.isArray(invRes) ? invRes : (invRes.data || []);
            const paymentData = Array.isArray(payRes) ? payRes : (payRes.data || []);
            const revenueData = revRes.revenue !== undefined ? revRes : (revRes.data || {});

            setInvoices(invoiceData);
            setPayments(paymentData);

            setStats({
                revenue: revenueData.revenue ?? 0,
                pending: calculatePending(invoiceData),
                arrears: calculateArrears(invoiceData)
            });
        } catch (error) {
            console.error("Failed to fetch finance data:", error);
            setInvoices([]);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate pending amount from invoices
    const calculatePending = (invoices: Invoice[]) => {
        return invoices
            .filter(inv => inv.status === 'PENDING' || inv.status === 'PARTIAL')
            .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paid_amount || 0)), 0);
    };

    // Calculate arrears (overdue invoices)
    const calculateArrears = (invoices: Invoice[]) => {
        const today = new Date();
        return invoices
            .filter(inv => {
                if (inv.status === 'PAID') return false;
                const dueDate = new Date(inv.due_date || inv.created_at);
                const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                return daysDiff > 30;
            })
            .reduce((sum, inv) => sum + (Number(inv.amount) - Number(inv.paid_amount || 0)), 0);
    };

    useEffect(() => {
        fetchData();
    }, [selectedProperty, selectedStatus]);

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
                    <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
                    <p className="text-muted-foreground">Manage invoices, payments, and financial reports.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleGenerateInvoices}>
                        <Plus className="mr-2 h-4 w-4" /> Generate Monthly Invoices
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <select
                    className="border rounded p-2 text-sm"
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                >
                    <option value="all">All Properties</option>
                    {properties && properties.length > 0 && properties.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select
                    className="border rounded p-2 text-sm"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="PARTIAL">Partial</option>
                </select>

                <Button variant="secondary" onClick={fetchData} size="sm">Refresh</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
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
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
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
                                        <TableCell className="font-medium">{inv.id}</TableCell>
                                        <TableCell>{inv.tenant_name || inv.tenant}</TableCell>
                                        <TableCell>{inv.property_name || '-'}</TableCell>
                                        <TableCell>{inv.unit_number || inv.unit}</TableCell>
                                        <TableCell>{inv.created_at || inv.date}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={inv.status === "PAID" ? "default" : inv.status === "OVERDUE" ? "destructive" : "secondary"}
                                                className={inv.status === "PAID" ? "bg-green-600" : ""}
                                            >
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">KES {Number(inv.amount).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" title="Send Reminder">
                                                <Send className="h-4 w-4 text-slate-500" />
                                            </Button>
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
                                        <TableCell>{pay.created_at || pay.date}</TableCell>
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