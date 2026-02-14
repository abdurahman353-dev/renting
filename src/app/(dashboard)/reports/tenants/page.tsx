"use client";

import { useState, useEffect } from "react";
import { Download, Filter, User, CreditCard, AlertCircle } from "lucide-react";
import { financeAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TenantReportPage() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);

    // Default to current month/year
    const [filters, setFilters] = useState({
        property_id: "all",
        month: new Date().getMonth() + 1, // 1-12
        year: new Date().getFullYear()
    });

    useEffect(() => {
        loadProperties();
    }, []);

    useEffect(() => {
        fetchReport();
    }, [filters]);

    const loadProperties = async () => {
        try {
            const res = await propertyAPI.getAll();
            setProperties(res);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await financeAPI.getTenantReport(filters);
            setData(res);
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch tenant report data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Property Name", "Tenant Name", "Status", "Phone Number", "Unit", "Opening Balance", "Agreement Fee", "Deposits", "Monthly Rent", "Past Arrears", "Amount Paid", "Balance"];
        const rows = data.map((row: any) => [
            `"${row.property_name}"`,
            `"${row.tenant_name}"`,
            `"${row.status}"`,
            `"${row.phone}"`,
            `"${row.unit_number}"`,
            row.opening_balance,
            row.agreement_amount,
            row.deposits,
            row.monthly_rent,
            row.monthly_rent,
            row.past_arrears,
            row.amount_paid,
            row.balance
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((r) => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tenant_monthly_report_${filters.year}_${filters.month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" }
    ];

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    const totalPaid = data.reduce((acc, curr) => acc + Number(curr.amount_paid), 0);
    const totalBalance = data.reduce((acc, curr) => acc + Number(curr.balance), 0);
    const debtors = data.filter(d => d.balance < 0).length;

    return (
        <div className="p-6 space-y-6 min-h-screen bg-muted/40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Tenants Ledger Report</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Monthly financial overview of all tenant accounts
                    </p>
                </div>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-none transition-all active:scale-95">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Collected</p>
                                <p className="text-2xl font-black text-foreground">{totalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-emerald-500/10">
                            <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <AlertCircle className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Outstanding</p>
                                <p className="text-2xl font-black text-rose-600">{Math.abs(totalBalance).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-rose-500/10">
                            <div className="h-full bg-rose-500 w-[70%]"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Debtors</p>
                                <p className="text-2xl font-black text-foreground">{debtors}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-indigo-500/10">
                            <div className="h-full bg-indigo-500 w-full"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-4 text-foreground font-medium">
                    <Filter className="h-4 w-4" />
                    Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Property</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.property_id}
                            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                        >
                            <option value="all">Global View (All)</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            placeholder="YYYY"
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.year}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length <= 4) {
                                    setFilters({ ...filters, year: parseInt(val) || 0 });
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="border-border shadow-sm overflow-hidden bg-card">
                <CardHeader>
                    <CardTitle className="text-lg text-foreground font-semibold">Detailed Report</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <table className="w-full text-sm text-left relative">
                        <thead className="text-xs text-muted-foreground uppercase bg-slate-50 border-b sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3">Tenant Identity</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Contact Info</th>
                                <th className="px-6 py-3 text-center">Unit</th>
                                <th className="px-6 py-3 text-right text-rose-500 font-semibold">Opening Balance</th>
                                <th className="px-6 py-3 text-right text-rose-600 font-semibold">Agreement Fee</th>
                                <th className="px-6 py-3 text-right text-indigo-500 font-semibold">Deposits</th>
                                <th className="px-6 py-3 text-right text-slate-900 font-semibold">Monthly Rent</th>
                                <th className="px-6 py-3 text-right text-amber-600 font-semibold">Past Arrears</th>
                                <th className="px-6 py-3 text-right text-emerald-600 font-semibold">Amount Paid</th>
                                <th className="px-6 py-3 text-right font-bold">Total Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr key="loading-row">
                                    <td colSpan={12} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr key="empty-row">
                                    <td colSpan={12} className="px-6 py-8 text-center text-slate-500 font-medium">
                                        No tenant transactions recorded for this period.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row: any) => (
                                    <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground text-xs uppercase">{row.property_name}</td>
                                        <td className="px-6 py-4 font-semibold text-foreground">{row.tenant_name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.status?.toLowerCase() === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                : (row.status?.toLowerCase() === 'inactive'
                                                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                                    : 'bg-slate-500/10 text-slate-600 border border-slate-500/20')
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-medium text-xs">
                                            {row.phone}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-foreground font-bold">{row.unit_number}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-500">
                                            {Number(row.opening_balance) !== 0 ? Number(row.opening_balance).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-rose-600">
                                            {Number(row.agreement_amount) !== 0 ? Number(row.agreement_amount).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-indigo-500">
                                            {Number(row.deposits) !== 0 ? Number(row.deposits).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                                            {Number(row.monthly_rent) > 0 ? Number(row.monthly_rent).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-amber-600">
                                            {Number(row.past_arrears) !== 0 ? Number(row.past_arrears).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                            {Number(row.amount_paid) > 0 ? Number(row.amount_paid).toLocaleString() : '—'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${row.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                            {Number(row.balance).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
