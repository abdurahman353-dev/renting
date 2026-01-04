"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/data/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Home,
    TrendingUp,
} from "lucide-react";

export default function TenantDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                // Fetch tenant details
                const tenantRes = await api.get(`/tenants/${params.id}`);
                setTenant(tenantRes.data);
            } catch (error) {
                console.error("Failed to fetch tenant:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTenant();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading tenant details...</p>
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <User className="w-20 h-20 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 text-xl font-semibold">Tenant not found</p>
                </div>
            </div>
        );
    }

    const currentLease = tenant.leases?.find((l: any) => l.status === 'Active') || tenant.leases?.[0];
    const unit = tenant.unit;
    const property = unit?.property;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto p-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                            <User className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
                                <Badge className={`text-xs px-3 py-0.5 rounded-full ${tenant.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-100 border-0'
                                    }`}>
                                    {tenant.status || 'Active'}
                                </Badge>
                            </div>
                            <div className="flex items-center text-slate-500 gap-4">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1.5" />
                                    <span>{unit ? `Unit ${unit.unit_number}, ${property?.name}` : 'No unit assigned'}</span>
                                </div>
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-1.5" />
                                    <span>ID: {tenant.id_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => router.push(`/tenants/${tenant.id}/statement`)}>
                            <TrendingUp className="mr-2 h-4 w-4" /> Financial Statement
                        </Button>
                        {/* <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push(`/finance/cashier?tenant_id=${tenant.id}`)}>
                            <CreditCard className="mr-2 h-4 w-4" /> Record Payment
                        </Button> */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Essential Info */}
                    <div className="space-y-6">
                        {/* Financial Summary Card */}
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="h-2 bg-blue-600"></div>
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-blue-600" />
                                    Financial Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-slate-600 font-medium">Current Balance</span>
                                    <span className={`text-xl font-bold ${Number(tenant.balance) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        KES {Math.abs(Number(tenant.balance)).toLocaleString()}
                                        <span className="text-xs ml-1 font-medium">{Number(tenant.balance) < 0 ? 'Due' : 'Credit'}</span>
                                    </span>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Monthly Rent</span>
                                        <span className="font-semibold text-slate-900">KES {Number(unit?.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Last Payment</span>
                                        <span className="font-semibold text-slate-900">
                                            {tenant.payments?.[0] ? `KES ${Number(tenant.payments[0].amount).toLocaleString()}` : 'None'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Contact Details */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-indigo-600" />
                                    Contact Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase mb-0.5">Email Address</p>
                                            <p className="text-slate-900 font-medium">{tenant.email || 'Not provided'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase mb-0.5">Phone Number</p>
                                            <p className="text-slate-900 font-medium">{tenant.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Lease & Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Lease Information */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                    Lease Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {currentLease ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">Start Date</span>
                                                <span className="text-slate-900 font-semibold">{new Date(currentLease.start_date).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">Monthly Rent</span>
                                                <span className="text-slate-900 font-semibold">KES {Number(currentLease.rent_amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start py-2 border-b border-slate-50">
                                                <span className="text-slate-500 font-medium pt-1">Security Deposit</span>
                                                <div className="text-right">
                                                    <div className="text-slate-900 font-semibold">
                                                        KES {((Number(currentLease.deposit_amount) || 0) + (Number(currentLease.deposit_2_amount) || 0)).toLocaleString()}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 font-medium">
                                                        {(() => {
                                                            const d1 = Number(currentLease.deposit_amount) || 0;
                                                            const d2 = Number(currentLease.deposit_2_amount) || 0;
                                                            if (d1 > 0 && d2 > 0) return `(1st & 2nd Deposit: ${d1.toLocaleString()} + ${d2.toLocaleString()})`;
                                                            if (d1 > 0) return `(1st Deposit: ${d1.toLocaleString()})`;
                                                            if (d2 > 0) return `(2nd Deposit: ${d2.toLocaleString()})`;
                                                            return "(No Deposit)";
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                                <span className="text-slate-500 font-medium">Rent Cycle</span>
                                                <span className="text-slate-900 font-semibold">Monthly</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-500 italic py-4">No active lease found.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="text-lg font-bold text-slate-800">Recent Transactions</CardTitle>
                                <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => router.push(`/tenants/${tenant.id}/statement`)}>
                                    View All
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="font-semibold text-slate-800">Date</TableHead>
                                            <TableHead className="font-semibold text-slate-800">Reference</TableHead>
                                            <TableHead className="font-semibold text-slate-800">Method</TableHead>
                                            <TableHead className="text-right font-semibold text-slate-800">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tenant.payments && tenant.payments.length > 0 ? (
                                            tenant.payments.slice(0, 5).map((payment: any) => (
                                                <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="font-medium text-slate-700">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {new Date(payment.date || payment.created_at).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">{payment.reference || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold text-slate-500 border-slate-200">
                                                            {payment.method}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600">
                                                        KES {Number(payment.amount).toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic">
                                                    No recent transactions found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
