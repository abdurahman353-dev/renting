"use client";

import { useState, useEffect } from "react";
import { Download, Filter, Home, CheckCircle2, XCircle } from "lucide-react";
import { financeAPI, propertyAPI } from "@/data/apis";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnitsReportPage() {
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
            const res = await financeAPI.getUnitReport(filters);
            setData(res);
        } catch (error) {
            console.error("Failed to fetch report:", error);
            toast.error("Failed to fetch unit report data");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Unit", "Property", "Tenant", "Status", "Opening Balance", "Agreement Fee", "Deposits", "Monthly Rent", "Past Arrears", "Amount Paid", "Balance"];
        const rows = data.map((row: any) => [
            `"${row.unit_number}"`,
            `"${row.property_name}"`,
            `"${row.tenant_name}"`,
            `"${row.status}"`,
            row.opening_balance,
            row.agreement_amount,
            row.deposits,
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
        link.setAttribute("download", `unit_monthly_report_${filters.year}_${filters.month}.csv`);
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

    const stats = {
        total: data.length,
        occupied: data.filter(u => u.status.toLowerCase() === 'occupied').length,
        available: data.filter(u => u.status.toLowerCase() !== 'occupied').length,
    };

    return (
        <div className="p-6 space-y-6 min-h-screen bg-muted/40">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Units Period Report</h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">
                        Comprehensive overview of unit occupancy and financial status
                    </p>
                </div>
                <Button onClick={handleExport} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <Download className="mr-2 h-4 w-4" />
                    Export to Excel
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <Home className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Units</p>
                                <p className="text-2xl font-black text-foreground">{stats.total}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-indigo-500/10">
                            <div className="h-full bg-indigo-500 w-full"></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Occupied</p>
                                <p className="text-2xl font-black text-foreground">{stats.occupied}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-blue-500/10">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: stats.total ? `${(stats.occupied / stats.total) * 100}%` : '0%' }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-card overflow-hidden group">
                    <CardContent className="p-0">
                        <div className="flex items-center p-6">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                <XCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Available</p>
                                <p className="text-2xl font-black text-foreground">{stats.available}</p>
                            </div>
                        </div>
                        <div className="h-1 w-full bg-emerald-500/10">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: stats.total ? `${(stats.available / stats.total) * 100}%` : '0%' }}></div>
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
                    {/* Property Select */}
                    <div className="space-y-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Property</label>
                        <select
                            className="w-full p-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.property_id}
                            onChange={(e) => setFilters({ ...filters, property_id: e.target.value })}
                        >
                            <option value="all">All Properties</option>
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Month Select */}
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

                    {/* Year Select */}
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
                                <th className="px-6 py-3">Unit Identity</th>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3">Current Tenant</th>
                                <th className="px-6 py-3 text-center">Occupancy Status</th>
                                <th className="px-6 py-3 text-right text-rose-500 font-semibold">Opening Balance</th>
                                <th className="px-6 py-3 text-right text-rose-600 font-semibold">Agreement Fee</th>
                                <th className="px-6 py-3 text-right text-indigo-500 font-semibold">Deposits</th>
                                <th className="px-6 py-3 text-right text-slate-900 font-semibold">Monthly Rent</th>
                                <th className="px-6 py-3 text-right text-amber-600 font-semibold">Past Arrears</th>
                                <th className="px-6 py-3 text-right text-emerald-600 font-semibold">Amount Paid</th>
                                <th className="px-6 py-3 text-right font-bold">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr key="loading-row">
                                    <td colSpan={11} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr key="empty-row">
                                    <td colSpan={11} className="px-6 py-8 text-center text-slate-500 font-medium">
                                        No metrics found for this period.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row: any) => (
                                    <tr key={row.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-foreground text-base">{row.unit_number}</span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-foreground text-xs uppercase">{row.property_name}</td>
                                        <td className="px-6 py-4">
                                            {row.tenant_name !== 'N/A' ? (
                                                <div className="font-semibold text-foreground">
                                                    {row.tenant_name}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic font-medium">No active tenant</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${row.status.toLowerCase() === 'occupied'
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50'
                                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
                                                }`}>
                                                {row.status}
                                            </span>
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
                                            {row.balance !== 0 ? Number(row.balance).toLocaleString() : (row.amount_paid > 0 ? '0' : '—')}
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
