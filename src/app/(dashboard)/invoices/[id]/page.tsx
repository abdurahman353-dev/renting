"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { financeAPI } from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Invoice {
    id: number;
    invoice_number: string;
    tenant: { id: number; id_number: string; name: string; email?: string; phone?: string };
    property_name: string;
    unit_number: string;
    amount: number;
    paid_amount: number;
    status: string;
    type: string;
    description?: string;
    month: number;
    year: number;
    month_year?: string;
    due_date?: string;
    created_at: string;
    payments?: Array<{
        id: number;
        amount: number;
        method: string;
        reference?: string;
        date: string;
    }>;
}

export default function InvoiceViewPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await financeAPI.getInvoice(params.id as string);
                setInvoice(data);
            } catch (error) {
                console.error("Failed to fetch invoice:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchInvoice();
        }
    }, [params.id]);

    const handleDownload = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-600">Invoice not found</p>
            </div>
        );
    }

    const statusColors = {
        PAID: "bg-green-100 text-green-700",
        PENDING: "bg-yellow-100 text-yellow-700",
        PARTIAL: "bg-orange-100 text-orange-700",
        OVERDUE: "bg-red-100 text-red-700",
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Action Bar - Hidden on Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                    </Button>
                </div>

                {/* Invoice Card */}
                <Card className="pt-0">
                    <CardHeader className="border-b bg-slate-200 text-black rounded-t-lg h-full">
                        <div className="flex justify-between items-start mt-4 mb-2">
                            <div>
                                <CardTitle className="text-2xl font-bold">INVOICE</CardTitle>
                                <p className="text-black-100">#{invoice.invoice_number}</p>
                            </div>
                            <Badge className={statusColors[invoice.status as keyof typeof statusColors] || "bg-slate-100 text-slate-700 mt-4 mb-2"}>
                                {invoice.status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-8">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 mb-2">BILLED TO</h3>
                                <p className="font-bold text-lg">Name: {invoice.tenant.name}</p>
                                {invoice.tenant.email && <p className="text-slate-600">Email: {invoice.tenant.email}</p>}
                                {invoice.tenant.id_number && <p className="text-slate-600">DI No: {invoice.tenant.id_number}</p>}
                                {invoice.tenant.phone && <p className="text-slate-600">Phone: {invoice.tenant.phone}</p>}
                            </div>
                            <div className="text-right">
                                <h3 className="text-sm font-semibold text-slate-500 mb-2">INVOICE DETAILS</h3>
                                <div className="space-y-1">
                                    <p className="text-slate-700"><span className="font-semibold">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
                                    {invoice.due_date && <p className="text-slate-700"><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>}
                                    <p className="text-slate-700"><span className="font-semibold">Period:</span> {invoice.month_year || `${invoice.month}/${invoice.year}`}</p>
                                </div>
                            </div>
                        </div>

                        {/* Property Details */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="text-sm font-semibold text-slate-500 mb-2">PROPERTY DETAILS</h3>
                            <p className="font-semibold text-slate-900">{invoice.property_name}</p>
                            <p className="text-slate-600">Unit: {invoice.unit_number}</p>
                        </div>

                        {/* Invoice Items */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 mb-4">INVOICE ITEMS</h3>
                            <table className="w-full">
                                <thead className="border-b-2 border-slate-200">
                                    <tr>
                                        <th className="text-left py-3 text-slate-700">Description</th>
                                        <th className="text-right py-3 text-slate-700">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="py-4">
                                            <p className="font-medium">{invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}</p>
                                            {invoice.description && <p className="text-sm text-slate-600">{invoice.description}</p>}
                                        </td>
                                        <td className="text-right font-semibold">KES {invoice.amount.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 border-slate-200 pt-4">
                            <div className="flex justify-end space-y-2">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-slate-700">
                                        <span>Subtotal:</span>
                                        <span>KES {invoice.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-700">
                                        <span>Paid:</span>
                                        <span className="text-green-600">KES {invoice.paid_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold border-t-2 border-slate-300 pt-2">
                                        <span>Balance Due:</span>
                                        <span className="text-blue-600">KES {(invoice.amount - invoice.paid_amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        {/* {invoice.payments && invoice.payments.length > 0 && (
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-sm font-semibold text-slate-500 mb-4">PAYMENT HISTORY</h3>
                                <div className="space-y-2">
                                    {invoice.payments.map((payment) => (
                                        <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                                            <div>
                                                <p className="font-medium">{payment.method}</p>
                                                <p className="text-sm text-slate-600">{new Date(payment.date).toLocaleDateString()}</p>
                                                {payment.reference && <p className="text-xs text-slate-500">{payment.reference}</p>}
                                            </div>
                                            <p className="font-semibold text-green-600">KES {payment.amount.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )} */}

                        {/* Footer */}
                        <div className="text-center text-sm text-slate-500 border-t border-slate-200 pt-6">
                            <p>Thank you for your business!</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
