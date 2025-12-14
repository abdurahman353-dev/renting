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

import { ReceiptModal } from "@/components/finance/ReceiptModal"
import { financeAPI } from "@/data/apis"

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
    tenant?: any; // Relaxed to handle both string (ID/Name) and Object (from API) without conflict
    amount: number;
    method: string;
    reference: string;
    date: string;
    created_at: string; // Made required to match ReceiptModal
    tenant_name?: string;
    // For Receipt
    unit_number?: string;
    tenant_details?: any; // To store full object if needed
}

export default function FinancePage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const handleGenerateInvoices = async () => {
        try {
            // await api.post("/finance/invoices/generate-monthly");
            await financeAPI.generateInvoice();
            // Refresh data
            const [invRes, payRes] = await Promise.all([
                // api.get('/finance/invoices'),
                financeAPI.getInvoices(),
                financeAPI.getPayments(),
                // api.get('/finance/payments'),
            ]);
            setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
            setPayments(Array.isArray(payRes.data) ? payRes.data : []);
            alert("Monthly invoices generated successfully!");
        } catch (error) {
            console.error("Failed to generate invoices:", error);
            alert("Failed to generate invoices. Check console.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invRes, payRes] = await Promise.all([
                    financeAPI.getInvoices(),
                    financeAPI.getPayments(),
                    // api.get('/finance/invoices'),
                    // api.get('/finance/payments'),
                ]);
                // Ensure arrays
                setInvoices(Array.isArray(invRes) ? invRes : []);
                setPayments(Array.isArray(payRes) ? payRes : []);
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
                    <p className="text-muted-foreground">Manage invoices, payments, and receipts.</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={handleGenerateInvoices}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Generate Monthly Invoices
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="invoices" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="payments">Payments & Receipts</TabsTrigger>
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
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No invoices found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="font-medium">{inv.id}</TableCell>
                                            <TableCell>{inv.tenant_name || inv.tenant}</TableCell>
                                            <TableCell>{inv.unit_number || inv.unit}</TableCell>
                                            <TableCell>{new Date(inv.created_at || inv.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={inv.status?.toUpperCase() === "PAID" ? "default" : inv.status?.toUpperCase() === "OVERDUE" ? "destructive" : "secondary"}
                                                    className={inv.status?.toUpperCase() === "PAID" ? "bg-green-600" : ""}
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="payments" className="space-y-4">
                    <div className="rounded-md border bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Receipt ID</TableHead>
                                    <TableHead>Tenant</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No payments recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((pay) => (
                                        <TableRow key={pay.id}>
                                            <TableCell className="font-medium">#{pay.id}</TableCell>
                                            <TableCell>{pay.tenant_name || (typeof pay.tenant === 'object' ? pay.tenant?.name : pay.tenant)}</TableCell>
                                            <TableCell>{pay.method}</TableCell>
                                            <TableCell className="font-mono text-xs">{pay.reference}</TableCell>
                                            <TableCell>{new Date(pay.created_at || pay.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">+KES {Number(pay.amount).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => {
                                                        setSelectedPayment(pay);
                                                        setShowReceipt(true);
                                                    }}
                                                >
                                                    <FileText className="mr-2 h-3 w-3" /> Receipt
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <ReceiptModal
                open={showReceipt}
                onOpenChange={setShowReceipt}
                payment={selectedPayment}
            />
        </div>
    )
}
