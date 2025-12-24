"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/data/apis";
import { Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ArrowLeft,
    Calendar,
    CreditCard,
    Download,
    FileText,
    Mail,
    MapPin,
    Phone,
    User,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function TenantDetailsPage() {
    const router = useRouter();
    const params = useParams();

    // ✅ FIXED STATE TYPES
    const [tenant, setTenant] = useState<any>(null);
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // ✅ FETCH TENANT DATA
                const tenantRes = await api.get(`/tenants/${params.id}`);
                setTenant(tenantRes.data);

                // ✅ FETCH PAYMENT HISTORY
                try {
                    const historyRes = await api.get(
                        `/tenants/${params.id}/payment-history`
                    );
                    setPaymentHistory(historyRes.data);
                } catch (e) {
                    console.warn("Could not fetch payment history");
                }
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchTenant();
        }
    }, [params?.id]);

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <Button
                variant="ghost"
                className="mb-4 pl-0 hover:pl-2 transition-all"
                onClick={() => router.back()}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            {tenant?.name}
                        </h1>
                        <div className="flex items-center text-slate-500 mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>
                                Unit {tenant?.unit}, {tenant?.property}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge
                        variant={tenant?.status === "Active" ? "default" : "secondary"}
                        className="text-base px-4 py-1"
                    >
                        {tenant?.status}
                    </Badge>

                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Download className="mr-2 h-4 w-4" /> View Rent Statement
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center">
                                <Mail className="w-4 h-4 mr-3 text-slate-500" />
                                <span>{tenant?.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                                <span>{tenant?.phone}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Lease Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Start Date</span>
                                <span className="font-medium">{tenant?.leaseStart}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">End Date</span>
                                <span className="font-medium">{tenant?.leaseEnd}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Monthly Rent</span>
                                <span className="font-medium">{tenant?.monthlyRent}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Security Deposit</span>
                                <span className="font-medium">{tenant?.deposit}</span>
                            </div>

                            <Button variant="outline" className="w-full">
                                <FileText className="mr-2 h-4 w-4" /> View Lease Agreement
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Transaction History</CardTitle>
                            <Button variant="outline" size="sm">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </CardHeader>

                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {paymentHistory.map((transaction: any) => (
                                        <TableRow key={transaction.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center">
                                                    <Calendar className="mr-2 h-4 w-4 text-slate-400" />
                                                    {transaction.date}
                                                </div>
                                            </TableCell>

                                            <TableCell>{transaction.type}</TableCell>

                                            <TableCell>
                                                <div className="flex items-center text-sm text-slate-500">
                                                    <CreditCard className="mr-2 h-4 w-4" />
                                                    {transaction.method}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-green-50 text-green-700 border-green-200"
                                                >
                                                    {transaction.status}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-right font-medium">
                                                {transaction.amount}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
