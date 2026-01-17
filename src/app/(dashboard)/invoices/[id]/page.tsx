"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { financeAPI } from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

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
    const [downloading, setDownloading] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

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

    const handleDownload = async () => {
        if (!componentRef.current) return;
        setDownloading(true);

        try {
            const element = componentRef.current;
            const clone = element.cloneNode(true) as HTMLElement;

            // Set styles to ensure full visibility and A4 Portrait width (approx 794px for 210mm)
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = '794px';
            clone.style.height = 'auto';
            clone.style.minHeight = 'auto';
            clone.style.maxHeight = 'none';
            clone.style.overflow = 'visible';
            clone.style.backgroundColor = 'white';

            // Ensure all Card/CardHeader/CardContent nested children don't have height constraints
            const hFullElements = clone.querySelectorAll('.h-full');
            hFullElements.forEach(el => (el as HTMLElement).classList.remove('h-full'));

            const cards = clone.querySelectorAll('[class*="Card"]');
            cards.forEach(el => {
                const e = el as HTMLElement;
                e.style.height = 'auto';
                e.style.minHeight = 'auto';
                e.style.maxHeight = 'none';
                e.style.overflow = 'visible';
                e.style.border = 'none';
                e.style.boxShadow = 'none';
            });

            // Specific adjustment for the header to ensure it's not cut
            const header = clone.querySelector('[class*="CardHeader"]') as HTMLElement;
            if (header) {
                header.style.minHeight = '100px';
                header.style.height = 'auto';
            }

            document.body.appendChild(clone);

            // Wait a bit for any layout shifts
            await new Promise(resolve => setTimeout(resolve, 100));

            const totalHeight = clone.scrollHeight;

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794,
                height: totalHeight,
                windowWidth: 794,
                windowHeight: totalHeight,
                y: 0,
                scrollX: 0,
                scrollY: 0
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL("image/png");

            // A4 Portrait: 210mm x 297mm
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // If the content is longer than A4, jspdf will add a page? 
            // Actually, we'll just place it. If it overflows, users might want pagination but single page high-quality is usually preferred for invoices.
            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`Invoice_${invoice?.invoice_number || 'Details'}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("Failed to download PDF");
        } finally {
            setDownloading(false);
        }
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
        PAID: "bg-emerald-500/15 text-[#22C55E] border-emerald-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
        PENDING: "bg-amber-500/15 text-amber-500 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
        PARTIAL: "bg-orange-500/15 text-orange-500 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
        OVERDUE: "bg-rose-500/15 text-rose-500 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
    };

    return (
        <div className="min-h-screen bg-muted/40 p-6 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                {/* Action Bar - Hidden on Print */}
                <div className="flex items-center justify-between mb-6 print:hidden">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="bg-white dark:bg-[#161B22] border-slate-200 dark:border-[#2A3242] text-slate-600 dark:text-[#CBD5E1]"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {downloading ? "Generating..." : "Download PDF"}
                    </Button>
                </div>

                {/* Invoice Card */}
                <div ref={componentRef} className="bg-white dark:bg-[#161B22] rounded-2xl overflow-hidden transition-all">
                    <Card className="pt-0 shadow-xl dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)] border-none bg-white dark:bg-[#161B22]">
                        <CardHeader className="border-b border-slate-200 dark:border-[#2A3242] bg-slate-50 dark:bg-[#1B2230] text-black dark:text-[#F9FAFB] rounded-t-2xl">
                            <div className="flex justify-between items-start mt-4 mb-2">
                                <div>
                                    <CardTitle className="text-3xl font-black tracking-tighter">INVOICE</CardTitle>
                                    <p className="text-slate-500 dark:text-[#9CA3AF] font-bold">#{invoice.invoice_number}</p>
                                </div>
                                <Badge className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest border transition-all ${statusColors[invoice.status as keyof typeof statusColors] || "bg-slate-100 text-slate-700"}`}>
                                    {invoice.status}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8 space-y-8 bg-white dark:bg-[#161B22]">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">BILLED TO</h3>
                                    <p className="font-black text-xl text-slate-900 dark:text-[#F9FAFB]">{invoice.tenant.name}</p>
                                    <div className="mt-2 space-y-1">
                                        {invoice.tenant.email && <p className="text-slate-600 dark:text-[#CBD5E1] font-medium flex items-center gap-2"><span className="h-1 w-1 bg-slate-400 rounded-full"></span>{invoice.tenant.email}</p>}
                                        {invoice.tenant.id_number && <p className="text-slate-600 dark:text-[#CBD5E1] font-medium flex items-center gap-2"><span className="h-1 w-1 bg-slate-400 rounded-full"></span>ID No: {invoice.tenant.id_number}</p>}
                                        {invoice.tenant.phone && <p className="text-slate-600 dark:text-[#CBD5E1] font-medium flex items-center gap-2"><span className="h-1 w-1 bg-slate-400 rounded-full"></span>{invoice.tenant.phone}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-[10px] font-black text-slate-400 dark:text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">INVOICE DETAILS</h3>
                                    <div className="space-y-2 font-bold text-sm">
                                        <p className="text-slate-600 dark:text-[#CBD5E1]"><span className="opacity-60">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}</p>
                                        {invoice.due_date && <p className="text-slate-600 dark:text-[#CBD5E1]"><span className="opacity-60 text-rose-500">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>}
                                        <p className="text-slate-600 dark:text-[#CBD5E1]"><span className="opacity-60">Period:</span> {invoice.month_year || `${invoice.month}/${invoice.year}`}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Property Details */}
                            <div className="bg-slate-50 dark:bg-[#1B2230] p-6 rounded-2xl border border-slate-100 dark:border-[#2A3242]/50 shadow-sm transition-all">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">PROPERTY DETAILS</h3>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-lg text-slate-900 dark:text-[#F9FAFB]">{invoice.property_name}</p>
                                        <p className="text-slate-500 dark:text-[#9CA3AF] font-bold uppercase text-xs tracking-widest mt-1">Tenant Space</p>
                                    </div>
                                    <div className="bg-slate-900 dark:bg-[#2563EB] text-white px-4 py-2 rounded-xl text-lg font-black shadow-lg">
                                        {invoice.unit_number}
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Items */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 dark:text-[#9CA3AF] uppercase tracking-[0.2em]">INVOICE ITEMS</h3>
                                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-[#2A3242]">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-[#1F2633] border-b border-slate-100 dark:border-[#2A3242]">
                                            <tr>
                                                <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 dark:text-[#9CA3AF] uppercase tracking-widest">Description</th>
                                                <th className="text-right px-6 py-4 text-[10px] font-black text-slate-500 dark:text-[#9CA3AF] uppercase tracking-widest">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-[#2A3242]">
                                            <tr>
                                                <td className="px-6 py-6">
                                                    <p className="font-black text-slate-900 dark:text-[#F9FAFB] text-lg">{invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}</p>
                                                    {invoice.description && <p className="text-sm text-slate-500 dark:text-[#9CA3AF] font-medium mt-1">{invoice.description}</p>}
                                                </td>
                                                <td className="text-right px-6 py-6 font-black text-slate-900 dark:text-[#F9FAFB] text-xl">KES {invoice.amount.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="flex justify-end pt-4">
                                <div className="w-full max-w-sm space-y-3">
                                    <div className="flex justify-between text-slate-600 dark:text-[#CBD5E1] font-bold">
                                        <span className="uppercase text-xs tracking-widest opacity-60">Subtotal</span>
                                        <span>KES {invoice.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-600 dark:text-[#22C55E] font-bold">
                                        <span className="uppercase text-xs tracking-widest opacity-60">Amount Paid</span>
                                        <span>KES {invoice.paid_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-[#1B2230] p-4 rounded-xl border border-slate-100 dark:border-[#2A3242]">
                                        <span className="font-black text-slate-900 dark:text-[#F9FAFB] uppercase text-xs tracking-[0.15em]">Balance Due</span>
                                        <span className="text-2xl font-black text-[#2563EB]">KES {(invoice.amount - invoice.paid_amount).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="text-center pt-8 border-t border-slate-100 dark:border-[#2A3242]">
                                <p className="text-[10px] font-black text-slate-400 dark:text-[#9CA3AF] uppercase tracking-[0.3em]">Official Invoice Statement</p>
                                <p className="text-sm text-slate-500 dark:text-[#9CA3AF] mt-2 italic font-medium">Thank you for your business!</p>
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
        </div>
    );
}