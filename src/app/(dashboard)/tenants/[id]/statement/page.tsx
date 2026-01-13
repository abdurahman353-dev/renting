"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, Printer, Loader2 } from "lucide-react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

interface Transaction {
    date: string;
    type: "INVOICE" | "PAYMENT";
    description: string;
    amount: number;
    reference: string;
    running_balance: number;
}

interface Tenant {
    id: string;
    name: string;
    unit?: {
        unit_number: string;
    };
}

export default function TenantStatementPage() {
    const params = useParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [closingBalance, setClosingBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchStatement = async () => {
            try {
                const res = await api.get(`/tenants/${params.id}/statement`);
                setTransactions(res.data.transactions);
                setTenant(res.data.tenant);
                setClosingBalance(res.data.closing_balance);
            } catch (error) {
                console.error("Failed to fetch statement:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchStatement();
        }
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        if (!componentRef.current) return;
        setDownloading(true);

        try {
            const element = componentRef.current;
            const clone = element.cloneNode(true) as HTMLElement;

            // Set base styles for off-screen rendering
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = '794px';
            clone.style.height = 'auto';
            clone.style.overflow = 'visible';

            // Ultra-compact styling for A5 Landscape
            clone.style.fontSize = '8px';

            // Reduce all headings aggressively
            const allHeadings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="text-"], p');
            allHeadings.forEach((el: Element) => {
                const e = el as HTMLElement;
                const classList = e.classList.toString();
                if (classList.includes('text-2xl')) {
                    e.style.fontSize = '12px';
                } else if (classList.includes('text-lg')) {
                    e.style.fontSize = '9px';
                } else if (classList.includes('text-sm')) {
                    e.style.fontSize = '7px';
                } else if (classList.includes('text-xs')) {
                    e.style.fontSize = '6px';
                } else {
                    e.style.fontSize = '8px';
                }
                e.style.margin = '0';
                e.style.lineHeight = '1.1';
            });

            // Ultra-compact table cells
            const tableCells = clone.querySelectorAll('td, th');
            tableCells.forEach((cell: Element) => {
                const c = cell as HTMLElement;
                c.style.padding = '1px 3px';
                c.style.fontSize = '6px';
                c.style.lineHeight = '1.1';
            });

            // Minimize all padding
            const paddedElements = clone.querySelectorAll('[class*="p-"], [class*="px-"], [class*="py-"], [class*="space-"]');
            paddedElements.forEach((el: Element) => {
                const e = el as HTMLElement;
                e.style.padding = '4px';
                e.style.margin = '0';
            });

            // Specific header reduction
            const cardHeader = clone.querySelector('[class*="CardHeader"]') as HTMLElement;
            if (cardHeader) {
                cardHeader.style.padding = '6px 8px';
            }

            const cardContent = clone.querySelector('[class*="CardContent"]') as HTMLElement;
            if (cardContent) {
                cardContent.style.padding = '0';
            }

            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            document.body.removeChild(clone);

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a5"
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
            pdf.save(`Statement_${tenant?.name || 'Tenant'}.pdf`);
        } catch (error) {
            console.error("Failed to download PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading statement...</div>;
    }

    if (!tenant) {
        return <div className="p-8 text-center text-red-500">Tenant not found</div>;
    }

    return (
        <div className="p-8 space-y-2 max-w-9xl mx-auto">
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenant
                </Button>
                <div className="space-x-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {downloading ? "Generating Only..." : "PDF"}
                    </Button>
                </div>
            </div>

            <div ref={componentRef} className="bg-white">
                <Card className="bg-white shadow-sm pt-0" id="printable-statement">
                    <CardHeader className="border-b bg-slate-50 rounded-t-lg pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-bold">Statement of Account</CardTitle>
                                <p className="text-muted-foreground mt-1">Tenant Statement</p>
                            </div>
                            <div className="text-right">
                                <h3 className="font-semibold text-lg">{tenant.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Unit: {tenant.unit?.unit_number || "N/A"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Statement Date: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto relative print:max-h-none print:overflow-visible">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm print:static print:shadow-none">
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-[150px] bg-slate-50">Date</TableHead>
                                        <TableHead className="bg-slate-50">Description</TableHead>
                                        <TableHead className="text-right bg-slate-50">Reference</TableHead>
                                        <TableHead className="text-right bg-slate-50">Charge / Credit</TableHead>
                                        <TableHead className="text-right font-bold w-[150px] bg-slate-50">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={4} className="font-medium text-slate-500">Opening Balance</TableCell>
                                        <TableCell className="text-right font-medium">KES 0</TableCell>
                                    </TableRow>
                                    {transactions.map((txn, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{new Date(txn.date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {txn.description}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">{txn.reference}</TableCell>
                                            <TableCell className={`text-right font-medium ${txn.amount < 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                {txn.amount < 0 ? '-' : '+'} KES {Math.abs(txn.amount).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-slate-900">
                                                KES {txn.running_balance.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="border-t-2 border-slate-900 bg-slate-50/50">
                                        <TableCell colSpan={4} className="text-right font-black text-slate-900 uppercase tracking-wider">Total Balance</TableCell>
                                        <TableCell className="text-right">
                                            <div className={`text-sm font-bold ${closingBalance < 0 ? 'text-red-600' : (closingBalance > 0 ? 'text-green-600' : 'text-slate-900')}`}>
                                                {closingBalance > 0 ? '+' : ''} KES {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                                {closingBalance < 0 ? 'Pending Amount' : (closingBalance > 0 ? 'Outstanding Credit' : 'Account Balanced')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                @media print {
                   @page {
                       size: auto;
                       margin: 10mm;
                   }
                   body {
                       background: #fff !important;
                       font-size: 8px;
                   }
                   .print\\:hidden {
                       display: none !important;
                   }
                   body * {
                       visibility: hidden;
                   }
                   #printable-statement, #printable-statement * {
                       visibility: visible;
                   }
                   #printable-statement {
                       position: absolute;
                       left: 0;
                       top: 0;
                       width: 100%;
                       margin: 0;
                       padding: 0;
                       border: none !important;
                       box-shadow: none !important;
                   }
                   /* Ultra-compact print styling */
                   #printable-statement h1,
                   #printable-statement h2,
                   #printable-statement h3,
                   #printable-statement h4,
                   #printable-statement h5,
                   #printable-statement h6 {
                       font-size: 12px !important;
                       margin: 0 !important;
                       line-height: 1.1 !important;
                   }
                   #printable-statement p {
                       font-size: 8px !important;
                       margin: 0 !important;
                       line-height: 1.1 !important;
                   }
                   #printable-statement td,
                   #printable-statement th {
                       padding: 1px 3px !important;
                       font-size: 6px !important;
                       line-height: 1.1 !important;
                   }
                   #printable-statement [class*="CardHeader"] {
                       padding: 6px 8px !important;
                       border: none !important;
                       box-shadow: none !important;
                   }
                   #printable-statement [class*="CardContent"] {
                       padding: 0 !important;
                   }
                   #printable-statement [class*="Card"] {
                       border: none !important;
                       box-shadow: none !important;
                   }
                }
             `}</style>
        </div>
    );
}
