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
    created_at?: string;
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, payRes, revRes] = await Promise.all([
                    api.get('/finance/invoices'),
                    api.get('/finance/payments'),
                    api.get('/dashboard/stats') // Re-using dashboard stats for finance cards
                ]);
                // Ensure arrays
                setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
                setPayments(Array.isArray(payRes.data) ? payRes.data : []);

                // Safe stats extraction
                const statsData = revRes.data || {};
                setStats({
                    revenue: statsData.revenue ?? 0,
                    pending: statsData.pendingIssues ?? 0,
                    arrears: 0
                });
            } catch (error) {
                console.error("Failed to fetch finance data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading finance data...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Finance</h2>
                    <p className="text-muted-foreground">Manage invoices, payments, and financial reports.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="mr-2 h-4 w-4" /> Generate Monthly Invoices
                    </Button>
                </div>
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
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell className="font-medium">{inv.id}</TableCell>
                                        <TableCell>{inv.tenant_name || inv.tenant}</TableCell>
                                        <TableCell>{inv.unit_number || inv.unit}</TableCell>
                                        <TableCell>{inv.created_at || inv.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Overdue" ? "destructive" : "secondary"}
                                                className={inv.status === "Paid" ? "bg-green-600" : ""}
                                            >
                                                {inv.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">KES {inv.amount.toLocaleString()}</TableCell>
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
                                {payments.map((pay) => (
                                    <TableRow key={pay.id}>
                                        <TableCell className="font-medium">{pay.id}</TableCell>
                                        <TableCell>{pay.tenant_name || pay.tenant}</TableCell>
                                        <TableCell>{pay.method}</TableCell>
                                        <TableCell className="font-mono text-xs">{pay.reference}</TableCell>
                                        <TableCell>{pay.created_at || pay.date}</TableCell>
                                        <TableCell className="text-right font-bold text-green-600">+KES {pay.amount.toLocaleString()}</TableCell>
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
