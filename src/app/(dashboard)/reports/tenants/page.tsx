"use client";

import { useState, useEffect } from "react";
import { Download, Filter, User, Phone, Building2, CreditCard, AlertCircle } from "lucide-react";
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

        const headers = ["Property Name", "Tenant Name", "Phone Number", "Unit", "Amount Paid", "Balance"];
        const rows = data.map((row: any) => [
            `"${row.property_name}"`,
            `"${row.tenant_name}"`,
            `"${row.phone}"`,
            `"${row.unit_number}"`,
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
        <div className="p-8 space-y-8 min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Tenants Ledger Report</h2>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Monthly financial overview of all tenant accounts and outstanding balances.
                    </p>
                </div>
                <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-none transition-all active:scale-95">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <CreditCard className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Collected</p>
                                <p className="text-2xl font-black text-slate-900">{totalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-emerald-500/10">
                            <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <AlertCircle className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Outstanding</p>
                                <p className="text-2xl font-black text-rose-600">{Math.abs(totalBalance).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-rose-500/10">
                            <div className="h-full bg-rose-500 w-[70%]"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                                <User className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Debtors</p>
                                <p className="text-2xl font-black text-slate-900">{debtors}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-indigo-500/10">
                            <div className="h-full bg-indigo-500 w-full"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-2 mb-6 text-slate-800 font-bold">
                    <Filter className="h-4 w-4 text-emerald-500" />
                    Report Filtering
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Property</label>
                        <select
                            className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filters.property_id}
                            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                        >
                            <option value="all">Global View (All)</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal Month</label>
                        <select
                            className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal Year</label>
                        <select
                            className="w-full h-12 px-4 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer hover:bg-white"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="border-slate-200/60 shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/20 border-b border-slate-100 py-6 px-8">
                    <CardTitle className="text-xl font-black text-slate-800 flex items-center">
                        <Building2 className="mr-3 h-5 w-5 text-slate-400" />
                        Monthly Tenant Balance Sheet
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5">Property</th>
                                <th className="px-8 py-5">Tenant Identity</th>
                                <th className="px-8 py-5">Contact Info</th>
                                <th className="px-8 py-5 text-center">Unit</th>
                                <th className="px-8 py-5 text-right font-black">Amount Paid</th>
                                <th className="px-8 py-5 text-right font-black">Period Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="h-10 w-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Financial Data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                                        No tenant transactions recorded for this period.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-5 font-bold text-slate-500 uppercase text-[11px] tracking-wide">{row.property_name}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-emerald-600 transition-colors">
                                                    <User className="h-4 w-4 text-slate-400 group-hover:text-white" />
                                                </div>
                                                <div className="font-black text-slate-900 text-base">{row.tenant_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center text-slate-500 font-bold">
                                                <Phone className="h-3 w-3 mr-2 opacity-50" />
                                                {row.phone}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm group-hover:scale-110 transition-transform inline-block">
                                                {row.unit_number}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-emerald-600 text-base">
                                            {Number(row.amount_paid) > 0 ? Number(row.amount_paid).toLocaleString() : '—'}
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black text-base ${row.balance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
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
