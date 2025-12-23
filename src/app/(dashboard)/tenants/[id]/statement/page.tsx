"use client";

import { useEffect, useState } from "react";
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
import { ArrowLeft, Download, Printer } from "lucide-react";

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
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </div>
            </div>

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
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[150px]">Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Reference</TableHead>
                                <TableHead className="text-right">Charge / Credit</TableHead>
                                <TableHead className="text-right font-bold w-[150px]">Balance</TableHead>
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
                                        {/* <span className={`px-2 py-1 rounded-full text-xs font-semibold mr-2 ${txn.type === 'INVOICE'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-green-100 text-green-700'
                                            }`}>
                                            {txn.type}
                                        </span> */}
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
                            <TableRow className="bg-slate-50 border-t-2 border-slate-200">
                                <TableCell colSpan={4} className="text-right font-bold text-lg uppercase">Closing Balance</TableCell>
                                <TableCell className={`text-right font-bold text-lg ${closingBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {closingBalance.toLocaleString()}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <style jsx global>{`
                @media print {
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
                     border: none;
                     box-shadow: none;
                   }
                   .print\\:hidden {
                     display: none;
                   }
                }
             `}</style>
        </div>
    );
}
